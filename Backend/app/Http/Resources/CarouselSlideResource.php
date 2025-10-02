<?php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CarouselSlideResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'               => $this->id,
            'title'            => $this->title,
            'alt'              => $this->alt,
            'caption'          => $this->caption,
            'button_text'      => $this->button_text,
            'button_url'       => $this->button_url,
            'image_url'        => $this->image_url,
            'mobile_image_url' => $this->mobile_image_url,
            'position'         => $this->position,
            'is_active'        => $this->is_active,
            'starts_at'        => optional($this->starts_at)->toIso8601String(),
            'ends_at'          => optional($this->ends_at)->toIso8601String(),
            'created_at'       => $this->created_at?->toIso8601String(),
        ];
    }
}
