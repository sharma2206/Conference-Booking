// FILE: resources/js/src/pages/ReportBuilder/ReportBuilderPage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, Plus, Trash2, Play, Download, Calendar, X, Filter,
  FileText, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';

const MODULES_CONFIG = {
  bookings: {
    label: 'Bookings',
    fields: [
      { key: 'id', label: 'Booking ID' },
      { key: 'hall_name', label: 'Hall Name' },
      { key: 'user_name', label: 'User Name' },
      { key: 'department', label: 'Department' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'end_date', label: 'End Date' },
      { key: 'status', label: 'Status' },
      { key: 'total_cost', label: 'Total Cost' },
      { key: 'attendees', label: 'Attendees' },
      { key: 'purpose', label: 'Purpose' },
    ],
  },
  halls: {
    label: 'Halls',
    fields: [
      { key: 'name', label: 'Hall Name' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'location', label: 'Location' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'booking_count', label: 'Booking Count' },
      { key: 'utilization_rate', label: 'Utilization Rate (%)' },
      { key: 'revenue', label: 'Revenue Generated' },
    ],
  },
  visitors: {
    label: 'Visitors',
    fields: [
      { key: 'name', label: 'Visitor Name' },
      { key: 'host_name', label: 'Host Name' },
      { key: 'visit_date', label: 'Visit Date' },
      { key: 'check_in', label: 'Check-in Time' },
      { key: 'check_out', label: 'Check-out Time' },
      { key: 'purpose', label: 'Purpose' },
      { key: 'status', label: 'Status' },
    ],
  },
  catering: {
    label: 'Catering',
    fields: [
      { key: 'order_id', label: 'Order ID' },
      { key: 'booking_id', label: 'Booking ID' },
      { key: 'menu_items', label: 'Menu Items' },
      { key: 'total_cost', label: 'Total Cost' },
      { key: 'order_date', label: 'Order Date' },
      { key: 'status', label: 'Status' },
    ],
  },
  resources: {
    label: 'Resources',
    fields: [
      { key: 'name', label: 'Resource Name' },
      { key: 'type', label: 'Type' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'available', label: 'Available' },
      { key: 'request_count', label: 'Request Count' },
      { key: 'utilization', label: 'Utilization' },
    ],
  },
};

const OPERATORS = [
  { value: 'eq',       label: 'Equals' },
  { value: 'neq',      label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'gt',       label: 'Greater Than' },
  { value: 'lt',       label: 'Less Than' },
  { value: 'between',  label: 'Between' },
];

