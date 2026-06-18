<?php

namespace App\Http\Requests\Hall;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreHallRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->user()->can('hall.create');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:halls,code'],
            'capacity' => ['required', 'integer', 'min:1'],
            'building' => ['nullable', 'string', 'max:100'],
            'floor' => ['nullable', 'string', 'max:50'],
            'location' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'amenities' => ['nullable', 'array'],
            'amenities.*' => ['string', 'max:50'],
            'status' => ['required', Rule::in(['active', 'inactive', 'maintenance'])],
            'facilities' => ['nullable', 'array'],
            'facilities.*.facility' => ['required', 'string', 'max:100'],
            'facilities.*.is_available' => ['boolean'],
        ];
    }
}
