<?php

namespace App\Http\Controllers\Branding;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\ThemeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThemeController extends Controller
{
    public function __construct(
        private readonly ThemeService $themeService
    ) {}

    /**
     * List all themes.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data'    => $this->themeService->getAll(),
            'message' => 'Themes retrieved.',
        ]);
    }

    /**
     * Show a single theme.
     */
    public function show(int $id): JsonResponse
    {
        $theme = \App\Models\Theme::findOrFail($id);

        return response()->json([
            'data'    => $theme,
            'message' => 'Theme retrieved.',
        ]);
    }

    /**
     * Create a new custom theme.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                  => ['required', 'string', 'max:100'],
            'slug'                  => ['nullable', 'string', 'max:100', 'unique:themes,slug'],
            'description'           => ['nullable', 'string'],
            'json_config'           => ['required', 'array'],
            'json_config.primary'   => ['required', 'string'],
            'json_config.secondary' => ['required', 'string'],
            'thumbnail'             => ['nullable', 'string', 'url'],
            'is_active'             => ['boolean'],
        ]);

        $theme = $this->themeService->create($data);

        AuditLog::record('create_theme', 'branding', ['theme_id' => $theme->id, 'name' => $theme->name]);

        return response()->json([
            'data'    => $theme,
            'message' => 'Theme created successfully.',
        ], 201);
    }

    /**
     * Update an existing theme.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'json_config' => ['sometimes', 'array'],
            'thumbnail'   => ['nullable', 'string'],
            'is_active'   => ['boolean'],
        ]);

        $theme = $this->themeService->update($id, $data);

        AuditLog::record('update_theme', 'branding', ['theme_id' => $id]);

        return response()->json([
            'data'    => $theme,
            'message' => 'Theme updated successfully.',
        ]);
    }

    /**
     * Delete a theme.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->themeService->delete($id);

        AuditLog::record('delete_theme', 'branding', ['theme_id' => $id]);

        return response()->json([
            'message' => 'Theme deleted.',
        ]);
    }

    /**
     * Activate / set a theme as default.
     */
    public function activate(int $id): JsonResponse
    {
        $theme = $this->themeService->activate($id);

        AuditLog::record('activate_theme', 'branding', ['theme_id' => $id, 'name' => $theme->name]);

        return response()->json([
            'data'    => $theme,
            'message' => "Theme '{$theme->name}' is now the active theme.",
        ]);
    }

    /**
     * Return the currently active theme.
     */
    public function active(): JsonResponse
    {
        return response()->json([
            'data'    => $this->themeService->getActive(),
            'message' => 'Active theme retrieved.',
        ]);
    }

    /**
     * Return all built-in theme configs (for the theme picker UI).
     */
    public function builtins(): JsonResponse
    {
        return response()->json([
            'data'    => $this->themeService->getBuiltinThemes(),
            'message' => 'Built-in themes retrieved.',
        ]);
    }
}
