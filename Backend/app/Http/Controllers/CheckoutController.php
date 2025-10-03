<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Mail\NewOrderMail;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function store(CheckoutRequest $request): JsonResponse
    {
        // Helpers para PII en logs
        $maskEmail = fn(?string $email) =>
        $email ? preg_replace('/(^.).*(@.*$)/', '$1***$2', $email) : null;
        $maskPhone = fn(?string $phone) =>
        $phone ? preg_replace('/.(?=.{2})/', '•', preg_replace('/\s+/', '', $phone)) : null;

        // Log::withContext([
        //     'route'      => 'api.checkout.store',
        //     'ip'         => $request->ip(),
        //     'user_agent' => (string) $request->userAgent(),
        //     'orderCode'  => null,
        // ]);

        $data = $request->validated();

        // Debug: qué nombres llegaron tras validated()
        // Log::info('validated items (names)', [
        //     'names' => array_column($data['items'] ?? [], 'name')
        // ]);

        // Log::info('Checkout recibido', [
        //     'items_count' => is_countable($data['items'] ?? null) ? count($data['items']) : 0,
        //     'customer'    => [
        //         'email' => $maskEmail($data['customer']['email'] ?? null),
        //         'phone' => $maskPhone($data['customer']['phone'] ?? null),
        //     ],
        // ]);

        // Normaliza items e impone mínimos
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
            })
            ->values()
            ->all();

        // Fallback: si name viene vacío, lo buscamos en BD por product_id
        $items = collect($items)->map(function ($it) {
            if (!filled($it['name']) && !empty($it['product_id'])) {
                if ($p = Product::select('name')->find($it['product_id'])) {
                    $it['name'] = $p->name;
                }
            }
            return $it;
        })->values()->all();

        // Debug: nombres finales que enviaremos por mail
        // Log::info('Items normalizados para mail', [
        //     'names' => array_map(fn($i) => $i['name'] ?? null, $items)
        // ]);

        // Total server-side
        $serverTotal = array_reduce($items, fn($acc, $it) =>
        $acc + ($it['price_cents'] * $it['qty']), 0);

        // Coherencia de total
        $clientTotal = (int) ($data['total_cents'] ?? -1);
        if ($clientTotal !== $serverTotal) {
            // Log::warning('Checkout total mismatch', [
            //     'client_total' => $clientTotal,
            //     'server_total' => $serverTotal,
            //     'diff'         => $serverTotal - $clientTotal,
            // ]);

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
            // Log::warning('Email inválido después de validación', [
            //     'email' => $maskEmail($customer['email']),
            // ]);

            return response()->json([
                'message' => 'Correo inválido.',
            ], 422);
        }

        // Código de pedido
        $orderCode = 'ORD-' . Str::upper(Str::random(8));
        // Log::withContext(['orderCode' => $orderCode]);

        try {
            $to = 'Ventasonlinemese@gmail.com';

            $mailable = (new NewOrderMail(
                customer: $customer,
                items: $items,
                total_cents: $serverTotal,
                orderCode: $orderCode
            ))
                ->subject("Nueva orden #{$orderCode}")
                ->replyTo($customer['email']);

            $mailer = Mail::to($to);
            if (filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
                $mailer->cc([$customer['email']]);
            }

            // Para pruebas locales usa send(); en prod/cola usa queue()
            $mailer->send($mailable);

            // Log::info('Checkout enviado por correo', [
            //     'to'          => $to,
            //     'cc'          => $maskEmail($customer['email']),
            //     'items_count' => count($items),
            //     'total_cents' => $serverTotal,
            // ]);

            return response()->json([
                'ok'          => true,
                'order_code'  => $orderCode,
                'total_cents' => $serverTotal,
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
