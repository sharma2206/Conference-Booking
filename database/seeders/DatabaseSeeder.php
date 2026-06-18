<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PermissionSeeder::class,
            DepartmentSeeder::class,
            UserSeeder::class,
            HallSeeder::class,
            SettingsSeeder::class,
            CateringMenuSeeder::class,
            ResourceSeeder::class,
        ]);
    }
}
