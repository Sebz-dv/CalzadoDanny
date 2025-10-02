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
        'ends_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
    ];

    protected $appends = ['image_url', 'mobile_image_url', 'thumb_url', 'mobile_thumb_url'];

    public function getThumbUrlAttribute()
    {
        return $this->image_url
            ? $this->image_url . '?v=' . optional($this->updated_at)->timestamp
            : null;
    }

    public function getMobileThumbUrlAttribute()
    {
        return $this->mobile_image_url
            ? $this->mobile_image_url . '?v=' . optional($this->updated_at)->timestamp
            : null;
    }

    public function getImageUrlAttribute(): ?string
    {
        $path = $this->image_path;
        if (!$path) return null;
        try {
            $disk = Storage::disk('public');
            $rel = $disk->url($path); // normalmente "/storage/lo-que-sea.png"
            $abs = str_starts_with($rel, 'http') ? $rel : url($rel);
            return $abs;
        } catch (\Throwable $e) {
            Log::error('[Carrusel][accessor:image:error]', [
                'path' => $path,
                'err'  => $e->getMessage(),
            ]);
            return null;
        }
    }
}
