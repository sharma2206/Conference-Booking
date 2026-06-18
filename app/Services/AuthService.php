<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public function login(array $credentials): array
    {
        $token = JWTAuth::attempt([
            'email' => $credentials['email'],
            'password' => $credentials['password'],
        ]);

        if (!$token) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = auth('api')->user();

        if ($user->status !== 'active') {
            JWTAuth::invalidate($token);
            throw ValidationException::withMessages([
                'email' => ['Your account has been suspended. Please contact administrator.'],
            ]);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ]);

        AuditLog::record('login', 'auth', ['email' => $credentials['email']]);

        return [
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => $user->load('roles', 'permissions', 'department'),
        ];
    }

    public function register(array $data): array
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'department_id' => $data['department_id'] ?? null,
            'designation' => $data['designation'] ?? null,
            'status' => 'active',
        ]);

        $user->assignRole($data['role'] ?? 'employee');

        event(new Registered($user));

        $token = JWTAuth::fromUser($user);

        AuditLog::record('register', 'auth', ['user_id' => $user->id]);

        return [
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user' => $user->load('roles', 'permissions', 'department'),
        ];
    }

    public function logout(): void
    {
        AuditLog::record('logout', 'auth');
        JWTAuth::invalidate(JWTAuth::getToken());
    }

    public function refresh(): array
    {
        $token = JWTAuth::refresh(JWTAuth::getToken());

        return [
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
        ];
    }

    public function sendPasswordResetLink(string $email): void
    {
        $status = Password::sendResetLink(['email' => $email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
    }

    public function resetPassword(array $data): void
    {
        $status = Password::reset(
            $data,
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
    }

    public function enable2FA(User $user): array
    {
        $secret = base64_encode(random_bytes(16));
        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_enabled' => true,
        ]);

        return ['secret' => $secret];
    }

    public function disable2FA(User $user): void
    {
        $user->update([
            'two_factor_secret' => null,
            'two_factor_enabled' => false,
        ]);
    }
}
