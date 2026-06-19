<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CateringOrder;
use App\Models\Hall;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $today  = today();
        $user   = auth('api')->user();
        $isAdmin = $user->hasAnyRole(['super-admin', 'admin', 'facility-manager']);
        $userId  = $user->id;

        // PERF-04: cache per-user for 60 seconds
        $data = Cache::remember("dashboard_summary_{$userId}", 60, function () use ($today, $isAdmin, $userId) {
            $todayMeetings = Booking::where('booking_date', $today)
                ->whereIn('status', ['approved', 'pending'])
                ->when(!$isAdmin, fn($q) => $q->where('user_id', $userId))
                ->count();

            $pendingApprovals = Booking::where('status', 'pending')
                ->when(!$isAdmin, fn($q) => $q->where('user_id', $userId))
                ->count();

            $bookedHalls = Booking::where('booking_date', $today)
                ->where('status', 'approved')
                ->distinct('hall_id')
                ->count('hall_id');

            $totalHalls = Hall::where('status', 'active')->count();

            $visitorsToday = Visitor::whereDate('created_at', $today)->count();

            $cateringCostMonth = CateringOrder::where('status', 'confirmed')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('total_cost');

            $totalBookingsMonth = Booking::whereMonth('booking_date', now()->month)
                ->whereYear('booking_date', now()->year)
                ->count();

            $approvedBookingsMonth = Booking::whereMonth('booking_date', now()->month)
                ->whereYear('booking_date', now()->year)
                ->where('status', 'approved')
                ->count();

            return [
                'today_meetings'        => $todayMeetings,
                'pending_approvals'     => $pendingApprovals,
                'booked_halls'          => $bookedHalls,
                'total_halls'           => $totalHalls,
                'visitors_today'        => $visitorsToday,
                'catering_cost_month'   => (float) $cateringCostMonth,
                'total_bookings_month'  => $totalBookingsMonth,
                'approved_bookings_month' => $approvedBookingsMonth,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function hallUtilization(): JsonResponse
    {
        $month = now()->month;
        $year  = now()->year;

        // API-04: use portable Eloquent instead of MySQL-specific DB::raw MONTH(NOW())
        $halls = Hall::withCount([
            'bookings as total_bookings'    => fn($q) => $q->whereMonth('booking_date', $month)->whereYear('booking_date', $year),
            'bookings as approved_bookings' => fn($q) => $q->whereMonth('booking_date', $month)->whereYear('booking_date', $year)->where('status', 'approved'),
        ])
        ->addSelect([
            'id', 'name', 'capacity', 'building', 'floor',
            DB::raw('(
                SELECT COALESCE(SUM(duration_minutes), 0)
                FROM bookings
                WHERE hall_id = halls.id
                  AND status = \'approved\'
                  AND MONTH(booking_date) = ' . $month . '
                  AND YEAR(booking_date) = ' . $year . '
            ) as total_minutes'),
        ])
        ->get();

        return response()->json(['data' => $halls]);
    }

    public function bookingTrends(): JsonResponse
    {
        // API-04: use portable date grouping
        $trends = Booking::select(
            DB::raw('DATE(booking_date) as date'),
            DB::raw('COUNT(*) as total'),
            DB::raw("SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved"),
            DB::raw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending"),
            DB::raw("SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected"),
        )
        ->whereBetween('booking_date', [now()->subDays(30)->toDateString(), now()->toDateString()])
        ->groupBy(DB::raw('DATE(booking_date)'))
        ->orderBy('date')
        ->get();

        return response()->json(['data' => $trends]);
    }

    public function departmentUsage(): JsonResponse
    {
        $month = now()->month;
        $year  = now()->year;

        $usage = Booking::select('department_id', DB::raw('COUNT(*) as total_bookings'), DB::raw('SUM(duration_minutes) as total_minutes'))
            ->with('department:id,name')
            ->whereNotNull('department_id')
            ->whereMonth('booking_date', $month)
            ->whereYear('booking_date', $year)
            ->groupBy('department_id')
            ->orderByDesc('total_bookings')
            ->get();

        return response()->json(['data' => $usage]);
    }

    public function upcomingBookings(): JsonResponse
    {
        $bookings = Booking::with(['hall', 'user'])
            ->where('booking_date', '>=', today())
            ->where('booking_date', '<=', today()->addDays(7))
            ->whereIn('status', ['approved', 'pending'])
            ->orderBy('booking_date')
            ->orderBy('start_time')
            ->limit(10)
            ->get();

        return response()->json(['data' => $bookings]);
    }
}
