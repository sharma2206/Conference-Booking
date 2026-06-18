<?php

namespace Database\Seeders;

use App\Models\Hall;
use App\Models\HallFacility;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class HallSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the halls and hall_facilities tables.
     */
    public function run(): void
    {
        $superAdmin = User::where('email', 'superadmin@example.com')->first();
        $admin = User::where('email', 'admin@example.com')->first();

        $halls = [
            [
                'name' => 'Executive Conference Room',
                'code' => 'HALL-001',
                'capacity' => 40,
                'location' => 'Tower A',
                'floor' => '5th Floor',
                'description' => 'Premium conference room with AV and video conferencing.',
                'status' => 'active',
                'images' => null,
                'created_by' => $superAdmin->id,
            ],
            [
                'name' => 'Training Hall',
                'code' => 'HALL-002',
                'capacity' => 80,
                'location' => 'Tower B',
                'floor' => '2nd Floor',
                'description' => 'Large training hall with seating for large workshops.',
                'status' => 'active',
                'images' => null,
                'created_by' => $admin->id,
            ],
        ];

        foreach ($halls as $hallData) {
            $hall = Hall::create($hallData);

            HallFacility::create([
                'hall_id' => $hall->id,
                'facility' => 'Projector',
                'is_available' => true,
            ]);

            HallFacility::create([
                'hall_id' => $hall->id,
                'facility' => 'Audio System',
                'is_available' => true,
            ]);
        }
    }
}
