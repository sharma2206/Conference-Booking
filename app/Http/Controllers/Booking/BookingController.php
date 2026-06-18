<?php

namespace App\Http\Controllers\Booking;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Http\Requests\Booking\UpdateBookingRequest;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function __construct(private readonly BookingService $bookingService) {}

    public function index(Request $request): JsonResponse
    {
        $bookings = $this->bookingService->list($request->all());

        return response()->json($bookings);
    }

    public function store(StoreBookingRequest $request): JsonResponse
    {
        $booking = $this->bookingService->create($request->validated());

        return response()->json(['data' => $booking], 201);
    }

    public function show(Booking $booking): JsonResponse
    {
        $this->authorize('view', $booking);

        return response()->json([
            'data' => $booking->load([
                'hall.facilities',
                'user',
                'department',
                'approvals.approver',
                'attendees',
                'visitors',
                'cateringOrder.items.menu',
                'resources.resource',
            ]),
        ]);
    }

    public function update(UpdateBookingRequest $request, Booking $booking): JsonResponse
    {
        $this->authorize('update', $booking);

        $updated = $this->bookingService->update($booking, $request->validated());

        return response()->json(['data' => $updated]);
    }

    public function destroy(Booking $booking): JsonResponse
    {
        $this->authorize('delete', $booking);

        $cancelled = $this->bookingService->cancel($booking, request('reason', ''));

        return response()->json(['data' => $cancelled, 'message' => 'Booking cancelled successfully.']);
    }

    public function calendar(Request $request): JsonResponse
    {
        $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date'],
        ]);

        $bookings = Booking::with(['hall', 'user'])
            ->whereBetween('booking_date', [$request->start, $request->end])
            ->whereIn('status', ['pending', 'approved', 'completed'])
            ->when(!auth('api')->user()->hasAnyRole(['super-admin', 'admin', 'facility-manager']), function ($q) {
                $q->where('user_id', auth('api')->id());
            })
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'title' => "{$b->hall->name}: {$b->title}",
                'start' => "{$b->booking_date->toDateString()}T{$b->start_time}",
                'end' => "{$b->booking_date->toDateString()}T{$b->end_time}",
                'color' => $this->getStatusColor($b->status),
                'extendedProps' => [
                    'booking_id' => $b->id,
                    'booking_number' => $b->booking_number,
                    'hall' => $b->hall->name,
                    'status' => $b->status,
                    'organizer' => $b->user->name,
                ],
            ]);

        return response()->json(['data' => $bookings]);
    }

    public function recurringStore(Request $request): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'purpose' => ['required', 'string'],
            'hall_id' => ['required', 'exists:halls,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'participant_count' => ['required', 'integer', 'min:1'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'frequency' => ['required', 'in:daily,weekly,monthly,custom'],
            'days_of_week' => ['nullable', 'array'],
            'days_of_week.*' => ['integer', 'between:0,6'],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        $result = $this->bookingService->createRecurring($request->validated());

        return response()->json([
            'data' => $result,
            'message' => count($result['bookings']) . ' recurring bookings created.',
        ], 201);
    }

    private function getStatusColor(string $status): string
    {
        return match ($status) {
            'approved' => '#22c55e',
            'pending' => '#f59e0b',
            'rejected' => '#ef4444',
            'cancelled' => '#6b7280',
            'completed' => '#3b82f6',
            default => '#8b5cf6',
        };
    }
}
