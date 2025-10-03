<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CarouselSlideResource extends JsonResource
{
    public function toArray($request)
    {
        $arr = [
            'id'        => $this->id,
            'title'     => $this->title,
            'alt'       => $this->alt,
            'caption'   => $this->caption,
            'is_active' => (bool) $this->is_active,
            'position'  => $this->position,

            'image_path'        => $this->image_path,
            'mobile_image_path' => $this->mobile_image_path,

            // Se leen de los accessors del modelo (ver paso 1)
            'image_url'         => $this->image_url,
            'mobile_image_url'  => $this->mobile_image_url,

            'updated_at'        => $this->updated_at,
        ];

        if (app()->isLocal()) {
            $disk = Storage::disk('public');
            $rel  = $this->image_path ? $disk->url($this->image_path) : null;
            $abs  = $rel ? (str_starts_with($rel, 'http') ? $rel : url($rel)) : null;

            $arr['debug'] = [
                'app_url'               => config('app.url'),
                'fs_public_url'         => $rel, // suele ser "/storage/..."
                'absolute_url'          => $abs, // debería ser "http://localhost:8000/storage/..."
                'exists_on_disk'        => $this->image_path ? $disk->exists($this->image_path) : null,
                'public_symlink_exists' => file_exists(public_path('storage')),
            ];
        }

        return $arr;
    }
}
