<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class Carrusel extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'alt',
        'caption',
        'button_text',
        'button_url',
        'image_path',
        'mobile_image_path',
        'position',
        'is_active',
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
    ];

    // OJO: si declaras aquí, asegúrate de implementar ambos accessors:
    protected $appends = ['image_url', 'mobile_image_url', 'thumb_url', 'mobile_thumb_url'];

    /** URL absoluta de la imagen de escritorio */
    public function getImageUrlAttribute(): ?string
    {
        $path = $this->image_path;
        if (!$path) return null;

        try {
            $rel = Storage::disk('public')->url($path);   // "/storage/..."
            return str_starts_with($rel, 'http') ? $rel : url($rel);
        } catch (\Throwable $e) {
            Log::error('[Carrusel][accessor:image:error]', [
                'path' => $path, 'err' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /** URL absoluta de la imagen móvil */
    public function getMobileImageUrlAttribute(): ?string
    {
        $path = $this->mobile_image_path;
        if (!$path) return null;

        try {
            $rel = Storage::disk('public')->url($path);
            return str_starts_with($rel, 'http') ? $rel : url($rel);
        } catch (\Throwable $e) {
            Log::error('[Carrusel][accessor:mobile_image:error]', [
                'path' => $path, 'err' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /** Thumbs con cache-buster usando updated_at (sirve perfecto para la tabla) */
    public function getThumbUrlAttribute(): ?string
    {
        return $this->image_url
            ? $this->image_url . '?v=' . optional($this->updated_at)->timestamp
            : null;
    }

    public function getMobileThumbUrlAttribute(): ?string
    {
        return $this->mobile_image_url
            ? $this->mobile_image_url . '?v=' . optional($this->updated_at)->timestamp
            : null;
    }
}
