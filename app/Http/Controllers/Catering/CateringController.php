<?php

namespace App\Http\Controllers\Catering;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CateringMenu;
use App\Models\CateringOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CateringController extends Controller
{
    public function menus(Request $request): JsonResponse
    {
        $menus = CateringMenu::when($request->category, fn($q, $v) => $q->where('category', $v))
            ->when($request->available, fn($q) => $q->where('is_available', true))
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $menus]);
    }

    public function storeMenu(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'category' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'unit' => ['nullable', 'string', 'max:30'],
            'is_available' => ['boolean'],
        ]);

        $menu = CateringMenu::create($data);

        return response()->json(['data' => $menu], 201);
    }

    public function updateMenu(Request $request, CateringMenu $menu): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'category' => ['sometimes', 'string', 'max:50'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'is_available' => ['boolean'],
        ]);

        $menu->update($data);

        return response()->json(['data' => $menu->fresh()]);
    }

    public function destroyMenu(CateringMenu $menu): JsonResponse
    {
        $menu->delete();

        return response()->json(['message' => 'Menu item deleted.']);
    }

    public function orders(Request $request): JsonResponse
    {
        $orders = CateringOrder::with(['booking:id,title,booking_number,booking_date', 'requestedBy:id,name', 'items.menu'])
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->booking_id, fn($q, $v) => $q->where('booking_id', $v))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 15);

        return response()->json($orders);
    }

    public function storeOrder(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_id' => ['required', 'exists:bookings,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.menu_id' => ['required', 'exists:catering_menus,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'special_instructions' => ['nullable', 'string'],
        ]);

        $totalCost = 0;
        $orderItems = [];

        foreach ($data['items'] as $item) {
            $menu = CateringMenu::findOrFail($item['menu_id']);
            $total = $menu->price * $item['quantity'];
            $totalCost += $total;
            $orderItems[] = [
                'menu_id' => $item['menu_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $menu->price,
                'total_price' => $total,
            ];
        }

        $order = CateringOrder::create([
            'booking_id' => $data['booking_id'],
            'requested_by' => auth('api')->id(),
            'status' => 'pending',
            'total_cost' => $totalCost,
            'special_instructions' => $data['special_instructions'] ?? null,
        ]);

        $order->items()->createMany($orderItems);
        AuditLog::record('create', 'catering_order', ['order_id' => $order->id]);

        return response()->json(['data' => $order->load('items.menu')], 201);
    }

    public function updateOrderStatus(Request $request, CateringOrder $order): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:pending,confirmed,delivered,cancelled'],
        ]);

        $order->update($data);

        return response()->json(['data' => $order->fresh(), 'message' => 'Order status updated.']);
    }

    public function monthlyCost(): JsonResponse
    {
        $data = CateringOrder::selectRaw('MONTH(created_at) as month, YEAR(created_at) as year, SUM(total_cost) as total')
            ->where('status', 'confirmed')
            ->whereYear('created_at', now()->year)
            ->groupByRaw('MONTH(created_at), YEAR(created_at)')
            ->orderBy('month')
            ->get();

        return response()->json(['data' => $data]);
    }
}
