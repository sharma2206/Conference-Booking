<?php

use App\Http\Controllers\AuditLog\AuditLogController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Booking\BookingApprovalController;
use App\Http\Controllers\Booking\BookingController;
use App\Http\Controllers\Branding\BrandingController;
use App\Http\Controllers\Branding\DashboardLayoutController;
use App\Http\Controllers\Branding\DynamicModuleController;
use App\Http\Controllers\Branding\EmailTemplateController;
use App\Http\Controllers\Branding\FileManagerController;
use App\Http\Controllers\Branding\MenuController;
use App\Http\Controllers\Branding\PageController;
use App\Http\Controllers\Branding\ReportTemplateController;
use App\Http\Controllers\Branding\ThemeController;
use App\Http\Controllers\Catering\CateringController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Department\DepartmentController;
use App\Http\Controllers\Hall\HallController;
use App\Http\Controllers\Notification\NotificationController;
use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\Resource\ResourceController;
use App\Http\Controllers\Role\RoleController;
use App\Http\Controllers\Settings\SettingsController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\Visitor\VisitorController;
use Illuminate\Support\Facades\Route;

// Health check — public, no auth required
Route::get('health', fn() => response()->json(['status' => 'ok', 'timestamp' => now()->toISOString()]));

// Public branding config — no auth required (used by frontend before login)
Route::get('branding/public', [BrandingController::class, 'publicConfig']);

