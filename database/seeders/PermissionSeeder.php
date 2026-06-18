<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    private array $permissions = [
        'hall' => ['view', 'create', 'edit', 'delete'],
        'booking' => ['view', 'create', 'edit', 'cancel', 'approve', 'reject'],
        'user' => ['view', 'create', 'edit', 'delete'],
        'department' => ['view', 'create', 'edit', 'delete'],
        'role' => ['view', 'create', 'edit', 'delete'],
        'visitor' => ['view', 'create', 'edit', 'approve', 'check_in', 'check_out'],
        'catering' => ['view', 'create', 'edit', 'delete'],
        'resource' => ['view', 'create', 'edit', 'delete'],
        'report' => ['view', 'export', 'print'],
        'settings' => ['view', 'update'],
        'audit' => ['view'],
        'notification' => ['view', 'manage'],
    ];

    private array $roles = [
        'super-admin' => null, // all permissions
        'admin' => [
            'hall.*', 'booking.*', 'user.*', 'department.*', 'role.view', 'role.create', 'role.edit',
            'visitor.*', 'catering.*', 'resource.*', 'report.*', 'settings.*', 'audit.view', 'notification.*',
        ],
        'facility-manager' => [
            'hall.*', 'booking.view', 'booking.approve', 'booking.reject',
            'visitor.*', 'catering.*', 'resource.*', 'report.view', 'report.export', 'audit.view',
        ],
        'department-head' => [
            'booking.view', 'booking.create', 'booking.edit', 'booking.cancel', 'booking.approve', 'booking.reject',
            'visitor.view', 'catering.view', 'resource.view', 'report.view',
        ],
        'employee' => [
            'booking.view', 'booking.create', 'booking.edit', 'booking.cancel',
            'visitor.view', 'catering.view', 'resource.view',
        ],
    ];

    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create all permissions
        $allPermissions = [];
        foreach ($this->permissions as $module => $actions) {
            foreach ($actions as $action) {
                $perm = Permission::firstOrCreate(
                    ['name' => "{$module}.{$action}", 'guard_name' => 'api']
                );
                $allPermissions["{$module}.{$action}"] = $perm;
            }
        }

        // Create roles and assign permissions
        foreach ($this->roles as $roleName => $permissionList) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'api']);

            if ($permissionList === null) {
                // Super admin gets all
                $role->syncPermissions(array_values($allPermissions));
            } else {
                $perms = [];
                foreach ($permissionList as $permPattern) {
                    if (str_ends_with($permPattern, '.*')) {
                        $module = str_replace('.*', '', $permPattern);
                        foreach ($allPermissions as $key => $perm) {
                            if (str_starts_with($key, "{$module}.")) {
                                $perms[] = $perm;
                            }
                        }
                    } elseif (isset($allPermissions[$permPattern])) {
                        $perms[] = $allPermissions[$permPattern];
                    }
                }
                $role->syncPermissions($perms);
            }
        }
    }
}
