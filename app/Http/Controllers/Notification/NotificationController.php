<?php

namespace App\Http\Controllers\Notification;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        $notifications = $user->notifications()
            ->when($request->unread_only, fn($q) => $q->whereNull('read_at'))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20);

        return response()->json($notifications);
    }

    public function unreadCount(): JsonResponse
    {
        return response()->json([
            'count' => auth('api')->user()->unreadNotifications()->count(),
        ]);
    }

    public function markRead(Request $request): JsonResponse
    {
        $user = auth('api')->user();

        if ($request->notification_id) {
            $user->notifications()->where('id', $request->notification_id)->update(['read_at' => now()]);
        } else {
            $user->unreadNotifications->markAsRead();
        }

        return response()->json(['message' => 'Notifications marked as read.']);
    }

    public function destroy(string $id): JsonResponse
    {
        auth('api')->user()->notifications()->where('id', $id)->delete();

        return response()->json(['message' => 'Notification deleted.']);
    }

    public function destroyAll(): JsonResponse
    {
        auth('api')->user()->notifications()->delete();

        return response()->json(['message' => 'All notifications deleted.']);
    }
}
