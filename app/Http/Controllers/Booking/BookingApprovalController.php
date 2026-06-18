<?php

namespace App\Http\Controllers\Booking;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingApproval;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookingApprovalController extends Controller
{
    public function approve(Booking $booking): JsonResponse
    {
        if ($booking->status !== 'pending') {
            return response()->json(['message' => 'Only pending bookings can be approved.'], 422);
        }

        $booking->update([
            'status'            => 'approved',
            'approver_id'       => Auth::id(),
            'rejection_reason'  => null,
        ]);

        BookingApproval::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'approver_id'   => Auth::id(),
                'status'        => 'approved',
                'remarks'       => 'Approved by ' . Auth::user()?->name,
                'approved_at'   => now(),
            ],
        );

        return response()->json($booking->load(['hall', 'user', 'approval.approver']));
    }

    public function reject(Request $request, Booking $booking): JsonResponse
    {
        if ($booking->status !== 'pending') {
            return response()->json(['message' => 'Only pending bookings can be rejected.'], 422);
        }

        $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $booking->update([
            'status'            => 'rejected',
            'approver_id'       => Auth::id(),
            'rejection_reason'  => $request->input('reason'),
        ]);

        BookingApproval::updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'approver_id'   => Auth::id(),
                'status'        => 'rejected',
                'remarks'       => $request->input('reason'),
                'approved_at'   => now(),
            ],
        );

        return response()->json($booking->load(['hall', 'user', 'approval.approver']));
    }
}
