<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Hall;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        return response()->json([
            'total_halls' => Hall::count(),
            'total_bookings' => Booking::count(),
            'todays_meetings' => Booking::where('booking_date', today())
                ->whereIn('status', ['approved', 'pending'])
                ->count(),
            'pending_approvals' => Booking::where('status', 'pending')->count(),
            'approved_bookings' => Booking::where('status', 'approved')->count(),
            'rejected_bookings' => Booking::where('status', 'rejected')->count(),
        ]);
    }
}
