<?php

namespace App\Http\Controllers\Branding;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageController extends Controller
{
    /**
     * List all pages (paginated).
     */
    public function index(Request $request): JsonResponse
    {
        $pages = Page::with('creator:id,name')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->search, fn($q, $v) => $q->where('title', 'like', "%{$v}%"))
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json([
            'data' => $pages->items(),
            'meta' => [
                'current_page' => $pages->currentPage(),
                'last_page'    => $pages->lastPage(),
                'total'        => $pages->total(),
            ],
            'message' => 'Pages retrieved.',
        ]);
    }

    /**
     * Show a single page.
     */
    public function show(int $id): JsonResponse
    {
        $page = Page::with('creator:id,name')->findOrFail($id);

        return response()->json([
            'data'    => $page,
            'message' => 'Page retrieved.',
        ]);
    }

    /**
     * Create a new page.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'            => ['required', 'string', 'max:200'],
            'slug'             => ['required', 'string', 'max:200', 'unique:pages,slug'],
            'components'       => ['nullable', 'array'],
            'seo'              => ['nullable', 'array'],
            'seo.title'        => ['nullable', 'string', 'max:200'],
            'seo.description'  => ['nullable', 'string', 'max:500'],
            'seo.keywords'     => ['nullable', 'string'],
            'status'           => ['nullable', 'string', 'in:draft,published'],
        ]);

        $page = Page::create([
            ...$data,
            'created_by' => auth()->id(),
            'status'     => $data['status'] ?? 'draft',
        ]);

        AuditLog::record('create_page', 'branding', ['page_id' => $page->id, 'slug' => $page->slug]);

        return response()->json([
            'data'    => $page->load('creator:id,name'),
            'message' => 'Page created.',
        ], 201);
    }

    /**
     * Update an existing page.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $page = Page::findOrFail($id);

        $data = $request->validate([
            'title'           => ['sometimes', 'string', 'max:200'],
            'slug'            => ['sometimes', 'string', 'max:200', "unique:pages,slug,{$id}"],
            'components'      => ['nullable', 'array'],
            'seo'             => ['nullable', 'array'],
            'seo.title'       => ['nullable', 'string', 'max:200'],
            'seo.description' => ['nullable', 'string', 'max:500'],
            'seo.keywords'    => ['nullable', 'string'],
        ]);

        $page->update($data);

        AuditLog::record('update_page', 'branding', ['page_id' => $id]);

        return response()->json([
            'data'    => $page->fresh()->load('creator:id,name'),
            'message' => 'Page updated.',
        ]);
    }

    /**
     * Soft-delete a page.
     */
    public function destroy(int $id): JsonResponse
    {
        $page = Page::findOrFail($id);
        $page->delete();

        AuditLog::record('delete_page', 'branding', ['page_id' => $id]);

        return response()->json([
            'message' => 'Page deleted.',
        ]);
    }

    /**
     * Publish a draft page.
     */
    public function publish(int $id): JsonResponse
    {
        $page = Page::findOrFail($id);
        $page->publish();

        AuditLog::record('publish_page', 'branding', ['page_id' => $id]);

        return response()->json([
            'data'    => $page->fresh(),
            'message' => 'Page published.',
        ]);
    }

    /**
     * Unpublish (revert to draft) a page.
     */
    public function unpublish(int $id): JsonResponse
    {
        $page = Page::findOrFail($id);
        $page->unpublish();

        AuditLog::record('unpublish_page', 'branding', ['page_id' => $id]);

        return response()->json([
            'data'    => $page->fresh(),
            'message' => 'Page reverted to draft.',
        ]);
    }
}
