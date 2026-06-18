import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Download, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useTheme } from '../../contexts/ThemeContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const REPORT_TABS = ['Bookings', 'Hall Utilization', 'Department Wise', 'Monthly'];

export default function ReportsPage() {
  const { isDark } = useTheme();
  const gridColor = isDark ? '#334155' : '#f0f0f0';
  const tickColor = isDark ? '#94a3b8' : '#6b7280';
  const tipStyle = { fontSize: 12, borderRadius: 8, backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e5e7eb', color: isDark ? '#e2e8f0' : '#111827' };

  const [tab, setTab] = useState('Bookings');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [exporting, setExporting] = useState(false);

  const { data: bookingsReport, isLoading: bookingsLoading } = useQuery({
    queryKey: ['report-bookings', dateRange],
    queryFn: () => api.get(API.REPORTS_BOOKINGS, { params: dateRange }).then(r => r.data.data || r.data),
    enabled: tab === 'Bookings',
  });

  const { data: hallsReport, isLoading: hallsLoading } = useQuery({
    queryKey: ['report-halls', dateRange],
    queryFn: () => api.get(API.REPORTS_HALLS, { params: dateRange }).then(r => r.data.data || r.data),
    enabled: tab === 'Hall Utilization',
  });

  const { data: deptReport, isLoading: deptLoading } = useQuery({
    queryKey: ['report-dept', dateRange],
    queryFn: () => api.get(API.REPORTS_DEPARTMENTS, { params: dateRange }).then(r => r.data.data || r.data),
    enabled: tab === 'Department Wise',
  });

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ['report-monthly'],
    queryFn: () => api.get(API.REPORTS_MONTHLY).then(r => r.data.data || r.data),
    enabled: tab === 'Monthly',
  });

  const handleExport = async (type) => {
    setExporting(true);
    try {
      const url = type === 'excel' ? API.REPORTS_EXCEL : API.REPORTS_PDF;
      const resp = await api.get(url, {
        params: { ...dateRange, report_type: tab.toLowerCase().replace(' ', '_') },
        responseType: 'blob',
      });
      const blob = new Blob([resp.data]);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `report_${tab.replace(' ', '_').toLowerCase()}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      toast.success(`${type.toUpperCase()} exported`);
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const statusPieData = bookingsReport?.status_summary
    ? Object.entries(bookingsReport.status_summary).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Insights into booking activity</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400 dark:text-slate-500 text-sm">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="secondary" size="sm" onClick={() => handleExport('excel')} loading={exporting}>
            <Download className="h-3.5 w-3.5" /> Excel
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleExport('pdf')} loading={exporting}>
            <Download className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700 overflow-x-auto">
        {REPORT_TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Bookings Report */}
      {tab === 'Bookings' && (
        <div className="space-y-5">
          {bookingsLoading ? (
            <div className="h-48 flex items-center justify-center text-gray-400 dark:text-slate-500">Loading…</div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <Card>
                <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                        {statusPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tipStyle} />
                      <Legend wrapperStyle={{ color: tickColor }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Bookings by Hall</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={bookingsReport?.by_hall || []} margin={{ left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="hall" tick={{ fontSize: 10, fill: tickColor }} />
                      <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                      <Tooltip contentStyle={tipStyle} />
                      <Bar dataKey="count" name="Bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Hall Utilization */}
      {tab === 'Hall Utilization' && (
        <Card>
          <CardHeader><CardTitle>Hall Utilization Rate</CardTitle></CardHeader>
          <CardContent>
            {hallsLoading ? (
              <div className="h-48 flex items-center justify-center text-gray-400 dark:text-slate-500">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={hallsReport || []} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="hall" tick={{ fontSize: 11, fill: tickColor }} />
                  <YAxis tick={{ fontSize: 11, fill: tickColor }} unit="%" domain={[0, 100]} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Utilization']} contentStyle={tipStyle} />
                  <Bar dataKey="utilization_rate" name="Utilization %" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Department Wise */}
      {tab === 'Department Wise' && (
        <Card>
          <CardHeader><CardTitle>Bookings by Department</CardTitle></CardHeader>
          <CardContent>
            {deptLoading ? (
              <div className="h-48 flex items-center justify-center text-gray-400 dark:text-slate-500">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptReport || []} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} />
                  <YAxis dataKey="department" type="category" tick={{ fontSize: 10, fill: tickColor }} width={80} />
                  <Tooltip contentStyle={tipStyle} />
                  <Bar dataKey="bookings" name="Bookings" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend */}
      {tab === 'Monthly' && (
        <Card>
          <CardHeader><CardTitle>Monthly Booking Trends</CardTitle></CardHeader>
          <CardContent>
            {monthlyLoading ? (
              <div className="h-48 flex items-center justify-center text-gray-400 dark:text-slate-500">Loading…</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyReport || []} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} />
                  <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                  <Tooltip contentStyle={tipStyle} />
                  <Bar dataKey="total" name="Total" fill="#3b82f6" stackId="a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Approved" fill="#10b981" stackId="b" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ color: tickColor }} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
