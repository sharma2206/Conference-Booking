<?php

namespace App\Http\Controllers\Branding;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\BrandingSetting;
use App\Services\BrandingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\File;

class BrandingController extends Controller
{
    public function __construct(
        private readonly BrandingService $brandingService
    ) {}

    /**
     * Return all branding settings, grouped by group key.
     */
    public function index(): JsonResponse
    {
        $grouped = BrandingSetting::all()
            ->groupBy('group')
            ->map(fn($items) => $items->keyBy('key')->map(fn($s) => [
                'value'       => $s->value,
                'type'        => $s->type,
                'label'       => $s->label,
                'description' => $s->description,
            ]));

        return response()->json([
            'data'    => $grouped,
            'message' => 'Branding settings retrieved.',
        ]);
    }

    /**
     * Mass-update branding settings.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings'             => ['required', 'array'],
            'settings.*.key'       => ['required', 'string', 'max:100'],
            'settings.*.value'     => ['nullable'],
            'settings.*.type'      => ['nullable', 'string', 'in:text,color,image,boolean,json,number'],
            'settings.*.group'     => ['nullable', 'string', 'max:50'],
            'settings.*.label'     => ['nullable', 'string', 'max:150'],
            'settings.*.description' => ['nullable', 'string'],
        ]);

        $payload = collect($data['settings'])->mapWithKeys(fn($s) => [$s['key'] => $s])->toArray();

        $this->brandingService->updateMany($payload);

        AuditLog::record('update', 'branding', [
            'keys' => array_column($data['settings'], 'key'),
        ]);

        return response()->json([
            'data'    => $this->brandingService->getAll(),
            'message' => 'Branding settings updated successfully.',
        ]);
    }

    /**
     * Handle logo / image asset upload.
     */
    public function uploadAsset(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', File::image()->max(2 * 1024)],
            'key'  => ['required', 'string', 'max:100'],
        ]);

        $url = $this->brandingService->uploadAsset($request->file('file'), $request->string('key'));

        AuditLog::record('upload_asset', 'branding', ['key' => $request->string('key')]);

        return response()->json([
            'data'    => ['url' => $url, 'key' => $request->string('key')],
            'message' => 'Asset uploaded successfully.',
        ]);
    }

    /**
     * Return the CSS :root block as a plain-text response.
     */
    public function cssVariables(): \Illuminate\Http\Response
    {
        $css = $this->brandingService->getCssVariables();

        return response($css, 200)->header('Content-Type', 'text/css');
    }

    /**
     * Return a safe public config for frontend consumption.
     */
    public function publicConfig(): JsonResponse
    {
        return response()->json([
            'data'    => $this->brandingService->getPublicConfig(),
            'message' => 'Public branding config retrieved.',
        ]);
    }

    /**
     * Preview the CSS output for a given theme config without persisting.
     */
    public function preview(Request $request): JsonResponse
    {
        $config = $request->validate([
            'config'               => ['required', 'array'],
            'config.primary'       => ['nullable', 'string'],
            'config.secondary'     => ['nullable', 'string'],
            'config.accent'        => ['nullable', 'string'],
            'config.font_family'   => ['nullable', 'string'],
            'config.button_radius' => ['nullable', 'string'],
            'config.card_radius'   => ['nullable', 'string'],
        ]);

        $css = $this->brandingService->previewConfig($config['config']);

        return response()->json([
            'data'    => ['css' => $css],
            'message' => 'Preview generated.',
        ]);
    }

    /**
     * Publish current branding as a live snapshot in the audit log.
     */
    public function publish(): JsonResponse
    {
        $config = $this->brandingService->getAll();

        AuditLog::record('publish_branding', 'branding', [
            'snapshot' => $config,
            'published_at' => now()->toISOString(),
        ]);

        return response()->json([
            'data'    => ['published_at' => now()->toISOString()],
            'message' => 'Branding published successfully.',
        ]);
    }
}
