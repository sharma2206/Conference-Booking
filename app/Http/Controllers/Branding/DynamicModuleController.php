<?php

namespace App\Http\Controllers\Branding;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DynamicModule;
use App\Services\ModuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DynamicModuleController extends Controller
{
    public function __construct(
        private readonly ModuleService $moduleService
    ) {}

    /**
     * List all dynamic modules.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data'    => $this->moduleService->getAll(),
            'message' => 'Modules retrieved.',
        ]);
    }

    /**
     * Show a single module.
     */
    public function show(int $id): JsonResponse
    {
        return response()->json([
            'data'    => DynamicModule::findOrFail($id),
            'message' => 'Module retrieved.',
        ]);
    }

    /**
     * Create a new dynamic module.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'              => ['required', 'string', 'max:100'],
            'slug'              => ['nullable', 'string', 'max:100', 'unique:dynamic_modules,slug'],
            'icon'              => ['nullable', 'string', 'max:100'],
            'description'       => ['nullable', 'string'],
            'url'               => ['nullable', 'string', 'max:500'],
            'menu_position'     => ['nullable', 'integer', 'min:0'],
            'status'            => ['nullable', 'string', 'in:active,inactive'],
            'permission_prefix' => ['nullable', 'string', 'max:50'],
            'config'            => ['nullable', 'array'],
        ]);

        $module = $this->moduleService->create($data);

        AuditLog::record('create_module', 'branding', ['module_id' => $module->id, 'slug' => $module->slug]);

        return response()->json([
            'data'    => $module,
            'message' => 'Module created successfully.',
        ], 201);
    }

    /**
     * Update a dynamic module.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name'          => ['sometimes', 'string', 'max:100'],
            'icon'          => ['nullable', 'string', 'max:100'],
            'description'   => ['nullable', 'string'],
            'url'           => ['nullable', 'string', 'max:500'],
            'menu_position' => ['nullable', 'integer', 'min:0'],
            'config'        => ['nullable', 'array'],
        ]);

        $module = $this->moduleService->update($id, $data);

        AuditLog::record('update_module', 'branding', ['module_id' => $id]);

        return response()->json([
            'data'    => $module,
            'message' => 'Module updated successfully.',
        ]);
    }

    /**
     * Delete a dynamic module.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->moduleService->delete($id);

        AuditLog::record('delete_module', 'branding', ['module_id' => $id]);

        return response()->json([
            'message' => 'Module deleted.',
        ]);
    }

    /**
     * Toggle a module active/inactive.
     */
    public function toggle(int $id): JsonResponse
    {
        $module = $this->moduleService->toggle($id);

        AuditLog::record('toggle_module', 'branding', [
            'module_id' => $id,
            'status'    => $module->status,
        ]);

        return response()->json([
            'data'    => $module,
            'message' => "Module is now {$module->status}.",
        ]);
    }
}
