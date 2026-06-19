<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class ComponentLibrary extends Model
{
    protected $table = 'component_library';

    protected $fillable = [
        'name',
        'slug',
        'type',
        'config',
        'is_enabled',
    ];

    protected function casts(): array
    {
        return [
            'config'     => 'array',
            'is_enabled' => 'boolean',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────

    public function scopeEnabled(Builder $query): Builder
    {
        return $query->where('is_enabled', true);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }
}
