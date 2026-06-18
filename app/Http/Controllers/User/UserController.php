<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with(['roles', 'department'])
            ->when($request->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%"))
            ->when($request->role, fn($q, $v) => $q->role($v))
            ->when($request->department_id, fn($q, $v) => $q->where('department_id', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('name')
            ->paginate($request->per_page ?? 15);

        return response()->json($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'employee_id' => $data['employee_id'] ?? null,
            'department_id' => $data['department_id'] ?? null,
            'designation' => $data['designation'] ?? null,
            'password' => Hash::make($data['password']),
            'status' => $data['status'] ?? 'active',
        ]);

        if (!empty($data['role'])) {
            $user->assignRole($data['role']);
        }

        AuditLog::record('create', 'user', ['user_id' => $user->id]);

        return response()->json(['data' => $user->load('roles', 'department')], 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => $user->load('roles', 'permissions', 'department'),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update(collect($data)->except(['role'])->toArray());

        if (!empty($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        AuditLog::record('update', 'user', ['user_id' => $user->id]);

        return response()->json(['data' => $user->fresh(['roles', 'department'])]);
    }

    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth('api')->id()) {
            return response()->json(['message' => 'Cannot delete your own account.'], 422);
        }

        AuditLog::record('delete', 'user', ['user_id' => $user->id, 'email' => $user->email]);
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    public function updateAvatar(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json(['data' => ['avatar' => Storage::url($path)]]);
    }

    public function updatePassword(Request $request, User $user): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::with('permissions')->get();

        return response()->json(['data' => $roles]);
    }
}
