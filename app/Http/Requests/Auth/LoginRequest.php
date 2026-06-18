<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'     => ['required', 'email'],
            'password'  => ['required', 'string'],
            // SEC-02: optional TOTP code for 2FA-enabled accounts
            'totp_code' => ['nullable', 'string', 'digits:6'],
        ];
    }
}
