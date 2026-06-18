<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\Department;
use App\Models\Hall;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Booking>
 */
class BookingFactory extends Factory
{
    public function definition(): array
    {
        $start = fake()->time('H:i', '17:00');
        $end   = date('H:i', strtotime($start) + 3600);

        return [
            'booking_number'   => 'BK' . now()->format('Ym') . str_pad(fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'title'            => fake()->sentence(4),
            'purpose'          => fake()->sentence(),
            'agenda'           => fake()->paragraph(),
            'organizer_name'   => fake()->name(),
            'organizer_phone'  => fake()->phoneNumber(),
            'hall_id'          => Hall::factory(),
            'user_id'          => User::factory(),
            'department_id'    => null,
            'participant_count'=> fake()->numberBetween(2, 20),
            'booking_date'     => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
            'start_time'       => $start,
            'end_time'         => $end,
            'duration_minutes' => 60,
            'status'           => 'pending',
            'is_recurring'     => false,
            'created_by'       => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(['status' => 'approved', 'approved_at' => now()]);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => 'cancelled', 'cancelled_at' => now()]);
    }

    public function forDate(string $date): static
    {
        return $this->state(['booking_date' => $date]);
    }
}
