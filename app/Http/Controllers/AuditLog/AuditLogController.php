<?php

namespace App\Http\Controllers\AuditLog;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::with('user:id,name,email')
            ->when($request->module, fn($q, $v) => $q->where('module', $v))
            ->when($request->action, fn($q, $v) => $q->where('action', $v))
            ->when($request->user_id, fn($q, $v) => $q->where('user_id', $v))
            ->when($request->date_from, fn($q, $v) => $q->where('created_at', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->where('created_at', '<=', $v . ' 23:59:59'))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($logs);
    }

    public function activityLog(Request $request): JsonResponse
    {
        $activities = Activity::with('causer:id,name')
            ->when($request->log_name, fn($q, $v) => $q->where('log_name', $v))
            ->when($request->subject_type, fn($q, $v) => $q->where('subject_type', 'like', "%{$v}%"))
            ->when($request->causer_id, fn($q, $v) => $q->where('causer_id', $v))
            ->when($request->date_from, fn($q, $v) => $q->where('created_at', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->where('created_at', '<=', $v . ' 23:59:59'))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($activities);
    }

    public function modules(): JsonResponse
    {
        $modules = AuditLog::distinct()->pluck('module')->sort()->values();

        return response()->json(['data' => $modules]);
    }
}
