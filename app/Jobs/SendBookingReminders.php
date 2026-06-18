<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Notifications\BookingReminderNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendBookingReminders implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function handle(): void
    {
        // 1 day before reminders
        $tomorrowBookings = Booking::with('user')
            ->where('booking_date', today()->addDay())
            ->where('status', 'approved')
            ->get();

        foreach ($tomorrowBookings as $booking) {
            $booking->user->notify(new BookingReminderNotification($booking, '1_day'));
        }

        // 1 hour before reminders
        $oneHourFromNow = now()->addHour();
        $hourlyBookings = Booking::with('user')
            ->where('booking_date', today())
            ->where('status', 'approved')
            ->whereTime('start_time', '>=', $oneHourFromNow->format('H:i'))
            ->whereTime('start_time', '<', $oneHourFromNow->addMinutes(5)->format('H:i'))
            ->get();

        foreach ($hourlyBookings as $booking) {
            $booking->user->notify(new BookingReminderNotification($booking, '1_hour'));
        }
    }

    public function failed(\Throwable $exception): void
    {
        \Log::error('SendBookingReminders job failed', ['error' => $exception->getMessage()]);
    }
}
