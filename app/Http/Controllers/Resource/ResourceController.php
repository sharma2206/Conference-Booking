<?php

namespace App\Http\Controllers\Resource;

use App\Http\Controllers\Controller;
use App\Models\BookingResource;
use App\Models\Resource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $resources = Resource::when($request->category, fn($q, $v) => $q->where('category', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->available, fn($q) => $q->where('available_quantity', '>', 0))
            ->orderBy('name')
            ->paginate($request->per_page ?? 15);

        return response()->json($resources);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'code' => ['required', 'string', 'max:30', 'unique:resources,code'],
            'category' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'total_quantity' => ['required', 'integer', 'min:1'],
        ]);

        $data['available_quantity'] = $data['total_quantity'];
        $resource = Resource::create($data);

        return response()->json(['data' => $resource], 201);
    }

    public function show(Resource $resource): JsonResponse
    {
        return response()->json(['data' => $resource]);
    }

    public function update(Request $request, Resource $resource): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'category' => ['sometimes', 'string', 'max:50'],
            'total_quantity' => ['sometimes', 'integer', 'min:1'],
            'status' => ['sometimes', 'in:available,maintenance,retired'],
        ]);

        $resource->update($data);

        return response()->json(['data' => $resource->fresh()]);
    }

    public function destroy(Resource $resource): JsonResponse
    {
        $resource->delete();

        return response()->json(['message' => 'Resource deleted.']);
    }

    public function requestResource(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_id' => ['required', 'exists:bookings,id'],
            'resource_id' => ['required', 'exists:resources,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $resource = Resource::findOrFail($data['resource_id']);

        if ($resource->available_quantity < $data['quantity']) {
            return response()->json(['message' => "Only {$resource->available_quantity} units available."], 422);
        }

        $bookingResource = BookingResource::create($data);
        $resource->decrement('available_quantity', $data['quantity']);

        return response()->json(['data' => $bookingResource->load('resource')], 201);
    }

    public function returnResource(BookingResource $bookingResource): JsonResponse
    {
        if ($bookingResource->status === 'returned') {
            return response()->json(['message' => 'Resource already returned.'], 422);
        }

        $bookingResource->update(['status' => 'returned']);
        $bookingResource->resource->increment('available_quantity', $bookingResource->quantity);

        return response()->json(['message' => 'Resource returned successfully.']);
    }
}
