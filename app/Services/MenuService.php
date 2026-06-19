<?php

namespace App\Services;

use App\Models\DynamicModule;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Support\Str;

class MenuService
{
    /**
     * Return the sidebar menu tree with children, filtered to active items only.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getSidebar(): array
    {
        $menu = Menu::active()->where('location', 'sidebar')->first();

        if (!$menu) {
            return [];
        }

        $rootItems = MenuItem::with(['activeChildren.activeChildren'])
            ->where('menu_id', $menu->id)
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return $rootItems->map(fn($item) => $this->formatItem($item))->values()->toArray();
    }

    /**
     * Update sort_order (and optionally parent_id) for a batch of menu items.
     *
     * @param array<int, array{id: int, order: int, parent_id?: int|null}> $items
     */
    public function reorder(array $items): void
    {
        foreach ($items as $itemData) {
            $update = ['sort_order' => $itemData['order']];

            if (array_key_exists('parent_id', $itemData)) {
                $update['parent_id'] = $itemData['parent_id'];
            }

            MenuItem::where('id', $itemData['id'])->update($update);
        }
    }

    /**
     * Create a new menu item.
     *
     * @param array<string, mixed> $data
     */
    public function createItem(array $data): MenuItem
    {
        $menu = Menu::active()->where('location', 'sidebar')->firstOrFail();

        return MenuItem::create([
            'menu_id'           => $data['menu_id'] ?? $menu->id,
            'parent_id'         => $data['parent_id'] ?? null,
            'label'             => $data['label'],
            'icon'              => $data['icon'] ?? null,
            'route'             => $data['route'] ?? null,
            'url'               => $data['url'] ?? null,
            'permission'        => $data['permission'] ?? null,
            'badge'             => $data['badge'] ?? null,
            'badge_color'       => $data['badge_color'] ?? null,
            'sort_order'        => $data['sort_order'] ?? 99,
            'is_active'         => $data['is_active'] ?? true,
            'visibility_type'   => $data['visibility_type'] ?? 'all',
            'visibility_values' => $data['visibility_values'] ?? null,
            'is_mega_menu'      => $data['is_mega_menu'] ?? false,
        ]);
    }

    /**
     * Update an existing menu item.
     *
     * @param array<string, mixed> $data
     */
    public function updateItem(int $id, array $data): MenuItem
    {
        $item = MenuItem::findOrFail($id);

        $item->update(array_filter([
            'label'             => $data['label'] ?? $item->label,
            'icon'              => $data['icon'] ?? $item->icon,
            'route'             => $data['route'] ?? $item->route,
            'url'               => $data['url'] ?? $item->url,
            'permission'        => $data['permission'] ?? $item->permission,
            'badge'             => $data['badge'] ?? $item->badge,
            'badge_color'       => $data['badge_color'] ?? $item->badge_color,
            'sort_order'        => $data['sort_order'] ?? $item->sort_order,
            'is_active'         => $data['is_active'] ?? $item->is_active,
            'visibility_type'   => $data['visibility_type'] ?? $item->visibility_type,
            'visibility_values' => $data['visibility_values'] ?? $item->visibility_values,
            'parent_id'         => array_key_exists('parent_id', $data) ? $data['parent_id'] : $item->parent_id,
            'is_mega_menu'      => $data['is_mega_menu'] ?? $item->is_mega_menu,
        ], fn($v) => $v !== null));

        return $item->fresh();
    }

    /**
     * Delete a menu item (and its children cascade via DB).
     */
    public function deleteItem(int $id): void
    {
        MenuItem::findOrFail($id)->delete();
    }

    /**
     * Ensure every active DynamicModule that has a URL has a corresponding menu item.
     */
    public function syncDynamicModules(): void
    {
        $menu = Menu::active()->where('location', 'sidebar')->first();
        if (!$menu) {
            return;
        }

        $modules = DynamicModule::active()->whereNotNull('url')->orderBy('menu_position')->get();

        foreach ($modules as $module) {
            $existingSlug = 'module-' . $module->slug;

            $existing = MenuItem::where('menu_id', $menu->id)
                ->where('route', $existingSlug)
                ->first();

            if (!$existing) {
                MenuItem::create([
                    'menu_id'         => $menu->id,
                    'label'           => $module->name,
                    'icon'            => $module->icon,
                    'route'           => $existingSlug,
                    'url'             => $module->url,
                    'permission'      => $module->permission_prefix ? "{$module->permission_prefix}.view" : null,
                    'sort_order'      => $module->menu_position,
                    'is_active'       => $module->status === 'active',
                    'visibility_type' => 'all',
                ]);
            } else {
                $existing->update([
                    'label'      => $module->name,
                    'icon'       => $module->icon,
                    'is_active'  => $module->status === 'active',
                    'sort_order' => $module->menu_position,
                ]);
            }
        }
    }

    // ── Private helpers ───────────────────────────────────────────────

    /**
     * @return array<string, mixed>
     */
    private function formatItem(MenuItem $item): array
    {
        $formatted = [
            'id'               => $item->id,
            'label'            => $item->label,
            'icon'             => $item->icon,
            'route'            => $item->route,
            'url'              => $item->url,
            'permission'       => $item->permission,
            'badge'            => $item->badge,
            'badge_color'      => $item->badge_color,
            'sort_order'       => $item->sort_order,
            'visibility_type'  => $item->visibility_type,
            'is_mega_menu'     => $item->is_mega_menu,
            'children'         => [],
        ];

        if ($item->relationLoaded('activeChildren') && $item->activeChildren->isNotEmpty()) {
            $formatted['children'] = $item->activeChildren
                ->map(fn($child) => $this->formatItem($child))
                ->values()
                ->toArray();
        }

        return $formatted;
    }
}
