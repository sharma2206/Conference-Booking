<?php

namespace Database\Seeders;

use App\Models\Hall;
use App\Models\HallFacility;
use App\Models\User;
use Illuminate\Database\Seeder;

class HallSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@conference.com')->first();

        $halls = [
            [
                'name' => 'Executive Board Room',
                'code' => 'HALL-EBR',
                'capacity' => 20,
                'building' => 'Tower A',
                'floor' => '12th Floor',
                'location' => 'Tower A, 12th Floor',
                'description' => 'Premium board room for executive meetings with panoramic city view.',
                'amenities' => ['projector', 'video_conference', 'ac', 'whiteboard', 'tv'],
                'status' => 'active',
                'created_by' => $admin->id,
                'facilities' => [
                    ['facility' => 'Projector', 'is_available' => true],
                    ['facility' => 'Video Conference System', 'is_available' => true],
                    ['facility' => 'Air Conditioning', 'is_available' => true],
                    ['facility' => 'Whiteboard', 'is_available' => true],
                    ['facility' => 'Smart TV', 'is_available' => true],
                    ['facility' => 'Microphone System', 'is_available' => true],
                ],
            ],
            [
                'name' => 'Training Hall - A',
                'code' => 'HALL-TRA',
                'capacity' => 80,
                'building' => 'Tower B',
                'floor' => '2nd Floor',
                'location' => 'Tower B, 2nd Floor',
                'description' => 'Spacious training hall with theater-style seating.',
                'amenities' => ['projector', 'speaker', 'mic', 'ac', 'podium'],
                'status' => 'active',
                'created_by' => $admin->id,
                'facilities' => [
                    ['facility' => 'Dual Projectors', 'is_available' => true],
                    ['facility' => 'Speaker System', 'is_available' => true],
                    ['facility' => 'Wireless Microphone', 'is_available' => true],
                    ['facility' => 'Air Conditioning', 'is_available' => true],
                    ['facility' => 'Podium', 'is_available' => true],
                ],
            ],
            [
                'name' => 'Conference Room - 101',
                'code' => 'HALL-CR1',
                'capacity' => 15,
                'building' => 'Main Block',
                'floor' => '1st Floor',
                'location' => 'Main Block, 1st Floor',
                'description' => 'Standard conference room for team meetings.',
                'amenities' => ['tv', 'whiteboard', 'ac'],
                'status' => 'active',
                'created_by' => $admin->id,
                'facilities' => [
                    ['facility' => 'Smart TV', 'is_available' => true],
                    ['facility' => 'Whiteboard', 'is_available' => true],
                    ['facility' => 'Air Conditioning', 'is_available' => true],
                ],
            ],
            [
                'name' => 'Auditorium',
                'code' => 'HALL-AUD',
                'capacity' => 300,
                'building' => 'Annex Block',
                'floor' => 'Ground Floor',
                'location' => 'Annex Block, Ground Floor',
                'description' => 'Large auditorium for company-wide events and presentations.',
                'amenities' => ['projector', 'speaker', 'mic', 'ac', 'podium', 'video_conference'],
                'status' => 'active',
                'created_by' => $admin->id,
                'facilities' => [
                    ['facility' => 'Main Stage Projector', 'is_available' => true],
                    ['facility' => 'Professional Sound System', 'is_available' => true],
                    ['facility' => 'Stage Microphones', 'is_available' => true],
                    ['facility' => 'Air Conditioning', 'is_available' => true],
                    ['facility' => 'Stage Podium', 'is_available' => true],
                    ['facility' => 'Video Conferencing', 'is_available' => true],
                    ['facility' => 'Recording System', 'is_available' => true],
                ],
            ],
            [
                'name' => 'Seminar Room - B2',
                'code' => 'HALL-SRB2',
                'capacity' => 40,
                'building' => 'Tower B',
                'floor' => '3rd Floor',
                'location' => 'Tower B, 3rd Floor',
                'description' => 'Seminar room with modular seating arrangement.',
                'amenities' => ['projector', 'whiteboard', 'ac'],
                'status' => 'active',
                'created_by' => $admin->id,
                'facilities' => [
                    ['facility' => 'Projector', 'is_available' => true],
                    ['facility' => 'Whiteboard', 'is_available' => true],
                    ['facility' => 'Air Conditioning', 'is_available' => true],
                ],
            ],
        ];

        foreach ($halls as $hallData) {
            $facilities = $hallData['facilities'];
            unset($hallData['facilities']);

            $hall = Hall::firstOrCreate(['code' => $hallData['code']], $hallData);
            $hall->facilities()->delete();
            $hall->facilities()->createMany($facilities);
        }
    }
}
