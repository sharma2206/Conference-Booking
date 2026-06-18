<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function view(User $user, Booking $booking): bool
    {
        return $user->hasAnyRole(['super-admin', 'admin', 'facility-manager']) ||
               $user->id === $booking->user_id ||
               $user->id === $booking->approver_id;
    }

    public function update(User $user, Booking $booking): bool
    {
        return ($user->id === $booking->user_id && in_array($booking->status, ['pending', 'draft'])) ||
               $user->hasAnyRole(['super-admin', 'admin']);
    }

    public function delete(User $user, Booking $booking): bool
    {
        return $user->id === $booking->user_id ||
               $user->hasAnyRole(['super-admin', 'admin']);
    }
}
