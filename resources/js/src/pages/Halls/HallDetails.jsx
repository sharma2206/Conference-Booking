import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Users, MapPin, Building, Clock } from 'lucide-react';
import { useHall } from '../../hooks/useHalls';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

const statusVariant = { active: 'success', inactive: 'default', maintenance: 'warning' };

function DetailItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
    </div>
  );
}

export default function HallDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { data: hall, isLoading, isError } = useHall(id);

  if (isLoading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  if (isError || !hall) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-red-500">Unable to load hall details.</p>
    </div>
  );

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{hall.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5 font-mono">{hall.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant[hall.status] || 'default'}>{hall.status}</Badge>
          {hasPermission('hall.edit') && (
            <Button size="sm" onClick={() => navigate(`/halls/${id}/edit`)}>
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader><CardTitle>Hall Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <DetailItem label="Capacity" value={`${hall.capacity} persons`} />
              <DetailItem label="Location" value={hall.location} />
              <DetailItem label="Building" value={hall.building} />
              <DetailItem label="Floor" value={hall.floor} />
              <DetailItem label="Hourly Rate" value={hall.hourly_rate ? `₹${hall.hourly_rate}` : 'Free'} />
              <DetailItem label="Created" value={hall.created_at ? new Date(hall.created_at).toLocaleDateString() : '—'} />
            </CardContent>
          </Card>

          {hall.description && (
            <Card>
              <CardHeader><CardTitle>Description</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">{hall.description}</p>
              </CardContent>
            </Card>
          )}

          {hall.amenities?.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Amenities</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {hall.amenities.map(a => (
                    <span key={a} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{a}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Capacity</p>
                  <p className="text-sm font-semibold text-gray-900">{hall.capacity} persons</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-semibold text-gray-900">{hall.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Building className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Building</p>
                  <p className="text-sm font-semibold text-gray-900">{hall.building || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rate</p>
                  <p className="text-sm font-semibold text-gray-900">{hall.hourly_rate ? `₹${hall.hourly_rate}/hr` : 'Free'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
