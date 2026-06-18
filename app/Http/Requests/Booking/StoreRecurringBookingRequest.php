<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class StoreRecurringBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->check();
    }

    public function rules(): array
    {
        return [
            'title'            => ['required', 'string', 'max:255'],
            'purpose'          => ['required', 'string'],
            'agenda'           => ['nullable', 'string'],
            'hall_id'          => ['required', 'exists:halls,id'],
            'department_id'    => ['nullable', 'exists:departments,id'],
            'participant_count'=> ['required', 'integer', 'min:1'],
            'start_time'       => ['required', 'date_format:H:i'],
            'end_time'         => ['required', 'date_format:H:i', 'after:start_time'],
            'frequency'        => ['required', 'in:daily,weekly,monthly'],
            'days_of_week'     => ['nullable', 'array'],
            'days_of_week.*'   => ['integer', 'between:0,6'],
            'start_date'       => ['required', 'date', 'after_or_equal:today'],
            'end_date'         => ['required', 'date', 'after:start_date'],
        ];
    }
}
