<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'purpose',
        'hall_id',
        'user_id',
        'department',
        'participant_count',
        'booking_date',
        'start_time',
        'end_time',
        'duration_minutes',
        'status',
        'remarks',
        'approver_id',
        'rejection_reason',
        'cancelled_at',
        'created_by',
    ];

    protected $casts = [
        'booking_date' => 'date',
        'cancelled_at' => 'datetime',
    ];

    public function hall(): BelongsTo
    {
        return $this->belongsTo(Hall::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approval(): HasOne
    {
        return $this->hasOne(BookingApproval::class);
    }
}
