<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Hall;
use App\Models\Holiday;
use App\Models\RecurringBooking;
use App\Models\Setting;
use App\Notifications\BookingCreatedNotification;
use App\Notifications\BookingStatusNotification;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(private readonly ApprovalService $approvalService) {}

    public function list(array $filters = []): LengthAwarePaginator
    {
        // API-06: whitelist allowed filter keys
        $allowed = ['status', 'hall_id', 'department_id', 'user_id', 'date_from', 'date_to', 'search', 'per_page', 'my_bookings'];
        $filters = array_intersect_key($filters, array_flip($allowed));

        // PERF-02: cap per_page to prevent resource exhaustion
        $perPage = min(100, max(1, (int) ($filters['per_page'] ?? 15)));

        $query = Booking::with(['hall', 'user', 'department', 'approvals.approver'])
            ->when($filters['status'] ?? null,        fn($q, $v) => $q->where('status', $v))
            ->when($filters['hall_id'] ?? null,       fn($q, $v) => $q->where('hall_id', $v))
            ->when($filters['department_id'] ?? null, fn($q, $v) => $q->where('department_id', $v))
            ->when($filters['user_id'] ?? null,       fn($q, $v) => $q->where('user_id', $v))
            ->when($filters['date_from'] ?? null,     fn($q, $v) => $q->where('booking_date', '>=', $v))
            ->when($filters['date_to'] ?? null,       fn($q, $v) => $q->where('booking_date', '<=', $v))
            ->when($filters['search'] ?? null,        fn($q, $v) => $q->where(function ($inner) use ($v) {
                $inner->where('title', 'like', "%{$v}%")
                      ->orWhere('booking_number', 'like', "%{$v}%");
            }))
            ->orderByDesc('booking_date')
            ->orderByDesc('created_at');

        if (!empty($filters['my_bookings'])) {
            $query->where('user_id', auth()->id());
        }

        if (auth()->user()->hasRole('employee')) {
            $query->where('user_id', auth()->id());
        } elseif (auth()->user()->hasRole('department-head')) {
            $query->where('department_id', auth()->user()->department_id);
        }

        return $query->paginate($perPage);
    }

    public function create(array $data): Booking
    {
        $this->validateBookingRules($data);
        $this->checkCapacity($data['hall_id'], $data['participant_count']);
        $this->checkAvailability($data['hall_id'], $data['booking_date'], $data['start_time'], $data['end_time']);

        return DB::transaction(function () use ($data) {
            // Prevent race condition: lock the hall row before conflict check
            Hall::where('id', $data['hall_id'])->lockForUpdate()->first();
            $this->checkAvailability($data['hall_id'], $data['booking_date'], $data['start_time'], $data['end_time']);

            $booking = Booking::create([
                'booking_number'  => $this->generateBookingNumber(),
                'title'           => $data['title'],
                'purpose'         => $data['purpose'],
                'agenda'          => $data['agenda'] ?? null,
                'organizer_name'  => $data['organizer_name'] ?? auth()->user()->name,
                'organizer_phone' => $data['organizer_phone'] ?? auth()->user()->phone,
                'hall_id'         => $data['hall_id'],
                'user_id'         => auth()->id(),
                'department_id'   => $data['department_id'] ?? auth()->user()->department_id,
                'participant_count' => $data['participant_count'],
                'booking_date'    => $data['booking_date'],
                'start_time'      => $data['start_time'],
                'end_time'        => $data['end_time'],
                'duration_minutes'=> $this->calculateDuration($data['start_time'], $data['end_time']),
                'status'          => 'pending',
                'created_by'      => auth()->id(),
            ]);

            if (!empty($data['attendees'])) {
                $booking->attendees()->createMany($data['attendees']);
            }

            $this->approvalService->initiateApproval($booking);

            $booking->user->notify(new BookingCreatedNotification($booking));

            // Bust dashboard summary cache for this user
            Cache::forget("dashboard_summary_{$booking->user_id}");

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
            $date   = $data['booking_date'] ?? $booking->booking_date->toDateString();
            $start  = $data['start_time']   ?? $booking->start_time;
            $end    = $data['end_time']     ?? $booking->end_time;
            $hallId = $data['hall_id']      ?? $booking->hall_id;

            $this->checkAvailability($hallId, $date, $start, $end, $booking->id);
        }

        if (isset($data['participant_count'])) {
            $this->checkCapacity($data['hall_id'] ?? $booking->hall_id, $data['participant_count']);
        }

        return DB::transaction(function () use ($booking, $data) {
            // BK-08: use explicit field mapping instead of array_filter (which strips falsy values)
            $updates = [];
            foreach (['title', 'purpose', 'agenda', 'hall_id', 'department_id', 'participant_count', 'booking_date', 'start_time', 'end_time'] as $field) {
                if (array_key_exists($field, $data) && $data[$field] !== null) {
                    $updates[$field] = $data[$field];
                }
            }

            if (!empty($updates)) {
                $booking->update($updates);
            }

            if (isset($data['start_time']) || isset($data['end_time'])) {
                $booking->refresh();
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

        $minHours = (int) Setting::get('min_cancellation_hours', 2);
        if ($minHours > 0) {
            $bookingStart = Carbon::parse($booking->booking_date->toDateString() . ' ' . $booking->start_time);
            if ($bookingStart->lt(now()->addHours($minHours))) {
                throw ValidationException::withMessages([
                    'booking' => ["Bookings must be cancelled at least {$minHours} hour(s) before the start time."],
                ]);
            }
        }

        $booking->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
            'remarks'      => $reason,
        ]);

        $booking->user->notify(new BookingStatusNotification($booking, 'cancelled'));

        Cache::forget("dashboard_summary_{$booking->user_id}");

        return $booking->fresh();
    }

    public function createRecurring(array $data): array
    {
        $this->validateBookingRules($data);
        $this->checkCapacity($data['hall_id'], $data['participant_count']);

        return DB::transaction(function () use ($data) {
            $recurring = RecurringBooking::create([
                'hall_id'          => $data['hall_id'],
                'user_id'          => auth()->id(),
                'title'            => $data['title'],
                'purpose'          => $data['purpose'],
                'agenda'           => $data['agenda'] ?? null,
                'department_id'    => $data['department_id'] ?? auth()->user()->department_id,
                'participant_count'=> $data['participant_count'],
                'start_time'       => $data['start_time'],
                'end_time'         => $data['end_time'],
                'frequency'        => $data['frequency'],
                'days_of_week'     => $data['days_of_week'] ?? null,
                'start_date'       => $data['start_date'],
                'end_date'         => $data['end_date'],
            ]);

            $dates = $this->generateRecurringDates($recurring);

            $created = [];
            $skipped = []; // BK-03: track skipped dates explicitly

            foreach ($dates as $date) {
                try {
                    $this->checkAvailability($data['hall_id'], $date, $data['start_time'], $data['end_time']);

                    $booking = Booking::create([
                        'booking_number'   => $this->generateBookingNumber(),
                        'title'            => $data['title'],
                        'purpose'          => $data['purpose'],
                        'agenda'           => $data['agenda'] ?? null,
                        'hall_id'          => $data['hall_id'],
                        'user_id'          => auth()->id(),
                        'department_id'    => $data['department_id'] ?? auth()->user()->department_id,
                        'participant_count'=> $data['participant_count'],
                        'booking_date'     => $date,
                        'start_time'       => $data['start_time'],
                        'end_time'         => $data['end_time'],
                        'duration_minutes' => $this->calculateDuration($data['start_time'], $data['end_time']),
                        'is_recurring'     => true,
                        'recurring_booking_id' => $recurring->id,
                        'status'           => 'pending',
                        'created_by'       => auth()->id(),
                    ]);

                    $this->approvalService->initiateApproval($booking);
                    $created[] = $booking;
                } catch (ValidationException $e) {
                    $skipped[] = ['date' => $date, 'reason' => $e->errors()];
                }
            }

            return ['recurring' => $recurring, 'bookings' => $created, 'skipped_dates' => $skipped];
        });
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    private function validateBookingRules(array $data): void
    {
        $date = Carbon::parse($data['booking_date'] ?? $data['start_date'] ?? now());

        if ($date->isPast() && !$date->isToday()) {
            throw ValidationException::withMessages([
                'booking_date' => ['Cannot book past dates.'],
            ]);
        }

        // BK-04: measure future distance correctly (now → date, not date → now)
        $maxAdvanceDays = (int) Setting::get('booking_advance_days', 30);
        if (now()->diffInDays($date) > $maxAdvanceDays) {
            throw ValidationException::withMessages([
                'booking_date' => ["Bookings can only be made up to {$maxAdvanceDays} days in advance."],
            ]);
        }

        // BK-05: block bookings on company holidays
        if (Holiday::where('date', $date->toDateString())->exists()) {
            throw ValidationException::withMessages([
                'booking_date' => ['This date is a company holiday. Bookings are not allowed.'],
            ]);
        }

        if (isset($data['start_time']) && isset($data['end_time'])) {
            $duration   = $this->calculateDuration($data['start_time'], $data['end_time']);
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

    // BK-07: validate participant count against hall capacity
    private function checkCapacity(int $hallId, int $participantCount): void
    {
        $hall = Hall::findOrFail($hallId);

        if ($participantCount > $hall->capacity) {
            throw ValidationException::withMessages([
                'participant_count' => [
                    "The hall '{$hall->name}' has a maximum capacity of {$hall->capacity}. "
                    . "Your participant count ({$participantCount}) exceeds this limit.",
                ],
            ]);
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

    // BK-01: use a cache lock to prevent race conditions on booking number generation
    private function generateBookingNumber(): string
    {
        $prefix = 'BK';
        $yearMonth = now()->format('Ym');

        return Cache::lock("booking_number_{$yearMonth}", 5)->block(3, function () use ($prefix, $yearMonth) {
            $count = Booking::whereYear('created_at', now()->year)
                            ->whereMonth('created_at', now()->month)
                            ->count() + 1;

            return sprintf('%s%s%04d', $prefix, $yearMonth, $count);
        });
    }

    private function calculateDuration(string $startTime, string $endTime): int
    {
        return (int) Carbon::parse($startTime)->diffInMinutes(Carbon::parse($endTime));
    }

    private function generateRecurringDates(RecurringBooking $recurring): array
    {
        $dates   = [];
        $current = Carbon::parse($recurring->start_date);
        $end     = Carbon::parse($recurring->end_date);

        while ($current->lte($end)) {
            $shouldAdd = match ($recurring->frequency) {
                'daily'   => true,
                'weekly'  => in_array($current->dayOfWeek, $recurring->days_of_week ?? []),
                'monthly' => $current->day === Carbon::parse($recurring->start_date)->day,
                default   => false,
            };

            if ($shouldAdd) {
                $dates[] = $current->toDateString();
            }

            $current->addDay();
        }

        return $dates;
    }
}
