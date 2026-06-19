<?php

namespace Database\Seeders;

use App\Models\DynamicModule;
use Illuminate\Database\Seeder;

class DynamicModuleSeeder extends Seeder
{
    public function run(): void
    {
        $modules = [
            [
                'name'              => 'Dashboard',
                'slug'              => 'dashboard',
                'icon'              => 'LayoutDashboard',
                'description'       => 'Main dashboard with analytics and widgets.',
                'url'               => '/dashboard',
                'menu_position'     => 1,
                'status'            => 'active',
                'permission_prefix' => 'booking',
                'is_system'         => true,
            ],
            [
                'name'              => 'Bookings',
                'slug'              => 'bookings',
                'icon'              => 'CalendarCheck',
                'description'       => 'Conference hall booking management.',
                'url'               => '/bookings',
                'menu_position'     => 2,
                'status'            => 'active',
                'permission_prefix' => 'booking',
                'is_system'         => true,
            ],
            [
                'name'              => 'Halls',
                'slug'              => 'halls',
                'icon'              => 'Building2',
                'description'       => 'Conference hall inventory and management.',
                'url'               => '/halls',
                'menu_position'     => 3,
                'status'            => 'active',
                'permission_prefix' => 'hall',
                'is_system'         => true,
            ],
            [
                'name'              => 'Visitors',
                'slug'              => 'visitors',
                'icon'              => 'Users',
                'description'       => 'Visitor management and check-in.',
                'url'               => '/visitors',
                'menu_position'     => 4,
                'status'            => 'active',
                'permission_prefix' => 'visitor',
                'is_system'         => true,
            ],
            [
                'name'              => 'Catering',
                'slug'              => 'catering',
                'icon'              => 'UtensilsCrossed',
                'description'       => 'Catering menus and order management.',
                'url'               => '/catering',
                'menu_position'     => 5,
                'status'            => 'active',
                'permission_prefix' => 'catering',
                'is_system'         => true,
            ],
            [
                'name'              => 'Resources',
                'slug'              => 'resources',
                'icon'              => 'Package',
                'description'       => 'Equipment and resource booking.',
                'url'               => '/resources',
                'menu_position'     => 6,
                'status'            => 'active',
                'permission_prefix' => 'resource',
                'is_system'         => true,
            ],
            [
                'name'              => 'Reports',
                'slug'              => 'reports',
                'icon'              => 'BarChart3',
                'description'       => 'Reporting and data export.',
                'url'               => '/reports',
                'menu_position'     => 7,
                'status'            => 'active',
                'permission_prefix' => 'report',
                'is_system'         => true,
            ],
            [
                'name'              => 'Users',
                'slug'              => 'users',
                'icon'              => 'Users',
                'description'       => 'User account management.',
                'url'               => '/users',
                'menu_position'     => 8,
                'status'            => 'active',
                'permission_prefix' => 'user',
                'is_system'         => true,
            ],
            [
                'name'              => 'Roles & Permissions',
                'slug'              => 'roles',
                'icon'              => 'Lock',
                'description'       => 'Role and permission management.',
                'url'               => '/roles',
                'menu_position'     => 9,
                'status'            => 'active',
                'permission_prefix' => 'role',
                'is_system'         => true,
            ],
            [
                'name'              => 'Departments',
                'slug'              => 'departments',
                'icon'              => 'Briefcase',
                'description'       => 'Department and organisational unit management.',
                'url'               => '/departments',
                'menu_position'     => 10,
                'status'            => 'active',
                'permission_prefix' => 'department',
                'is_system'         => true,
            ],
            [
                'name'              => 'Settings',
                'slug'              => 'settings',
                'icon'              => 'Settings',
                'description'       => 'Application configuration and settings.',
                'url'               => '/settings',
                'menu_position'     => 11,
                'status'            => 'active',
                'permission_prefix' => 'settings',
                'is_system'         => true,
            ],
            [
                'name'              => 'Audit Logs',
                'slug'              => 'audit',
                'icon'              => 'ClipboardList',
                'description'       => 'System audit trail and activity logs.',
                'url'               => '/audit',
                'menu_position'     => 12,
                'status'            => 'active',
                'permission_prefix' => 'audit',
                'is_system'         => true,
            ],
        ];

        foreach ($modules as $moduleData) {
            DynamicModule::updateOrCreate(
                ['slug' => $moduleData['slug']],
                $moduleData
            );
        }
    }
}
