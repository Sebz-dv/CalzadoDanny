<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $param = $this->route('category');
        $id = $param instanceof Category ? $param->id : $param;

        return [
            'name'        => ['sometimes','string','max:120'],
            'slug'        => ['sometimes','nullable','string','max:160', Rule::unique('categories','slug')->ignore($id)],
            'subtitle'    => ['sometimes','nullable','string','max:160'],
            'description' => ['sometimes','nullable','string'],
            'color'       => ['sometimes','nullable','string','max:24'],
            'position'    => ['sometimes','integer','min:0'],
            'is_featured' => ['sometimes','boolean'],
            'status'      => ['sometimes','in:draft,published,archived'],
            'image'       => ['sometimes','nullable','image','mimes:jpg,jpeg,png,webp,avif'],
            'image_alt'   => ['sometimes','nullable','string','max:160'],
        ];
    }
}
