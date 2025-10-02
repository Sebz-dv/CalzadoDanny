<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ProductImage extends Model
{
    protected $guarded = [];
    protected $appends = ['url'];

    public function product() { return $this->belongsTo(Product::class); }

    public function getUrlAttribute(): ?string
    {
        $rel = Storage::disk('public')->url($this->path);
        return str_starts_with($rel,'http') ? $rel : url($rel);
    }
}