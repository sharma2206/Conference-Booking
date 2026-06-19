import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Building2, CalendarDays, Clock, CheckCircle2, XCircle, CalendarCheck,
  TrendingUp, Users, UtensilsCrossed, Package, Bell, ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { StatsCard } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { formatDate, formatTime } from '../../lib/utils';

// ─── data hooks ────────────────────────────────────────────────────────────────
function useDashboardData() {
  const opts = { staleTime: 60_000 };
  return {
    summary:     useQuery({ queryKey: ['dashboard-summary'],     queryFn: () => api.get(API.DASHBOARD_SUMMARY).then(r => r.data.data),                                        ...opts }),
    trends:      useQuery({ queryKey: ['dashboard-trends'],      queryFn: () => api.get(API.DASHBOARD_BOOKING_TRENDS).then(r => r.data.data),                                 ...opts }),
    utilization: useQuery({ queryKey: ['dashboard-utilization'], queryFn: () => api.get(API.DASHBOARD_HALL_UTILIZATION).then(r => r.data.data),                               ...opts }),
    upcoming:    useQuery({ queryKey: ['dashboard-upcoming'],    queryFn: () => api.get(API.DASHBOARD_UPCOMING).then(r => r.data.data),                                       ...opts }),
    deptUsage:   useQuery({ queryKey: ['dashboard-dept'],        queryFn: () => api.get(API.DASHBOARD_DEPARTMENT_USAGE).then(r => r.data.data),                               ...opts }),
    visitors:    useQuery({ queryKey: ['dashboard-visitors'],    queryFn: () => api.get('/visitors').then(r => r.data.data || []).catch(() => []),                             ...opts }),
    catering:    useQuery({ queryKey: ['dashboard-catering'],    queryFn: () => api.get('/catering/orders').then(r => r.data.data || []).catch(() => []),                     ...opts }),
    resources:   useQuery({ queryKey: ['dashboard-resources'],   queryFn: () => api.get('/resources').then(r => r.data.data || []).catch(() => []),                           ...opts }),
    notifications: useQuery({ queryKey: ['dashboard-notifications'], queryFn: () => api.get('/notifications').then(r => r.data.data || []).catch(() => []),                   ...opts }),
  };
}

// ─── shared chart theme ─────────────────────────────────────────────────────────
function useChartTheme() {
  const { isDark } = useTheme();
  return {
    isDark,
    gridColor: isDark ? '#1e293b' : '#f1f5f9',
    tickColor: isDark ? '#64748b' : '#9ca3af',
    tipStyle: {
      fontSize: 12, borderRadius: 8,
      background: isDark ? '#1e293b' : '#fff',
      border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
      color: isDark ? '#f1f5f9' : '#111827',
    },
  };
}

const STATUS_BADGE = { pending: 'warning', approved: 'success', rejected: 'danger', cancelled: 'default', completed: 'info' };
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function ChartLoader() {
  return <div className="h-52 flex items-center justify-center"><Skeleton className="w-full h-full rounded-lg" /></div>;
}