// Public auth routes
Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Authenticated routes
Route::middleware(['auth:api', 'throttle:api'])->group(function () {

    // ── Auth (all authenticated users) ──────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('2fa/enable', [AuthController::class, 'enable2FA']);
        Route::post('2fa/disable', [AuthController::class, 'disable2FA']);
    });

    // ── Dashboard — requires booking.view ───────────────────────────
    Route::prefix('dashboard')->middleware('permission:booking.view')->group(function () {
        Route::get('summary', [DashboardController::class, 'summary']);
        Route::get('hall-utilization', [DashboardController::class, 'hallUtilization']);
        Route::get('booking-trends', [DashboardController::class, 'bookingTrends']);
        Route::get('department-usage', [DashboardController::class, 'departmentUsage']);
        Route::get('upcoming-bookings', [DashboardController::class, 'upcomingBookings']);
    });

    // ── Notifications (all authenticated users) ─────────────────────
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('notifications/mark-read', [NotificationController::class, 'markRead']);
    Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('notifications', [NotificationController::class, 'destroyAll']);

    // ── Halls ────────────────────────────────────────────────────────
    Route::middleware('permission:hall.view')->group(function () {
        Route::get('halls', [HallController::class, 'index']);
        Route::get('halls/{hall}', [HallController::class, 'show']);
        Route::get('halls/{hall}/availability', [HallController::class, 'availability']);
    });
    Route::post('halls', [HallController::class, 'store'])->middleware('permission:hall.create');
    Route::put('halls/{hall}', [HallController::class, 'update'])->middleware('permission:hall.edit');
    Route::delete('halls/{hall}', [HallController::class, 'destroy'])->middleware('permission:hall.delete');
    Route::post('halls/{hall}/images', [HallController::class, 'uploadImage'])->middleware('permission:hall.edit');

    // ── Bookings ─────────────────────────────────────────────────────
    Route::middleware('permission:booking.view')->group(function () {
        Route::get('bookings/calendar', [BookingController::class, 'calendar']);
        Route::get('bookings', [BookingController::class, 'index']);
        Route::get('bookings/{booking}', [BookingController::class, 'show']);
    });
    Route::post('bookings', [BookingController::class, 'store'])->middleware('permission:booking.create');
    Route::post('bookings/recurring', [BookingController::class, 'recurringStore'])->middleware('permission:booking.create');
    Route::put('bookings/{booking}', [BookingController::class, 'update'])->middleware('permission:booking.edit');
    // POST /cancel is the semantically correct REST action; DELETE is kept for backwards compatibility
    Route::post('bookings/{booking}/cancel', [BookingController::class, 'destroy'])->middleware('permission:booking.cancel');
    Route::delete('bookings/{booking}', [BookingController::class, 'destroy'])->middleware('permission:booking.cancel');

    // ── Approvals ────────────────────────────────────────────────────
    Route::middleware('permission:booking.approve')->group(function () {
        Route::get('pending-approvals', [BookingApprovalController::class, 'pendingApprovals']);
        Route::post('bookings/{booking}/approve', [BookingApprovalController::class, 'approve']);
        Route::post('bookings/{booking}/reject', [BookingApprovalController::class, 'reject']);
    });

    // ── Departments ──────────────────────────────────────────────────
    Route::middleware('permission:department.view')->group(function () {
        Route::get('departments/all', [DepartmentController::class, 'all']);
        Route::get('departments', [DepartmentController::class, 'index']);
        Route::get('departments/{department}', [DepartmentController::class, 'show']);
    });
    Route::post('departments', [DepartmentController::class, 'store'])->middleware('permission:department.create');
    Route::put('departments/{department}', [DepartmentController::class, 'update'])->middleware('permission:department.edit');
    Route::delete('departments/{department}', [DepartmentController::class, 'destroy'])->middleware('permission:department.delete');

    // ── Users ────────────────────────────────────────────────────────
    Route::middleware('permission:user.view')->group(function () {
        Route::get('users', [UserController::class, 'index']);
        Route::get('users/{user}', [UserController::class, 'show']);
        Route::get('user-roles', [UserController::class, 'roles']);
    });
    Route::post('users', [UserController::class, 'store'])->middleware('permission:user.create');
    Route::put('users/{user}', [UserController::class, 'update'])->middleware('permission:user.edit');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('permission:user.delete');
    Route::post('users/{user}/avatar', [UserController::class, 'updateAvatar'])->middleware('permission:user.edit');
    Route::put('users/{user}/password', [UserController::class, 'updatePassword'])->middleware('permission:user.edit');

    // ── Roles & Permissions ──────────────────────────────────────────
    Route::middleware('permission:role.view')->group(function () {
        Route::get('roles', [RoleController::class, 'index']);
        Route::get('roles/{role}', [RoleController::class, 'show']);
        Route::get('permissions', [RoleController::class, 'permissions']);
        Route::get('all-permissions', [RoleController::class, 'allPermissions']);
    });
    Route::post('roles', [RoleController::class, 'store'])->middleware('permission:role.create');
    Route::put('roles/{role}', [RoleController::class, 'update'])->middleware('permission:role.edit');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:role.delete');

    // ── Visitors ─────────────────────────────────────────────────────
    Route::middleware('permission:visitor.view')->group(function () {
        Route::get('visitors', [VisitorController::class, 'index']);
        Route::get('visitors/{visitor}', [VisitorController::class, 'show']);
    });
    Route::post('visitors', [VisitorController::class, 'store'])->middleware('permission:visitor.create');
    Route::put('visitors/{visitor}', [VisitorController::class, 'update'])->middleware('permission:visitor.edit');
    Route::delete('visitors/{visitor}', [VisitorController::class, 'destroy'])->middleware('permission:visitor.delete');
    Route::post('visitors/{visitor}/check-in', [VisitorController::class, 'checkIn'])->middleware('permission:visitor.check_in');
    Route::post('visitors/{visitor}/check-out', [VisitorController::class, 'checkOut'])->middleware('permission:visitor.check_out');
    Route::post('visitors/{visitor}/approve', [VisitorController::class, 'approve'])->middleware('permission:visitor.approve');

    // ── Catering ─────────────────────────────────────────────────────
    Route::middleware('permission:catering.view')->group(function () {
        Route::get('catering/menus', [CateringController::class, 'menus']);
        Route::get('catering/orders', [CateringController::class, 'orders']);
        Route::get('catering/monthly-cost', [CateringController::class, 'monthlyCost']);
    });
    Route::post('catering/menus', [CateringController::class, 'storeMenu'])->middleware('permission:catering.create');
    Route::put('catering/menus/{menu}', [CateringController::class, 'updateMenu'])->middleware('permission:catering.edit');
    Route::delete('catering/menus/{menu}', [CateringController::class, 'destroyMenu'])->middleware('permission:catering.delete');
    Route::post('catering/orders', [CateringController::class, 'storeOrder'])->middleware('permission:catering.create');
    Route::put('catering/orders/{order}/status', [CateringController::class, 'updateOrderStatus'])->middleware('permission:catering.edit');

    // ── Resources ────────────────────────────────────────────────────
    Route::middleware('permission:resource.view')->group(function () {
        Route::get('resources', [ResourceController::class, 'index']);
        Route::get('resources/{resource}', [ResourceController::class, 'show']);
    });
    Route::post('resources', [ResourceController::class, 'store'])->middleware('permission:resource.create');
    Route::put('resources/{resource}', [ResourceController::class, 'update'])->middleware('permission:resource.edit');
    Route::delete('resources/{resource}', [ResourceController::class, 'destroy'])->middleware('permission:resource.delete');
    Route::post('resources/request', [ResourceController::class, 'requestResource'])->middleware('permission:resource.view');
    Route::post('booking-resources/{bookingResource}/return', [ResourceController::class, 'returnResource'])->middleware('permission:resource.view');

    // ── Reports ──────────────────────────────────────────────────────
    Route::middleware('permission:report.view')->prefix('reports')->group(function () {
        Route::get('bookings', [ReportController::class, 'bookings']);
        Route::get('hall-utilization', [ReportController::class, 'hallUtilization']);
        Route::get('department-wise', [ReportController::class, 'departmentWise']);
        Route::get('top-halls', [ReportController::class, 'topHalls']);
        Route::get('monthly', [ReportController::class, 'monthly']);
    });
    Route::get('reports/export/excel', [ReportController::class, 'exportExcel'])->middleware('permission:report.export');
    Route::get('reports/export/pdf', [ReportController::class, 'exportPdf'])->middleware('permission:report.export');

    // ── Audit Logs ───────────────────────────────────────────────────
    Route::middleware('permission:audit.view')->prefix('audit')->group(function () {
        Route::get('logs', [AuditLogController::class, 'index']);
        Route::get('activity', [AuditLogController::class, 'activityLog']);
        Route::get('modules', [AuditLogController::class, 'modules']);
    });

    // ── Settings ─────────────────────────────────────────────────────
    Route::middleware('permission:settings.view')->prefix('settings')->group(function () {
        Route::get('/', [SettingsController::class, 'index']);
        Route::get('group/{group}', [SettingsController::class, 'getByGroup']);
        Route::get('holidays', [SettingsController::class, 'holidays']);
        Route::get('workflows', [SettingsController::class, 'approvalWorkflows']);
    });
    Route::middleware('permission:settings.view')->prefix('settings')->group(function () {
        Route::get('smtp', [SettingsController::class, 'smtpSettings']);
    });

    Route::middleware('permission:settings.update')->prefix('settings')->group(function () {
        Route::put('/', [SettingsController::class, 'update']);
        Route::put('smtp', [SettingsController::class, 'updateSmtp']);
        Route::post('smtp/test', [SettingsController::class, 'testSmtp']);
        Route::post('holidays', [SettingsController::class, 'storeHoliday']);
        Route::put('holidays/{holiday}', [SettingsController::class, 'updateHoliday']);
        Route::delete('holidays/{holiday}', [SettingsController::class, 'destroyHoliday']);
        Route::post('workflows', [SettingsController::class, 'storeWorkflow']);
        Route::delete('workflows/{workflow}', [SettingsController::class, 'destroyWorkflow']);
    });

    // ── Branding (read) ───────────────────────────────────────────────
    Route::middleware('permission:settings.view')->group(function () {
        Route::get('branding', [BrandingController::class, 'index']);
        Route::get('branding/css-variables', [BrandingController::class, 'cssVariables']);
        Route::get('themes', [ThemeController::class, 'index']);
        // Static named routes MUST come before {theme} wildcard
        Route::get('themes/active',   [ThemeController::class, 'active']);
        Route::get('themes/builtins', [ThemeController::class, 'builtins']);
        Route::get('themes/{theme}',  [ThemeController::class, 'show']);
        Route::get('menus', [MenuController::class, 'index']);
        Route::get('modules', [DynamicModuleController::class, 'index']);
        Route::get('modules/{module}', [DynamicModuleController::class, 'show']);
        Route::get('pages', [PageController::class, 'index']);
        Route::get('pages/{page}', [PageController::class, 'show']);
        Route::get('dashboard/layouts', [DashboardLayoutController::class, 'index']);
        Route::get('dashboard/widgets', [DashboardLayoutController::class, 'getWidgets']);
        Route::get('email-templates', [EmailTemplateController::class, 'index']);
        Route::get('email-templates/{template}', [EmailTemplateController::class, 'show']);
        Route::get('report-templates', [ReportTemplateController::class, 'index']);
        Route::get('report-templates/{template}', [ReportTemplateController::class, 'show']);
        Route::get('report-templates/{template}/export', [ReportTemplateController::class, 'export']);
        Route::get('file-manager', [FileManagerController::class, 'index']);
    });

    // ── Branding (write) ──────────────────────────────────────────────
    Route::middleware('permission:settings.update')->group(function () {
        Route::post('branding', [BrandingController::class, 'update']);
        Route::post('branding/upload', [BrandingController::class, 'uploadAsset']);
        Route::post('branding/preview', [BrandingController::class, 'preview']);
        Route::post('branding/publish', [BrandingController::class, 'publish']);

        Route::post('themes', [ThemeController::class, 'store']);
        Route::put('themes/{theme}', [ThemeController::class, 'update']);
        Route::delete('themes/{theme}', [ThemeController::class, 'destroy']);
        Route::post('themes/{theme}/activate', [ThemeController::class, 'activate']);

        Route::post('menus', [MenuController::class, 'store']);
        Route::put('menus/{item}', [MenuController::class, 'update']);
        Route::delete('menus/{item}', [MenuController::class, 'destroy']);
        Route::post('menus/reorder', [MenuController::class, 'reorder']);

        Route::post('modules', [DynamicModuleController::class, 'store']);
        Route::put('modules/{module}', [DynamicModuleController::class, 'update']);
        Route::delete('modules/{module}', [DynamicModuleController::class, 'destroy']);
        Route::post('modules/{module}/toggle', [DynamicModuleController::class, 'toggle']);

        Route::post('pages', [PageController::class, 'store']);
        Route::put('pages/{page}', [PageController::class, 'update']);
        Route::delete('pages/{page}', [PageController::class, 'destroy']);
        Route::post('pages/{page}/publish', [PageController::class, 'publish']);
        Route::post('pages/{page}/unpublish', [PageController::class, 'unpublish']);

        Route::post('dashboard/layouts', [DashboardLayoutController::class, 'store']);
        Route::post('dashboard/layouts/role', [DashboardLayoutController::class, 'storeRole']);

        Route::put('email-templates/{template}', [EmailTemplateController::class, 'update']);
        Route::post('email-templates/{template}/preview', [EmailTemplateController::class, 'preview']);

        Route::post('report-templates', [ReportTemplateController::class, 'store']);
        Route::put('report-templates/{template}', [ReportTemplateController::class, 'update']);
        Route::delete('report-templates/{template}', [ReportTemplateController::class, 'destroy']);
        Route::post('report-templates/{template}/run', [ReportTemplateController::class, 'run']);

        Route::post('file-manager/upload', [FileManagerController::class, 'upload']);
        Route::delete('file-manager/{filename}', [FileManagerController::class, 'destroy']);
    });
});
