<?php

namespace Tests\Feature\RBAC;

use App\Models\Department;
use App\Models\Hall;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
    }

    private function userWithRole(string $role): User
    {
        $user = User::factory()->create(['status' => 'active']);
        $user->assignRole($role);
        return $user;
    }

    // --- Employee restrictions ---

    public function test_employee_cannot_list_users(): void
    {
        $this->actingAs($this->userWithRole('employee'), 'api')
             ->getJson('/api/users')
             ->assertForbidden();
    }

    public function test_employee_cannot_create_hall(): void
    {
        $this->actingAs($this->userWithRole('employee'), 'api')
             ->postJson('/api/halls', [
                 'name'     => 'Unauthorized Hall',
                 'capacity' => 10,
                 'status'   => 'active',
             ])
             ->assertForbidden();
    }

    public function test_employee_cannot_create_department(): void
    {
        $this->actingAs($this->userWithRole('employee'), 'api')
             ->postJson('/api/departments', ['name' => 'Unauthorized Department'])
             ->assertForbidden();
    }

    public function test_employee_cannot_access_settings(): void
    {
        $this->actingAs($this->userWithRole('employee'), 'api')
             ->getJson('/api/settings')
             ->assertForbidden();
    }

    // --- Department-head restrictions ---

    public function test_department_head_cannot_delete_users(): void
    {
        $target = User::factory()->create(['status' => 'active']);
        $target->assignRole('employee');

        $this->actingAs($this->userWithRole('department-head'), 'api')
             ->deleteJson("/api/users/{$target->id}")
             ->assertForbidden();
    }

    public function test_department_head_cannot_create_halls(): void
    {
        $this->actingAs($this->userWithRole('department-head'), 'api')
             ->postJson('/api/halls', [
                 'name'     => 'Unauthorized Hall',
                 'capacity' => 10,
                 'status'   => 'active',
             ])
             ->assertForbidden();
    }

    // --- Facility-manager permissions ---

    public function test_facility_manager_can_create_hall(): void
    {
        $this->actingAs($this->userWithRole('facility-manager'), 'api')
             ->postJson('/api/halls', [
                 'name'     => 'New Hall',
                 'capacity' => 30,
                 'status'   => 'active',
             ])
             ->assertCreated();
    }

    // --- Super-admin can do everything ---

    public function test_super_admin_can_list_users(): void
    {
        $this->actingAs($this->userWithRole('super-admin'), 'api')
             ->getJson('/api/users')
             ->assertOk();
    }

    public function test_super_admin_can_delete_another_user(): void
    {
        $target = User::factory()->create(['status' => 'active']);
        $target->assignRole('employee');

        $this->actingAs($this->userWithRole('super-admin'), 'api')
             ->deleteJson("/api/users/{$target->id}")
             ->assertOk();
    }

    public function test_super_admin_can_access_settings(): void
    {
        $this->actingAs($this->userWithRole('super-admin'), 'api')
             ->getJson('/api/settings')
             ->assertOk();
    }

    // --- Unauthenticated user ---

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $this->getJson('/api/bookings')->assertUnauthorized();
        $this->getJson('/api/users')->assertUnauthorized();
        $this->getJson('/api/halls')->assertUnauthorized();
    }
}
