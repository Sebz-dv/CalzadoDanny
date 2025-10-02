<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Product extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'status' => 'string',
    ];

    protected $appends = ['main_image_url'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
    public function images()
    {
        return $this->hasMany(ProductImage::class)->orderBy('position')->orderBy('id');
    }

    public function getMainImageUrlAttribute(): ?string
    {
        if (!$this->main_image_path) return null;
        $rel = Storage::disk('public')->url($this->main_image_path);
        return str_starts_with($rel, 'http') ? $rel : url($rel);
    }

    protected static function booted(): void
    {
        static::creating(function ($m) {
            if (blank($m->slug) && filled($m->name)) $m->slug = static::uniqueSlug(Str::slug($m->name));
            elseif (filled($m->slug)) $m->slug = static::uniqueSlug(Str::slug($m->slug));
        });

        static::updating(function ($m) {
            if ($m->isDirty('name') && !$m->isDirty('slug')) $m->slug = static::uniqueSlug(Str::slug($m->name), $m->id);
            if ($m->isDirty('slug') && filled($m->slug)) $m->slug = static::uniqueSlug(Str::slug($m->slug), $m->id);
        });

        static::deleting(function ($m) {
            if ($m->main_image_path && Storage::disk('public')->exists($m->main_image_path)) {
                Storage::disk('public')->delete($m->main_image_path);
            }
            foreach ($m->images as $img) {
                if ($img->path && Storage::disk('public')->exists($img->path)) {
                    Storage::disk('public')->delete($img->path);
                }
            }
        });
    }

    protected static function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = $base ?: 'producto';
        $i = 2;
        while (static::withTrashed()
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }
        return $slug;
    }
}
