<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VisitorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'booking_id'            => $this->booking_id,
            'name'                  => $this->name,
            'company'               => $this->company,
            'email'                 => $this->email,
            'phone'                 => $this->phone,
            'id_proof_type'         => $this->id_proof_type,
            'id_proof_number'       => $this->id_proof_number,
            'vehicle_number'        => $this->vehicle_number,
            'host_id'               => $this->host_id,
            'host'                  => $this->whenLoaded('host', fn() => new UserResource($this->host)),
            'status'                => $this->status,
            'check_in_at'           => $this->check_in_at?->toISOString(),
            'check_out_at'          => $this->check_out_at?->toISOString(),
            'security_approved_at'  => $this->security_approved_at?->toISOString(),
            'created_at'            => $this->created_at?->toISOString(),
        ];
    }
}
