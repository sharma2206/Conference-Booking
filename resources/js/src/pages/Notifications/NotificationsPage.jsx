import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Table';
import { cn, formatDate } from '../../lib/utils';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications-page', page],
    queryFn: () => api.get(API.NOTIFICATIONS, { params: { page, per_page: 20 } }).then(r => r.data),
  });
  const notifications = data?.data || [];
  const meta = data?.meta;

  const markReadMutation = useMutation({
    mutationFn: () => api.post(API.NOTIFICATIONS_MARK_READ).then(r => r.data),
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['notifications-page'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(API.NOTIFICATION(id)).then(r => r.data),
    onSuccess: () => { refetch(); },
    onError: () => toast.error('Delete failed'),
  });

  const unread = notifications.filter(n => !n.read_at).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{unread > 0 ? `${unread} unread` : 'All caught up'}</p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markReadMutation.mutate()} loading={markReadMutation.isPending}>
            <Check className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-50">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : notifications.map(n => (
          <div
            key={n.id}
            className={cn(
              'flex items-start gap-4 px-5 py-4 hover:bg-gray-50/70 transition-colors',
              !n.read_at && 'bg-blue-50/40'
            )}
          >
            <div className={cn(
              'mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0',
              !n.read_at ? 'bg-blue-500' : 'bg-gray-200'
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {n.data?.title || 'Notification'}
              </p>
              <p className="text-sm text-gray-600 mt-0.5 leading-snug">
                {n.data?.message}
              </p>
              <p className="text-xs text-gray-400 mt-1.5">
                {formatDate(n.created_at)} · {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => deleteMutation.mutate(n.id)}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Pagination meta={meta} onPageChange={setPage} />
      </div>
    </div>
  );
}
