<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Hall;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function bookings(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'status' => ['nullable', 'string'],
            'hall_id' => ['nullable', 'exists:halls,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
        ]);

        $bookings = Booking::with(['hall:id,name', 'user:id,name', 'department:id,name'])
            ->when($request->date_from, fn($q, $v) => $q->where('booking_date', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->where('booking_date', '<=', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->hall_id, fn($q, $v) => $q->where('hall_id', $v))
            ->when($request->department_id, fn($q, $v) => $q->where('department_id', $v))
            ->orderByDesc('booking_date')
            ->paginate($request->per_page ?? 20);

        return response()->json($bookings);
    }

    public function hallUtilization(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year' => ['nullable', 'integer', 'min:2020'],
        ]);

        $month = $request->month ?? now()->month;
        $year = $request->year ?? now()->year;

        $halls = Hall::withCount([
            'bookings as total_bookings' => fn($q) => $q->whereMonth('booking_date', $month)->whereYear('booking_date', $year),
            'bookings as approved_bookings' => fn($q) => $q->whereMonth('booking_date', $month)->whereYear('booking_date', $year)->where('status', 'approved'),
            'bookings as cancelled_bookings' => fn($q) => $q->whereMonth('booking_date', $month)->whereYear('booking_date', $year)->where('status', 'cancelled'),
        ])
        ->addSelect([
            '*',
            DB::raw("(SELECT SUM(duration_minutes) FROM bookings WHERE hall_id = halls.id AND status='approved' AND MONTH(booking_date)={$month} AND YEAR(booking_date)={$year}) as total_minutes"),
        ])
        ->get();

        return response()->json(['data' => $halls]);
    }

    public function departmentWise(Request $request): JsonResponse
    {
        $data = Booking::select('department_id',
            DB::raw('COUNT(*) as total'),
            DB::raw('SUM(CASE WHEN status="approved" THEN 1 ELSE 0 END) as approved'),
            DB::raw('SUM(CASE WHEN status="pending" THEN 1 ELSE 0 END) as pending'),
            DB::raw('SUM(CASE WHEN status="rejected" THEN 1 ELSE 0 END) as rejected'),
            DB::raw('SUM(CASE WHEN status="cancelled" THEN 1 ELSE 0 END) as cancelled'),
            DB::raw('SUM(duration_minutes) as total_minutes')
        )
        ->with('department:id,name')
        ->when($request->month, fn($q, $v) => $q->whereMonth('booking_date', $v))
        ->when($request->year, fn($q, $v) => $q->whereYear('booking_date', $v))
        ->whereNotNull('department_id')
        ->groupBy('department_id')
        ->orderByDesc('total')
        ->get();

        return response()->json(['data' => $data]);
    }

    public function topHalls(Request $request): JsonResponse
    {
        $halls = Booking::select('hall_id', DB::raw('COUNT(*) as bookings_count'), DB::raw('SUM(duration_minutes) as total_minutes'))
            ->with('hall:id,name,capacity')
            ->where('status', 'approved')
            ->when($request->month, fn($q, $v) => $q->whereMonth('booking_date', $v))
            ->when($request->year, fn($q, $v) => $q->whereYear('booking_date', $v))
            ->groupBy('hall_id')
            ->orderByDesc('bookings_count')
            ->limit(10)
            ->get();

        return response()->json(['data' => $halls]);
    }

    public function exportExcel(Request $request): mixed
    {
        $request->validate(['type' => ['required', 'in:bookings,halls,departments']]);

        return Excel::download(
            new \App\Exports\BookingsExport($request->all()),
            "report_{$request->type}_" . now()->format('Ymd_His') . '.xlsx'
        );
    }

    public function exportPdf(Request $request): Response
    {
        $request->validate(['type' => ['required', 'in:bookings,halls,departments']]);

        $bookings = Booking::with(['hall:id,name', 'user:id,name', 'department:id,name'])
            ->when($request->date_from, fn($q, $v) => $q->where('booking_date', '>=', $v))
            ->when($request->date_to, fn($q, $v) => $q->where('booking_date', '<=', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderByDesc('booking_date')
            ->limit(500)
            ->get();

        $pdf = Pdf::loadView("reports.{$request->type}", [
            'bookings' => $bookings,
            'generated_at' => now(),
            'filters' => $request->all(),
        ]);

        return $pdf->download("report_{$request->type}_" . now()->format('Ymd') . '.pdf');
    }

    public function monthly(Request $request): JsonResponse
    {
        $year = $request->year ?? now()->year;

        $data = Booking::select(
            DB::raw('MONTH(booking_date) as month'),
            DB::raw('COUNT(*) as total'),
            DB::raw('SUM(CASE WHEN status="approved" THEN 1 ELSE 0 END) as approved'),
            DB::raw('SUM(CASE WHEN status="rejected" THEN 1 ELSE 0 END) as rejected'),
            DB::raw('SUM(CASE WHEN status="cancelled" THEN 1 ELSE 0 END) as cancelled'),
        )
        ->whereYear('booking_date', $year)
        ->groupBy(DB::raw('MONTH(booking_date)'))
        ->orderBy('month')
        ->get();

        return response()->json(['data' => $data]);
    }
}
