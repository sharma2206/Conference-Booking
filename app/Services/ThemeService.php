<?php

namespace App\Services;

use App\Models\Theme;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ThemeService
{
    /**
     * Return all themes.
     */
    public function getAll(): Collection
    {
        return Theme::with('creator:id,name')->orderBy('is_default', 'desc')->orderBy('name')->get();
    }

    /**
     * Return the currently active/default theme.
     */
    public function getActive(): Theme
    {
        return Theme::getActive() ?? $this->seedDefaultIfMissing();
    }

    /**
     * Create a new custom theme.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Theme
    {
        $theme = Theme::create([
            'name'        => $data['name'],
            'slug'        => $data['slug'] ?? Str::slug($data['name']),
            'description' => $data['description'] ?? null,
            'json_config' => $data['json_config'] ?? [],
            'thumbnail'   => $data['thumbnail'] ?? null,
            'is_default'  => false,
            'is_active'   => $data['is_active'] ?? true,
            'is_system'   => false,
            'created_by'  => auth()->id(),
        ]);

        return $theme;
    }

    /**
     * Update an existing theme.
     *
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): Theme
    {
        $theme = Theme::findOrFail($id);

        $theme->update([
            'name'        => $data['name'] ?? $theme->name,
            'description' => $data['description'] ?? $theme->description,
            'json_config' => $data['json_config'] ?? $theme->json_config,
            'thumbnail'   => $data['thumbnail'] ?? $theme->thumbnail,
            'is_active'   => $data['is_active'] ?? $theme->is_active,
        ]);

        return $theme->fresh();
    }

    /**
     * Set the given theme as default (active), clearing all other defaults.
     */
    public function activate(int $id): Theme
    {
        return Theme::setDefault($id);
    }

    /**
     * Delete a theme. System themes cannot be deleted.
     */
    public function delete(int $id): void
    {
        $theme = Theme::findOrFail($id);

        if ($theme->is_system) {
            throw ValidationException::withMessages([
                'theme' => ['System themes cannot be deleted.'],
            ]);
        }

        if ($theme->is_default) {
            throw ValidationException::withMessages([
                'theme' => ['Cannot delete the active default theme. Activate another theme first.'],
            ]);
        }

        $theme->delete();
    }

    /**
     * Return the 9 built-in theme configs as an array.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getBuiltinThemes(): array
    {
        return [
            [
                'name'        => 'Corporate',
                'slug'        => 'corporate',
                'description' => 'Professional corporate look with deep blue tones.',
                'is_system'   => true,
                'is_default'  => true,
                'json_config' => [
                    'primary'       => '#1e40af',
                    'secondary'     => '#1e293b',
                    'accent'        => '#3b82f6',
                    'success'       => '#059669',
                    'danger'        => '#dc2626',
                    'warning'       => '#d97706',
                    'info'          => '#0284c7',
                    'font_family'   => 'Inter',
                    'button_radius' => '6',
                    'card_radius'   => '8',
                    'dark_mode'     => false,
                ],
            ],
            [
                'name'        => 'Hospital',
                'slug'        => 'hospital',
                'description' => 'Clean, calming theme for healthcare environments.',
                'is_system'   => true,
                'is_default'  => false,
                'json_config' => [
                    'primary'       => '#0891b2',
                    'secondary'     => '#0e7490',
                    'accent'        => '#06b6d4',
                    'success'       => '#059669',
                    'danger'        => '#dc2626',
                    'warning'       => '#d97706',
                    'info'          => '#0284c7',
                    'font_family'   => 'Inter',
                    'button_radius' => '8',
                    'card_radius'   => '12',
                    'dark_mode'     => false,
                ],
            ],
            [
                'name'        => 'Education',
                'slug'        => 'education',
                'description' => 'Vibrant purple theme for educational institutions.',
                'is_system'   => true,
                'is_default'  => false,
                'json_config' => [
                    'primary'       => '#7c3aed',
                    'secondary'     => '#4c1d95',
                    'accent'        => '#8b5cf6',
                    'success'       => '#10b981',
                    'danger'        => '#ef4444',
                    'warning'       => '#f59e0b',
                    'info'          => '#06b6d4',
                    'font_family'   => 'Poppins',
                    'button_radius' => '8',
                    'card_radius'   => '12',
                    'dark_mode'     => false,
                ],
            ],
            [
                'name'        => 'Dark',
                'slug'        => 'dark',
                'description' => 'Dark mode theme with indigo accents.',
                'is_system'   => true,
                'is_default'  => false,
                'json_config' => [
                    'primary'       => '#818cf8',
                    'secondary'     => '#1e1b4b',
                    'accent'        => '#a5b4fc',
                    'success'       => '#34d399',
                    'danger'        => '#f87171',
                    'warning'       => '#fbbf24',
                    'info'          => '#38bdf8',
                    'font_family'   => 'Inter',
                    'button_radius' => '6',
                    'card_radius'   => '8',
                    'dark_mode'     => true,
                    'background'    => '#0f172a',
                    'surface'       => '#1e293b',
                ],
            ],
            [
                'name'        => 'Light',
                'slug'        => 'light',
                'description' => 'Clean, minimal light theme.',
                'is_system'   => true,
                'is_default'  => false,
                'json_config' => [
                    'primary'       => '#3b82f6',
                    'secondary'     => '#64748b',
                    'accent'        => '#60a5fa',
                    'success'       => '#10b981',
                    'danger'        => '#ef4444',
                    'warning'       => '#f59e0b',
                    'info'          => '#06b6d4',
                    'font_family'   => 'Inter',
                    'button_radius' => '6',
                    'card_radius'   => '8',
                    'dark_mode'     => false,
                    'background'    => '#f8fafc',
                    'surface'       => '#ffffff',
                ],
            ],
            [
                'name'        => 'Blue',
                'slug'        => 'blue',
                'description' => 'Deep blue theme for a professional feel.',
                'is_system'   => true,
                'is_default'  => false,
                'json_config' => [
                    'primary'       => '#1d4ed8',
                    'secondary'     => '#1e3a8a',
                    'accent'        => '#2563eb',
                    'success'       => '#059669',
                    'danger'        => '#dc2626',
                    'warning'       => '#d97706',
                    'info'          => '#0284c7',
                    'font_family'   => 'Inter',
                    'button_radius' => '4',
                    'card_radius'   => '6',
                    'dark_mode'     => false,
                ],
            ],
            [
                'name'        => 'Green',
                'slug'        => 'green',
                'description' => 'Fresh green theme, ideal for sustainability focus.',
                'is_system'   => true,
                'is_default'  => false,
                'json_config' => [
                    'primary'       => '#16a34a',
                    'secondary'     => '#14532d',
                    'accent'        => '#22c55e',
                    'success'       => '#059669',
                    'danger'        => '#dc2626',
                    'warning'       => '#d97706',
                    'info'          => '#0284c7',
                    'font_family'   => 'Inter',
                    'button_radius' => '8',
                    'card_radius'   => '10',
                    'dark_mode'     => false,
                ],
            ],
            [
                'name'        => 'Purple',
                'slug'        => 'purple',
                'description' => 'Rich purple theme for a premium experience.',
                'is_system'   => true,
                'is_default'  => false,
                'json_config' => [
                    'primary'       => '#7c3aed',
                    'secondary'     => '#6d28d9',
                    'accent'        => '#8b5cf6',
                    'success'       => '#10b981',
                    'danger'        => '#ef4444',
                    'warning'       => '#f59e0b',
                    'info'          => '#06b6d4',
                    'font_family'   => 'Inter',
                    'button_radius' => '8',
                    'card_radius'   => '12',
                    'dark_mode'     => false,
                ],
            ],
            [
                'name'        => 'Custom',
                'slug'        => 'custom',
                'description' => 'Blank canvas — configure your own brand colors.',
                'is_system'   => true,
                'is_default'  => false,
                'json_config' => [
                    'primary'       => '',
                    'secondary'     => '',
                    'accent'        => '',
                    'success'       => '#10b981',
                    'danger'        => '#ef4444',
                    'warning'       => '#f59e0b',
                    'info'          => '#06b6d4',
                    'font_family'   => 'Inter',
                    'button_radius' => '6',
                    'card_radius'   => '8',
                    'dark_mode'     => false,
                ],
            ],
        ];
    }

    private function seedDefaultIfMissing(): Theme
    {
        $configs = $this->getBuiltinThemes();
        $default = $configs[0]; // Corporate

        return Theme::create([
            'name'        => $default['name'],
            'slug'        => $default['slug'],
            'description' => $default['description'],
            'json_config' => $default['json_config'],
            'is_default'  => true,
            'is_active'   => true,
            'is_system'   => true,
        ]);
    }
}
