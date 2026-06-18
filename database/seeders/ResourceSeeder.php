<?php

namespace Database\Seeders;

use App\Models\Resource;
use Illuminate\Database\Seeder;

class ResourceSeeder extends Seeder
{
    public function run(): void
    {
        $resources = [
            ['name' => 'Laptop', 'code' => 'RES-LAP-001', 'category' => 'Electronics', 'total_quantity' => 10, 'available_quantity' => 10],
            ['name' => 'Projector', 'code' => 'RES-PROJ-001', 'category' => 'Electronics', 'total_quantity' => 5, 'available_quantity' => 5],
            ['name' => 'Wireless Speaker', 'code' => 'RES-SPK-001', 'category' => 'Audio', 'total_quantity' => 8, 'available_quantity' => 8],
            ['name' => 'Wireless Microphone', 'code' => 'RES-MIC-001', 'category' => 'Audio', 'total_quantity' => 10, 'available_quantity' => 10],
            ['name' => 'Flip Chart Stand', 'code' => 'RES-FLIP-001', 'category' => 'Stationery', 'total_quantity' => 6, 'available_quantity' => 6],
            ['name' => 'Extension Cord', 'code' => 'RES-EXT-001', 'category' => 'Accessories', 'total_quantity' => 15, 'available_quantity' => 15],
            ['name' => 'HDMI Cable', 'code' => 'RES-HDMI-001', 'category' => 'Accessories', 'total_quantity' => 20, 'available_quantity' => 20],
            ['name' => 'Laser Pointer', 'code' => 'RES-LP-001', 'category' => 'Accessories', 'total_quantity' => 12, 'available_quantity' => 12],
        ];

        foreach ($resources as $resource) {
            Resource::firstOrCreate(['code' => $resource['code']], $resource);
        }
    }
}
