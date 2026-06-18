<?php

namespace App\Jobs;

use App\Models\Booking;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class MarkCompletedBookings implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        Booking::where('status', 'approved')
            ->where(function ($query) {
                $query->where('booking_date', '<', today())
                      ->orWhere(function ($q) {
                          $q->where('booking_date', today())
                            ->whereTime('end_time', '<', now()->format('H:i'));
                      });
            })
            ->update(['status' => 'completed']);
    }
}
