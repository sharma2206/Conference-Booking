<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'step_level',
        'role_name',
        'approver_id',
        'status',
        'remarks',
        'approved_at',
        'notified_at',
        'escalated_at',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'notified_at' => 'datetime',
            'escalated_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
