<?php

namespace App\Http\Requests\Hall;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHallRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->user()->can('hall.edit');
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('halls', 'code')->ignore($this->route('hall'))],
            'capacity' => ['sometimes', 'integer', 'min:1'],
            'building' => ['nullable', 'string', 'max:100'],
            'floor' => ['nullable', 'string', 'max:50'],
            'location' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:50'],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'maintenance'])],
            'facilities' => ['nullable', 'array'],
            'facilities.*.facility' => ['required', 'string', 'max:100'],
            'facilities.*.is_available' => ['boolean'],
        ];
    }
}
