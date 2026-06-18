import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBooking, useCreateBooking, useUpdateBooking } from '../../hooks/useBookings';
import { useHalls } from '../../hooks/useHalls';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const schema = z.object({
  title: z.string().min(3, 'Title is required'),
  purpose: z.string().min(5, 'Purpose is required'),
  agenda: z.string().optional(),
  hall_id: z.coerce.number().positive('Select a hall'),
  department_id: z.coerce.number().optional().nullable(),
  booking_date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  participant_count: z.coerce.number().int().min(1, 'At least 1 participant'),
  organizer_name: z.string().optional(),
  organizer_phone: z.string().optional(),
  remarks: z.string().optional(),
});

export default function BookingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: booking, isLoading: bookingLoading } = useBooking(id, { enabled: isEdit });
  const { data: hallsData } = useHalls({ status: 'active', per_page: 100 });
  const halls = hallsData?.data || [];

  const { data: deptsData } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => api.get(API.DEPARTMENTS_ALL).then(r => r.data.data || r.data),
  });
  const departments = deptsData || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (booking) {
      reset({
        title: booking.title,
        purpose: booking.purpose,
        agenda: booking.agenda || '',
        hall_id: booking.hall_id,
        department_id: booking.department_id || null,
        booking_date: booking.booking_date,
        start_time: booking.start_time?.substring(0, 5),
        end_time: booking.end_time?.substring(0, 5),
        participant_count: booking.participant_count,
        organizer_name: booking.organizer_name || '',
        organizer_phone: booking.organizer_phone || '',
        remarks: booking.remarks || '',
      });
    }
  }, [booking, reset]);

  const createMutation = useCreateBooking({
    onSuccess: () => { toast.success('Booking submitted for approval'); navigate('/bookings'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create booking'),
  });

  const updateMutation = useUpdateBooking({
    onSuccess: () => { toast.success('Booking updated'); navigate(`/bookings/${id}`); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to update booking'),
  });

  const onSubmit = (data) => {
    if (isEdit) {
      updateMutation.mutate({ id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEdit && bookingLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Booking' : 'New Booking'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Submit a conference hall booking request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            <Card>
              <CardHeader><CardTitle>Booking Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Meeting Title"
                  required
                  placeholder="e.g. Q4 Budget Review"
                  error={errors.title?.message}
                  {...register('title')}
                />
                <Textarea
                  label="Purpose"
                  required
                  placeholder="Describe the meeting purpose…"
                  rows={2}
                  error={errors.purpose?.message}
                  {...register('purpose')}
                />
                <Textarea
                  label="Agenda"
                  placeholder="Meeting agenda items…"
                  rows={3}
                  {...register('agenda')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Schedule & Venue</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Select
                    label="Conference Hall"
                    required
                    error={errors.hall_id?.message}
                    {...register('hall_id')}
                  >
                    <option value="">Select a hall</option>
                    {halls.map(h => (
                      <option key={h.id} value={h.id}>{h.name} (cap: {h.capacity})</option>
                    ))}
                  </Select>
                </div>
                <Input
                  label="Booking Date"
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  error={errors.booking_date?.message}
                  {...register('booking_date')}
                />
                <Select
                  label="Department"
                  error={errors.department_id?.message}
                  {...register('department_id')}
                >
                  <option value="">Select department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
                <Input
                  label="Start Time"
                  required
                  type="time"
                  error={errors.start_time?.message}
                  {...register('start_time')}
                />
                <Input
                  label="End Time"
                  required
                  type="time"
                  error={errors.end_time?.message}
                  {...register('end_time')}
                />
                <Input
                  label="Number of Participants"
                  required
                  type="number"
                  min={1}
                  placeholder="20"
                  error={errors.participant_count?.message}
                  {...register('participant_count')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Organizer Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Input
                  label="Organizer Name"
                  placeholder="Full name"
                  {...register('organizer_name')}
                />
                <Input
                  label="Organizer Phone"
                  placeholder="+91 98765 43210"
                  {...register('organizer_phone')}
                />
                <div className="col-span-2">
                  <Textarea
                    label="Special Remarks"
                    placeholder="Any special requirements, equipment needs…"
                    rows={2}
                    {...register('remarks')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle>Submission</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your booking will be submitted for approval. You will be notified once it is reviewed.
                </p>
                <Button type="submit" loading={isSaving} className="w-full justify-center">
                  {isEdit ? 'Update Booking' : 'Submit for Approval'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="w-full justify-center">
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
