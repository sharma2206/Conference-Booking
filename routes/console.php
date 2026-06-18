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

Schedule::job(new SendBookingReminders)->hourly();
Schedule::job(new MarkCompletedBookings)->hourly();
Schedule::job(new EscalateOverdueApprovals)->dailyAt('08:00');
