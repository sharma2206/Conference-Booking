<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Page extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'components',
        'seo',
        'status',
        'published_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'components'   => 'array',
            'seo'          => 'array',
            'published_at' => 'datetime',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────────

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ────────────────────────────────────────────────────────

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    // ── Helpers ───────────────────────────────────────────────────────

    public function isPublished(): bool
    {
        return $this->status === 'published'
            && $this->published_at !== null
            && $this->published_at->lte(now());
    }

    public function publish(): void
    {
        $this->update([
            'status'       => 'published',
            'published_at' => now(),
        ]);
    }

    public function unpublish(): void
    {
        $this->update(['status' => 'draft']);
    }
}
