<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            // ── Core application seeders (pre-existing) ────────────────
            PermissionSeeder::class,
            DepartmentSeeder::class,
            UserSeeder::class,
            HallSeeder::class,
            SettingsSeeder::class,
            CateringMenuSeeder::class,
            ResourceSeeder::class,

            // ── Branding system seeders ────────────────────────────────
            BrandingSeeder::class,
            ThemeSeeder::class,
            MenuSeeder::class,
            DynamicModuleSeeder::class,
            EmailTemplateSeeder::class,
        ]);
    }
}
