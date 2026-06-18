<?php

namespace App\Jobs;

use App\Models\Booking;
use App\Models\BookingApproval;
use App\Notifications\ApprovalRequiredNotification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class EscalateOverdueApprovals implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $overdueApprovals = BookingApproval::with('booking.user', 'booking.hall')
            ->where('status', 'pending')
            ->whereNull('escalated_at')
            ->whereNotNull('notified_at')
            ->where('notified_at', '<', now()->subHours(24))
            ->get();

        foreach ($overdueApprovals as $approval) {
            $approval->update(['escalated_at' => now()]);

            // Notify admin role
            User::role('admin')->each(function (User $admin) use ($approval) {
                $admin->notify(new ApprovalRequiredNotification($approval->booking));
            });
        }
    }
}
