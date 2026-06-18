<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->check();
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'purpose' => ['required', 'string'],
            'agenda' => ['nullable', 'string'],
            'organizer_name' => ['nullable', 'string', 'max:100'],
            'organizer_phone' => ['nullable', 'string', 'max:20'],
            'hall_id' => ['required', 'exists:halls,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'participant_count' => ['required', 'integer', 'min:1'],
            'booking_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'attendees' => ['nullable', 'array'],
            'attendees.*.name' => ['required', 'string', 'max:100'],
            'attendees.*.email' => ['nullable', 'email', 'max:100'],
            'attendees.*.phone' => ['nullable', 'string', 'max:20'],
            'attendees.*.type' => ['nullable', 'in:internal,external'],
            'attendees.*.user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
