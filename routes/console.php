<?php

use App\Jobs\EscalateOverdueApprovals;
use App\Jobs\MarkCompletedBookings;
use App\Jobs\SendBookingReminders;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Runs every 15 minutes to catch 1-day and 1-hour pre-booking reminders
Schedule::job(new SendBookingReminders)->everyFifteenMinutes()->withoutOverlapping();

// Marks past approved bookings as completed — runs once daily at midnight
Schedule::job(new MarkCompletedBookings)->daily()->withoutOverlapping();

// Escalates approvals pending for > 24 hours — runs every hour
Schedule::job(new EscalateOverdueApprovals)->hourly()->withoutOverlapping();
