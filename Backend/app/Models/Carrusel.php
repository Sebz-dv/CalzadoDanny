<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Carrusel extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title','alt','caption','button_text','button_url',
        'image_path','mobile_image_path','position',
        'is_active','starts_at','ends_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'starts_at' => 'datetime',
        'ends_at'   => 'datetime',
    ];

    protected $appends = ['image_url','mobile_image_url'];

    public function getImageUrlAttribute() {
        return $this->image_path ? Storage::url($this->image_path) : null;
    }
    public function getMobileImageUrlAttribute() {
        return $this->mobile_image_path ? Storage::url($this->mobile_image_path) : null;
    }
}
