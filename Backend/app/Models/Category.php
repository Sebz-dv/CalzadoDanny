<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Category extends Model
{
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'is_featured' => 'boolean',
        'position' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function ($m) {
            if (blank($m->slug) && filled($m->name)) {
                $m->slug = static::uniqueSlug(Str::slug($m->name));
            } elseif (filled($m->slug)) {
                $m->slug = static::uniqueSlug(Str::slug($m->slug));
            }
        });

        static::updating(function ($m) {
            // Si cambia el name y no mandan slug, regenera desde name
            if ($m->isDirty('name') && !$m->isDirty('slug')) {
                $m->slug = static::uniqueSlug(Str::slug($m->name), $m->id);
            }
            // Si mandan slug explícito, normaliza/asegura único
            if ($m->isDirty('slug') && filled($m->slug)) {
                $m->slug = static::uniqueSlug(Str::slug($m->slug), $m->id);
            }
        });
    }

    protected static function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = $base ?: 'categoria';
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
