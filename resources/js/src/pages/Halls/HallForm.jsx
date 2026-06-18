import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useHall, useCreateHall, useUpdateHall } from '../../hooks/useHalls';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(2, 'Code is required'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  location: z.string().min(2, 'Location is required'),
  building: z.string().optional(),
  floor: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']),
  hourly_rate: z.coerce.number().min(0).optional(),
});

export default function HallForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [amenities, setAmenities] = useState([]);
  const [amenityInput, setAmenityInput] = useState('');

  const { data: hall, isLoading: hallLoading } = useHall(id, { enabled: isEdit });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active', hourly_rate: 0 },
  });

  useEffect(() => {
    if (hall) {
      reset({
        name: hall.name,
        code: hall.code,
        capacity: hall.capacity,
        location: hall.location,
        building: hall.building || '',
        floor: hall.floor || '',
        description: hall.description || '',
        status: hall.status || 'active',
        hourly_rate: hall.hourly_rate || 0,
      });
      if (hall.amenities) {
        setAmenities(Array.isArray(hall.amenities) ? hall.amenities : []);
      }
    }
  }, [hall, reset]);

  const createMutation = useCreateHall({
    onSuccess: () => { toast.success('Hall created'); navigate('/halls'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Create failed'),
  });

  const updateMutation = useUpdateHall({
    onSuccess: () => { toast.success('Hall updated'); navigate(`/halls/${id}`); },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  });

  const onSubmit = (data) => {
    const payload = { ...data, amenities };
    if (isEdit) {
      updateMutation.mutate({ id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const addAmenity = () => {
    const v = amenityInput.trim();
    if (v && !amenities.includes(v)) {
      setAmenities(prev => [...prev, v]);
      setAmenityInput('');
    }
  };

  const removeAmenity = (a) => setAmenities(prev => prev.filter(x => x !== a));

  if (isEdit && hallLoading) {
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
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Hall' : 'Create New Hall'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEdit ? 'Update conference hall details' : 'Add a new conference hall'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 space-y-5">
            <Card>
              <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Input
                  label="Hall Name"
                  required
                  placeholder="e.g. Executive Board Room"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label="Hall Code"
                  required
                  placeholder="e.g. HALL-001"
                  error={errors.code?.message}
                  {...register('code')}
                />
                <Input
                  label="Capacity (persons)"
                  required
                  type="number"
                  min={1}
                  placeholder="40"
                  error={errors.capacity?.message}
                  {...register('capacity')}
                />
                <Input
                  label="Hourly Rate (₹)"
                  type="number"
                  min={0}
                  placeholder="0"
                  error={errors.hourly_rate?.message}
                  {...register('hourly_rate')}
                />
                <Input
                  label="Location"
                  required
                  placeholder="Tower A, Ground Floor"
                  error={errors.location?.message}
                  {...register('location')}
                />
                <Input
                  label="Building"
                  placeholder="Main Building"
                  {...register('building')}
                />
                <Input
                  label="Floor"
                  placeholder="5th Floor"
                  {...register('floor')}
                />
                <Select
                  label="Status"
                  required
                  error={errors.status?.message}
                  {...register('status')}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Under Maintenance</option>
                </Select>
                <div className="col-span-2">
                  <Textarea
                    label="Description"
                    placeholder="Brief description of the hall, its purpose, and features…"
                    rows={3}
                    {...register('description')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={amenityInput}
                    onChange={e => setAmenityInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                    placeholder="Add amenity…"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {amenities.length === 0 && (
                    <p className="text-sm text-gray-400">No amenities added</p>
                  )}
                  {amenities.map(a => (
                    <span key={a} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {a}
                      <button type="button" onClick={() => removeAmenity(a)}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" loading={isSaving} className="w-full justify-center">
                {isEdit ? 'Update Hall' : 'Create Hall'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="w-full justify-center">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
