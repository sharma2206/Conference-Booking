<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public function login(array $credentials): array
    {
        $token = JWTAuth::attempt([
            'email'    => $credentials['email'],
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

        // SEC-02: validate TOTP token when 2FA is enabled
        if ($user->two_factor_enabled) {
            $totp = $credentials['totp_code'] ?? null;
            if (!$totp) {
                JWTAuth::invalidate($token);
                throw ValidationException::withMessages([
                    'totp_code' => ['Two-factor authentication code is required.'],
                ]);
            }

            $google2fa = new Google2FA();
            // two_factor_secret is encrypted at rest; decrypt before verifying
            $secret = decrypt($user->getRawOriginal('two_factor_secret'));
            if (!$google2fa->verifyKey($secret, $totp)) {
                JWTAuth::invalidate($token);
                throw ValidationException::withMessages([
                    'totp_code' => ['Invalid two-factor authentication code.'],
                ]);
            }
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ]);

        AuditLog::record('login', 'auth', ['email' => $credentials['email']]);

        $userData               = $user->load('roles', 'department')->toArray();
        $userData['permissions'] = $user->getAllPermissions()->pluck('name')->values();

        return [
            'token'      => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user'       => $userData,
        ];
    }

    public function register(array $data): array
    {
        $user = User::create([
            'name'          => $data['name'],
            'email'         => $data['email'],
            'password'      => Hash::make($data['password']),
            'phone'         => $data['phone'] ?? null,
            'department_id' => $data['department_id'] ?? null,
            'designation'   => $data['designation'] ?? null,
            'status'        => 'active',
        ]);

        // SEC-01: always assign 'employee' — never accept role from external input
        $user->assignRole('employee');

        event(new Registered($user));

        $token = JWTAuth::fromUser($user);

        AuditLog::record('register', 'auth', ['user_id' => $user->id]);

        $userData               = $user->load('roles', 'department')->toArray();
        $userData['permissions'] = $user->getAllPermissions()->pluck('name')->values();

        return [
            'token'      => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
            'user'       => $userData,
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
            'token'      => $token,
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

    // SEC-02: generate a real TOTP secret and return QR code URI for authenticator apps
    public function enable2FA(User $user): array
    {
        $google2fa = new Google2FA();
        $secret    = $google2fa->generateSecretKey();

        // SEC-12: store secret encrypted at rest
        $user->update([
            'two_factor_secret'  => encrypt($secret),
            'two_factor_enabled' => true,
        ]);

        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        return [
            'secret'      => $secret,
            'qr_code_url' => $qrCodeUrl,
            'message'     => 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.).',
        ];
    }

    public function disable2FA(User $user): void
    {
        $user->update([
            'two_factor_secret'  => null,
            'two_factor_enabled' => false,
        ]);
    }
}
