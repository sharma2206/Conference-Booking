<?php

namespace App\Http\Controllers\Branding;

use App\Http\Controllers\Controller;
use App\Models\DashboardLayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardLayoutController extends Controller
{
    private const AVAILABLE_WIDGETS = [
        ['type' => 'booking_summary',   'label' => 'Booking Summary',       'min_w' => 3, 'min_h' => 2],
        ['type' => 'hall_utilization',  'label' => 'Hall Utilization',       'min_w' => 4, 'min_h' => 3],
        ['type' => 'booking_trends',    'label' => 'Booking Trends Chart',   'min_w' => 6, 'min_h' => 3],
        ['type' => 'upcoming_bookings', 'label' => 'Upcoming Bookings',      'min_w' => 4, 'min_h' => 3],
        ['type' => 'department_usage',  'label' => 'Department Usage',       'min_w' => 4, 'min_h' => 3],
        ['type' => 'visitor_summary',   'label' => 'Visitor Summary',        'min_w' => 3, 'min_h' => 2],
        ['type' => 'catering_cost',     'label' => 'Catering Cost',          'min_w' => 3, 'min_h' => 2],
        ['type' => 'resource_status',   'label' => 'Resource Status',        'min_w' => 3, 'min_h' => 2],
        ['type' => 'pending_approvals', 'label' => 'Pending Approvals',      'min_w' => 3, 'min_h' => 2],
        ['type' => 'top_halls',         'label' => 'Top Halls',              'min_w' => 4, 'min_h' => 3],
        ['type' => 'calendar_mini',     'label' => 'Mini Calendar',          'min_w' => 3, 'min_h' => 3],
        ['type' => 'announcements',     'label' => 'Announcements',          'min_w' => 4, 'min_h' => 2],
    ];

    /**
     * Resolve the layout for the current authenticated user.
     * Priority: user-specific > role-specific > system default.
     */
    public function index(): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user   = auth()->user();
        $layout = DashboardLayout::resolveForUser($user);

        return response()->json([
            'data'    => $layout,
            'message' => 'Dashboard layout retrieved.',
            'meta'    => [
                'source' => $layout
                    ? ($layout->user_id ? 'user' : ($layout->role ? 'role' : 'default'))
                    : 'none',
            ],
        ]);
    }

    /**
     * Save / overwrite the current user's personal dashboard layout.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'layout'          => ['required', 'array', 'min:1'],
            'layout.*.id'     => ['required', 'string'],
            'layout.*.type'   => ['required', 'string'],
            'layout.*.x'      => ['required', 'integer', 'min:0'],
            'layout.*.y'      => ['required', 'integer', 'min:0'],
            'layout.*.w'      => ['required', 'integer', 'min:1'],
            'layout.*.h'      => ['required', 'integer', 'min:1'],
            'layout.*.config' => ['nullable', 'array'],
        ]);

        $userId = auth()->id();

        $dashLayout = DashboardLayout::updateOrCreate(
            ['user_id' => $userId, 'role' => null],
            ['layout' => $data['layout'], 'is_default' => false]
        );

        return response()->json([
            'data'    => $dashLayout,
            'message' => 'Dashboard layout saved.',
        ]);
    }

    /**
     * Save a role-specific layout (admin only).
     */
    public function storeRole(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role'             => ['required', 'string', 'exists:roles,name'],
            'layout'           => ['required', 'array', 'min:1'],
            'layout.*.id'      => ['required', 'string'],
            'layout.*.type'    => ['required', 'string'],
            'layout.*.x'       => ['required', 'integer', 'min:0'],
            'layout.*.y'       => ['required', 'integer', 'min:0'],
            'layout.*.w'       => ['required', 'integer', 'min:1'],
            'layout.*.h'       => ['required', 'integer', 'min:1'],
            'layout.*.config'  => ['nullable', 'array'],
            'is_default'       => ['boolean'],
        ]);

        $dashLayout = DashboardLayout::updateOrCreate(
            ['role' => $data['role'], 'user_id' => null],
            [
                'layout'     => $data['layout'],
                'is_default' => $data['is_default'] ?? false,
            ]
        );

        return response()->json([
            'data'    => $dashLayout,
            'message' => "Layout saved for role: {$data['role']}.",
        ]);
    }

    /**
     * Return the list of available widget types for the layout builder UI.
     */
    public function getWidgets(): JsonResponse
    {
        return response()->json([
            'data'    => self::AVAILABLE_WIDGETS,
            'message' => 'Available widgets retrieved.',
        ]);
    }
}
