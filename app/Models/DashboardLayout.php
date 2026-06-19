<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DashboardLayout extends Model
{
    protected $fillable = [
        'role',
        'user_id',
        'layout',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'layout'     => 'array',
            'is_default' => 'boolean',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId)->whereNull('role');
    }

    public function scopeForRole(Builder $query, string $role): Builder
    {
        return $query->where('role', $role)->whereNull('user_id');
    }

    public function scopeDefault(Builder $query): Builder
    {
        return $query->where('is_default', true)->whereNull('user_id')->whereNull('role');
    }

    // ── Static helpers ────────────────────────────────────────────────

    /**
     * Resolve layout for a user using priority: user > role > default.
     */
    public static function resolveForUser(User $user): ?static
    {
        // 1. User-specific layout
        $layout = static::forUser($user->id)->first();
        if ($layout) {
            return $layout;
        }

        // 2. Role-specific layout (check all roles the user has)
        $roles = $user->getRoleNames()->toArray();
        if (!empty($roles)) {
            $layout = static::whereIn('role', $roles)->whereNull('user_id')->first();
            if ($layout) {
                return $layout;
            }
        }

        // 3. System default layout
        return static::default()->first();
    }
}
