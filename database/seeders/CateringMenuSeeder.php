<?php

namespace Database\Seeders;

use App\Models\CateringMenu;
use Illuminate\Database\Seeder;

class CateringMenuSeeder extends Seeder
{
    public function run(): void
    {
        $menus = [
            ['name' => 'Tea', 'category' => 'Beverages', 'price' => 15, 'unit' => 'per cup', 'is_available' => true],
            ['name' => 'Coffee', 'category' => 'Beverages', 'price' => 20, 'unit' => 'per cup', 'is_available' => true],
            ['name' => 'Fresh Juice', 'category' => 'Beverages', 'price' => 40, 'unit' => 'per glass', 'is_available' => true],
            ['name' => 'Water Bottles', 'category' => 'Beverages', 'price' => 20, 'unit' => 'per bottle', 'is_available' => true],
            ['name' => 'Samosa (2 pcs)', 'category' => 'Snacks', 'price' => 30, 'unit' => 'per person', 'is_available' => true],
            ['name' => 'Sandwich', 'category' => 'Snacks', 'price' => 60, 'unit' => 'per person', 'is_available' => true],
            ['name' => 'Fruit Platter', 'category' => 'Snacks', 'price' => 80, 'unit' => 'per person', 'is_available' => true],
            ['name' => 'Cookies & Biscuits', 'category' => 'Snacks', 'price' => 40, 'unit' => 'per person', 'is_available' => true],
            ['name' => 'Standard Lunch', 'category' => 'Meals', 'price' => 200, 'unit' => 'per person', 'is_available' => true],
            ['name' => 'Premium Lunch Buffet', 'category' => 'Meals', 'price' => 350, 'unit' => 'per person', 'is_available' => true],
            ['name' => 'Standard Dinner', 'category' => 'Meals', 'price' => 250, 'unit' => 'per person', 'is_available' => true],
            ['name' => 'Breakfast Box', 'category' => 'Meals', 'price' => 150, 'unit' => 'per person', 'is_available' => true],
        ];

        foreach ($menus as $menu) {
            CateringMenu::firstOrCreate(['name' => $menu['name'], 'category' => $menu['category']], $menu);
        }
    }
}