function WidgetShell({ title, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 h-full ${className}`}>
      {title && <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      {children}
    </div>
  );
}

// ─── individual widgets ──────────────────────────────────────────────────────────
function QuickStatsWidget({ data }) {
  const s = data?.summary?.data ?? {};
  const isLoading = data?.summary?.isLoading;
  const stats = [
    { title: 'Total Halls',       value: s.total_halls       ?? 0, icon: Building2,    color: 'blue' },
    { title: 'Total Bookings',    value: s.total_bookings    ?? 0, icon: CalendarDays,  color: 'purple' },
    { title: "Today's Meetings",  value: s.today_meetings    ?? s.todays_meetings ?? 0, icon: CalendarCheck, color: 'green' },
    { title: 'Pending Approvals', value: s.pending_approvals ?? 0, icon: Clock,         color: 'yellow' },
    { title: 'Approved',          value: s.approved_bookings_month ?? s.approved_bookings ?? 0, icon: CheckCircle2, color: 'green' },
    { title: 'Rejected',          value: s.rejected_bookings ?? 0, icon: XCircle,       color: 'red' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
      {isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 animate-pulse">
              <Skeleton className="h-3.5 w-1/2 mb-2" /><Skeleton className="h-7 w-1/3" />
            </div>
          ))
        : stats.map(stat => <StatsCard key={stat.title} {...stat} />)
      }
    </div>
  );
}

function RevenueChartWidget({ data }) {
  const { gridColor, tickColor, tipStyle } = useChartTheme();
  const { isDark } = useTheme();
  const trends = data?.trends;
  return (
    <WidgetShell title="Revenue / Booking Trends">
      {trends?.isLoading ? <ChartLoader /> : (
        <ResponsiveContainer width="100%" height={208}>
          <AreaChart data={trends?.data ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} />
            <Tooltip contentStyle={tipStyle} />
            <Area type="monotone" dataKey="total" name="Bookings" stroke="#3b82f6" fill={isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff'} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </WidgetShell>
  );
}

function BookingsChartWidget({ data }) {
  const { gridColor, tickColor, tipStyle } = useChartTheme();
  const trends = data?.trends;
  return (
    <WidgetShell title="Bookings Chart">
      {trends?.isLoading ? <ChartLoader /> : (
        <ResponsiveContainer width="100%" height={208}>
          <BarChart data={trends?.data ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} />
            <Tooltip contentStyle={tipStyle} />
            <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[4,4,0,0]} stackId="a" />
            <Bar dataKey="pending"  name="Pending"  fill="#f59e0b" radius={[4,4,0,0]} stackId="a" />
            <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4,4,0,0]} stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </WidgetShell>
  );
}

function HallUsageWidget({ data }) {
  const { gridColor, tickColor, tipStyle } = useChartTheme();
  const utilization = data?.utilization;
  const chartData = (utilization?.data ?? []).map(h => ({ hall: h.name, bookings: h.total_bookings || 0 }));
  return (
    <WidgetShell title="Hall Utilization">
      {utilization?.isLoading ? <ChartLoader /> : (
        <ResponsiveContainer width="100%" height={208}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="hall" tick={{ fontSize: 10, fill: tickColor }} />
            <YAxis tick={{ fontSize: 11, fill: tickColor }} />
            <Tooltip contentStyle={tipStyle} />
            <Bar dataKey="bookings" name="Bookings" fill="#6366f1" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </WidgetShell>
  );
}

function UpcomingBookingsWidget({ data }) {
  const upcoming = data?.upcoming;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Upcoming Bookings</h3>
        <Link to="/bookings" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all →</Link>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-slate-700/50 flex-1 overflow-y-auto">
        {upcoming?.isLoading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="flex items-center justify-between animate-pulse"><div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-2/3" /></div><Skeleton className="h-5 w-16 rounded-full" /></div>)}
          </div>
        ) : !upcoming?.data?.length ? (
          <p className="py-10 text-center text-sm text-gray-400 dark:text-slate-500">No upcoming bookings</p>
        ) : (
          upcoming.data.slice(0, 6).map(b => (
            <Link key={b.id} to={`/bookings/${b.id}`} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.title || b.hall?.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                  {b.hall?.name} · {formatDate(b.booking_date)} · {formatTime(b.start_time)}
                </p>
              </div>
              <Badge variant={STATUS_BADGE[b.status] ?? 'default'} className="ml-3 flex-shrink-0">{b.status}</Badge>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function VisitorStatsWidget({ data }) {
  const { tipStyle } = useChartTheme();
  const visitors = data?.visitors;
  const counts = useMemo(() => {
    const arr = visitors?.data ?? [];
    return [
      { name: 'Expected', value: arr.filter(v => v.status === 'expected').length },
      { name: 'Checked In', value: arr.filter(v => v.status === 'checked_in').length },
      { name: 'Checked Out', value: arr.filter(v => v.status === 'checked_out').length },
    ];
  }, [visitors?.data]);
  return (
    <WidgetShell title="Visitor Stats">
      {visitors?.isLoading ? <ChartLoader /> : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{(visitors?.data ?? []).length}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Total Visitors</p>
            </div>
          </div>
          <div className="space-y-2">
            {counts.map(({ name, value }) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-slate-400">{name}</span>
                <span className="font-medium text-gray-900 dark:text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}

function CateringOrdersWidget({ data }) {
  const catering = data?.catering;
  const orders = catering?.data ?? [];
  const total = orders.reduce((s, o) => s + (parseFloat(o.total_cost) || 0), 0);
  return (
    <WidgetShell title="Catering Orders">
      {catering?.isLoading ? <ChartLoader /> : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-8 w-8 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{orders.length}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Total Orders</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {['pending','confirmed','cancelled'].map(status => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="capitalize text-gray-500 dark:text-slate-400">{status}</span>
                <span className="font-medium text-gray-900 dark:text-white">{orders.filter(o => o.status === status).length}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-100 dark:border-slate-700">
              <span className="text-gray-500 dark:text-slate-400">Total Cost</span>
              <span className="font-semibold text-green-600 dark:text-green-400">₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  );
}

function ResourceStatusWidget({ data }) {
  const resources = data?.resources;
  const items = resources?.data ?? [];
  return (
    <WidgetShell title="Resource Status">
      {resources?.isLoading ? <ChartLoader /> : (
        <div className="space-y-2 overflow-y-auto max-h-48">
          {!items.length ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">No resources</p>
          ) : items.slice(0, 6).map(r => (
            <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 dark:border-slate-700/50 last:border-0">
              <div className="flex items-center gap-2 min-w-0">
                <Package className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate text-gray-700 dark:text-slate-200">{r.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-gray-400 text-xs">{r.available_quantity ?? r.quantity ?? 0} avail</span>
                <Badge variant={r.status === 'available' ? 'success' : 'warning'} className="text-[10px]">{r.status || 'active'}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function CalendarMiniWidget() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  return (
    <WidgetShell title={`${months[month]} ${year}`}>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {days.map(d => <div key={d} className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 pb-1">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today.getDate();
          return (
            <div key={day} className={`text-xs rounded-full w-6 h-6 flex items-center justify-center mx-auto ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
              {day}
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}

function NotificationsFeedWidget({ data }) {
  const notifications = data?.notifications;
  const items = (notifications?.data ?? []).slice(0, 6);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm h-full flex flex-col">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
        <Bell className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
      </div>
      <div className="flex-1 divide-y divide-gray-50 dark:divide-slate-700/50 overflow-y-auto">
        {notifications?.isLoading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : !items.length ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">No notifications</p>
        ) : items.map((n, i) => (
          <div key={n.id || i} className="px-4 py-3">
            <p className="text-xs font-medium text-gray-700 dark:text-slate-200 truncate">{n.data?.title || n.title || 'Notification'}</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 truncate">{n.data?.body || n.body || ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeptUsageWidget({ data }) {
  const { gridColor, tickColor, tipStyle } = useChartTheme();
  const deptUsage = data?.deptUsage;
  const chartData = (deptUsage?.data ?? []).map(d => ({ department: d.department?.name || d.department_id, bookings: d.total_bookings }));
  return (
    <WidgetShell title="Bookings by Department">
      {deptUsage?.isLoading ? <ChartLoader /> : !chartData.length ? (
        <div className="h-52 flex items-center justify-center text-sm text-gray-400 dark:text-slate-500">No data</div>
      ) : (
        <ResponsiveContainer width="100%" height={208}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} />
            <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: tickColor }} width={60} />
            <Tooltip contentStyle={tipStyle} />
            <Bar dataKey="bookings" name="Bookings" fill="#10b981" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </WidgetShell>
  );
}

// ─── widget registry ─────────────────────────────────────────────────────────────
const WIDGET_MAP = {
  quick_stats:        QuickStatsWidget,
  revenue_chart:      RevenueChartWidget,
  bookings_chart:     BookingsChartWidget,
  hall_usage:         HallUsageWidget,
  upcoming_bookings:  UpcomingBookingsWidget,
  visitor_stats:      VisitorStatsWidget,
  catering_orders:    CateringOrdersWidget,
  resource_status:    ResourceStatusWidget,
  calendar_mini:      CalendarMiniWidget,
  notifications_feed: NotificationsFeedWidget,
  dept_usage:         DeptUsageWidget,
};

// ─── default layout (used when no custom layout saved) ──────────────────────────
const DEFAULT_LAYOUT = [
  { id: 'qs', type: 'quick_stats',       w: 12, h: 1 },
  { id: 'rc', type: 'revenue_chart',     w: 6,  h: 2 },
  { id: 'bc', type: 'bookings_chart',    w: 6,  h: 2 },
  { id: 'ub', type: 'upcoming_bookings', w: 6,  h: 2 },
  { id: 'du', type: 'dept_usage',        w: 6,  h: 2 },
];

// ─── role → layout role key ───────────────────────────────────────────────────
function getRoleKey(user) {
  if (!user?.roles) return 'employee';
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const names = roles.map(r => (typeof r === 'string' ? r : r.name));
  if (names.includes('super-admin'))      return 'super-admin';
  if (names.includes('admin'))            return 'admin';
  if (names.includes('facility-manager')) return 'facility-manager';
  if (names.includes('department-head'))  return 'department-head';
  return 'employee';
}

// ─── dynamic layout grid ─────────────────────────────────────────────────────────
function DynamicGrid({ layout, dashData }) {
  // quick_stats spans full width always — render outside grid
  const quickStats = layout.find(w => w.type === 'quick_stats');
  const rest       = layout.filter(w => w.type !== 'quick_stats');

  return (
    <div className="space-y-4">
      {quickStats && <QuickStatsWidget data={dashData} />}
      <div className="grid grid-cols-12 gap-4">
        {rest.map(widget => {
          const Widget = WIDGET_MAP[widget.type];
          if (!Widget) return null;
          const span = Math.min(Math.max(widget.w || 6, 2), 12);
          return (
            <div key={widget.id} style={{ gridColumn: `span ${span}` }} className="min-h-[220px]">
              <Widget data={dashData} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const roleKey  = getRoleKey(user);
  const dashData = useDashboardData();

  // Fetch the saved layout for this user's role
  const { data: layoutData } = useQuery({
    queryKey: ['dashboard-layout-user', roleKey],
    queryFn: () =>
      api.get(`/dashboard/layouts?role=${roleKey}`)
        .then(r => {
          const d = r.data.data || r.data;
          if (Array.isArray(d) && d.length > 0) return d;
          if (d?.layout && Array.isArray(d.layout) && d.layout.length > 0) return d.layout;
          return null;
        })
        .catch(() => null),
    staleTime: 30_000,
  });

  const layout = layoutData ?? DEFAULT_LAYOUT;

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Overview of conference bookings and activity</p>
      </div>
      <DynamicGrid layout={layout} dashData={dashData} />
    </div>
  );
}
