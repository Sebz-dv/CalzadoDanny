<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['required', 'exists:categories,id'],
            'name'        => ['required', 'string', 'max:160'],
            'slug'        => ['nullable', 'string', 'max:180', 'unique:products,slug'],
            'description' => ['nullable', 'string'],
            'price_cents' => ['sometimes', 'integer'],
            'size'        => ['nullable', 'string'],
            'color'       => ['nullable', 'string'],
            'referencia'       => ['nullable', 'string'],
            'gender'      => ['required', 'in:male,female'],

            'status'      => ['nullable', 'in:draft,published,archived'],

            // imágenes
            'main_image'     => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp,avif'],
            'main_image_alt' => ['sometimes', 'nullable', 'string', 'max:160'],

            'images'         => ['sometimes', 'array'],
            'images.*'       => ['image', 'mimes:jpg,jpeg,png,webp,avif'],
            'images_alt'     => ['sometimes', 'array'],
            'images_alt.*'   => ['nullable', 'string', 'max:160'],

            // mantenimiento de galería (solo para update, pero no estorba en store)
            'remove_image_ids' => ['sometimes', 'array'],
            'remove_image_ids.*' => ['integer', 'exists:product_images,id'],
            'images_order'   => ['sometimes', 'array'],
            'images_order.*' => ['integer', 'exists:product_images,id'],
        ];
    }
}
