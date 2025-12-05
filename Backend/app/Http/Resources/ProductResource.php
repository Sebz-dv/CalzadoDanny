<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $mainRel = $this->main_image_path ? Storage::disk('public')->url($this->main_image_path) : null;
        $mainAbs = $mainRel ? (str_starts_with($mainRel, 'http') ? $mainRel : url($mainRel)) : null;

        return [
            'id'            => $this->id,
            'category_id'   => $this->category_id,
            'category'      => $this->whenLoaded('category', fn() => [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),

            'name'          => $this->name,
            'slug'          => $this->slug,
            'description'   => $this->description,
            'price_cents'   => (int) ($this->price_cents ?? 0),
            'price_cop'     => function () {
                $cents = (int)($this->price_cents ?? 0);
                $value = $cents / 100;
                // COP sin decimales
                return '$' . number_format($value, 0, ',', '.');
            },
            'size'          => $this->size,
            'color'         => $this->color,
            'referencia'         => $this->referencia,
            'gender'        => $this->gender,
            'status'        => $this->status,

            'main_image_url' => $mainAbs,
            'main_image_alt' => $this->main_image_alt,

            'images'        => $this->whenLoaded('images', fn() => $this->images->map(fn($i) => [
                'id' => $i->id,
                'url' => $i->url,
                'alt' => $i->alt,
                'position' => $i->position,
            ])),

            'created_at'    => $this->created_at?->toISOString(),
            'updated_at'    => $this->updated_at?->toISOString(),
        ];
    }
}
