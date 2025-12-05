<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BoldCallbackController extends Controller
{
    public function handle(Request $request)
    {
        $rawBody   = $request->getContent();
        $signature = $request->header('x-bold-signature', '');

        $secretKey = config('services.bold.secret_key', '');

        $encodedBody = base64_encode($rawBody);
        $localHash   = hash_hmac('sha256', $encodedBody, $secretKey);

        $isValid = hash_equals($localHash, $signature);

        if (! $isValid) {
            Log::warning('Bold webhook firma inválida', [
                'received_signature' => $signature,
                'calculated'         => $localHash,
            ]);

            return response()->json([
                'ok'      => false,
                'message' => 'Invalid signature',
            ], 400);
        }

        $payload = json_decode($rawBody, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('Bold webhook JSON inválido', [
                'error'   => json_last_error_msg(),
                'rawBody' => $rawBody,
            ]);

            return response()->json([
                'ok'      => false,
                'message' => 'Invalid JSON',
            ], 400);
        }

        $type   = $payload['type']   ?? null;
        $data   = $payload['data']   ?? [];
        $meta   = $data['metadata']  ?? [];
        $paymentId  = $data['payment_id']  ?? null;
        $reference  = $meta['reference']  ?? null;
        $total      = $data['amount']['total'] ?? null;
        $currency   = $data['amount']['currency'] ?? null;

        Log::info('Bold webhook recibido y firma válida', [
            'type'        => $type,
            'payment_id'  => $paymentId,
            'reference'   => $reference,
            'total'       => $total,
            'currency'    => $currency,
        ]);

        // Aquí luego amarras con Order y actualizas estado

        return response()->json([
            'ok'      => true,
            'message' => 'Webhook received',
        ], 200);
    }
}
