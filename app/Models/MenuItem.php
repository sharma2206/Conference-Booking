<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    protected $fillable = [
        'menu_id',
        'parent_id',
        'label',
        'icon',
        'route',
        'url',
        'permission',
        'badge',
        'badge_color',
        'sort_order',
        'is_active',
        'visibility_type',
        'visibility_values',
        'is_mega_menu',
    ];

    protected function casts(): array
    {
        return [
            'is_active'         => 'boolean',
            'is_mega_menu'      => 'boolean',
            'visibility_values' => 'array',
            'sort_order'        => 'integer',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(MenuItem::class, 'parent_id')
            ->orderBy('sort_order');
    }

    public function activeChildren(): HasMany
    {
        return $this->hasMany(MenuItem::class, 'parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order');
    }

    // ── Scopes ────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeRootLevel(Builder $query): Builder
    {
        return $query->whereNull('parent_id');
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order');
    }

    // ── Helpers ───────────────────────────────────────────────────────

    /**
     * Check if the authenticated user can see this item based on permission.
     */
    public function isVisibleTo(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        if ($this->permission && !$user->can($this->permission)) {
            return false;
        }

        return match ($this->visibility_type) {
            'all'        => true,
            'role'       => $user->hasAnyRole($this->visibility_values ?? []),
            'department' => in_array($user->department_id, $this->visibility_values ?? []),
            'user'       => in_array($user->id, $this->visibility_values ?? []),
            default      => true,
        };
    }
}
