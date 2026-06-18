<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CateringOrderItem extends Model
{
    use HasFactory;

    protected $table = 'catering_order_items';

    protected $fillable = [
        'order_id',
        'menu_id',
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(CateringOrder::class, 'order_id');
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(CateringMenu::class, 'menu_id');
    }
}
