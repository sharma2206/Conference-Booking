<?php

namespace App\Http\Controllers\Booking;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Http\Requests\Booking\StoreRecurringBookingRequest;
use App\Http\Requests\Booking\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(private readonly BookingService $bookingService) {}

    public function index(Request $request): JsonResponse
    {
        // API-06: whitelist filter keys rather than passing $request->all()
        $filters  = $request->only(['status', 'hall_id', 'department_id', 'user_id', 'date_from', 'date_to', 'search', 'per_page', 'my_bookings']);
        $bookings = $this->bookingService->list($filters);

        return response()->json($bookings);
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $booking = $this->bookingService->create($request->validated());

        return response()->json(['data' => new BookingResource($booking)], 201);
    }

    public function show(Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        return response()->json([
            'data' => new BookingResource($booking->load([
                'hall.facilities',
                'user',
                'department',
                'approvals.approver',
                'attendees',
                'visitors',
                'cateringOrder.items.menu',
                'resources.resource',
            ])),
        ]);
    }

    public function update(UpdateBookingRequest $request, Booking $booking): JsonResponse
    {
        $this->authorize('update', $booking);

        $updated = $this->bookingService->update($booking, $request->validated());

        return response()->json(['data' => new BookingResource($updated)]);
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $this->authorize('delete', $booking);

        $cancelled = $this->bookingService->cancel($booking, request('reason', ''));

        return response()->json(['data' => new BookingResource($cancelled), 'message' => 'Booking cancelled successfully.']);
    }

    public function calendar(Request $request): JsonResponse
    {
        $request->validate([
            'start' => ['required', 'date'],
            'end'   => ['required', 'date'],
        ]);

        $user    = auth('api')->user();
        $isAdmin = $user->hasAnyRole(['super-admin', 'admin', 'facility-manager']);

        $bookings = Booking::with(['hall', 'user'])
            ->whereBetween('booking_date', [$request->start, $request->end])
            ->whereIn('status', ['pending', 'approved', 'completed'])
            ->when(!$isAdmin, fn($q) => $q->where('user_id', $user->id))
            ->get()
            ->map(fn($b) => [
                'id'    => $b->id,
                'title' => "{$b->hall->name}: {$b->title}",
                'start' => "{$b->booking_date->toDateString()}T{$b->start_time}",
                'end'   => "{$b->booking_date->toDateString()}T{$b->end_time}",
                'color' => $this->getStatusColor($b->status),
                'extendedProps' => [
                    'booking_id'     => $b->id,
                    'booking_number' => $b->booking_number,
                    'hall'           => $b->hall->name,
                    'status'         => $b->status,
                    'organizer'      => $b->user->name,
                ],
            ]);

        return response()->json(['data' => $bookings]);
    }

    public function recurringStore(StoreRecurringBookingRequest $request): JsonResponse
    {
        $result = $this->bookingService->createRecurring($request->validated());

        return response()->json([
            'data'    => $result,
            'message' => count($result['bookings']) . ' recurring bookings created.'
                . (count($result['skipped_dates']) > 0 ? ' ' . count($result['skipped_dates']) . ' dates were skipped due to conflicts.' : ''),
        ], 201);
    }

    private function getStatusColor(string $status): string
    {
        return match ($status) {
            'approved'  => '#22c55e',
            'pending'   => '#f59e0b',
            'rejected'  => '#ef4444',
            'cancelled' => '#6b7280',
            'completed' => '#3b82f6',
            default     => '#8b5cf6',
        };
    }
}
