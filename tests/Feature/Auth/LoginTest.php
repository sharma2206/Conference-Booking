<?php

namespace Tests\Feature\Auth;

use App\Models\Department;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
    }

    public function test_successful_login_returns_token(): void
    {
        $user = User::factory()->create(['status' => 'active']);
        $user->assignRole('employee');

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
                 ->assertJsonStructure(['token', 'token_type', 'expires_in', 'user']);
    }

    public function test_wrong_password_returns_422(): void
    {
        $user = User::factory()->create(['status' => 'active']);

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertUnprocessable()
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_suspended_user_cannot_login(): void
    {
        $user = User::factory()->create(['status' => 'suspended']);
        $user->assignRole('employee');

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'password',
        ]);

        $response->assertUnprocessable()
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_login_requires_email_and_password(): void
    {
        $this->postJson('/api/auth/login', [])
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['email', 'password']);
    }
}
