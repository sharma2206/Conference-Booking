<?php

namespace Database\Seeders;

use App\Models\Theme;
use App\Services\ThemeService;
use Illuminate\Database\Seeder;

class ThemeSeeder extends Seeder
{
    public function __construct(
        private readonly ThemeService $themeService
    ) {}

    public function run(): void
    {
        $themes = $this->themeService->getBuiltinThemes();

        foreach ($themes as $themeData) {
            Theme::updateOrCreate(
                ['slug' => $themeData['slug']],
                [
                    'name'        => $themeData['name'],
                    'description' => $themeData['description'],
                    'json_config' => $themeData['json_config'],
                    'is_default'  => $themeData['is_default'],
                    'is_active'   => true,
                    'is_system'   => true,
                ]
            );
        }
    }
}
