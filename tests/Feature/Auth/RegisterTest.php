<?php

namespace Tests\Feature\Auth;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
    }

    public function test_registration_creates_employee_role(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'Test@12345',
            'password_confirmation' => 'Test@12345',
        ]);

        $response->assertCreated()
                 ->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);

        // SEC-01: role must always be 'employee' regardless of input
        $user = \App\Models\User::where('email', 'test@example.com')->first();
        $this->assertTrue($user->hasRole('employee'));
        $this->assertFalse($user->hasRole('super-admin'));
        $this->assertFalse($user->hasRole('admin'));
    }

    public function test_role_injection_is_blocked(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Hacker',
            'email'                 => 'hacker@example.com',
            'password'              => 'Test@12345',
            'password_confirmation' => 'Test@12345',
            'role'                  => 'super-admin', // should be ignored
        ]);

        $response->assertCreated();

        $user = \App\Models\User::where('email', 'hacker@example.com')->first();
        $this->assertFalse($user->hasRole('super-admin'));
        $this->assertTrue($user->hasRole('employee'));
    }

    public function test_weak_password_is_rejected(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'password',
            'password_confirmation' => 'password',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['password']);
    }

    public function test_duplicate_email_rejected(): void
    {
        \App\Models\User::factory()->create(['email' => 'existing@example.com']);

        $this->postJson('/api/auth/register', [
            'name'                  => 'Another User',
            'email'                 => 'existing@example.com',
            'password'              => 'Test@12345',
            'password_confirmation' => 'Test@12345',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors(['email']);
    }
}
