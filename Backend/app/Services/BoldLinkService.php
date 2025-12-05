<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BoldLinkService
{
    public function createPaymentLink(int $totalCop, string $description, ?string $payerEmail = null): array
    {
        $baseUrl   = rtrim(config('services.bold.base_url'), '/');
        $apiKey    = config('services.bold.api_key');
        $currency  = config('services.bold.currency', 'COP');
        $callback  = config('services.bold.callback_url');

        if (! $apiKey) {
            throw new \RuntimeException('Bold API key not configured');
        }

        $payload = [
            'amount_type' => 'CLOSE',
            'amount' => [
                'currency'     => $currency,
                'total_amount' => $totalCop, // COP enteros
                'tip_amount'   => 0,
            ],
            'description'  => $description,
            'reference'    => $description,
            'callback_url' => $callback,
            'payer_email'  => $payerEmail,
        ];

        $resp = Http::withHeaders([
            'Authorization' => 'x-api-key ' . $apiKey,
        ])->post($baseUrl . '/online/link/v1', $payload);

        if (! $resp->successful()) {
            Log::error('BoldLinkService: error creando link', [
                'status' => $resp->status(),
                'body'   => $resp->body(),
            ]);

            throw new \RuntimeException('Error al crear link de pago Bold: HTTP ' . $resp->status());
        }

        $body = $resp->json();

        $paymentLink = data_get($body, 'payload.payment_link');
        $url         = data_get($body, 'payload.url');

        Log::info('BoldLinkService: link creado OK', [
            'payment_link' => $paymentLink,
            'url'          => $url,
        ]);

        return [
            'payment_link' => $paymentLink,
            'url'          => $url,
            'raw'          => $body,
        ];
    }
}
