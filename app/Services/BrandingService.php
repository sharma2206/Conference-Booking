<?php

namespace App\Services;

use App\Models\BrandingSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BrandingService
{
    private const ASSET_DISK = 'public';
    private const ASSET_PATH = 'brand-assets';

    private const COLOR_KEYS = [
        'primary_color',
        'secondary_color',
        'accent_color',
        'success_color',
        'danger_color',
        'warning_color',
        'info_color',
        'table_header_color',
        'card_background',
    ];

    private const SECRET_KEYS = [];

    /**
     * Return all branding settings keyed by their key.
     *
     * @return array<string, mixed>
     */
    public function getAll(): array
    {
        return BrandingSetting::allAsConfig();
    }

    /**
     * Return all settings within a specific group.
     *
     * @return array<string, mixed>
     */
    public function getGroup(string $group): array
    {
        return BrandingSetting::getGroup($group);
    }

    /**
     * Mass-update branding settings from an associative array.
     *
     * @param array<string, mixed> $data
     */
    public function updateMany(array $data): void
    {
        BrandingSetting::setMany($data);

        Cache::forget('branding_css_vars');
        Cache::forget('branding_public_config');
    }

    /**
     * Store an uploaded brand asset, return its public URL, and update the corresponding setting.
     */
    public function uploadAsset(UploadedFile $file, string $key): string
    {
        $extension = $file->getClientOriginalExtension();
        $filename  = Str::slug($key) . '_' . time() . '.' . $extension;
        $path      = $file->storeAs(self::ASSET_PATH, $filename, self::ASSET_DISK);

        $url = Storage::disk(self::ASSET_DISK)->url($path);

        BrandingSetting::set(key: $key, value: $url, type: 'image', group: 'images');

        Cache::forget('branding_all');
        Cache::forget('branding_public_config');

        return $url;
    }

    /**
     * Generate a CSS :root block with brand CSS custom properties.
     */
    public function getCssVariables(): string
    {
        return Cache::remember('branding_css_vars', now()->addHours(6), function () {
            $settings = BrandingSetting::allAsConfig();

            $lines = [':root {'];

            // Colors
            foreach (self::COLOR_KEYS as $key) {
                if (!empty($settings[$key])) {
                    $varName = '--' . str_replace('_', '-', $key);
                    $lines[] = "    {$varName}: {$settings[$key]};";
                }
            }

            // Typography
            if (!empty($settings['font_family'])) {
                $lines[] = "    --font-family: '{$settings['font_family']}', system-ui, sans-serif;";
            }
            if (!empty($settings['font_size'])) {
                $lines[] = "    --font-size-base: {$settings['font_size']}px;";
            }

            // Buttons
            if (!empty($settings['button_radius'])) {
                $lines[] = "    --button-radius: {$settings['button_radius']}px;";
            }

            // Cards
            if (!empty($settings['card_border_radius'])) {
                $lines[] = "    --card-radius: {$settings['card_border_radius']}px;";
            }

            $lines[] = '}';

            return implode("\n", $lines);
        });
    }

    /**
     * Return a safe subset of branding config for the frontend (no secrets).
     *
     * @return array<string, mixed>
     */
    public function getPublicConfig(): array
    {
        return Cache::remember('branding_public_config', now()->addHours(6), function () {
            $all = BrandingSetting::allAsConfig();

            // Strip any server-side-only keys
            foreach (self::SECRET_KEYS as $secret) {
                unset($all[$secret]);
            }

            return [
                'branding'     => $all,
                'css_variables' => $this->getCssVariables(),
                'generated_at'  => now()->toISOString(),
            ];
        });
    }

    /**
     * Preview a theme config without persisting it. Returns the would-be CSS variables.
     *
     * @param array<string, mixed> $config
     */
    public function previewConfig(array $config): string
    {
        $lines = [':root {'];

        $colorMap = [
            'primary'   => '--primary-color',
            'secondary' => '--secondary-color',
            'accent'    => '--accent-color',
            'success'   => '--success-color',
            'danger'    => '--danger-color',
            'warning'   => '--warning-color',
            'info'      => '--info-color',
        ];

        foreach ($colorMap as $key => $var) {
            if (!empty($config[$key])) {
                $lines[] = "    {$var}: {$config[$key]};";
            }
        }

        if (!empty($config['font_family'])) {
            $lines[] = "    --font-family: '{$config['font_family']}', system-ui, sans-serif;";
        }

        if (!empty($config['button_radius'])) {
            $lines[] = "    --button-radius: {$config['button_radius']}px;";
        }

        if (!empty($config['card_radius'])) {
            $lines[] = "    --card-radius: {$config['card_radius']}px;";
        }

        $lines[] = '}';

        return implode("\n", $lines);
    }
}
