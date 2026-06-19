<?php

namespace App\Http\Controllers\Branding;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\MenuService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function __construct(
        private readonly MenuService $menuService
    ) {}

    /**
     * Return the full sidebar menu tree.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data'    => $this->menuService->getSidebar(),
            'message' => 'Menu retrieved.',
        ]);
    }

    /**
     * Create a new menu item.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'menu_id'           => ['nullable', 'integer', 'exists:menus,id'],
            'parent_id'         => ['nullable', 'integer', 'exists:menu_items,id'],
            'label'             => ['required', 'string', 'max:100'],
            'icon'              => ['nullable', 'string', 'max:100'],
            'route'             => ['nullable', 'string', 'max:200'],
            'url'               => ['nullable', 'string', 'url', 'max:500'],
            'permission'        => ['nullable', 'string', 'max:100'],
            'badge'             => ['nullable', 'string', 'max:20'],
            'badge_color'       => ['nullable', 'string', 'max:20'],
            'sort_order'        => ['nullable', 'integer', 'min:0'],
            'is_active'         => ['boolean'],
            'visibility_type'   => ['nullable', 'string', 'in:all,role,department,user'],
            'visibility_values' => ['nullable', 'array'],
            'is_mega_menu'      => ['boolean'],
        ]);

        $item = $this->menuService->createItem($data);

        AuditLog::record('create_menu_item', 'branding', ['item_id' => $item->id, 'label' => $item->label]);

        return response()->json([
            'data'    => $item,
            'message' => 'Menu item created.',
        ], 201);
    }

    /**
     * Update an existing menu item.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'parent_id'         => ['nullable', 'integer', 'exists:menu_items,id'],
            'label'             => ['sometimes', 'string', 'max:100'],
            'icon'              => ['nullable', 'string', 'max:100'],
            'route'             => ['nullable', 'string', 'max:200'],
            'url'               => ['nullable', 'string', 'url', 'max:500'],
            'permission'        => ['nullable', 'string', 'max:100'],
            'badge'             => ['nullable', 'string', 'max:20'],
            'badge_color'       => ['nullable', 'string', 'max:20'],
            'sort_order'        => ['nullable', 'integer', 'min:0'],
            'is_active'         => ['boolean'],
            'visibility_type'   => ['nullable', 'string', 'in:all,role,department,user'],
            'visibility_values' => ['nullable', 'array'],
            'is_mega_menu'      => ['boolean'],
        ]);

        $item = $this->menuService->updateItem($id, $data);

        AuditLog::record('update_menu_item', 'branding', ['item_id' => $id]);

        return response()->json([
            'data'    => $item,
            'message' => 'Menu item updated.',
        ]);
    }

    /**
     * Delete a menu item.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->menuService->deleteItem($id);

        AuditLog::record('delete_menu_item', 'branding', ['item_id' => $id]);

        return response()->json([
            'message' => 'Menu item deleted.',
        ]);
    }

    /**
     * Reorder menu items. Accepts an array of {id, order, parent_id?}.
     */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items'            => ['required', 'array', 'min:1'],
            'items.*.id'       => ['required', 'integer', 'exists:menu_items,id'],
            'items.*.order'    => ['required', 'integer', 'min:0'],
            'items.*.parent_id' => ['nullable', 'integer', 'exists:menu_items,id'],
        ]);

        $this->menuService->reorder($data['items']);

        return response()->json([
            'data'    => $this->menuService->getSidebar(),
            'message' => 'Menu reordered.',
        ]);
    }
}
