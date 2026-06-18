<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $departments = Department::with('head:id,name,email')
            ->withCount('users')
            ->when($request->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%"))
            ->when(isset($request->is_active), fn($q) => $q->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)))
            ->orderBy('name')
            ->paginate($request->per_page ?? 15);

        return response()->json($departments);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:departments,name'],
            'code' => ['required', 'string', 'max:20', 'unique:departments,code'],
            'description' => ['nullable', 'string'],
            'head_id' => ['nullable', 'exists:users,id'],
            'is_active' => ['boolean'],
        ]);

        $department = Department::create($data);
        AuditLog::record('create', 'department', ['department_id' => $department->id]);

        return response()->json(['data' => $department->load('head:id,name')], 201);
    }

    public function show(Department $department): JsonResponse
    {
        return response()->json(['data' => $department->load('head:id,name,email', 'users:id,name,email')]);
    }

    public function update(Request $request, Department $department): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', "unique:departments,name,{$department->id}"],
            'code' => ['sometimes', 'string', 'max:20', "unique:departments,code,{$department->id}"],
            'description' => ['nullable', 'string'],
            'head_id' => ['nullable', 'exists:users,id'],
            'is_active' => ['boolean'],
        ]);

        $department->update($data);
        AuditLog::record('update', 'department', ['department_id' => $department->id]);

        return response()->json(['data' => $department->fresh('head:id,name')]);
    }

    public function destroy(Department $department): JsonResponse
    {
        if ($department->users()->exists()) {
            return response()->json(['message' => 'Cannot delete department with assigned users.'], 422);
        }

        AuditLog::record('delete', 'department', ['name' => $department->name]);
        $department->delete();

        return response()->json(['message' => 'Department deleted successfully.']);
    }

    public function all(): JsonResponse
    {
        return response()->json(['data' => Department::where('is_active', true)->orderBy('name')->get(['id', 'name', 'code'])]);
    }
}
