<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['required','string','max:120'],
            'slug'        => ['nullable','string','max:160','unique:categories,slug'],
            'subtitle'    => ['nullable','string','max:160'],
            'description' => ['nullable','string'],
            'color'       => ['nullable','string','max:24'],
            'position'    => ['nullable','integer','min:0'],
            'is_featured' => ['nullable','boolean'],
            'status'      => ['nullable','in:draft,published,archived'],
            'image'       => ['sometimes','nullable','image','mimes:jpg,jpeg,png,webp,avif'],
            'image_alt'   => ['nullable','string','max:160'],
        ];
    }
}
