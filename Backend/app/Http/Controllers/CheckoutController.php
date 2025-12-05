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
        // ===== Contexto y helpers =====
        $t0 = microtime(true);
        $requestId = (string) Str::uuid();

        Log::withContext([
            'request_id' => $requestId,
            'route'      => 'api.checkout.store',
            'ip'         => $request->ip(),
            'ua'         => (string) $request->userAgent(),
        ]);

        $maskEmail = fn(?string $email) =>
            $email ? preg_replace('/(^.).*(@.*$)/', '$1***$2', $email) : null;

        $maskPhone = fn(?string $phone) =>
            $phone ? preg_replace('/.(?=.{2})/', '•', preg_replace('/\s+/', '', $phone)) : null;

        // ===== Entrada validada =====
        $data = $request->validated();
        Log::info('Checkout: payload recibido', [
            'items_count' => is_countable($data['items'] ?? null) ? count($data['items']) : 0,
            'customer'    => [
                'email' => $maskEmail($data['customer']['email'] ?? null),
                'phone' => $maskPhone($data['customer']['phone'] ?? null),
            ],
            'total_cents_from_client' => (int) ($data['total_cents'] ?? -1),
        ]);

        // ===== Normalización de ítems =====
        $items = collect($data['items'] ?? [])
            ->map(function ($it) {
                return [
                    'product_id'  => $it['product_id'] ?? null,
                    'name'        => trim((string)($it['name'] ?? '')),
                    'size'        => $it['size'] ?? null,
                    'color'       => $it['color'] ?? null,
                    'referencia'  => trim((string)($it['referencia'] ?? '')),
                    'qty'         => (int) max(1, (int)($it['qty'] ?? 1)),
                    'price_cents' => (int) max(0, (int)($it['price_cents'] ?? 0)),
                    'image'       => $it['image'] ?? null,
                ];
            })
            ->values()
            ->all();

        // Fallback de nombre (y referencia) desde BD si no vinieron en el payload
        $items = collect($items)
            ->map(function ($it) {
                if ((!filled($it['name']) || !filled($it['referencia'])) && !empty($it['product_id'])) {
                    $p = Product::select('name', 'referencia')->find($it['product_id']);
                    if ($p) {
                        if (!filled($it['name'])) {
                            $it['name'] = $p->name;
                        }
                        if (!filled($it['referencia'])) {
                            $it['referencia'] = $p->referencia ?? '';
                        }
                    }
                }
                return $it;
            })
            ->values()
            ->all();

        Log::debug('Checkout: items normalizados', [
            'items' => array_map(function ($i) {
                return [
                    'name'       => $i['name'] ?? null,
                    'referencia' => $i['referencia'] ?? null,
                    'qty'        => $i['qty'] ?? null,
                    'price'      => $i['price_cents'] ?? null,
                ];
            }, $items),
        ]);

        // ===== Totales (server vs client) =====
        $serverTotal = array_reduce(
            $items,
            fn($acc, $it) => $acc + ($it['price_cents'] * $it['qty']),
            0
        );

        $clientTotal = (int) ($data['total_cents'] ?? -1);
        if ($clientTotal !== $serverTotal) {
            Log::warning('Checkout: mismatch de total', [
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

        // ===== Cliente =====
        $customer = [
            'email'   => $data['customer']['email'] ?? null,
            'phone'   => $data['customer']['phone'] ?? null,
            'address' => $data['customer']['address'] ?? null,
        ];

        if (!filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
            Log::warning('Checkout: email inválido tras validated()', [
                'email' => $maskEmail($customer['email']),
            ]);
            return response()->json(['message' => 'Correo inválido.'], 422);
        }

        // ===== Código de pedido =====
        $orderCode = 'ORD-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(5));
        Log::info('Checkout: creando orden', ['order_code' => $orderCode]);

        // ===== Datos para Bold (hash de integridad) =====
        $amount   = $serverTotal; // Monto entero en COP (sin decimales)
        $currency = config('services.bold.currency', 'COP');
        $secret   = trim((string) config('services.bold.secret_key', ''));

        Log::info('DEBUG Bold config', [
            'has_secret' => $secret !== '',
            'currency'   => $currency,
        ]);

        if ($secret === '') {
            Log::error('Bold: secret_key no configurada en services.bold / .env');

            return response()->json([
                'ok'      => false,
                'message' => 'Error de configuración de pagos. Contacta soporte.',
            ], 500);
        }

        // Cadena: {Identificador}{Monto}{Divisa}{LlaveSecreta}
        $cadena = $orderCode . $amount . $currency . $secret;

        // Hash SHA-256
        $hash = hash('sha256', $cadena);

        Log::info('Bold: hash de integridad generado', [
            'order_code' => $orderCode,
            'amount'     => $amount,
            'currency'   => $currency,
            // No logeamos la cadena ni el secret por seguridad
        ]);

        // ===== Envío de correo =====
        try {
            $to = 'Ventasonlinemese@gmail.com';

            // Array de referencias por ítem para mantener compatibilidad
            $referencias = array_map(
                fn($i) => $i['referencia'] ?? null,
                $items
            );

            $mailable = (new NewOrderMail(
                customer: $customer,
                items: $items,
                referencia: $referencias,
                total_cents: $serverTotal,
                orderCode: $orderCode,
                payUrl: null, // Ahora el pago se hace con el botón Bold en el sitio
            ))
                ->subject("Nueva orden #{$orderCode}")
                ->replyTo($customer['email']);

            $mailer = Mail::to($to);
            if (filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
                $mailer->cc([$customer['email']]);
            }

            $mailer->send($mailable);

            Log::info('Checkout: correo enviado', [
                'to'         => $maskEmail($to),
                'cc'         => $maskEmail($customer['email']),
                'order_code' => $orderCode,
            ]);

            return response()->json([
                'ok'             => true,
                'order_code'     => $orderCode,
                'total_cents'    => $serverTotal,
                'bold_amount'    => $amount,
                'bold_currency'  => $currency,
                'bold_signature' => $hash,
                'elapsed_ms'     => (int) ((microtime(true) - $t0) * 1000),
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Checkout: fallo enviando correo', [
                'order_code'  => $orderCode,
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
