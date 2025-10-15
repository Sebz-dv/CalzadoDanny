<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class BoldLinkService
{
    public function createPaymentLink(int $totalCop, string $description, ?string $payerEmail = null): array
    {
        $resp = Http::withHeaders([
            'Authorization' => 'x-api-key '.config('services.bold.api_key'),
            'Accept'        => 'application/json',
            'Content-Type'  => 'application/json',
        ])->post('https://integrations.api.bold.co/online/link/v1', [
            // Monto cerrado: tú defines el total
            'amount_type'     => 'CLOSE',
            'amount'          => [
                'currency' => 'COP',
                'total'    => $totalCop, // entero en COP, p.ej. 129900
                // opcional: impuestos (VAT/CONSUMPTION) si los manejas por separado
                // 'taxes' => [['type' => 'VAT','base' => 109160,'value' => 20740]],
            ],
            'description'     => Str::limit($description, 100, ''),
            // opcional: restringir métodos de pago
            // 'payment_methods' => ['CREDIT_CARD','PSE','BOTON_BANCOLOMBIA','NEQUI'],
            'payer_email'     => $payerEmail,
            // opcional: fecha de expiración en epoch (nanosegundos). Si no, queda sin expiración.
            // 'expiration_date' => now()->addDays(3)->valueOf() * 1000000,
            // opcional: imagen https://... .png|.jpg
            // 'image_url' => 'https://tu-sitio.com/img/producto.jpg',
        ]);

        $resp->throw();

        // La respuesta incluye el identificador y el link generado
        return $resp->json(); // guarda aquí id/link/reference según payload
    }
}
