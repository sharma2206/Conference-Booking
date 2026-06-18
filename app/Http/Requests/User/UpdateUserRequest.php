<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth('api')->user()->can('user.edit') || auth('api')->id() === $this->route('user')->id;
    }

    public function rules(): array
    {
        $userId = $this->route('user')->id;

        return [
            'name' => ['sometimes', 'string', 'max:100'],
            'email' => ['sometimes', 'email', 'max:100', "unique:users,email,{$userId}"],
            'phone' => ['nullable', 'string', 'max:20'],
            'employee_id' => ['nullable', 'string', 'max:30', "unique:users,employee_id,{$userId}"],
            'department_id' => ['nullable', 'exists:departments,id'],
            'designation' => ['nullable', 'string', 'max:100'],
            'password' => ['nullable', Password::min(8)->letters()->numbers()],
            'role' => ['nullable', 'exists:roles,name'],
            'status' => ['nullable', 'in:active,inactive,suspended'],
        ];
    }
}
