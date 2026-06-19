<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'module',
        'fields',
        'filters',
        'group_by',
        'chart_type',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'fields'    => 'array',
            'filters'   => 'array',
            'is_active' => 'boolean',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeForModule(Builder $query, string $module): Builder
    {
        return $query->where('module', $module);
    }
}
