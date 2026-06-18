<?php

namespace App\Http\Controllers\Booking;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Http\Requests\Booking\UpdateBookingRequest;
use App\Models\Booking;
use App\Models\Hall;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class BookingController extends Controller
{
    public function index(): JsonResponse
    {
        $bookings = Booking::with(['hall', 'user'])
            ->orderByDesc('booking_date')
            ->paginate(15);

        return response()->json($bookings);
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $data = $request->validated();
        $hall = Hall::findOrFail($data['hall_id']);

        if ($data['participant_count'] > $hall->capacity) {
            return response()->json(['message' => 'Participant count exceeds hall capacity.'], 422);
        }

        $hasConflict = Booking::where('hall_id', $hall->id)
            ->where('booking_date', $data['booking_date'])
            ->where(function ($query) use ($data) {
                $query->whereBetween('start_time', [$data['start_time'], $data['end_time']])
                    ->orWhereBetween('end_time', [$data['start_time'], $data['end_time']])
                    ->orWhere(function ($query) use ($data) {
                        $query->where('start_time', '<=', $data['start_time'])
                            ->where('end_time', '>=', $data['end_time']);
                    });
            })
            ->whereNotIn('status', ['cancelled', 'rejected'])
            ->exists();

        if ($hasConflict) {
            return response()->json(['message' => 'Selected hall is not available for the requested time range.'], 422);
        }

        $duration = (int) now()->parse($data['end_time'])->diffInMinutes(now()->parse($data['start_time']));

        $booking = Booking::create([
            'title' => $data['title'],
            'purpose' => $data['purpose'],
            'hall_id' => $data['hall_id'],
            'user_id' => Auth::id(),
            'department' => $data['department'],
            'participant_count' => $data['participant_count'],
            'booking_date' => $data['booking_date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'duration_minutes' => $duration,
            'status' => 'pending',
            'remarks' => $data['remarks'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return response()->json($booking->load(['hall', 'user']), 201);
    }

    public function show(Booking $booking): JsonResponse
    {
        return response()->json($booking->load(['hall', 'user', 'approval.approver']));
    }

    public function update(UpdateBookingRequest $request, Booking $booking): JsonResponse
    {
        $data = $request->validated();
        $hall = Hall::findOrFail($data['hall_id']);

        if ($data['participant_count'] > $hall->capacity) {
            return response()->json(['message' => 'Participant count exceeds hall capacity.'], 422);
        }

        $booking->update($data + ['duration_minutes' => now()->parse($data['end_time'])->diffInMinutes(now()->parse($data['start_time']))]);

        return response()->json($booking->load(['hall', 'user', 'approval']));
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $booking->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        return response()->json(['message' => 'Booking cancelled successfully.']);
    }
}
