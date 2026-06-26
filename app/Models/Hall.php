<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Setting;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Hall extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'name',
        'code',
        'capacity',
        'building',
        'floor',
        'location',
        'description',
        'amenities',
        'status',
        'images',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'amenities' => 'array',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logFillable()->logOnlyDirty()->dontSubmitEmptyLogs();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function facilities(): HasMany
    {
        return $this->hasMany(HallFacility::class);
    }

    public function isAvailable(string $date, string $startTime, string $endTime, ?int $excludeBookingId = null): bool
    {
        // Apply configurable buffer so back-to-back bookings have a gap
        $bufferMinutes = (int) Setting::get('booking_buffer_minutes', 0);
        if ($bufferMinutes > 0) {
            $startTime = \Carbon\Carbon::parse($startTime)->subMinutes($bufferMinutes)->format('H:i:s');
            $endTime   = \Carbon\Carbon::parse($endTime)->addMinutes($bufferMinutes)->format('H:i:s');
        }

        $query = $this->bookings()
            ->whereIn('status', ['pending', 'approved'])
            ->where('booking_date', $date)
            ->where(function ($q) use ($startTime, $endTime) {
                $q->where(function ($inner) use ($startTime, $endTime) {
                    $inner->where('start_time', '<', $endTime)
                          ->where('end_time', '>', $startTime);
                });
            });

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }

        return $query->doesntExist();
    }
}
