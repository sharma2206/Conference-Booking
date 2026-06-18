import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useNavigate } from 'react-router-dom';
import { useCalendarBookings } from '../../hooks/useBookings';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatTime } from '../../lib/utils';
import { Button } from '../../components/ui/Button';

const statusColors = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#9ca3af',
  completed: '#6366f1',
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState({});
  const [eventModal, setEventModal] = useState(null);

  const { data: bookings = [], isLoading } = useCalendarBookings(range);

  const events = (Array.isArray(bookings) ? bookings : []).map(b => ({
    id: String(b.id),
    title: b.title,
    start: `${b.booking_date}T${b.start_time}`,
    end: `${b.booking_date}T${b.end_time}`,
    backgroundColor: statusColors[b.status] || '#6366f1',
    borderColor: statusColors[b.status] || '#6366f1',
    extendedProps: b,
  }));

  const handleEventClick = ({ event }) => {
    setEventModal(event.extendedProps);
  };

  const handleDatesSet = ({ startStr, endStr }) => {
    setRange({ start: startStr.split('T')[0], end: endStr.split('T')[0] });
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Booking Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">View all bookings by date</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {Object.entries(statusColors).map(([s, c]) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
              <span className="capitalize text-gray-600 dark:text-slate-300">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          eventClick={handleEventClick}
          datesSet={handleDatesSet}
          height="auto"
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false, hour12: false }}
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
        />
      </div>

      <Modal
        isOpen={!!eventModal}
        onClose={() => setEventModal(null)}
        title="Booking Details"
        size="sm"
      >
        {eventModal && (
          <div className="p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Title</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{eventModal.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Hall</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300">{eventModal.hall?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Status</p>
                  <Badge variant={{ pending: 'warning', approved: 'success', rejected: 'danger' }[eventModal.status] || 'default'}>
                    {eventModal.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Date</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300">{eventModal.booking_date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 uppercase font-semibold mb-0.5">Time</p>
                  <p className="text-sm text-gray-700 dark:text-slate-300">{formatTime(eventModal.start_time)} – {formatTime(eventModal.end_time)}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => { navigate(`/bookings/${eventModal.id}`); setEventModal(null); }}
              className="w-full py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              View Full Details
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
