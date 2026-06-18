<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'name'                 => $this->name,
            'email'                => $this->email,
            'employee_id'          => $this->employee_id,
            'phone'                => $this->phone,
            'designation'          => $this->designation,
            'status'               => $this->status,
            'avatar'               => $this->avatar,
            'two_factor_enabled'   => $this->two_factor_enabled,
            'last_login_at'        => $this->last_login_at?->toISOString(),
            'department_id'        => $this->department_id,
            'department'           => $this->whenLoaded('department'),
            'roles'                => $this->whenLoaded('roles', fn() => $this->roles->pluck('name')),
            'permissions'          => $this->when(
                $request->is('api/auth/me') || $request->is('api/auth/login'),
                fn() => $this->getAllPermissions()->pluck('name')->values()
            ),
            'email_verified_at'    => $this->email_verified_at?->toISOString(),
            'created_at'           => $this->created_at?->toISOString(),
        ];
    }
}
