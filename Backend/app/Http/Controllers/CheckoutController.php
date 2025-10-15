<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Mail\NewOrderMail;
use App\Models\Product;
use App\Services\BoldLinkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function store(CheckoutRequest $request, BoldLinkService $bold): JsonResponse
    {
        $maskEmail = fn(?string $email) => $email ? preg_replace('/(^.).*(@.*$)/', '$1***$2', $email) : null;
        $maskPhone = fn(?string $phone) => $phone ? preg_replace('/.(?=.{2})/', '•', preg_replace('/\s+/', '', $phone)) : null;

        $data = $request->validated();

        $items = collect($data['items'] ?? [])
            ->map(function ($it) {
                return [
                    'product_id'  => $it['product_id'] ?? null,
                    'name'        => trim((string)($it['name'] ?? '')),
                    'size'        => $it['size'] ?? null,
                    'color'       => $it['color'] ?? null,
                    'qty'         => (int) max(1, (int)($it['qty'] ?? 1)),
                    'price_cents' => (int) max(0, (int)($it['price_cents'] ?? 0)),
                    'image'       => $it['image'] ?? null,
                ];
            })->values()->all();

        $items = collect($items)->map(function ($it) {
            if (!filled($it['name']) && !empty($it['product_id'])) {
                if ($p = Product::select('name')->find($it['product_id'])) {
                    $it['name'] = $p->name;
                }
            }
            return $it;
        })->values()->all();

        $serverTotal = array_reduce($items, fn($acc, $it) =>
        $acc + ($it['price_cents'] * $it['qty']), 0);

        $clientTotal = (int) ($data['total_cents'] ?? -1);
        if ($clientTotal !== $serverTotal) {
            return response()->json([
                'message'       => 'El total no coincide.',
                'server_total'  => $serverTotal,
                'client_total'  => $clientTotal,
            ], 422);
        }

        $customer = [
            'email'   => $data['customer']['email'] ?? null,
            'phone'   => $data['customer']['phone'] ?? null,
            'address' => $data['customer']['address'] ?? null,
        ];

        if (!filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
            return response()->json(['message' => 'Correo inválido.'], 422);
        }

        $orderCode = 'ORD-' . Str::upper(Str::random(8));

        // === NUEVO: crear Link de Pago Bold ===
        // serverTotal está en centavos. Convertimos a COP (entero).
        $totalCop = (int) round($serverTotal / 100);
        $payUrl = null;
        $boldMeta = null;

        try {
            $boldMeta = $bold->createPaymentLink(
                totalCop: $totalCop,
                description: "Pago orden #{$orderCode}",
                payerEmail: $customer['email']
            );

            // Ajusta estas claves según la respuesta real:
            $payUrl = $boldMeta['url']
                ?? ($boldMeta['payment_url'] ?? null);
        } catch (\Throwable $e) {
            // No abortamos la orden por fallo del link; enviamos sin botón de pago
            Log::warning('Bold link error', ['err' => $e->getMessage(), 'order' => $orderCode]);
        }

        try {
            $to = 'Ventasonlinemese@gmail.com';

            $mailable = (new NewOrderMail(
                customer: $customer,
                items: $items,
                total_cents: $serverTotal,
                orderCode: $orderCode,
                payUrl: $payUrl,
            ))
                ->subject("Nueva orden #{$orderCode}")
                ->replyTo($customer['email']);

            $mailer = Mail::to($to);
            if (filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
                $mailer->cc([$customer['email']]);
            }

            $mailer->send($mailable);

            return response()->json([
                'ok'          => true,
                'order_code'  => $orderCode,
                'total_cents' => $serverTotal,
                'pay_url'     => $payUrl,     // útil para UI
                'bold_meta'   => $boldMeta,   // opcional para debug/UI
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Checkout mail failed', [
                'error'       => $e->getMessage(),
                'items_count' => count($items),
                'has_email'   => (bool) $customer['email'],
            ]);

            return response()->json([
                'ok'      => false,
                'message' => 'No se pudo enviar el correo. Intenta más tarde.',
            ], 500);
        }
    }
}
