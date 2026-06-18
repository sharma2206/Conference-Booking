import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Building2, CalendarDays, Clock, CheckCircle2,
  XCircle, Users, TrendingUp, CalendarCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { StatsCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { cn, formatDate, formatTime, getStatusColor } from '../../lib/utils';

function useDashboard() {
  const summary = useQuery({ queryKey: ['dashboard-summary'], queryFn: () => api.get(API.DASHBOARD_SUMMARY).then(r => r.data.data) });
  const trends = useQuery({ queryKey: ['dashboard-trends'], queryFn: () => api.get(API.DASHBOARD_BOOKING_TRENDS).then(r => r.data.data) });
  const utilization = useQuery({ queryKey: ['dashboard-utilization'], queryFn: () => api.get(API.DASHBOARD_HALL_UTILIZATION).then(r => r.data.data) });
  const upcoming = useQuery({ queryKey: ['dashboard-upcoming'], queryFn: () => api.get(API.DASHBOARD_UPCOMING).then(r => r.data.data) });
  const deptUsage = useQuery({ queryKey: ['dashboard-dept'], queryFn: () => api.get(API.DASHBOARD_DEPARTMENT_USAGE).then(r => r.data.data) });
  return { summary, trends, utilization, upcoming, deptUsage };
}

const statusBadgeMap = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  cancelled: 'default',
  completed: 'info',
};

export default function Dashboard() {
  const { summary, trends, utilization, upcoming, deptUsage } = useDashboard();
  const s = summary.data || {};

  const stats = [
    { title: 'Total Halls', value: s.total_halls ?? 0, icon: Building2, color: 'blue' },
    { title: 'Total Bookings', value: s.total_bookings ?? 0, icon: CalendarDays, color: 'purple' },
    { title: "Today's Meetings", value: s.todays_meetings ?? 0, icon: CalendarCheck, color: 'green' },
    { title: 'Pending Approvals', value: s.pending_approvals ?? 0, icon: Clock, color: 'yellow' },
    { title: 'Approved', value: s.approved_bookings ?? 0, icon: CheckCircle2, color: 'green' },
    { title: 'Rejected', value: s.rejected_bookings ?? 0, icon: XCircle, color: 'red' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of conference bookings and activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(stat => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Booking trends */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Booking Trends (Last 6 months)</h3>
          {trends.isLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trends.data || []} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="bookings" name="Bookings" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Hall utilization */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Hall Utilization</h3>
          {utilization.isLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={utilization.data || []} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hall" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="bookings" name="Bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming bookings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Upcoming Bookings</h3>
            <Link to="/bookings" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcoming.isLoading ? (
              <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
            ) : !upcoming.data?.length ? (
              <div className="py-8 text-center text-sm text-gray-400">No upcoming bookings</div>
            ) : (
              upcoming.data.slice(0, 5).map(b => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {b.hall?.name} · {formatDate(b.booking_date)} · {formatTime(b.start_time)}–{formatTime(b.end_time)}
                    </p>
                  </div>
                  <Badge variant={statusBadgeMap[b.status] || 'default'}>{b.status}</Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department usage */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Bookings by Department</h3>
          {deptUsage.isLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
          ) : !deptUsage.data?.length ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deptUsage.data} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: '#9ca3af' }} width={60} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="bookings" name="Bookings" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
