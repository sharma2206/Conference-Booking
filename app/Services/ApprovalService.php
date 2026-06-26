<?php

namespace App\Services;

use App\Models\ApprovalWorkflow;
use App\Models\Booking;
use App\Models\BookingApproval;
use App\Models\User;
use App\Notifications\ApprovalRequiredNotification;
use App\Notifications\BookingStatusNotification;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApprovalService
{
    public function initiateApproval(Booking $booking): void
    {
        $workflow = Cache::remember('default_approval_workflow', 300, fn () =>
    ApprovalWorkflow::with('steps')->where('is_default', true)->where('is_active', true)->first()
);

        if (!$workflow || $workflow->steps->isEmpty()) {
            $booking->update(['status' => 'approved', 'approved_at' => now(), 'current_approval_step' => 0]);
            return;
        }

        $firstStep = $workflow->steps->first();

        BookingApproval::create([
            'booking_id' => $booking->id,
            'step_level' => $firstStep->step_order,
            'role_name' => $firstStep->role_name,
            'approver_id' => null,
            'status' => 'pending',
        ]);

        $booking->update(['current_approval_step' => $firstStep->step_order]);

        $this->notifyApprovers($booking, $firstStep->role_name);
    }

    public function approve(Booking $booking, User $approver, string $remarks = ''): Booking
    {
        $this->validateApproverPermission($booking, $approver);

        return DB::transaction(function () use ($booking, $approver, $remarks) {
            $currentApproval = $booking->approvals()
                ->where('step_level', $booking->current_approval_step)
                ->where('status', 'pending')
                ->firstOrFail();

            $currentApproval->update([
                'approver_id' => $approver->id,
                'status' => 'approved',
                'remarks' => $remarks,
                'approved_at' => now(),
            ]);

            $workflow = Cache::remember('default_approval_workflow', 300, fn () =>
    ApprovalWorkflow::with('steps')->where('is_default', true)->where('is_active', true)->first()
);
            $nextStep = $workflow?->steps
                ->where('step_order', '>', $booking->current_approval_step)
                ->first();

            if ($nextStep) {
                BookingApproval::create([
                    'booking_id' => $booking->id,
                    'step_level' => $nextStep->step_order,
                    'role_name' => $nextStep->role_name,
                    'status' => 'pending',
                ]);

                $booking->update(['current_approval_step' => $nextStep->step_order]);
                $this->notifyApprovers($booking, $nextStep->role_name);
            } else {
                $booking->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approver_id' => $approver->id,
                ]);

                $booking->user->notify(new BookingStatusNotification($booking, 'approved'));
            }

            return $booking->fresh(['hall', 'user', 'approvals.approver']);
        });
    }

    public function reject(Booking $booking, User $approver, string $reason): Booking
    {
        $this->validateApproverPermission($booking, $approver);

        return DB::transaction(function () use ($booking, $approver, $reason) {
            $currentApproval = $booking->approvals()
                ->where('step_level', $booking->current_approval_step)
                ->where('status', 'pending')
                ->firstOrFail();

            $currentApproval->update([
                'approver_id' => $approver->id,
                'status' => 'rejected',
                'remarks' => $reason,
                'approved_at' => now(),
            ]);

            $booking->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'approver_id' => $approver->id,
            ]);

            $booking->user->notify(new BookingStatusNotification($booking, 'rejected'));

            return $booking->fresh(['hall', 'user', 'approvals.approver']);
        });
    }

    private function validateApproverPermission(Booking $booking, User $approver): void
    {
        if ($booking->status !== 'pending') {
            throw ValidationException::withMessages([
                'booking' => ['This booking is not pending approval.'],
            ]);
        }

        // SEC-03: prevent self-approval
        if ($approver->id === $booking->user_id) {
            throw ValidationException::withMessages([
                'approver' => ['You cannot approve or reject your own booking.'],
            ]);
        }

        $currentApproval = $booking->approvals()
            ->where('step_level', $booking->current_approval_step)
            ->where('status', 'pending')
            ->first();

        if (!$currentApproval) {
            throw ValidationException::withMessages([
                'booking' => ['No pending approval step found.'],
            ]);
        }

        if ($currentApproval->role_name && !$approver->hasRole($currentApproval->role_name)) {
            throw ValidationException::withMessages([
                'approver' => ["You must have the role '{$currentApproval->role_name}' to approve this booking."],
            ]);
        }
    }

    private function notifyApprovers(Booking $booking, string $roleName): void
    {
        User::role($roleName)->each(function (User $approver) use ($booking) {
            $approver->notify(new ApprovalRequiredNotification($booking));
        });
    }
}
