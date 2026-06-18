<?php

namespace App\Http\Controllers\Hall;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hall\StoreHallRequest;
use App\Http\Requests\Hall\UpdateHallRequest;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Hall;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HallController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $halls = Hall::with('facilities')
            ->when($request->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%")->orWhere('code', 'like', "%{$v}%"))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->capacity_min, fn($q, $v) => $q->where('capacity', '>=', $v))
            ->when($request->building, fn($q, $v) => $q->where('building', $v))
            ->orderBy('name')
            ->paginate($request->per_page ?? 15);

        return response()->json($halls);
    }

    public function store(StoreHallRequest $request): JsonResponse
    {
        $data = $request->validated();
        $hall = Hall::create(array_merge(
            collect($data)->except(['facilities'])->toArray(),
            ['created_by' => auth('api')->id()]
        ));

        if (!empty($data['facilities'])) {
            $hall->facilities()->createMany($data['facilities']);
        }

        AuditLog::record('create', 'hall', ['hall_id' => $hall->id, 'name' => $hall->name]);

        return response()->json(['data' => $hall->load('facilities')], 201);
    }

    public function show(Hall $hall): JsonResponse
    {
        return response()->json([
            'data' => $hall->load('facilities', 'createdBy'),
        ]);
    }

    public function update(UpdateHallRequest $request, Hall $hall): JsonResponse
    {
        $data = $request->validated();
        $hall->update(collect($data)->except(['facilities'])->toArray());

        if (array_key_exists('facilities', $data)) {
            $hall->facilities()->delete();
            if (!empty($data['facilities'])) {
                $hall->facilities()->createMany($data['facilities']);
            }
        }

        AuditLog::record('update', 'hall', ['hall_id' => $hall->id]);

        return response()->json(['data' => $hall->fresh('facilities')]);
    }

    public function destroy(Hall $hall): JsonResponse
    {
        $activeBookings = Booking::where('hall_id', $hall->id)
            ->whereIn('status', ['pending', 'approved'])
            ->where('booking_date', '>=', today())
            ->exists();

        if ($activeBookings) {
            return response()->json(['message' => 'Cannot delete hall with active bookings.'], 422);
        }

        AuditLog::record('delete', 'hall', ['hall_id' => $hall->id, 'name' => $hall->name]);
        $hall->delete();

        return response()->json(['message' => 'Hall deleted successfully.']);
    }

    public function uploadImage(Request $request, Hall $hall): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $path = $request->file('image')->store('halls', 'public');
        $images = $hall->images ?? [];
        $images[] = $path;
        $hall->update(['images' => $images]);

        return response()->json(['data' => ['path' => $path, 'url' => Storage::url($path)]]);
    }

    public function availability(Request $request, Hall $hall): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ]);

        $available = $hall->isAvailable(
            $request->date,
            $request->start_time,
            $request->end_time
        );

        $bookings = Booking::where('hall_id', $hall->id)
            ->where('booking_date', $request->date)
            ->whereIn('status', ['pending', 'approved'])
            ->select('title', 'start_time', 'end_time', 'status')
            ->get();

        return response()->json([
            'available' => $available,
            'bookings' => $bookings,
        ]);
    }
}
