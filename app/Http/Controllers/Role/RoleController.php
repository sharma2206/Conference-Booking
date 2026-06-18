<?php

namespace App\Http\Controllers\Role;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->withCount('users')->get();

        return response()->json(['data' => $roles]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:roles,name'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'api']);

        if (!empty($data['permissions'])) {
            $role->givePermissionTo($data['permissions']);
        }

        AuditLog::record('create', 'role', ['role' => $role->name]);

        return response()->json(['data' => $role->load('permissions')], 201);
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json(['data' => $role->load('permissions')]);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:50', "unique:roles,name,{$role->id}"],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        if (!empty($data['name'])) {
            $role->update(['name' => $data['name']]);
        }

        if (array_key_exists('permissions', $data)) {
            $role->syncPermissions($data['permissions'] ?? []);
        }

        AuditLog::record('update', 'role', ['role' => $role->name]);

        return response()->json(['data' => $role->fresh('permissions')]);
    }

    public function destroy(Role $role): JsonResponse
    {
        if (in_array($role->name, ['super-admin', 'admin'])) {
            return response()->json(['message' => 'Cannot delete system roles.'], 422);
        }

        AuditLog::record('delete', 'role', ['role' => $role->name]);
        $role->delete();

        return response()->json(['message' => 'Role deleted.']);
    }

    public function permissions(): JsonResponse
    {
        $permissions = Permission::all()->groupBy(fn($p) => explode('.', $p->name)[0]);

        return response()->json(['data' => $permissions]);
    }

    public function allPermissions(): JsonResponse
    {
        return response()->json(['data' => Permission::orderBy('name')->get()]);
    }
}
