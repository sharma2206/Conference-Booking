<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HallResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'code'        => $this->code,
            'capacity'    => $this->capacity,
            'building'    => $this->building,
            'floor'       => $this->floor,
            'location'    => $this->location,
            'description' => $this->description,
            'amenities'   => $this->amenities ?? [],
            'images'      => $this->images ?? [],
            'status'      => $this->status,
            'facilities'  => $this->whenLoaded('facilities'),
            'created_at'  => $this->created_at?->toISOString(),
            'updated_at'  => $this->updated_at?->toISOString(),
        ];
    }
}
