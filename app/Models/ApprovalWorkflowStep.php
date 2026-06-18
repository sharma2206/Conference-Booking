<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalWorkflowStep extends Model
{
    use HasFactory;

    protected $table = 'approval_workflow_steps';

    protected $fillable = [
        'workflow_id',
        'step_order',
        'step_name',
        'role_name',
        'can_skip',
        'escalation_hours',
    ];

    protected function casts(): array
    {
        return [
            'can_skip' => 'boolean',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class);
    }
}
