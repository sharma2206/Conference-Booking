<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'subject',
        'html_content',
        'variables',
        'is_active',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'variables' => 'array',
            'is_active' => 'boolean',
            'is_system' => 'boolean',
        ];
    }

    // ── Scopes ────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('is_system', true);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    /**
     * Render the template by replacing {{variable}} placeholders with data values.
     *
     * @param array<string, mixed> $data
     */
    public function render(array $data): array
    {
        $subject     = $this->replaceVariables($this->subject, $data);
        $htmlContent = $this->replaceVariables($this->html_content, $data);

        return [
            'subject'      => $subject,
            'html_content' => $htmlContent,
        ];
    }

    /**
     * Replace {{key}} placeholders in a string with values from $data.
     */
    private function replaceVariables(string $template, array $data): string
    {
        return preg_replace_callback(
            '/\{\{(\w+)\}\}/',
            function (array $matches) use ($data): string {
                $key = $matches[1];
                return array_key_exists($key, $data)
                    ? (string) $data[$key]
                    : $matches[0]; // leave unreplaced if not in data
            },
            $template
        );
    }

    /**
     * Find a template by its slug.
     */
    public static function findBySlug(string $slug): ?static
    {
        return static::where('slug', $slug)->first();
    }
}
