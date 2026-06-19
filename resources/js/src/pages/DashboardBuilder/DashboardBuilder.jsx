// FILE: resources/js/src/pages/DashboardBuilder/DashboardBuilder.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, Calendar, TrendingUp, Clock, Users, UtensilsCrossed,
  Package, Hash, CalendarDays, Bell, Save, Trash2, ChevronLeft, ChevronRight,
  ChevronUp, ChevronDown, Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const ROLES = [
  { value: 'super-admin',      label: 'Super Admin' },
  { value: 'admin',            label: 'Admin' },
  { value: 'facility-manager', label: 'Facility Manager' },
  { value: 'department-head',  label: 'Department Head' },
  { value: 'employee',         label: 'Employee' },
];

const WIDGET_TYPES = [
  { type: 'revenue_chart',      label: 'Revenue Chart',       icon: TrendingUp,     w: 6, h: 2 },
  { type: 'bookings_chart',     label: 'Bookings Chart',      icon: BarChart3,      w: 6, h: 2 },
  { type: 'hall_usage',         label: 'Hall Usage',          icon: Clock,          w: 4, h: 2 },
  { type: 'upcoming_bookings',  label: 'Upcoming Bookings',   icon: Calendar,       w: 8, h: 3 },
  { type: 'visitor_stats',      label: 'Visitor Stats',       icon: Users,          w: 4, h: 2 },
  { type: 'catering_orders',    label: 'Catering Orders',     icon: UtensilsCrossed,w: 4, h: 2 },
  { type: 'resource_status',    label: 'Resource Status',     icon: Package,        w: 4, h: 2 },
  { type: 'quick_stats',        label: 'Quick Stats',         icon: Hash,           w: 12, h: 1 },
  { type: 'calendar_mini',      label: 'Calendar Mini',       icon: CalendarDays,   w: 4, h: 3 },
  { type: 'notifications_feed', label: 'Notifications Feed',  icon: Bell,           w: 4, h: 3 },
];

function getWidgetDef(type) {
  return WIDGET_TYPES.find(w => w.type === type) || WIDGET_TYPES[0];
}

// Mini widget placeholder rendering in canvas
function WidgetCanvas({ widget, onRemove, onMove, canMoveUp, canMoveDown, canMoveLeft, canMoveRight }) {
  const def = getWidgetDef(widget.type);
  const Icon = def.icon;

  return (
    <div
      className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 flex flex-col gap-2 group hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
      style={{ gridColumn: `span ${Math.min(widget.w || def.w, 12)}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">{widget.title || def.label}</span>
        </div>
        <button
          onClick={() => onRemove(widget.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Remove widget"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Placeholder content */}
      <div className="flex-1 min-h-12 bg-gray-50 dark:bg-slate-700/50 rounded-lg flex items-center justify-center">
        <p className="text-xs text-gray-400 dark:text-slate-500">{def.label} widget</p>
      </div>

      {/* Move controls */}
      <div className="opacity-0 group-hover:opacity-100 flex justify-center gap-1 transition-all">
        <button onClick={() => onMove(widget.id, 'up')} disabled={!canMoveUp} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 rounded">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onMove(widget.id, 'down')} disabled={!canMoveDown} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 rounded">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onMove(widget.id, 'left')} disabled={!canMoveLeft} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 rounded">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onMove(widget.id, 'right')} disabled={!canMoveRight} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 rounded">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function DashboardBuilder() {
  const qc = useQueryClient();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [layout, setLayout] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-layout', selectedRole],
    queryFn: () => api.get(`/dashboard/layouts?role=${selectedRole}`).then(r => r.data.data || r.data || []).catch(() => []),
    keepPreviousData: true,
  });

  useEffect(() => {
    if (Array.isArray(data)) setLayout(data);
    else if (data?.layout && Array.isArray(data.layout)) setLayout(data.layout);
    else setLayout([]);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.post('/dashboard/layouts', payload).then(r => r.data),
    onSuccess: () => {
      toast.success('Dashboard layout saved');
      qc.invalidateQueries({ queryKey: ['dashboard-layout', selectedRole] });
    },
    onError: () => toast.error('Failed to save layout'),
  });

  function addWidget(widgetDef) {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: widgetDef.type,
      title: widgetDef.label,
      w: widgetDef.w,
      h: widgetDef.h,
      x: 0,
      y: layout.length,
      config: {},
    };
    setLayout(prev => [...prev, newWidget]);
  }

  function removeWidget(id) {
    setLayout(prev => prev.filter(w => w.id !== id));
  }

  function moveWidget(id, direction) {
    setLayout(prev => {
      const idx = prev.findIndex(w => w.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      if (direction === 'up' && idx > 0) {
        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
      } else if (direction === 'down' && idx < next.length - 1) {
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      } else if (direction === 'left') {
        next[idx] = { ...next[idx], w: Math.max(2, (next[idx].w || 4) - 2) };
      } else if (direction === 'right') {
        next[idx] = { ...next[idx], w: Math.min(12, (next[idx].w || 4) + 2) };
      }
      return next;
    });
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard Builder</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Customize the dashboard layout for each role</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="w-48"
          >
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
          <Button
            icon={Save}
            loading={saveMutation.isPending}
            onClick={() => saveMutation.mutate({ role: selectedRole, layout })}
          >
            Save Layout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Widget Palette */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Widget Palette</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {WIDGET_TYPES.map(w => {
                const Icon = w.icon;
                const alreadyAdded = layout.some(l => l.type === w.type);
                return (
                  <button
                    key={w.type}
                    onClick={() => !alreadyAdded && addWidget(w)}
                    disabled={alreadyAdded}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      alreadyAdded
                        ? 'opacity-50 cursor-not-allowed text-gray-400 dark:text-slate-500'
                        : 'text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 cursor-pointer'
                    }`}
                    title={alreadyAdded ? 'Already on canvas' : `Add ${w.label}`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{w.label}</span>
                    {alreadyAdded ? (
                      <Badge variant="success" className="ml-auto text-[10px] flex-shrink-0">Added</Badge>
                    ) : (
                      <Plus className="h-3 w-3 ml-auto text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="xl:col-span-4">
          <Card className="min-h-96">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Canvas
                <span className="ml-2 text-sm font-normal text-gray-400 dark:text-slate-500">
                  — {ROLES.find(r => r.value === selectedRole)?.label} layout
                </span>
              </CardTitle>
              {layout.length > 0 && (
                <Button variant="secondary" size="xs" onClick={() => setLayout([])}>Clear All</Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-12 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="col-span-6 h-28 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : layout.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-gray-400 dark:text-slate-500">No widgets on canvas</p>
                  <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">Click widgets from the palette to add them</p>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-3">
                  {layout.map((widget, idx) => (
                    <WidgetCanvas
                      key={widget.id}
                      widget={widget}
                      onRemove={removeWidget}
                      onMove={moveWidget}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < layout.length - 1}
                      canMoveLeft={(widget.w || 4) > 2}
                      canMoveRight={(widget.w || 4) < 12}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Layout summary */}
          {layout.length > 0 && (
            <Card className="mt-3">
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">Current Layout ({layout.length} widgets)</p>
                <div className="flex flex-wrap gap-1.5">
                  {layout.map((w, i) => {
                    const def = getWidgetDef(w.type);
                    return (
                      <span key={w.id} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-full">
                        <span>{i + 1}.</span>
                        <span>{w.title || def.label}</span>
                        <span className="text-gray-400 font-mono">({w.w || def.w}col)</span>
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
