<?php

use App\Http\Controllers\AuditLog\AuditLogController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Booking\BookingApprovalController;
use App\Http\Controllers\Booking\BookingController;
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

// Public auth routes
Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

// Authenticated routes
Route::middleware(['auth:api', 'throttle:api'])->group(function () {

    // Auth
    Route::prefix('auth')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('2fa/enable', [AuthController::class, 'enable2FA']);
        Route::post('2fa/disable', [AuthController::class, 'disable2FA']);
    });

    // Dashboard
    Route::prefix('dashboard')->group(function () {
        Route::get('summary', [DashboardController::class, 'summary']);
        Route::get('hall-utilization', [DashboardController::class, 'hallUtilization']);
        Route::get('booking-trends', [DashboardController::class, 'bookingTrends']);
        Route::get('department-usage', [DashboardController::class, 'departmentUsage']);
        Route::get('upcoming-bookings', [DashboardController::class, 'upcomingBookings']);
    });

    // Halls
    Route::apiResource('halls', HallController::class);
    Route::post('halls/{hall}/images', [HallController::class, 'uploadImage']);
    Route::get('halls/{hall}/availability', [HallController::class, 'availability']);

    // Bookings
    Route::get('bookings/calendar', [BookingController::class, 'calendar']);
    Route::post('bookings/recurring', [BookingController::class, 'recurringStore']);
    Route::apiResource('bookings', BookingController::class);
    Route::post('bookings/{booking}/approve', [BookingApprovalController::class, 'approve']);
    Route::post('bookings/{booking}/reject', [BookingApprovalController::class, 'reject']);
    Route::get('pending-approvals', [BookingApprovalController::class, 'pendingApprovals']);

    // Departments
    Route::get('departments/all', [DepartmentController::class, 'all']);
    Route::apiResource('departments', DepartmentController::class);

    // Users
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/avatar', [UserController::class, 'updateAvatar']);
    Route::put('users/{user}/password', [UserController::class, 'updatePassword']);
    Route::get('user-roles', [UserController::class, 'roles']);

    // Roles & Permissions
    Route::apiResource('roles', RoleController::class);
    Route::get('permissions', [RoleController::class, 'permissions']);
    Route::get('all-permissions', [RoleController::class, 'allPermissions']);

    // Visitors
    Route::apiResource('visitors', VisitorController::class);
    Route::post('visitors/{visitor}/check-in', [VisitorController::class, 'checkIn']);
    Route::post('visitors/{visitor}/check-out', [VisitorController::class, 'checkOut']);
    Route::post('visitors/{visitor}/approve', [VisitorController::class, 'approve']);

    // Catering
    Route::get('catering/menus', [CateringController::class, 'menus']);
    Route::post('catering/menus', [CateringController::class, 'storeMenu']);
    Route::put('catering/menus/{menu}', [CateringController::class, 'updateMenu']);
    Route::delete('catering/menus/{menu}', [CateringController::class, 'destroyMenu']);
    Route::get('catering/orders', [CateringController::class, 'orders']);
    Route::post('catering/orders', [CateringController::class, 'storeOrder']);
    Route::put('catering/orders/{order}/status', [CateringController::class, 'updateOrderStatus']);
    Route::get('catering/monthly-cost', [CateringController::class, 'monthlyCost']);

    // Resources
    Route::apiResource('resources', ResourceController::class);
    Route::post('resources/request', [ResourceController::class, 'requestResource']);
    Route::post('booking-resources/{bookingResource}/return', [ResourceController::class, 'returnResource']);

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('notifications/mark-read', [NotificationController::class, 'markRead']);
    Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('notifications', [NotificationController::class, 'destroyAll']);

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('bookings', [ReportController::class, 'bookings']);
        Route::get('hall-utilization', [ReportController::class, 'hallUtilization']);
        Route::get('department-wise', [ReportController::class, 'departmentWise']);
        Route::get('top-halls', [ReportController::class, 'topHalls']);
        Route::get('monthly', [ReportController::class, 'monthly']);
        Route::get('export/excel', [ReportController::class, 'exportExcel']);
        Route::get('export/pdf', [ReportController::class, 'exportPdf']);
    });

    // Audit Logs
    Route::prefix('audit')->group(function () {
        Route::get('logs', [AuditLogController::class, 'index']);
        Route::get('activity', [AuditLogController::class, 'activityLog']);
        Route::get('modules', [AuditLogController::class, 'modules']);
    });

    // Settings
    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingsController::class, 'index']);
        Route::put('/', [SettingsController::class, 'update']);
        Route::get('group/{group}', [SettingsController::class, 'getByGroup']);
        Route::get('holidays', [SettingsController::class, 'holidays']);
        Route::post('holidays', [SettingsController::class, 'storeHoliday']);
        Route::put('holidays/{holiday}', [SettingsController::class, 'updateHoliday']);
        Route::delete('holidays/{holiday}', [SettingsController::class, 'destroyHoliday']);
        Route::get('workflows', [SettingsController::class, 'approvalWorkflows']);
        Route::post('workflows', [SettingsController::class, 'storeWorkflow']);
        Route::delete('workflows/{workflow}', [SettingsController::class, 'destroyWorkflow']);
    });
});
