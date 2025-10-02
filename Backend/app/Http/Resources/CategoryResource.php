<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $disk = Storage::disk('public');
        $rel  = $this->image_path ? $disk->url($this->image_path) : null;
        $abs  = $rel ? (str_starts_with($rel, 'http') ? $rel : url($rel)) : null;

        $arr = [
            'id'          => $this->id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'subtitle'    => $this->subtitle,
            'description' => $this->description,
            'color'       => $this->color,
            'position'    => $this->position,
            'is_featured' => (bool) $this->is_featured,
            'status'      => $this->status,

            'image_url'   => $abs,
            'image_alt'   => $this->image_alt,

            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
        ];

        if (app()->isLocal()) {
            $arr['debug'] = [
                'app_url'                => config('app.url'),
                'fs_public_url'          => $rel,
                'absolute_url'           => $abs,
                'exists_on_disk'         => $this->image_path ? $disk->exists($this->image_path) : null,
                'public_symlink_exists'  => file_exists(public_path('storage')),
                'image_path_db'          => $this->image_path,
            ];
        }

        return $arr;
    }
}
