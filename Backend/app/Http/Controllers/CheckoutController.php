<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Mail\NewOrderMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function store(CheckoutRequest $request): JsonResponse
    {
        // ===== Helpers para logs seguros (evita PII cruda) =====
        $maskEmail = fn (?string $email) =>
            $email ? preg_replace('/(^.).*(@.*$)/', '$1***$2', $email) : null;

        $maskPhone = fn (?string $phone) =>
            $phone ? preg_replace('/.(?=.{2})/', '•', preg_replace('/\s+/', '', $phone)) : null;

        // ========= Inicio: log básico del evento =========
        Log::withContext([
            'route'      => 'api.checkout.store',
            'ip'         => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
            // orderCode se setea más abajo, aquí inicial vacío
            'orderCode'  => null,
        ]);

        $data = $request->validated();

        Log::info('Checkout recibido', [
            'items_count' => is_countable($data['items'] ?? null) ? count($data['items']) : 0,
            'customer'    => [
                'email'   => $maskEmail($data['customer']['email'] ?? null),
                'phone'   => $maskPhone($data['customer']['phone'] ?? null),
                // Dirección no se loguea; demasiado PII. Si quieres, enmárcala también.
            ],
        ]);

        // ===== Normaliza items y recalcula total en servidor =====
        $items = collect($data['items'] ?? [])
            ->map(function ($it) {
                return [
                    'product_id'  => $it['product_id'] ?? null,
                    'name'        => trim($it['name'] ?? ''),
                    'size'        => $it['size'] ?? null,
                    'color'       => $it['color'] ?? null,
                    'qty'         => (int) max(1, (int)($it['qty'] ?? 1)),
                    'price_cents' => (int) max(0, (int)($it['price_cents'] ?? 0)),
                    'image'       => $it['image'] ?? null,
                ];
            })
            ->values()
            ->all();

        $serverTotal = array_reduce($items, function ($acc, $it) {
            return $acc + ($it['price_cents'] * $it['qty']);
        }, 0);

        // ===== Validación extra de coherencia de total =====
        $clientTotal = (int) ($data['total_cents'] ?? -1);
        if ($clientTotal !== $serverTotal) {
            Log::warning('Checkout total mismatch', [
                'client_total' => $clientTotal,
                'server_total' => $serverTotal,
                'diff'         => $serverTotal - $clientTotal,
            ]);

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

        // (Opcional) valida de nuevo email (por si cambiaste reglas)
        if (!filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
            Log::warning('Email inválido después de validación', [
                'email' => $maskEmail($customer['email']),
            ]);

            return response()->json([
                'message' => 'Correo inválido.',
            ], 422);
        }

        // ===== Código de pedido para trazabilidad =====
        $orderCode = 'ORD-' . Str::upper(Str::random(8));
        Log::withContext(['orderCode' => $orderCode]); // todos los logs siguientes heredarán esto

        try {
            $to = 'Ventasonlinemese@gmail.com';

            $mailable = (new NewOrderMail($customer, $items, $serverTotal, $orderCode))
                ->subject("Nueva orden #{$orderCode}")
                ->replyTo($customer['email']);

            $mailer = Mail::to($to);

            if (filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
                $mailer->cc([$customer['email']]);
            }

            // Usa queue() si tienes cola; si no, cambia a send()
            $mailer->send($mailable);

            Log::info('Checkout encolado para envío de correo', [
                'to'          => $to,
                'cc'          => $maskEmail($customer['email']),
                'items_count' => count($items),
                'total_cents' => $serverTotal,
            ]);

            return response()->json([
                'ok'          => true,
                'order_code'  => $orderCode,
                'total_cents' => $serverTotal,
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Checkout mail failed', [
                'error' => $e->getMessage(),
                // No metemos $items completos ni address aquí para evitar PII en logs de error
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
