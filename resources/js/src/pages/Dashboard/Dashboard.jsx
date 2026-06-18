import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Building2, CalendarDays, Clock, CheckCircle2, XCircle, CalendarCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { StatsCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDate, formatTime } from '../../lib/utils';

function useDashboard() {
  const opts = { staleTime: 60_000 };
  const summary     = useQuery({ queryKey: ['dashboard-summary'],     queryFn: () => api.get(API.DASHBOARD_SUMMARY).then(r => r.data.data),           ...opts });
  const trends      = useQuery({ queryKey: ['dashboard-trends'],      queryFn: () => api.get(API.DASHBOARD_BOOKING_TRENDS).then(r => r.data.data),    ...opts });
  const utilization = useQuery({ queryKey: ['dashboard-utilization'], queryFn: () => api.get(API.DASHBOARD_HALL_UTILIZATION).then(r => r.data.data),  ...opts });
  const upcoming    = useQuery({ queryKey: ['dashboard-upcoming'],    queryFn: () => api.get(API.DASHBOARD_UPCOMING).then(r => r.data.data),          ...opts });
  const deptUsage   = useQuery({ queryKey: ['dashboard-dept'],        queryFn: () => api.get(API.DASHBOARD_DEPARTMENT_USAGE).then(r => r.data.data),  ...opts });
  return { summary, trends, utilization, upcoming, deptUsage };
}

const STATUS_BADGE = {
  pending:   'warning',
  approved:  'success',
  rejected:  'danger',
  cancelled: 'default',
  completed: 'info',
};

function ChartLoader() {
  return (
    <div className="h-52 flex items-center justify-center">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  );
}

export default function Dashboard() {
  const { summary, trends, utilization, upcoming, deptUsage } = useDashboard();
  const { isDark } = useTheme();
  const s = summary.data ?? {};

  // Recharts theme values
  const gridColor  = isDark ? '#1e293b' : '#f1f5f9';
  const tickColor  = isDark ? '#64748b' : '#9ca3af';
  const tipStyle   = {
    fontSize: 12,
    borderRadius: 8,
    background: isDark ? '#1e293b' : '#fff',
    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
    color: isDark ? '#f1f5f9' : '#111827',
  };

  const stats = [
    { title: 'Total Halls',       value: s.total_halls      ?? 0, icon: Building2,    color: 'blue' },
    { title: 'Total Bookings',    value: s.total_bookings   ?? 0, icon: CalendarDays,  color: 'purple' },
    { title: "Today's Meetings",  value: s.todays_meetings  ?? 0, icon: CalendarCheck, color: 'green' },
    { title: 'Pending Approvals', value: s.pending_approvals ?? 0, icon: Clock,       color: 'yellow' },
    { title: 'Approved',          value: s.approved_bookings ?? 0, icon: CheckCircle2, color: 'green' },
    { title: 'Rejected',          value: s.rejected_bookings ?? 0, icon: XCircle,     color: 'red' },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Overview of conference bookings and activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {summary.isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 animate-pulse">
                <Skeleton className="h-3.5 w-1/2 mb-2" />
                <Skeleton className="h-7 w-1/3" />
              </div>
            ))
          : stats.map(stat => <StatsCard key={stat.title} {...stat} />)
        }
      </div>

      {/* Charts — top row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Booking trends */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Booking Trends (Last 6 months)</h3>
          {trends.isLoading ? <ChartLoader /> : (
            <ResponsiveContainer width="100%" height={208}>
              <AreaChart data={trends.data ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip contentStyle={tipStyle} />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  name="Bookings"
                  stroke="#3b82f6"
                  fill={isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff'}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Hall utilization */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Hall Utilization</h3>
          {utilization.isLoading ? <ChartLoader /> : (
            <ResponsiveContainer width="100%" height={208}>
              <BarChart data={utilization.data ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="hall" tick={{ fontSize: 10, fill: tickColor }} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="bookings" name="Bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts — bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Upcoming bookings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Upcoming Bookings</h3>
            <Link
              to="/bookings"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {upcoming.isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : !upcoming.data?.length ? (
              <p className="py-10 text-center text-sm text-gray-400 dark:text-slate-500">No upcoming bookings</p>
            ) : (
              upcoming.data.slice(0, 6).map(b => (
                <Link
                  key={b.id}
                  to={`/bookings/${b.id}`}
                  className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.title}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                      {b.hall?.name} · {formatDate(b.booking_date)} · {formatTime(b.start_time)}–{formatTime(b.end_time)}
                    </p>
                  </div>
                  <Badge variant={STATUS_BADGE[b.status] ?? 'default'} className="ml-3 flex-shrink-0">
                    {b.status}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Bookings by department */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bookings by Department</h3>
          {deptUsage.isLoading ? <ChartLoader /> : !deptUsage.data?.length ? (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400 dark:text-slate-500">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={208}>
              <BarChart
                data={deptUsage.data}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: tickColor }} width={60} />
                <Tooltip contentStyle={tipStyle} />
                <Bar dataKey="bookings" name="Bookings" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
