import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, CalendarDays, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBookings, useCancelBooking } from '../../hooks/useBookings';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState } from '../../components/ui/Table';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { ConfirmModal } from '../../components/ui/Modal';
import { formatDate, formatTime } from '../../lib/utils';

const statusVariant = {
  pending: 'warning', approved: 'success', rejected: 'danger',
  cancelled: 'default', completed: 'info',
};

export default function BookingList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  // UX-11a: pre-fill search from URL ?search= param (set by global search)
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [status, setStatus] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);

  const { data, isLoading } = useBookings({ page, search, status, per_page: 15 });
  const bookings = data?.data ?? [];
  const meta = data?.meta;

  const cancelMutation = useCancelBooking({
    onSuccess: () => { toast.success('Booking cancelled'); setCancelTarget(null); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cannot cancel booking'),
  });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage conference hall bookings</p>
        </div>
        {hasPermission('booking.create') && (
          <Button onClick={() => navigate('/bookings/new')}>
            <Plus className="h-4 w-4" /> New Booking
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search bookings…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>Booking #</Th>
              <Th>Title</Th>
              <Th>Hall</Th>
              <Th>Date & Time</Th>
              <Th>Booked By</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <SkeletonTable rows={8} cols={7} />
            ) : bookings.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No bookings found" description="Create your first booking" />
            ) : bookings.map(b => (
              <Tr key={b.id} onClick={() => navigate(`/bookings/${b.id}`)}>
                <Td>
                  <span className="font-mono text-xs text-gray-500 dark:text-slate-400">
                    {b.booking_number || `#${b.id}`}
                  </span>
                </Td>
                <Td>
                  <p className="font-medium text-gray-900 dark:text-white">{b.title}</p>
                  {b.department?.name && (
                    <p className="text-xs text-gray-400 dark:text-slate-500">{b.department.name}</p>
                  )}
                </Td>
                <Td className="dark:text-slate-300">{b.hall?.name || '—'}</Td>
                <Td>
                  <p className="text-sm dark:text-slate-300">{formatDate(b.booking_date)}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {formatTime(b.start_time)} – {formatTime(b.end_time)}
                  </p>
                </Td>
                <Td className="dark:text-slate-300">{b.user?.name || '—'}</Td>
                <Td>
                  <Badge variant={statusVariant[b.status] ?? 'default'}>{b.status}</Badge>
                </Td>
                <Td className="text-right">
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/bookings/${b.id}`); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    aria-label={`View booking ${b.title}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <ConfirmModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelMutation.mutate(cancelTarget?.id)}
        loading={cancelMutation.isPending}
        title="Cancel Booking"
        message={`Cancel booking "${cancelTarget?.title}"? This action cannot be undone.`}
        confirmText="Cancel Booking"
        variant="danger"
      />
    </div>
  );
}
