<?php

namespace App\Http\Controllers\Branding;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\EmailTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    /**
     * List all email templates.
     */
    public function index(): JsonResponse
    {
        $templates = EmailTemplate::orderBy('name')->get([
            'id', 'name', 'slug', 'subject', 'is_active', 'is_system', 'variables', 'updated_at',
        ]);

        return response()->json([
            'data'    => $templates,
            'message' => 'Email templates retrieved.',
        ]);
    }

    /**
     * Show a single email template.
     */
    public function show(int $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);

        return response()->json([
            'data'    => $template,
            'message' => 'Email template retrieved.',
        ]);
    }

    /**
     * Update an email template's subject and HTML content.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);

        $data = $request->validate([
            'subject'      => ['sometimes', 'string', 'max:255'],
            'html_content' => ['sometimes', 'string'],
            'is_active'    => ['boolean'],
        ]);

        $template->update($data);

        AuditLog::record('update_email_template', 'branding', [
            'template_id' => $id,
            'slug'        => $template->slug,
        ]);

        return response()->json([
            'data'    => $template->fresh(),
            'message' => 'Email template updated.',
        ]);
    }

    /**
     * Preview a template rendered with sample data.
     */
    public function preview(Request $request, int $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);

        $data = $request->validate([
            'data' => ['nullable', 'array'],
        ]);

        $sampleData = $data['data'] ?? $this->buildSampleData($template);
        $rendered   = $template->render($sampleData);

        return response()->json([
            'data'    => [
                'subject'      => $rendered['subject'],
                'html_content' => $rendered['html_content'],
                'sample_data'  => $sampleData,
            ],
            'message' => 'Template preview rendered.',
        ]);
    }

    /**
     * Build a sample data map from a template's declared variables.
     *
     * @return array<string, string>
     */
    private function buildSampleData(EmailTemplate $template): array
    {
        $variables = $template->variables ?? [];

        return collect($variables)->mapWithKeys(function ($var) {
            $key = is_array($var) ? ($var['name'] ?? $var[0] ?? '') : $var;

            $samples = [
                'name'          => 'John Doe',
                'email'         => 'john@example.com',
                'booking_id'    => '#BK-2025-001',
                'hall_name'     => 'Conference Hall A',
                'start_time'    => '2025-07-01 09:00',
                'end_time'      => '2025-07-01 11:00',
                'status'        => 'Confirmed',
                'reason'        => 'Scheduling conflict',
                'otp_code'      => '123456',
                'app_name'      => config('app.name'),
                'app_url'       => config('app.url'),
                'reset_url'     => config('app.url') . '/reset-password',
            ];

            return [$key => $samples[$key] ?? "{{ {$key} }}"];
        })->toArray();
    }
}
