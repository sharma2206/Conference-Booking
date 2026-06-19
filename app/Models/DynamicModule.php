<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Spatie\Permission\Models\Permission;

class DynamicModule extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'icon',
        'description',
        'url',
        'menu_position',
        'status',
        'permission_prefix',
        'is_system',
        'config',
    ];

    protected function casts(): array
    {
        return [
            'is_system'     => 'boolean',
            'menu_position' => 'integer',
            'config'        => 'array',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('is_system', true);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    /**
     * Generate Spatie permissions for this module.
     * Creates {prefix}.view, {prefix}.create, {prefix}.edit, {prefix}.delete
     */
    public function generatePermissions(): void
    {
        $prefix = $this->permission_prefix ?? $this->slug;

        $actions = ['view', 'create', 'edit', 'delete'];

        foreach ($actions as $action) {
            Permission::firstOrCreate(
                ['name' => "{$prefix}.{$action}", 'guard_name' => 'api']
            );
        }
    }

    /**
     * Return all permission names this module owns.
     */
    public function permissionNames(): array
    {
        $prefix = $this->permission_prefix ?? $this->slug;

        return array_map(
            fn($action) => "{$prefix}.{$action}",
            ['view', 'create', 'edit', 'delete']
        );
    }
}
