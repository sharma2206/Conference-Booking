<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class BrandingSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
        'description',
    ];

    /**
     * Get a branding setting value by key.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = Cache::remember(
            "branding_{$key}",
            now()->addHours(12),
            fn() => static::where('key', $key)->first()
        );

        if ($setting === null) {
            return $default;
        }

        return match ($setting->type) {
            'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'number'  => is_numeric($setting->value) ? (float) $setting->value : $default,
            'json'    => json_decode($setting->value, true) ?? $default,
            default   => $setting->value ?? $default,
        };
    }

    /**
     * Set a branding setting value by key.
     */
    public static function set(string $key, mixed $value, string $type = 'text', string $group = 'general', ?string $label = null): static
    {
        $stored = match ($type) {
            'json'    => is_string($value) ? $value : json_encode($value),
            'boolean' => $value ? '1' : '0',
            default   => (string) $value,
        };

        $setting = static::updateOrCreate(
            ['key' => $key],
            compact('value', 'type', 'group', 'label') + ['value' => $stored]
        );

        Cache::forget("branding_{$key}");
        Cache::forget('branding_all');

        return $setting;
    }

    /**
     * Get all settings for a given group.
     */
    public static function getGroup(string $group): array
    {
        return static::where('group', $group)
            ->get()
            ->mapWithKeys(fn($s) => [$s->key => $s->value])
            ->toArray();
    }

    /**
     * Mass-update multiple branding settings.
     *
     * @param array<string, mixed> $data  [key => value] or array of ['key', 'value', 'type', 'group']
     */
    public static function setMany(array $data): void
    {
        foreach ($data as $key => $value) {
            if (is_array($value) && isset($value['key'])) {
                // Full record format
                static::set(
                    key: $value['key'],
                    value: $value['value'] ?? null,
                    type: $value['type'] ?? 'text',
                    group: $value['group'] ?? 'general',
                    label: $value['label'] ?? null,
                );
            } else {
                // Simple key => value format
                $existing = static::where('key', $key)->first();
                static::set(
                    key: $key,
                    value: $value,
                    type: $existing?->type ?? 'text',
                    group: $existing?->group ?? 'general',
                );
            }
        }

        Cache::forget('branding_all');
    }

    /**
     * Return all settings as a flat keyed config array, suitable for frontend.
     */
    public static function allAsConfig(): array
    {
        return Cache::remember('branding_all', now()->addHours(6), function () {
            return static::all()
                ->mapWithKeys(function ($setting) {
                    $value = match ($setting->type) {
                        'boolean' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
                        'number'  => is_numeric($setting->value) ? (float) $setting->value : null,
                        'json'    => json_decode($setting->value, true),
                        default   => $setting->value,
                    };

                    return [$setting->key => $value];
                })
                ->toArray();
        });
    }
}
