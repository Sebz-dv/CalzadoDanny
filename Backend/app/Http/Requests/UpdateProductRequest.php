<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $param = $this->route('product');
        $id = $param instanceof Product ? $param->id : $param;

        return [
            'category_id' => ['sometimes', 'exists:categories,id'],
            'name'        => ['sometimes', 'string', 'max:160'],
            'slug'        => ['sometimes', 'nullable', 'string', 'max:180', Rule::unique('products', 'slug')->ignore($id)],
            'description' => ['sometimes', 'nullable', 'string'],
            'price_cents' => ['sometimes', 'integer', 'min:0'],
            'size'        => ['sometimes', 'nullable', 'string'],
            'color'       => ['sometimes', 'nullable', 'string'],
            'referencia'       => ['sometimes', 'nullable', 'string'],
            'gender'      => ['sometimes', 'in:male,female'],

            'status'      => ['sometimes', 'in:draft,published,archived'],

            'main_image'     => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp,avif'],
            'main_image_alt' => ['sometimes', 'nullable', 'string', 'max:160'],

            'images'         => ['sometimes', 'array'],
            'images.*'       => ['image', 'mimes:jpg,jpeg,png,webp,avif'],
            'images_alt'     => ['sometimes', 'array'],
            'images_alt.*'   => ['nullable', 'string', 'max:160'],

            'remove_image_ids' => ['sometimes', 'array'],
            'remove_image_ids.*' => ['integer', 'exists:product_images,id'],
            'images_order'   => ['sometimes', 'array'],
            'images_order.*' => ['integer', 'exists:product_images,id'],
        ];
    }
}
