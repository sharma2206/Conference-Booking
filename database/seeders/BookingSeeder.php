<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Hall;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BookingSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the bookings table with sample bookings.
     */
    public function run(): void
    {
        $employee = User::where('email', 'employee@example.com')->first();
        $approver = User::where('email', 'approver@example.com')->first();

        $hall1 = Hall::where('code', 'HALL-001')->first();
        $hall2 = Hall::where('code', 'HALL-002')->first();

        Booking::create([
            'title' => 'Monthly Budget Review',
            'purpose' => 'Review monthly budget and forecasts with leadership.',
            'hall_id' => $hall1->id,
            'user_id' => $employee->id,
            'department' => 'Finance',
            'participant_count' => 18,
            'booking_date' => now()->addDays(2)->toDateString(),
            'start_time' => '10:00',
            'end_time' => '12:00',
            'duration_minutes' => 120,
            'status' => 'pending',
            'remarks' => 'Need conference call equipment.',
            'created_by' => $employee->id,
        ]);

        Booking::create([
            'title' => 'Product Launch Planning',
            'purpose' => 'Collaborate on launch plan and marketing strategy.',
            'hall_id' => $hall2->id,
            'user_id' => $employee->id,
            'department' => 'Marketing',
            'participant_count' => 52,
            'booking_date' => now()->addDays(5)->toDateString(),
            'start_time' => '09:00',
            'end_time' => '13:00',
            'duration_minutes' => 240,
            'status' => 'approved',
            'remarks' => 'Need whiteboard and projector.',
            'created_by' => $employee->id,
            'approver_id' => $approver->id,
        ]);
    }
}