const SCHEDULE_OPTIONS = [
  { value: '',        label: 'No schedule' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const EMPTY_TEMPLATE = {
  name: '',
  description: '',
  module: 'bookings',
  fields: [],
  filters: [],
  group_by: '',
  chart_type: 'bar',
  schedule: '',
  schedule_email: '',
};

function FilterRow({ filter, index, fields, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2">
      <Select value={filter.field} onChange={e => onChange(index, 'field', e.target.value)} className="flex-1">
        <option value="">Field…</option>
        {fields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
      </Select>
      <Select value={filter.operator} onChange={e => onChange(index, 'operator', e.target.value)} className="flex-1">
        {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <input
        type="text"
        value={filter.value || ''}
        onChange={e => onChange(index, 'value', e.target.value)}
        placeholder="Value"
        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button onClick={() => onRemove(index)} className="p-2 text-gray-400 hover:text-red-500 flex-shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Report editor right panel
function TemplateEditor({ template, isNew, onSave, onRun, onExport, saving, running }) {
  const [form, setForm] = useState({ ...EMPTY_TEMPLATE, ...(template || {}) });
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setForm({ ...EMPTY_TEMPLATE, ...(template || {}) });
    setResults(null);
    setShowResults(false);
  }, [template?.id]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const moduleCfg = MODULES_CONFIG[form.module] || MODULES_CONFIG.bookings;
  const availableFields = moduleCfg.fields;

  function toggleField(key) {
    set('fields', form.fields.includes(key) ? form.fields.filter(f => f !== key) : [...form.fields, key]);
  }

  function addFilter() {
    set('filters', [...(form.filters || []), { field: availableFields[0]?.key || '', operator: 'eq', value: '' }]);
  }

  function updateFilter(idx, key, val) {
    const filters = [...form.filters];
    filters[idx] = { ...filters[idx], [key]: val };
    set('filters', filters);
  }

  function removeFilter(idx) {
    set('filters', form.filters.filter((_, i) => i !== idx));
  }

  async function handleRun() {
    try {
      const res = await onRun(form);
      setResults(res);
      setShowResults(true);
    } catch { /* handled in parent */ }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{isNew ? 'New Report Template' : 'Edit Report'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Template Name" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Monthly Bookings Summary" />
          <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Report showing all bookings by month…" />
          <Select label="Module / Data Source" value={form.module} onChange={e => { set('module', e.target.value); set('fields', []); set('filters', []); set('group_by', ''); }}>
            {Object.entries(MODULES_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fields to Include</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableFields.map(f => (
              <button
                key={f.key}
                onClick={() => toggleField(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  form.fields.includes(f.key)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {form.fields.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">All fields selected when none are chosen</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filters</CardTitle>
          <Button size="xs" variant="secondary" icon={Filter} onClick={addFilter}>Add Filter</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(form.filters || []).length === 0 && (
            <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-2">No filters. All records will be included.</p>
          )}
          {(form.filters || []).map((filter, idx) => (
            <FilterRow
              key={idx}
              filter={filter}
              index={idx}
              fields={availableFields}
              onChange={updateFilter}
              onRemove={removeFilter}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Grouping & Chart</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select label="Group By" value={form.group_by} onChange={e => set('group_by', e.target.value)}>
            <option value="">— No grouping —</option>
            {availableFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </Select>
          <Select label="Chart Type" value={form.chart_type} onChange={e => set('chart_type', e.target.value)}>
            <option value="none">None (table only)</option>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="line">Line Chart</option>
            <option value="area">Area Chart</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Schedule (Auto-Email)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Select label="Frequency" value={form.schedule} onChange={e => set('schedule', e.target.value)}>
            {SCHEDULE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          {form.schedule && (
            <Input
              label="Email To"
              type="email"
              value={form.schedule_email}
              onChange={e => set('schedule_email', e.target.value)}
              placeholder="reports@company.com"
              hint="Report will be emailed automatically"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button icon={Play} variant="secondary" loading={running} onClick={handleRun} disabled={!template?.id}>
          Run Preview
        </Button>
        <Button icon={Download} variant="secondary" onClick={() => onExport(template?.id, 'excel')} disabled={!template?.id}>
          Export Excel
        </Button>
        <Button icon={Download} variant="secondary" onClick={() => onExport(template?.id, 'pdf')} disabled={!template?.id}>
          Export PDF
        </Button>
        <Button loading={saving} disabled={!form.name} onClick={() => onSave(form)}>
          Save Template
        </Button>
      </div>

      {/* Results preview */}
      {showResults && results && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview Results</CardTitle>
            <Button size="xs" variant="secondary" onClick={() => setShowResults(false)}>Close</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {Array.isArray(results) && results.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-700">
                      {Object.keys(results[0]).map(k => (
                        <th key={k} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-3 py-2 text-gray-700 dark:text-slate-200 text-xs">{String(v ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">No results found</p>
              )}
            </div>
            {Array.isArray(results) && results.length > 10 && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 text-center">Showing 10 of {results.length} rows. Export for full data.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ReportBuilderPage() {
  const qc = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: templates = [], isLoading, isError } = useQuery({
    queryKey: ['report-templates'],
    queryFn: () => api.get('/report-templates').then(r => r.data.data || r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      selectedTemplate?.id && !isNew
        ? api.put(`/report-templates/${selectedTemplate.id}`, data).then(r => r.data)
        : api.post('/report-templates', data).then(r => r.data),
    onSuccess: (res) => {
      toast.success(isNew ? 'Template created' : 'Template updated');
      qc.invalidateQueries({ queryKey: ['report-templates'] });
      setSelectedTemplate(res.data || res);
      setIsNew(false);
    },
    onError: () => toast.error('Failed to save template'),
  });

  const runMutation = useMutation({
    mutationFn: (id) => api.post(`/report-templates/${id}/run`).then(r => r.data.data || r.data),
    onError: () => toast.error('Failed to run report'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/report-templates/${id}`),
    onSuccess: () => {
      toast.success('Template deleted');
      qc.invalidateQueries({ queryKey: ['report-templates'] });
      setDeleteTarget(null);
      setSelectedTemplate(null);
    },
    onError: () => toast.error('Failed to delete template'),
  });

  function handleExport(id, format) {
    window.open(`/api/report-templates/${id}/export?format=${format}`, '_blank');
  }

  async function handleRun(formData) {
    if (!selectedTemplate?.id) {
      toast.error('Save the template first');
      throw new Error('No ID');
    }
    return runMutation.mutateAsync(selectedTemplate.id);
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Report Builder</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Create and manage custom report templates with scheduling</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Template list */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Reports</CardTitle>
              <Button size="xs" icon={Plus} onClick={() => { setSelectedTemplate({ ...EMPTY_TEMPLATE }); setIsNew(true); }}>New</Button>
            </CardHeader>
            <CardContent className="p-1">
              {isLoading && (
                <div className="space-y-2 p-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />)}
                </div>
              )}
              {isError && <p className="text-xs text-red-500 p-3 text-center">Failed to load</p>}
              {!isLoading && templates.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">No templates yet</p>
              )}
              {templates.map(t => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer group transition-colors ${
                    selectedTemplate?.id === t.id && !isNew
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                  onClick={() => { setSelectedTemplate(t); setIsNew(false); }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BarChart3 className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {t.schedule && <Badge variant="info" className="text-[10px]">{t.schedule}</Badge>}
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(t); }}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Editor */}
        <div className="xl:col-span-3">
          {selectedTemplate ? (
            <TemplateEditor
              template={selectedTemplate}
              isNew={isNew}
              onSave={data => saveMutation.mutate(data)}
              onRun={handleRun}
              onExport={handleExport}
              saving={saveMutation.isPending}
              running={runMutation.isPending}
            />
          ) : (
            <Card className="min-h-80">
              <CardContent className="flex flex-col items-center justify-center h-80">
                <BarChart3 className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-gray-400 dark:text-slate-500">Select a template or create a new one</p>
                <Button size="sm" icon={Plus} className="mt-4" onClick={() => { setSelectedTemplate({ ...EMPTY_TEMPLATE }); setIsNew(true); }}>
                  Create Report Template
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Report Template"
        message={`Delete "${deleteTarget?.name}"? Scheduled emails will also be cancelled.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
