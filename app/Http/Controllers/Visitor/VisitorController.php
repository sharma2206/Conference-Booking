<?php

namespace App\Http\Controllers\Visitor;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Visitor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class VisitorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $visitors = Visitor::with(['booking:id,title,booking_number', 'host:id,name'])
            ->when($request->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%")->orWhere('company', 'like', "%{$v}%"))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->date, fn($q, $v) => $q->whereDate('created_at', $v))
            ->when($request->booking_id, fn($q, $v) => $q->where('booking_id', $v))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 15);

        return response()->json($visitors);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_id' => ['nullable', 'exists:bookings,id'],
            'name' => ['required', 'string', 'max:100'],
            'company' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:100'],
            'phone' => ['required', 'string', 'max:20'],
            'id_proof_type' => ['nullable', 'string', 'max:50'],
            'id_proof_number' => ['nullable', 'string', 'max:50'],
            'vehicle_number' => ['nullable', 'string', 'max:20'],
            'host_id' => ['nullable', 'exists:users,id'],
            'purpose' => ['nullable', 'string'],
        ]);

        $data['host_id'] = $data['host_id'] ?? auth('api')->id();

        if ($request->hasFile('id_proof_image')) {
            $data['id_proof_image'] = $request->file('id_proof_image')->store('visitors/id-proofs', 'public');
        }

        $visitor = Visitor::create($data);
        AuditLog::record('create', 'visitor', ['visitor_id' => $visitor->id]);

        return response()->json(['data' => $visitor->load('host:id,name', 'booking:id,title')], 201);
    }

    public function show(Visitor $visitor): JsonResponse
    {
        return response()->json(['data' => $visitor->load('booking.hall', 'host:id,name,phone')]);
    }

    public function update(Request $request, Visitor $visitor): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'company' => ['nullable', 'string', 'max:100'],
            'phone' => ['sometimes', 'string', 'max:20'],
            'vehicle_number' => ['nullable', 'string', 'max:20'],
            'status' => ['sometimes', 'in:pending,approved,rejected,checked_in,checked_out'],
            'purpose' => ['nullable', 'string'],
        ]);

        $visitor->update($data);

        return response()->json(['data' => $visitor->fresh()]);
    }

    public function checkIn(Visitor $visitor): JsonResponse
    {
        if (!in_array($visitor->status, ['approved', 'pending'])) {
            return response()->json(['message' => 'Visitor cannot be checked in.'], 422);
        }

        $visitor->update(['status' => 'checked_in', 'check_in_at' => now()]);
        AuditLog::record('check_in', 'visitor', ['visitor_id' => $visitor->id]);

        return response()->json(['data' => $visitor->fresh(), 'message' => 'Visitor checked in.']);
    }

    public function checkOut(Visitor $visitor): JsonResponse
    {
        if ($visitor->status !== 'checked_in') {
            return response()->json(['message' => 'Visitor is not currently checked in.'], 422);
        }

        $visitor->update(['status' => 'checked_out', 'check_out_at' => now()]);
        AuditLog::record('check_out', 'visitor', ['visitor_id' => $visitor->id]);

        return response()->json(['data' => $visitor->fresh(), 'message' => 'Visitor checked out.']);
    }

    public function approve(Visitor $visitor): JsonResponse
    {
        $visitor->update([
            'status' => 'approved',
            'security_approved_by' => auth('api')->user()->name,
            'security_approved_at' => now(),
        ]);

        return response()->json(['data' => $visitor->fresh(), 'message' => 'Visitor approved.']);
    }

    public function destroy(Visitor $visitor): JsonResponse
    {
        $visitor->delete();

        return response()->json(['message' => 'Visitor deleted.']);
    }
}
