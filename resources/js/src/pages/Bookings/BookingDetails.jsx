import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, CheckCircle2, XCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBooking, useApproveBooking, useRejectBooking, useCancelBooking } from '../../hooks/useBookings';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { formatDate, formatTime } from '../../lib/utils';

const statusVariant = {
  pending: 'warning', approved: 'success', rejected: 'danger',
  cancelled: 'default', completed: 'info',
};

function DetailItem({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-gray-800 dark:text-slate-200 font-medium">{value || '—'}</p>
    </div>
  );
}

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission, hasAnyRole } = useAuth();
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelModal, setCancelModal] = useState(false);

  const { data: booking, isLoading, refetch } = useBooking(id);

  const approveMutation = useApproveBooking({
    onSuccess: () => { toast.success('Booking approved'); refetch(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Approval failed'),
  });

  const rejectMutation = useRejectBooking({
    onSuccess: () => { toast.success('Booking rejected'); setRejectModal(false); refetch(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Rejection failed'),
  });

  const cancelMutation = useCancelBooking({
    onSuccess: () => { toast.success('Booking cancelled'); setCancelModal(false); refetch(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Cancel failed'),
  });

  const canApprove = hasPermission('booking.approve');
  const canEdit = booking?.status === 'pending' && hasPermission('booking.edit');
  const canCancel = ['pending', 'approved'].includes(booking?.status) && hasPermission('booking.cancel');

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400 dark:text-slate-500">Loading…</div>;
  if (!booking) return <div className="flex items-center justify-center h-64"><p className="text-red-500">Booking not found.</p></div>;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{booking.title}</h1>
            <p className="text-sm text-gray-500 mt-0.5 font-mono">{booking.booking_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[booking.status] || 'default'}>{booking.status}</Badge>
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/bookings/${id}/edit`)}>
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
          {canApprove && booking.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="success"
                loading={approveMutation.isPending}
                onClick={() => approveMutation.mutate({ id, data: {} })}
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => setRejectModal(true)}>
                <XCircle className="h-3.5 w-3.5" /> Reject
              </Button>
            </>
          )}
          {canCancel && (
            <Button size="sm" variant="danger" onClick={() => setCancelModal(true)}>
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader><CardTitle>Booking Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <DetailItem label="Hall" value={booking.hall?.name} />
              <DetailItem label="Date" value={formatDate(booking.booking_date)} />
              <DetailItem label="Time" value={`${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`} />
              <DetailItem label="Department" value={booking.department?.name} />
              <DetailItem label="Participants" value={booking.participant_count} />
              <DetailItem label="Organizer" value={booking.organizer_name} />
              <DetailItem label="Organizer Phone" value={booking.organizer_phone} />
              <DetailItem label="Booked By" value={booking.user?.name} />
              <DetailItem label="Created" value={booking.created_at ? formatDate(booking.created_at) : '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Purpose & Agenda</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Purpose</p>
                <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{booking.purpose}</p>
              </div>
              {booking.agenda && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Agenda</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{booking.agenda}</p>
                </div>
              )}
              {booking.remarks && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">Remarks</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300">{booking.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Approval Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {booking.approvals?.length > 0 ? (
                booking.approvals.map(approval => (
                  <div key={approval.id} className="border border-gray-100 dark:border-slate-700 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">Step {approval.step_level}</span>
                      <Badge variant={statusVariant[approval.status] || 'default'}>{approval.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{approval.role_name}</p>
                    {approval.approver?.name && (
                      <p className="text-xs text-gray-700 dark:text-slate-300 mt-0.5">By: {approval.approver.name}</p>
                    )}
                    {approval.remarks && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 italic">"{approval.remarks}"</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 dark:text-slate-500">No approval records yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Reject Booking" size="sm">
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-300">Provide a reason for rejection:</p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection…"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRejectModal(false)}>Cancel</Button>
            <Button
              variant="danger"
              size="sm"
              loading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
              onClick={() => rejectMutation.mutate({ id, data: { reason: rejectReason } })}
            >
              Reject Booking
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        onConfirm={() => cancelMutation.mutate(id)}
        loading={cancelMutation.isPending}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking?"
        confirmText="Cancel Booking"
        variant="danger"
      />
    </div>
  );
}
