<?php

namespace Tests\Feature\Booking;

use App\Models\ApprovalWorkflow;
use App\Models\ApprovalWorkflowStep;
use App\Models\Booking;
use App\Models\Hall;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ApprovalWorkflowTest extends TestCase
{
    use LazilyRefreshDatabase;

    private User $employee;
    private User $approver;
    private Hall $hall;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Notification::fake();

        $this->hall     = Hall::factory()->create(['capacity' => 50, 'status' => 'active']);
        $this->employee = User::factory()->create(['status' => 'active']);
        $this->employee->assignRole('employee');

        $this->approver = User::factory()->create(['status' => 'active']);
        $this->approver->assignRole('facility-manager');

        // Set up a single-step approval workflow
        $workflow = ApprovalWorkflow::create([
            'name'       => 'Default',
            'is_active'  => true,
            'is_default' => true,
            'created_by' => $this->approver->id,
        ]);
        ApprovalWorkflowStep::create([
            'workflow_id'      => $workflow->id,
            'step_order'       => 1,
            'step_name'        => 'Manager Approval',
            'role_name'        => 'facility-manager',
            'escalation_hours' => 24,
        ]);
    }

    private function createPendingBooking(): Booking
    {
        $response = $this->actingAs($this->employee, 'api')
                         ->postJson('/api/bookings', [
                             'title'             => 'Board Meeting',
                             'purpose'           => 'Quarterly review',
                             'hall_id'           => $this->hall->id,
                             'participant_count' => 10,
                             'booking_date'      => now()->addDays(3)->toDateString(),
                             'start_time'        => '14:00',
                             'end_time'          => '15:00',
                         ]);

        return Booking::find($response->json('data.id'));
    }

    public function test_approver_can_approve_booking(): void
    {
        $booking = $this->createPendingBooking();

        $this->actingAs($this->approver, 'api')
             ->postJson("/api/bookings/{$booking->id}/approve", ['remarks' => 'Looks good'])
             ->assertOk()
             ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'approved']);
    }

    public function test_self_approval_is_blocked(): void
    {
        // Employee creates AND tries to approve their own booking
        $this->employee->syncRoles(['employee', 'facility-manager']);

        $booking = $this->createPendingBooking();

        $this->actingAs($this->employee, 'api')
             ->postJson("/api/bookings/{$booking->id}/approve")
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['approver']);
    }

    public function test_approver_can_reject_booking(): void
    {
        $booking = $this->createPendingBooking();

        $this->actingAs($this->approver, 'api')
             ->postJson("/api/bookings/{$booking->id}/reject", ['reason' => 'Conflicting event'])
             ->assertOk()
             ->assertJsonPath('data.status', 'rejected');
    }

    public function test_wrong_role_cannot_approve(): void
    {
        $booking = $this->createPendingBooking();

        $wrongApprover = User::factory()->create(['status' => 'active']);
        $wrongApprover->assignRole('employee');

        $this->actingAs($wrongApprover, 'api')
             ->postJson("/api/bookings/{$booking->id}/approve")
             ->assertStatus(403);
    }

    public function test_cannot_approve_non_pending_booking(): void
    {
        $booking = $this->createPendingBooking();

        // Approve first
        $this->actingAs($this->approver, 'api')
             ->postJson("/api/bookings/{$booking->id}/approve");

        // Try to approve again
        $this->actingAs($this->approver, 'api')
             ->postJson("/api/bookings/{$booking->id}/approve")
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['booking']);
    }
}
