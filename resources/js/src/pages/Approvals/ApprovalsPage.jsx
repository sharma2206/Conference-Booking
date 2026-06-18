import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Eye, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { usePendingApprovals, useApproveBooking, useRejectBooking } from '../../hooks/useBookings';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatTime } from '../../lib/utils';

export default function ApprovalsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading, refetch } = usePendingApprovals({ page });
  const approvals = data?.data || [];
  const meta = data?.meta;

  const approveMutation = useApproveBooking({
    onSuccess: () => { toast.success('Booking approved'); refetch(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Approval failed'),
  });

  const rejectMutation = useRejectBooking({
    onSuccess: () => { toast.success('Booking rejected'); setRejectModal(null); setRejectReason(''); refetch(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Rejection failed'),
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pending Approvals</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and action booking requests</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>Booking</Th>
              <Th>Hall</Th>
              <Th>Date & Time</Th>
              <Th>Requestor</Th>
              <Th>Department</Th>
              <Th>Step</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : approvals.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No pending approvals" description="All bookings are reviewed" />
            ) : approvals.map(b => (
              <Tr key={b.id}>
                <Td>
                  <p className="font-medium text-gray-900">{b.title}</p>
                  <p className="text-xs font-mono text-gray-400">{b.booking_number}</p>
                </Td>
                <Td>{b.hall?.name || '—'}</Td>
                <Td>
                  <p className="text-sm">{formatDate(b.booking_date)}</p>
                  <p className="text-xs text-gray-400">{formatTime(b.start_time)} – {formatTime(b.end_time)}</p>
                </Td>
                <Td>{b.user?.name || '—'}</Td>
                <Td>{b.department?.name || '—'}</Td>
                <Td>
                  <Badge variant="warning">Step {b.current_approval_step || 1}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/bookings/${b.id}`)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => approveMutation.mutate({ id: b.id, data: {} })}
                      disabled={approveMutation.isPending}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                      title="Approve"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setRejectModal(b); setRejectReason(''); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Reject"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Booking" size="sm">
        {rejectModal && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Rejecting: <span className="font-medium">{rejectModal.title}</span>
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)…"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="sm"
                loading={rejectMutation.isPending}
                disabled={!rejectReason.trim()}
                onClick={() => rejectMutation.mutate({ id: rejectModal.id, data: { reason: rejectReason } })}
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
