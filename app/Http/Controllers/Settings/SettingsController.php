<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Holiday;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SettingsController extends Controller
{
    private array $settingGroups = [
        'general' => ['app_name', 'app_logo', 'app_timezone', 'app_theme'],
        'booking' => ['booking_advance_days', 'min_booking_duration', 'max_booking_duration', 'office_start_time', 'office_end_time', 'booking_allowed_days'],
        'mail' => ['mail_host', 'mail_port', 'mail_username', 'mail_from_address', 'mail_from_name'],
        'notifications' => ['notify_on_create', 'notify_on_approve', 'notify_on_reject', 'notify_reminder_1day', 'notify_reminder_1hour'],
    ];

    public function index(): JsonResponse
    {
        $settings = Setting::all()->groupBy('group')->map(fn($items) => $items->pluck('value', 'key'));

        return response()->json(['data' => $settings]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable'],
            'settings.*.group' => ['nullable', 'string'],
            'settings.*.type' => ['nullable', 'string'],
        ]);

        foreach ($data['settings'] as $setting) {
            Setting::set(
                $setting['key'],
                $setting['value'],
                $setting['group'] ?? 'general',
                $setting['type'] ?? 'string'
            );
            // PERF-08: bust per-key cache so next read reflects new value
            Cache::forget("setting_{$setting['key']}");
        }

        AuditLog::record('update', 'settings', ['keys' => array_column($data['settings'], 'key')]);

        return response()->json(['message' => 'Settings updated successfully.']);
    }

    public function getByGroup(string $group): JsonResponse
    {
        $settings = Setting::where('group', $group)->get()->pluck('value', 'key');

        return response()->json(['data' => $settings]);
    }

    public function holidays(Request $request): JsonResponse
    {
        $holidays = Holiday::when($request->year, fn($q, $v) => $q->whereYear('date', $v))
            ->orderBy('date')
            ->get();

        return response()->json(['data' => $holidays]);
    }

    public function storeHoliday(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'date' => ['required', 'date'],
            'is_recurring_yearly' => ['boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $holiday = Holiday::create($data);

        return response()->json(['data' => $holiday], 201);
    }

    public function updateHoliday(Request $request, Holiday $holiday): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'date' => ['sometimes', 'date'],
            'is_recurring_yearly' => ['boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $holiday->update($data);

        return response()->json(['data' => $holiday->fresh()]);
    }

    public function destroyHoliday(Holiday $holiday): JsonResponse
    {
        $holiday->delete();

        return response()->json(['message' => 'Holiday deleted.']);
    }

    public function approvalWorkflows(): JsonResponse
    {
        $workflows = \App\Models\ApprovalWorkflow::with('steps')->get();

        return response()->json(['data' => $workflows]);
    }

    public function storeWorkflow(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
            'is_default' => ['boolean'],
            'steps' => ['required', 'array', 'min:1'],
            'steps.*.step_name' => ['required', 'string', 'max:100'],
            'steps.*.role_name' => ['required', 'string', 'exists:roles,name'],
            'steps.*.can_skip' => ['boolean'],
            'steps.*.escalation_hours' => ['integer', 'min:1'],
        ]);

        if (!empty($data['is_default'])) {
            \App\Models\ApprovalWorkflow::where('is_default', true)->update(['is_default' => false]);
        }

        $workflow = \App\Models\ApprovalWorkflow::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'is_default' => $data['is_default'] ?? false,
            'created_by' => auth('api')->id(),
        ]);

        foreach ($data['steps'] as $index => $step) {
            $workflow->steps()->create([
                'step_order' => $index + 1,
                'step_name' => $step['step_name'],
                'role_name' => $step['role_name'],
                'can_skip' => $step['can_skip'] ?? false,
                'escalation_hours' => $step['escalation_hours'] ?? 24,
            ]);
        }

        return response()->json(['data' => $workflow->load('steps')], 201);
    }

    public function destroyWorkflow(\App\Models\ApprovalWorkflow $workflow): JsonResponse
    {
        $workflow->delete();

        return response()->json(['message' => 'Workflow deleted.']);
    }

    public function smtpSettings(): JsonResponse
    {
        $keys = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_encryption', 'mail_from_name', 'mail_from_address'];
        $settings = Setting::whereIn('key', $keys)->get()->pluck('value', 'key');

        return response()->json(['data' => $settings]);
    }

    public function updateSmtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'smtp_host' => ['nullable', 'string', 'max:255'],
            'smtp_port' => ['nullable', 'integer'],
            'smtp_username' => ['nullable', 'string', 'max:255'],
            'smtp_password' => ['nullable', 'string', 'max:255'],
            'smtp_encryption' => ['nullable', 'in:tls,ssl,none'],
            'mail_from_name' => ['nullable', 'string', 'max:100'],
            'mail_from_address' => ['nullable', 'email', 'max:255'],
        ]);

        foreach ($data as $key => $value) {
            Setting::set($key, $value, 'smtp', 'string');
            Cache::forget("setting_{$key}");
        }

        AuditLog::record('update', 'settings', ['keys' => array_keys($data), 'group' => 'smtp']);

        return response()->json(['message' => 'SMTP settings saved.']);
    }

    public function testSmtp(): JsonResponse
    {
        $host = Setting::get('smtp_host');

        if (!$host) {
            return response()->json(['message' => 'SMTP not configured.'], 422);
        }

        try {
            \Illuminate\Support\Facades\Mail::raw('This is a test email from Conference Booking.', function ($message) {
                $message->to(auth('api')->user()->email)
                        ->subject('SMTP Test Email');
            });

            return response()->json(['message' => 'Test email sent successfully.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'SMTP test failed: ' . $e->getMessage()], 422);
        }
    }
}
