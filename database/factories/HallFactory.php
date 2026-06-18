<?php

namespace Database\Factories;

use App\Models\Hall;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Hall>
 */
class HallFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name'        => fake()->unique()->words(3, true) . ' Room',
            'code'        => strtoupper(fake()->unique()->lexify('HALL-???')),
            'capacity'    => fake()->numberBetween(10, 200),
            'building'    => 'Block ' . fake()->randomLetter(),
            'floor'       => fake()->numberBetween(1, 5),
            'location'    => fake()->address(),
            'description' => fake()->sentence(),
            'amenities'   => ['Projector', 'Whiteboard', 'AC'],
            'images'      => [],
            'status'      => 'active',
            'created_by'  => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['status' => 'inactive']);
    }
}
