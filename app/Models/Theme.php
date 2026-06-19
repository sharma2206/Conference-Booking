<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Theme extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'json_config',
        'thumbnail',
        'is_default',
        'is_active',
        'is_system',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'json_config' => 'array',
            'is_default'  => 'boolean',
            'is_active'   => 'boolean',
            'is_system'   => 'boolean',
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

    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('is_system', true);
    }

    public function scopeDefault(Builder $query): Builder
    {
        return $query->where('is_default', true);
    }

    // ── Static helpers ────────────────────────────────────────────────

    /**
     * Get the currently active (default) theme.
     */
    public static function getActive(): ?static
    {
        return static::active()->default()->first()
            ?? static::active()->first();
    }

    /**
     * Set the given theme as default, clearing all others.
     */
    public static function setDefault(int|string $id): static
    {
        static::where('is_default', true)->update(['is_default' => false]);

        $theme = static::findOrFail($id);
        $theme->update(['is_default' => true, 'is_active' => true]);

        return $theme->fresh();
    }
}
