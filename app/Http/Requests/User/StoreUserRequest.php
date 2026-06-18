<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->user()->can('user.create');
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:100'],
            'email'         => ['required', 'email', 'max:100', 'unique:users,email'],
            'phone'         => ['nullable', 'string', 'max:20'],
            'employee_id'   => ['nullable', 'string', 'max:30', 'unique:users,employee_id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'designation'   => ['nullable', 'string', 'max:100'],
            // SEC-06: enforce strong passwords for admin-created users
            'password'      => ['required', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
            'role'          => ['required', 'exists:roles,name'],
            'status'        => ['nullable', 'in:active,inactive,suspended'],
        ];
    }
}
