<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSlideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        return [
            'title'        => ['nullable', 'string', 'max:150'],
            'alt'          => ['nullable', 'string', 'max:150'],
            'caption'      => ['nullable', 'string', 'max:300'],
            'button_text'  => ['nullable', 'string', 'max:60'],
            'button_url'   => ['nullable', 'url', 'max:255'],
            'image'        => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp'],
            'mobile_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp'],
            'position'     => ['nullable', 'integer', 'min:0'],
            'is_active'    => ['boolean'],
            'starts_at'    => ['nullable', 'date'],
            'ends_at'      => ['nullable', 'date', 'after_or_equal:starts_at'],
        ];
    }
}
