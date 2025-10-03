<?php
// app/Http/Requests/CheckoutRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer.email'   => ['required','email'],
            'customer.phone'   => ['required','string','min:7','max:20'],
            'customer.address' => ['required','string','min:6','max:255'],

            'items'                 => ['required','array','min:1'],
            'items.*.product_id'    => ['required','integer','exists:products,id'],
            'items.*.name'          => ['nullable','string','max:255'], // ← opcional; rellenamos desde BD
            'items.*.size'          => ['nullable','string','max:40'],
            'items.*.color'         => ['nullable','string','max:40'],
            'items.*.qty'           => ['required','integer','min:1','max:100'],
            'items.*.price_cents'   => ['required','integer','min:0'],
            'items.*.image'         => ['nullable','url'], // si mandas URL

            'total_cents'           => ['required','integer','min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'customer.email.required' => 'El correo es obligatorio.',
            'items.min'               => 'Debes incluir al menos un artículo.',
            'items.*.product_id.exists' => 'Algún producto no existe.',
        ];
    }
}
