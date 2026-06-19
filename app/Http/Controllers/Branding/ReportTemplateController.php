<?php

namespace App\Http\Controllers\Branding;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Hall;
use App\Models\ReportTemplate;
use App\Models\Visitor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportTemplateController extends Controller
{
    private const ALLOWED_MODULES = ['bookings', 'halls', 'visitors', 'catering', 'resources'];

    /**
     * List all report templates.
     */
    public function index(Request $request): JsonResponse
    {
        $templates = ReportTemplate::with('creator:id,name')
            ->when($request->module, fn($q, $v) => $q->forModule($v))
            ->orderBy('name')
            ->get();

        return response()->json([
            'data'    => $templates,
            'message' => 'Report templates retrieved.',
        ]);
    }

    /**
     * Show a single report template.
     */
    public function show(int $id): JsonResponse
    {
        $template = ReportTemplate::with('creator:id,name')->findOrFail($id);

        return response()->json([
            'data'    => $template,
            'message' => 'Report template retrieved.',
        ]);
    }

    /**
     * Create a new report template.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'module'      => ['required', 'string', 'in:' . implode(',', self::ALLOWED_MODULES)],
            'fields'      => ['required', 'array', 'min:1'],
            'fields.*'    => ['string'],
            'filters'     => ['nullable', 'array'],
            'group_by'    => ['nullable', 'string', 'max:100'],
            'chart_type'  => ['nullable', 'string', 'in:bar,pie,line,area,none'],
            'is_active'   => ['boolean'],
        ]);

        $template = ReportTemplate::create([
            ...$data,
            'created_by' => auth()->id(),
        ]);

        AuditLog::record('create_report_template', 'branding', ['template_id' => $template->id]);

        return response()->json([
            'data'    => $template->load('creator:id,name'),
            'message' => 'Report template created.',
        ], 201);
    }

    /**
     * Update an existing report template.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $template = ReportTemplate::findOrFail($id);

        $data = $request->validate([
            'name'        => ['sometimes', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'fields'      => ['sometimes', 'array', 'min:1'],
            'fields.*'    => ['string'],
            'filters'     => ['nullable', 'array'],
            'group_by'    => ['nullable', 'string', 'max:100'],
            'chart_type'  => ['nullable', 'string', 'in:bar,pie,line,area,none'],
            'is_active'   => ['boolean'],
        ]);

        $template->update($data);

        AuditLog::record('update_report_template', 'branding', ['template_id' => $id]);

        return response()->json([
            'data'    => $template->fresh()->load('creator:id,name'),
            'message' => 'Report template updated.',
        ]);
    }

    /**
     * Delete a report template.
     */
    public function destroy(int $id): JsonResponse
    {
        ReportTemplate::findOrFail($id)->delete();

        AuditLog::record('delete_report_template', 'branding', ['template_id' => $id]);

        return response()->json([
            'message' => 'Report template deleted.',
        ]);
    }

    /**
     * Execute the report query and return the data rows.
     */
    public function run(Request $request, int $id): JsonResponse
    {
        $template = ReportTemplate::findOrFail($id);

        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date'   => ['nullable', 'date', 'after_or_equal:start_date'],
            'per_page'   => ['nullable', 'integer', 'min:1', 'max:500'],
        ]);

        $query = $this->buildQuery($template, $request);

        $perPage = $request->integer('per_page', 50);
        $results = $query->paginate($perPage);

        AuditLog::record('run_report', 'branding', [
            'template_id' => $id,
            'module'      => $template->module,
        ]);

        return response()->json([
            'data' => $results->items(),
            'meta' => [
                'template'     => ['id' => $template->id, 'name' => $template->name],
                'current_page' => $results->currentPage(),
                'last_page'    => $results->lastPage(),
                'total'        => $results->total(),
                'chart_type'   => $template->chart_type,
            ],
            'message' => 'Report executed.',
        ]);
    }

    private function buildQuery(ReportTemplate $template, Request $request): Builder
    {
        $startDate = $request->input('start_date');
        $endDate   = $request->input('end_date');

        $query = match ($template->module) {
            'bookings'  => Booking::query(),
            'halls'     => Hall::query(),
            'visitors'  => Visitor::query(),
            default     => Booking::query(),
        };

        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }

        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        // Apply stored filters
        if (!empty($template->filters)) {
            foreach ($template->filters as $filter) {
                if (isset($filter['column'], $filter['operator'], $filter['value'])) {
                    $query->where($filter['column'], $filter['operator'], $filter['value']);
                }
            }
        }

        // Group by
        if ($template->group_by) {
            $query->groupBy($template->group_by)->selectRaw("{$template->group_by}, count(*) as total");
        } else {
            // Select only the requested fields
            $safeFields = array_filter(
                $template->fields,
                fn($f) => preg_match('/^[\w.]+$/', $f)
            );
            if (!empty($safeFields)) {
                $query->select($safeFields);
            }
        }

        return $query;
    }
}
