<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->check();
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'purpose' => ['sometimes', 'string'],
            'agenda' => ['nullable', 'string'],
            'hall_id' => ['sometimes', 'exists:halls,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'participant_count' => ['sometimes', 'integer', 'min:1'],
            'booking_date' => ['sometimes', 'date', 'after_or_equal:today'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i', 'after:start_time'],
            'attendees' => ['nullable', 'array'],
            'attendees.*.name' => ['required', 'string', 'max:100'],
            'attendees.*.email' => ['nullable', 'email', 'max:100'],
            'attendees.*.type' => ['nullable', 'in:internal,external'],
        ];
    }
}
