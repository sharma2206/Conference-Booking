<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HallFacility extends Model
{
    use HasFactory;

    protected $fillable = [
        'hall_id',
        'facility',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    public function hall(): BelongsTo
    {
        return $this->belongsTo(Hall::class);
    }
}
