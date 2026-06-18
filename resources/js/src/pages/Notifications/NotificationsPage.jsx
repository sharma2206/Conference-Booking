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
  const notifications = data?.data ?? [];
  const meta = data?.meta;

  const markReadMutation = useMutation({
    mutationFn: () => api.post(API.NOTIFICATIONS_MARK_READ),
    onSuccess: () => {
      toast.success('All marked as read');
      qc.invalidateQueries({ queryKey: ['notifications-page'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(API.NOTIFICATION(id)),
    onSuccess: () => refetch(),
    onError: () => toast.error('Delete failed'),
  });

  const unread = notifications.filter(n => !n.read_at).length;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markReadMutation.mutate()}
            loading={markReadMutation.isPending}
          >
            <Check className="h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm divide-y divide-gray-50 dark:divide-slate-700/50">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-slate-500">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
              <Bell className="h-7 w-7 text-gray-400 dark:text-slate-400" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">No notifications</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">You're all caught up!</p>
          </div>
        ) : notifications.map(n => (
          <div
            key={n.id}
            className={cn(
              'flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors',
              !n.read_at && 'bg-blue-50/40 dark:bg-blue-900/10',
            )}
          >
            <div
              className={cn(
                'mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0',
                !n.read_at ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-600',
              )}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {n.data?.title || 'Notification'}
              </p>
              <p className="text-sm text-gray-600 dark:text-slate-300 mt-0.5 leading-snug">
                {n.data?.message}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                {formatDate(n.created_at)}
                {' · '}
                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => deleteMutation.mutate(n.id)}
              className="p-1.5 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
              aria-label="Delete notification"
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
