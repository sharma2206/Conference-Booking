<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'booking_number'       => $this->booking_number,
            'title'                => $this->title,
            'purpose'              => $this->purpose,
            'agenda'               => $this->agenda,
            'organizer_name'       => $this->organizer_name,
            'organizer_phone'      => $this->organizer_phone,
            'hall_id'              => $this->hall_id,
            'hall'                 => $this->whenLoaded('hall', fn() => new HallResource($this->hall)),
            'user_id'              => $this->user_id,
            'user'                 => $this->whenLoaded('user', fn() => new UserResource($this->user)),
            'department_id'        => $this->department_id,
            'department'           => $this->whenLoaded('department'),
            'participant_count'    => $this->participant_count,
            'booking_date'         => $this->booking_date?->toDateString(),
            'start_time'           => $this->start_time,
            'end_time'             => $this->end_time,
            'duration_minutes'     => $this->duration_minutes,
            'status'               => $this->status,
            'is_recurring'         => $this->is_recurring,
            'recurring_booking_id' => $this->recurring_booking_id,
            'current_approval_step'=> $this->current_approval_step,
            'remarks'              => $this->remarks,
            'rejection_reason'     => $this->rejection_reason,
            'approved_at'          => $this->approved_at?->toISOString(),
            'cancelled_at'         => $this->cancelled_at?->toISOString(),
            'approvals'            => $this->whenLoaded('approvals'),
            'attendees'            => $this->whenLoaded('attendees'),
            'visitors'             => $this->whenLoaded('visitors'),
            'catering_order'       => $this->whenLoaded('cateringOrder'),
            'resources'            => $this->whenLoaded('resources'),
            'created_at'           => $this->created_at?->toISOString(),
            'updated_at'           => $this->updated_at?->toISOString(),
        ];
    }
}
