<?php

namespace App\Http\Controllers\Hall;

use App\Http\Controllers\Controller;
use App\Http\Requests\Hall\StoreHallRequest;
use App\Http\Requests\Hall\UpdateHallRequest;
use App\Models\Hall;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class HallController extends Controller
{
    public function index(): JsonResponse
    {
        $halls = Hall::with('facilities')->orderBy('name')->paginate(15);

        return response()->json($halls);
    }

    public function store(StoreHallRequest $request): JsonResponse
    {
        $data = $request->validated();
        $hall = Hall::create(array_merge($data, ['created_by' => Auth::id()]));

        if (!empty($data['facilities'])) {
            $hall->facilities()->createMany(array_map(fn($facility) => ['facility' => $facility], $data['facilities']));
        }

        return response()->json($hall->load('facilities'), 201);
    }

    public function show(Hall $hall): JsonResponse
    {
        return response()->json($hall->load('facilities'));
    }

    public function update(UpdateHallRequest $request, Hall $hall): JsonResponse
    {
        $data = $request->validated();
        $hall->update($data);

        if (array_key_exists('facilities', $data)) {
            $hall->facilities()->delete();
            $hall->facilities()->createMany(array_map(fn($facility) => ['facility' => $facility], $data['facilities']));
        }

        return response()->json($hall->load('facilities'));
    }

    public function destroy(Hall $hall): JsonResponse
    {
        $hall->delete();

        return response()->json(['message' => 'Hall deleted successfully']);
    }
}
