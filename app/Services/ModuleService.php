<?php

namespace App\Services;

use App\Models\DynamicModule;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;

class ModuleService
{
    public function __construct(
        private readonly MenuService $menuService
    ) {}

    /**
     * Return all dynamic modules.
     */
    public function getAll(): Collection
    {
        return DynamicModule::orderBy('menu_position')->get();
    }

    /**
     * Create a new dynamic module and generate its Spatie permissions.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): DynamicModule
    {
        $slug = $data['slug'] ?? Str::slug($data['name']);

        $module = DynamicModule::create([
            'name'              => $data['name'],
            'slug'              => $slug,
            'icon'              => $data['icon'] ?? null,
            'description'       => $data['description'] ?? null,
            'url'               => $data['url'] ?? null,
            'menu_position'     => $data['menu_position'] ?? 99,
            'status'            => $data['status'] ?? 'active',
            'permission_prefix' => $data['permission_prefix'] ?? $slug,
            'is_system'         => false,
            'config'            => $data['config'] ?? null,
        ]);

        $this->syncPermissions($module);
        $this->menuService->syncDynamicModules();

        return $module;
    }

    /**
     * Update an existing dynamic module.
     *
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): DynamicModule
    {
        $module = DynamicModule::findOrFail($id);

        $module->update([
            'name'          => $data['name'] ?? $module->name,
            'icon'          => $data['icon'] ?? $module->icon,
            'description'   => $data['description'] ?? $module->description,
            'url'           => $data['url'] ?? $module->url,
            'menu_position' => $data['menu_position'] ?? $module->menu_position,
            'config'        => $data['config'] ?? $module->config,
        ]);

        $this->syncPermissions($module->fresh());
        $this->menuService->syncDynamicModules();

        return $module->fresh();
    }

    /**
     * Toggle a module between active and inactive.
     */
    public function toggle(int $id): DynamicModule
    {
        $module = DynamicModule::findOrFail($id);

        $module->update([
            'status' => $module->status === 'active' ? 'inactive' : 'active',
        ]);

        $this->menuService->syncDynamicModules();

        return $module->fresh();
    }

    /**
     * Delete a dynamic module. System modules cannot be deleted.
     */
    public function delete(int $id): void
    {
        $module = DynamicModule::findOrFail($id);

        if ($module->is_system) {
            throw ValidationException::withMessages([
                'module' => ['System modules cannot be deleted.'],
            ]);
        }

        $module->delete();
    }

    /**
     * Ensure Spatie permissions exist for this module's CRUD actions.
     */
    public function syncPermissions(DynamicModule $module): void
    {
        $prefix  = $module->permission_prefix ?? $module->slug;
        $actions = ['view', 'create', 'edit', 'delete'];

        foreach ($actions as $action) {
            Permission::firstOrCreate(
                ['name' => "{$prefix}.{$action}", 'guard_name' => 'api']
            );
        }
    }
}
