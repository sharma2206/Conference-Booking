<?php

namespace App\Http\Controllers\Branding;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\File;

class FileManagerController extends Controller
{
    private const DISK      = 'public';
    private const BASE_PATH = 'brand-assets';

    /**
     * List all files in the brand-assets directory.
     */
    public function index(): JsonResponse
    {
        $files = Storage::disk(self::DISK)->files(self::BASE_PATH);

        $listed = collect($files)->map(function (string $path) {
            $name = basename($path);
            $url  = Storage::disk(self::DISK)->url($path);
            $size = Storage::disk(self::DISK)->size($path);
            $lastModified = Storage::disk(self::DISK)->lastModified($path);

            return [
                'name'          => $name,
                'path'          => $path,
                'url'           => $url,
                'size'          => $size,
                'size_human'    => $this->humanFileSize($size),
                'extension'     => pathinfo($name, PATHINFO_EXTENSION),
                'last_modified' => date('Y-m-d H:i:s', $lastModified),
            ];
        })->sortByDesc('last_modified')->values();

        return response()->json([
            'data'    => $listed,
            'message' => 'Files retrieved.',
            'meta'    => ['total' => $listed->count()],
        ]);
    }

    /**
     * Upload a new file to brand-assets.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => [
                'required',
                File::types(['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', 'pdf'])->max(5 * 1024),
            ],
            'name' => ['nullable', 'string', 'max:100'],
        ]);

        $file      = $request->file('file');
        $extension = $file->getClientOriginalExtension();
        $baseName  = $request->filled('name')
            ? Str::slug($request->string('name')) . '.' . $extension
            : Str::random(12) . '_' . time() . '.' . $extension;

        $path = $file->storeAs(self::BASE_PATH, $baseName, self::DISK);
        $url  = Storage::disk(self::DISK)->url($path);

        AuditLog::record('upload_file', 'branding', ['file' => $baseName, 'url' => $url]);

        return response()->json([
            'data'    => [
                'name'      => $baseName,
                'path'      => $path,
                'url'       => $url,
                'size'      => $file->getSize(),
                'extension' => $extension,
            ],
            'message' => 'File uploaded successfully.',
        ], 201);
    }

    /**
     * Delete a file from brand-assets.
     */
    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'path' => ['required', 'string'],
        ]);

        // Safety: ensure path stays within brand-assets
        $normalised = ltrim($data['path'], '/');
        if (!Str::startsWith($normalised, self::BASE_PATH . '/')) {
            abort(403, 'Access denied: path outside brand-assets.');
        }

        if (!Storage::disk(self::DISK)->exists($normalised)) {
            abort(404, 'File not found.');
        }

        Storage::disk(self::DISK)->delete($normalised);

        AuditLog::record('delete_file', 'branding', ['path' => $normalised]);

        return response()->json([
            'message' => 'File deleted.',
        ]);
    }

    private function humanFileSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i     = 0;

        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
