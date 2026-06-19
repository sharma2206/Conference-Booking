<?php

namespace Database\Seeders;

use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // Create the main sidebar menu
        $sidebar = Menu::updateOrCreate(
            ['slug' => 'main-sidebar'],
            [
                'name'      => 'Main Sidebar',
                'location'  => 'sidebar',
                'is_active' => true,
            ]
        );

        // Clear existing items for idempotent seeding
        MenuItem::where('menu_id', $sidebar->id)->delete();

        $items = [
            // ── Dashboard ────────────────────────────────────────────────
            [
                'label'      => 'Dashboard',
                'icon'       => 'LayoutDashboard',
                'route'      => 'dashboard',
                'permission' => 'booking.view',
                'sort_order' => 1,
                'children'   => [],
            ],

            // ── Bookings ─────────────────────────────────────────────────
            [
                'label'      => 'Bookings',
                'icon'       => 'CalendarCheck',
                'route'      => null,
                'permission' => 'booking.view',
                'sort_order' => 2,
                'children'   => [
                    [
                        'label'      => 'All Bookings',
                        'icon'       => 'List',
                        'route'      => 'bookings.index',
                        'permission' => 'booking.view',
                        'sort_order' => 1,
                    ],
                    [
                        'label'      => 'Calendar View',
                        'icon'       => 'Calendar',
                        'route'      => 'bookings.calendar',
                        'permission' => 'booking.view',
                        'sort_order' => 2,
                    ],
                    [
                        'label'      => 'New Booking',
                        'icon'       => 'Plus',
                        'route'      => 'bookings.create',
                        'permission' => 'booking.create',
                        'sort_order' => 3,
                    ],
                    [
                        'label'      => 'Pending Approvals',
                        'icon'       => 'ClipboardList',
                        'route'      => 'bookings.approvals',
                        'permission' => 'booking.approve',
                        'sort_order' => 4,
                    ],
                ],
            ],

            // ── Halls ─────────────────────────────────────────────────────
            [
                'label'      => 'Halls',
                'icon'       => 'Building2',
                'route'      => null,
                'permission' => 'hall.view',
                'sort_order' => 3,
                'children'   => [
                    [
                        'label'      => 'All Halls',
                        'icon'       => 'List',
                        'route'      => 'halls.index',
                        'permission' => 'hall.view',
                        'sort_order' => 1,
                    ],
                    [
                        'label'      => 'Add Hall',
                        'icon'       => 'Plus',
                        'route'      => 'halls.create',
                        'permission' => 'hall.create',
                        'sort_order' => 2,
                    ],
                ],
            ],

            // ── Visitors ─────────────────────────────────────────────────
            [
                'label'      => 'Visitors',
                'icon'       => 'Users',
                'route'      => null,
                'permission' => 'visitor.view',
                'sort_order' => 4,
                'children'   => [
                    [
                        'label'      => 'All Visitors',
                        'icon'       => 'List',
                        'route'      => 'visitors.index',
                        'permission' => 'visitor.view',
                        'sort_order' => 1,
                    ],
                    [
                        'label'      => 'Register Visitor',
                        'icon'       => 'UserPlus',
                        'route'      => 'visitors.create',
                        'permission' => 'visitor.create',
                        'sort_order' => 2,
                    ],
                ],
            ],

            // ── Catering ─────────────────────────────────────────────────
            [
                'label'      => 'Catering',
                'icon'       => 'UtensilsCrossed',
                'route'      => null,
                'permission' => 'catering.view',
                'sort_order' => 5,
                'children'   => [
                    [
                        'label'      => 'Menus',
                        'icon'       => 'BookOpen',
                        'route'      => 'catering.menus',
                        'permission' => 'catering.view',
                        'sort_order' => 1,
                    ],
                    [
                        'label'      => 'Orders',
                        'icon'       => 'ShoppingBag',
                        'route'      => 'catering.orders',
                        'permission' => 'catering.view',
                        'sort_order' => 2,
                    ],
                ],
            ],

            // ── Resources ─────────────────────────────────────────────────
            [
                'label'      => 'Resources',
                'icon'       => 'Package',
                'route'      => null,
                'permission' => 'resource.view',
                'sort_order' => 6,
                'children'   => [
                    [
                        'label'      => 'All Resources',
                        'icon'       => 'List',
                        'route'      => 'resources.index',
                        'permission' => 'resource.view',
                        'sort_order' => 1,
                    ],
                ],
            ],

            // ── Reports ───────────────────────────────────────────────────
            [
                'label'      => 'Reports',
                'icon'       => 'BarChart3',
                'route'      => null,
                'permission' => 'report.view',
                'sort_order' => 7,
                'children'   => [
                    [
                        'label'      => 'Booking Reports',
                        'icon'       => 'FileBarChart',
                        'route'      => 'reports.bookings',
                        'permission' => 'report.view',
                        'sort_order' => 1,
                    ],
                    [
                        'label'      => 'Hall Utilization',
                        'icon'       => 'PieChart',
                        'route'      => 'reports.hall-utilization',
                        'permission' => 'report.view',
                        'sort_order' => 2,
                    ],
                    [
                        'label'      => 'Department Report',
                        'icon'       => 'TrendingUp',
                        'route'      => 'reports.department',
                        'permission' => 'report.view',
                        'sort_order' => 3,
                    ],
                    [
                        'label'      => 'Export',
                        'icon'       => 'Download',
                        'route'      => 'reports.export',
                        'permission' => 'report.export',
                        'sort_order' => 4,
                    ],
                ],
            ],

            // ── Administration ────────────────────────────────────────────
            [
                'label'      => 'Administration',
                'icon'       => 'Shield',
                'route'      => null,
                'permission' => 'user.view',
                'sort_order' => 8,
                'children'   => [
                    [
                        'label'      => 'Users',
                        'icon'       => 'Users',
                        'route'      => 'users.index',
                        'permission' => 'user.view',
                        'sort_order' => 1,
                    ],
                    [
                        'label'      => 'Roles & Permissions',
                        'icon'       => 'Lock',
                        'route'      => 'roles.index',
                        'permission' => 'role.view',
                        'sort_order' => 2,
                    ],
                    [
                        'label'      => 'Departments',
                        'icon'       => 'Briefcase',
                        'route'      => 'departments.index',
                        'permission' => 'department.view',
                        'sort_order' => 3,
                    ],
                    [
                        'label'      => 'Audit Logs',
                        'icon'       => 'ClipboardList',
                        'route'      => 'audit.logs',
                        'permission' => 'audit.view',
                        'sort_order' => 4,
                    ],
                ],
            ],

            // ── Settings ──────────────────────────────────────────────────
            [
                'label'      => 'Settings',
                'icon'       => 'Settings',
                'route'      => null,
                'permission' => 'settings.view',
                'sort_order' => 9,
                'children'   => [
                    [
                        'label'      => 'General Settings',
                        'icon'       => 'Sliders',
                        'route'      => 'settings.general',
                        'permission' => 'settings.view',
                        'sort_order' => 1,
                    ],
                    [
                        'label'      => 'Branding',
                        'icon'       => 'Palette',
                        'route'      => 'settings.branding',
                        'permission' => 'settings.update',
                        'sort_order' => 2,
                    ],
                    [
                        'label'      => 'Themes',
                        'icon'       => 'Brush',
                        'route'      => 'settings.themes',
                        'permission' => 'settings.update',
                        'sort_order' => 3,
                    ],
                    [
                        'label'      => 'Email Templates',
                        'icon'       => 'Mail',
                        'route'      => 'settings.email-templates',
                        'permission' => 'settings.update',
                        'sort_order' => 4,
                    ],
                    [
                        'label'      => 'Menus',
                        'icon'       => 'Menu',
                        'route'      => 'settings.menus',
                        'permission' => 'settings.update',
                        'sort_order' => 5,
                    ],
                    [
                        'label'      => 'Modules',
                        'icon'       => 'Puzzle',
                        'route'      => 'settings.modules',
                        'permission' => 'settings.update',
                        'sort_order' => 6,
                    ],
                    [
                        'label'      => 'Holidays',
                        'icon'       => 'Sun',
                        'route'      => 'settings.holidays',
                        'permission' => 'settings.view',
                        'sort_order' => 7,
                    ],
                    [
                        'label'      => 'Approval Workflows',
                        'icon'       => 'GitBranch',
                        'route'      => 'settings.workflows',
                        'permission' => 'settings.view',
                        'sort_order' => 8,
                    ],
                ],
            ],
        ];

        foreach ($items as $itemData) {
            $children = $itemData['children'] ?? [];
            unset($itemData['children']);

            $parent = MenuItem::create([
                'menu_id'         => $sidebar->id,
                'parent_id'       => null,
                'label'           => $itemData['label'],
                'icon'            => $itemData['icon'] ?? null,
                'route'           => $itemData['route'] ?? null,
                'url'             => $itemData['url'] ?? null,
                'permission'      => $itemData['permission'] ?? null,
                'sort_order'      => $itemData['sort_order'] ?? 99,
                'is_active'       => true,
                'visibility_type' => 'all',
            ]);

            foreach ($children as $childData) {
                MenuItem::create([
                    'menu_id'         => $sidebar->id,
                    'parent_id'       => $parent->id,
                    'label'           => $childData['label'],
                    'icon'            => $childData['icon'] ?? null,
                    'route'           => $childData['route'] ?? null,
                    'url'             => $childData['url'] ?? null,
                    'permission'      => $childData['permission'] ?? null,
                    'sort_order'      => $childData['sort_order'] ?? 99,
                    'is_active'       => true,
                    'visibility_type' => 'all',
                ]);
            }
        }
    }
}
