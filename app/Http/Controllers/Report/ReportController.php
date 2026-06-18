<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function bookings(Request $request): JsonResponse
    {
        $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $query = Booking::with(['hall', 'user']);

        if ($request->filled('from')) {
            $query->whereDate('booking_date', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('booking_date', '<=', $request->input('to'));
        }

        return response()->json($query->orderBy('booking_date')->paginate(20));
    }
}
