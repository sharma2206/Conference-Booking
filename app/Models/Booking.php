<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Booking extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'booking_number',
        'title',
        'purpose',
        'agenda',
        'organizer_name',
        'organizer_phone',
        'hall_id',
        'user_id',
        'department_id',
        'participant_count',
        'booking_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'is_recurring',
        'recurring_booking_id',
        'status',
        'current_approval_step',
        'remarks',
        'approver_id',
        'rejection_reason',
        'approved_at',
        'cancelled_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'booking_date' => 'date',
            'cancelled_at' => 'datetime',
            'approved_at' => 'datetime',
            'is_recurring' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['title', 'status', 'hall_id', 'booking_date', 'start_time', 'end_time'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    public function hall(): BelongsTo
    {
        return $this->belongsTo(Hall::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function recurringBooking(): BelongsTo
    {
        return $this->belongsTo(RecurringBooking::class);
    }

    public function approval(): HasOne
    {
        return $this->hasOne(BookingApproval::class)->latest();
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(BookingApproval::class)->orderBy('step_level');
    }

    public function attendees(): HasMany
    {
        return $this->hasMany(BookingAttendee::class);
    }

    public function visitors(): HasMany
    {
        return $this->hasMany(Visitor::class);
    }

    public function cateringOrder(): HasOne
    {
        return $this->hasOne(CateringOrder::class);
    }

    public function resources(): HasMany
    {
        return $this->hasMany(BookingResource::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isCancellable(): bool
    {
        return in_array($this->status, ['pending', 'approved']) &&
               $this->booking_date->isFuture();
    }
}
