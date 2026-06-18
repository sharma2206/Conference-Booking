<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Hall;
use App\Models\RecurringBooking;
use App\Models\Setting;
use App\Notifications\BookingCreatedNotification;
use App\Notifications\BookingStatusNotification;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(private readonly ApprovalService $approvalService) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Booking::with(['hall', 'user', 'department', 'approvals.approver'])
            ->when($filters['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->when($filters['hall_id'] ?? null, fn($q, $v) => $q->where('hall_id', $v))
            ->when($filters['department_id'] ?? null, fn($q, $v) => $q->where('department_id', $v))
            ->when($filters['user_id'] ?? null, fn($q, $v) => $q->where('user_id', $v))
            ->when($filters['date_from'] ?? null, fn($q, $v) => $q->where('booking_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn($q, $v) => $q->where('booking_date', '<=', $v))
            ->when($filters['search'] ?? null, fn($q, $v) => $q->where(function ($inner) use ($v) {
                $inner->where('title', 'like', "%{$v}%")
                      ->orWhere('booking_number', 'like', "%{$v}%");
            }))
            ->orderByDesc('booking_date')
            ->orderByDesc('created_at');

        if (isset($filters['my_bookings']) && $filters['my_bookings']) {
            $query->where('user_id', auth()->id());
        }

        if (auth()->user()->hasRole('employee')) {
            $query->where('user_id', auth()->id());
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): Booking
    {
        $this->validateBookingRules($data);
        $this->checkAvailability($data['hall_id'], $data['booking_date'], $data['start_time'], $data['end_time']);

        return DB::transaction(function () use ($data) {
            $booking = Booking::create([
                'booking_number' => $this->generateBookingNumber(),
                'title' => $data['title'],
                'purpose' => $data['purpose'],
                'agenda' => $data['agenda'] ?? null,
                'organizer_name' => $data['organizer_name'] ?? auth()->user()->name,
                'organizer_phone' => $data['organizer_phone'] ?? auth()->user()->phone,
                'hall_id' => $data['hall_id'],
                'user_id' => auth()->id(),
                'department' => $data['department'] ?? null,
                'department_id' => $data['department_id'] ?? auth()->user()->department_id,
                'participant_count' => $data['participant_count'],
                'booking_date' => $data['booking_date'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'duration_minutes' => $this->calculateDuration($data['start_time'], $data['end_time']),
                'status' => 'pending',
                'created_by' => auth()->id(),
            ]);

            if (!empty($data['attendees'])) {
                $booking->attendees()->createMany($data['attendees']);
            }

            $this->approvalService->initiateApproval($booking);

            $booking->user->notify(new BookingCreatedNotification($booking));

            return $booking->load('hall', 'user', 'approvals', 'attendees');
        });
    }

    public function update(Booking $booking, array $data): Booking
    {
        if (!in_array($booking->status, ['pending', 'draft'])) {
            throw ValidationException::withMessages([
                'booking' => ['Only pending or draft bookings can be updated.'],
            ]);
        }

        if (isset($data['booking_date']) || isset($data['start_time']) || isset($data['end_time'])) {
            $date = $data['booking_date'] ?? $booking->booking_date->toDateString();
            $start = $data['start_time'] ?? $booking->start_time;
            $end = $data['end_time'] ?? $booking->end_time;
            $hallId = $data['hall_id'] ?? $booking->hall_id;

            $this->checkAvailability($hallId, $date, $start, $end, $booking->id);
        }

        return DB::transaction(function () use ($booking, $data) {
            $booking->update(array_filter([
                'title' => $data['title'] ?? null,
                'purpose' => $data['purpose'] ?? null,
                'agenda' => $data['agenda'] ?? null,
                'hall_id' => $data['hall_id'] ?? null,
                'department_id' => $data['department_id'] ?? null,
                'participant_count' => $data['participant_count'] ?? null,
                'booking_date' => $data['booking_date'] ?? null,
                'start_time' => $data['start_time'] ?? null,
                'end_time' => $data['end_time'] ?? null,
            ], fn($v) => $v !== null));

            if (isset($data['start_time']) && isset($data['end_time'])) {
                $booking->update([
                    'duration_minutes' => $this->calculateDuration($booking->start_time, $booking->end_time),
                ]);
            }

            if (isset($data['attendees'])) {
                $booking->attendees()->delete();
                $booking->attendees()->createMany($data['attendees']);
            }

            return $booking->fresh(['hall', 'user', 'approvals', 'attendees']);
        });
    }

    public function cancel(Booking $booking, string $reason = ''): Booking
    {
        if (!$booking->isCancellable()) {
            throw ValidationException::withMessages([
                'booking' => ['This booking cannot be cancelled.'],
            ]);
        }

        $booking->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'remarks' => $reason,
        ]);

        $booking->user->notify(new BookingStatusNotification($booking, 'cancelled'));

        return $booking->fresh();
    }

    public function createRecurring(array $data): array
    {
        $this->validateBookingRules($data);

        return DB::transaction(function () use ($data) {
            $recurring = RecurringBooking::create([
                'hall_id' => $data['hall_id'],
                'user_id' => auth()->id(),
                'title' => $data['title'],
                'purpose' => $data['purpose'],
                'agenda' => $data['agenda'] ?? null,
                'department_id' => $data['department_id'] ?? auth()->user()->department_id,
                'participant_count' => $data['participant_count'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
                'frequency' => $data['frequency'],
                'days_of_week' => $data['days_of_week'] ?? null,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
            ]);

            $bookings = $this->generateRecurringDates($recurring);

            $created = [];
            foreach ($bookings as $date) {
                try {
                    $this->checkAvailability($data['hall_id'], $date, $data['start_time'], $data['end_time']);
                    $booking = Booking::create([
                        'booking_number' => $this->generateBookingNumber(),
                        'title' => $data['title'],
                        'purpose' => $data['purpose'],
                        'agenda' => $data['agenda'] ?? null,
                        'hall_id' => $data['hall_id'],
                        'user_id' => auth()->id(),
                        'department_id' => $data['department_id'] ?? auth()->user()->department_id,
                        'participant_count' => $data['participant_count'],
                        'booking_date' => $date,
                        'start_time' => $data['start_time'],
                        'end_time' => $data['end_time'],
                        'duration_minutes' => $this->calculateDuration($data['start_time'], $data['end_time']),
                        'is_recurring' => true,
                        'recurring_booking_id' => $recurring->id,
                        'status' => 'pending',
                        'created_by' => auth()->id(),
                    ]);
                    $this->approvalService->initiateApproval($booking);
                    $created[] = $booking;
                } catch (ValidationException) {
                    // skip conflicting dates silently
                }
            }

            return ['recurring' => $recurring, 'bookings' => $created];
        });
    }

    private function validateBookingRules(array $data): void
    {
        $date = Carbon::parse($data['booking_date'] ?? $data['start_date'] ?? now());

        if ($date->isPast() && !$date->isToday()) {
            throw ValidationException::withMessages([
                'booking_date' => ['Cannot book past dates.'],
            ]);
        }

        $maxAdvanceDays = (int) Setting::get('booking_advance_days', 30);
        if ($date->diffInDays(now()) > $maxAdvanceDays) {
            throw ValidationException::withMessages([
                'booking_date' => ["Bookings can only be made up to {$maxAdvanceDays} days in advance."],
            ]);
        }

        if (isset($data['start_time']) && isset($data['end_time'])) {
            $duration = $this->calculateDuration($data['start_time'], $data['end_time']);
            $minDuration = (int) Setting::get('min_booking_duration', 30);
            $maxDuration = (int) Setting::get('max_booking_duration', 480);

            if ($duration < $minDuration) {
                throw ValidationException::withMessages([
                    'start_time' => ["Minimum booking duration is {$minDuration} minutes."],
                ]);
            }

            if ($duration > $maxDuration) {
                throw ValidationException::withMessages([
                    'end_time' => ["Maximum booking duration is {$maxDuration} minutes."],
                ]);
            }
        }
    }

    private function checkAvailability(int $hallId, string $date, string $startTime, string $endTime, ?int $excludeId = null): void
    {
        $hall = Hall::findOrFail($hallId);

        if (!$hall->isAvailable($date, $startTime, $endTime, $excludeId)) {
            throw ValidationException::withMessages([
                'hall_id' => ['This hall is not available for the selected time slot.'],
            ]);
        }
    }

    private function generateBookingNumber(): string
    {
        $prefix = 'BK';
        $year = now()->format('Y');
        $month = now()->format('m');
        $count = Booking::whereYear('created_at', $year)->whereMonth('created_at', $month)->count() + 1;

        return sprintf('%s%s%s%04d', $prefix, $year, $month, $count);
    }

    private function calculateDuration(string $startTime, string $endTime): int
    {
        return (int) Carbon::parse($startTime)->diffInMinutes(Carbon::parse($endTime));
    }

    private function generateRecurringDates(RecurringBooking $recurring): array
    {
        $dates = [];
        $current = Carbon::parse($recurring->start_date);
        $end = Carbon::parse($recurring->end_date);

        while ($current->lte($end)) {
            $shouldAdd = match ($recurring->frequency) {
                'daily' => true,
                'weekly' => in_array($current->dayOfWeek, $recurring->days_of_week ?? []),
                'monthly' => $current->day === Carbon::parse($recurring->start_date)->day,
                default => false,
            };

            if ($shouldAdd) {
                $dates[] = $current->toDateString();
            }

            $current->addDay();
        }

        return $dates;
    }
}
