<?php

namespace App\Http\Controllers\Booking;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\ApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingApprovalController extends Controller
{
    public function __construct(private readonly ApprovalService $approvalService) {}

    public function approve(Request $request, Booking $booking): JsonResponse
    {
        $request->validate([
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $updated = $this->approvalService->approve(
            $booking,
            auth('api')->user(),
            $request->remarks ?? ''
        );

        return response()->json(['data' => $updated, 'message' => 'Booking approved successfully.']);
    }

    public function reject(Request $request, Booking $booking): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        $updated = $this->approvalService->reject(
            $booking,
            auth('api')->user(),
            $request->reason
        );

        return response()->json(['data' => $updated, 'message' => 'Booking rejected.']);
    }

    public function pendingApprovals(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $bookings = Booking::with(['hall', 'user', 'department', 'approvals'])
            ->where('status', 'pending')
            ->whereHas('approvals', function ($q) use ($user) {
                $q->where('status', 'pending')
                  ->where(function ($inner) use ($user) {
                      $inner->whereNull('approver_id')
                            ->orWhere('approver_id', $user->id);
                  });
            })
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 15);

        return response()->json($bookings);
    }
}
