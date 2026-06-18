<?php

namespace Tests\Feature\Booking;

use App\Models\Department;
use App\Models\Hall;
use App\Models\Holiday;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class BookingCreationTest extends TestCase
{
    use LazilyRefreshDatabase;

    private User $employee;
    private Hall $hall;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);

        $this->hall     = Hall::factory()->create(['capacity' => 20, 'status' => 'active']);
        $this->employee = User::factory()->create(['status' => 'active']);
        $this->employee->assignRole('employee');
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'title'             => 'Team Standup',
            'purpose'           => 'Daily sync meeting',
            'hall_id'           => $this->hall->id,
            'participant_count' => 5,
            'booking_date'      => now()->addDay()->toDateString(),
            'start_time'        => '10:00',
            'end_time'          => '11:00',
        ], $overrides);
    }

    public function test_employee_can_create_booking(): void
    {
        $response = $this->actingAs($this->employee, 'api')
                         ->postJson('/api/bookings', $this->validPayload());

        $response->assertCreated()
                 ->assertJsonPath('data.status', 'pending')
                 ->assertJsonStructure(['data' => ['id', 'booking_number', 'status']]);
    }

    public function test_past_date_booking_rejected(): void
    {
        $this->actingAs($this->employee, 'api')
             ->postJson('/api/bookings', $this->validPayload(['booking_date' => now()->subDay()->toDateString()]))
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['booking_date']);
    }

    public function test_hall_capacity_exceeded_rejected(): void
    {
        $this->actingAs($this->employee, 'api')
             ->postJson('/api/bookings', $this->validPayload(['participant_count' => 999]))
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['participant_count']);
    }

    public function test_holiday_date_booking_rejected(): void
    {
        $date = now()->addDays(3)->toDateString();
        Holiday::create(['name' => 'Test Holiday', 'date' => $date, 'is_recurring_yearly' => false]);

        $this->actingAs($this->employee, 'api')
             ->postJson('/api/bookings', $this->validPayload(['booking_date' => $date]))
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['booking_date']);
    }

    public function test_conflicting_time_slot_rejected(): void
    {
        // Create existing booking
        $this->actingAs($this->employee, 'api')
             ->postJson('/api/bookings', $this->validPayload([
                 'booking_date' => now()->addDays(2)->toDateString(),
                 'start_time'   => '10:00',
                 'end_time'     => '11:00',
             ]))->assertCreated();

        // Attempt overlapping booking for same hall & date
        $this->actingAs($this->employee, 'api')
             ->postJson('/api/bookings', $this->validPayload([
                 'booking_date' => now()->addDays(2)->toDateString(),
                 'start_time'   => '10:30',
                 'end_time'     => '11:30',
             ]))->assertUnprocessable()
                ->assertJsonValidationErrors(['hall_id']);
    }

    public function test_booking_number_is_unique(): void
    {
        $r1 = $this->actingAs($this->employee, 'api')
                   ->postJson('/api/bookings', $this->validPayload(['booking_date' => now()->addDays(1)->toDateString(), 'start_time' => '09:00', 'end_time' => '10:00']));
        $r2 = $this->actingAs($this->employee, 'api')
                   ->postJson('/api/bookings', $this->validPayload(['booking_date' => now()->addDays(1)->toDateString(), 'start_time' => '11:00', 'end_time' => '12:00']));

        $r1->assertCreated();
        $r2->assertCreated();

        $this->assertNotEquals(
            $r1->json('data.booking_number'),
            $r2->json('data.booking_number')
        );
    }

    public function test_title_is_required(): void
    {
        $this->actingAs($this->employee, 'api')
             ->postJson('/api/bookings', $this->validPayload(['title' => '']))
             ->assertUnprocessable()
             ->assertJsonValidationErrors(['title']);
    }
}
