// FILE: resources/js/src/pages/PageBuilder/PageBuilderPage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Plus, Trash2, ChevronUp, ChevronDown, Edit2,
  Globe, EyeOff, Eye, Save, BarChart3, Table2, Hash, AlertTriangle, Code,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';

const COMPONENT_TYPES = [
  { type: 'card',    label: 'Card Block',    icon: FileText,  defaultConfig: { title: 'Card Title', content: 'Card content here…' } },
  { type: 'stats',   label: 'Stats Block',   icon: Hash,      defaultConfig: { stats: [{ label: 'Metric', value: '0' }, { label: 'Metric', value: '0' }, { label: 'Metric', value: '0' }, { label: 'Metric', value: '0' }] } },
  { type: 'table',   label: 'Table Block',   icon: Table2,    defaultConfig: { title: 'Table', description: '' } },
  { type: 'chart',   label: 'Chart Block',   icon: BarChart3, defaultConfig: { chart_type: 'bar', data_source: '' } },
  { type: 'html',    label: 'HTML / Text',   icon: Code,      defaultConfig: { html: '<p>Your content here…</p>' } },
  { type: 'alert',   label: 'Alert / Banner',icon: AlertTriangle, defaultConfig: { message: 'Alert message', type: 'info' } },
];

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Renders config fields for a component
function ComponentConfigEditor({ comp, onChange }) {
  const cfg = comp.config || {};

  if (comp.type === 'card') return (
    <div className="space-y-2">
      <Input label="Title" value={cfg.title || ''} onChange={e => onChange({ ...cfg, title: e.target.value })} />
      <Textarea label="Content" value={cfg.content || ''} onChange={e => onChange({ ...cfg, content: e.target.value })} rows={3} />
    </div>
  );

  if (comp.type === 'stats') return (
    <div className="space-y-2">
      {(cfg.stats || []).map((s, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <Input label={`Stat ${i + 1} Label`} value={s.label || ''} onChange={e => { const stats = [...cfg.stats]; stats[i] = { ...s, label: e.target.value }; onChange({ ...cfg, stats }); }} />
          <Input label="Value" value={s.value || ''} onChange={e => { const stats = [...cfg.stats]; stats[i] = { ...s, value: e.target.value }; onChange({ ...cfg, stats }); }} />
        </div>
      ))}
    </div>
  );

  if (comp.type === 'table') return (
    <div className="space-y-2">
      <Input label="Table Title" value={cfg.title || ''} onChange={e => onChange({ ...cfg, title: e.target.value })} />
      <Textarea label="Description" value={cfg.description || ''} onChange={e => onChange({ ...cfg, description: e.target.value })} rows={2} />
    </div>
  );

  if (comp.type === 'chart') return (
    <div className="space-y-2">
      <Select label="Chart Type" value={cfg.chart_type || 'bar'} onChange={e => onChange({ ...cfg, chart_type: e.target.value })}>
        <option value="bar">Bar Chart</option>
        <option value="line">Line Chart</option>
        <option value="pie">Pie Chart</option>
        <option value="area">Area Chart</option>
      </Select>
      <Input label="Data Source" value={cfg.data_source || ''} onChange={e => onChange({ ...cfg, data_source: e.target.value })} placeholder="/api/reports/bookings" />
    </div>
  );

  if (comp.type === 'html') return (
    <Textarea label="HTML Content" value={cfg.html || ''} onChange={e => onChange({ ...cfg, html: e.target.value })} rows={5} className="font-mono text-xs" />
  );

  if (comp.type === 'alert') return (
    <div className="space-y-2">
      <Textarea label="Alert Message" value={cfg.message || ''} onChange={e => onChange({ ...cfg, message: e.target.value })} rows={2} />
      <Select label="Type" value={cfg.type || 'info'} onChange={e => onChange({ ...cfg, type: e.target.value })}>
        <option value="info">Info</option>
        <option value="success">Success</option>
        <option value="warning">Warning</option>
        <option value="danger">Danger</option>
      </Select>
    </div>
  );

  return null;
}

// Right panel: page editor
function PageEditor({ page, onSave, onPublish, saving, publishing }) {
  const [form, setForm] = useState({
    title: '',
    slug: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    status: 'draft',
    components: [],
  });

  useEffect(() => {
    if (page) {
      setForm({
        title:           page.title || '',
        slug:            page.slug || '',
        meta_title:      page.meta_title || '',
        meta_description: page.meta_description || '',
        meta_keywords:   page.meta_keywords || '',
        status:          page.status || 'draft',
        components:      Array.isArray(page.components) ? page.components : [],
      });
    }
  }, [page]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function handleTitleChange(val) {
    setForm(p => ({ ...p, title: val, slug: p.slug || slugify(val) }));
  }

  function addComponent(def) {
    const comp = { id: `comp-${Date.now()}`, type: def.type, config: { ...def.defaultConfig } };
    set('components', [...form.components, comp]);
  }

  function removeComponent(id) {
    set('components', form.components.filter(c => c.id !== id));
  }

  function moveComponent(idx, dir) {
    const comps = [...form.components];
    const next = idx + (dir === 'up' ? -1 : 1);
    if (next < 0 || next >= comps.length) return;
    [comps[idx], comps[next]] = [comps[next], comps[idx]];
    set('components', comps);
  }

  function updateComponentConfig(id, newCfg) {
    set('components', form.components.map(c => c.id === id ? { ...c, config: newCfg } : c));
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Page Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Page Title" required value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="My Custom Page" />
          <Input label="Slug" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="my-custom-page" hint="Used in the page URL: /pages/{slug}" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>SEO Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Meta Title" value={form.meta_title} onChange={e => set('meta_title', e.target.value)} placeholder="Page title for search engines" />
          <Textarea label="Meta Description" value={form.meta_description} onChange={e => set('meta_description', e.target.value)} rows={2} placeholder="Brief description for search results…" />
          <Input label="Meta Keywords" value={form.meta_keywords} onChange={e => set('meta_keywords', e.target.value)} placeholder="conference, booking, hall" hint="Comma-separated keywords" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Components</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {COMPONENT_TYPES.map(def => {
              const Icon = def.icon;
              return (
                <button
                  key={def.type}
                  onClick={() => addComponent(def)}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  <Icon className="h-3 w-3" />
                  {def.label}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.components.length === 0 && (
            <div className="py-8 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
              <p className="text-sm text-gray-400 dark:text-slate-500">No components yet. Add from the palette above.</p>
            </div>
          )}
          {form.components.map((comp, idx) => {
            const def = COMPONENT_TYPES.find(d => d.type === comp.type);
            const Icon = def?.icon || FileText;
            return (
              <div key={comp.id} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-slate-700/50">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{def?.label || comp.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveComponent(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => moveComponent(idx, 'down')} disabled={idx === form.components.length - 1} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => removeComponent(comp.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <ComponentConfigEditor comp={comp} onChange={cfg => updateComponentConfig(comp.id, cfg)} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-slate-400">Status:</span>
          <Badge variant={form.status === 'published' ? 'success' : 'default'} dot>
            {form.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={Save} loading={saving} onClick={() => onSave(form)}>
            Save Draft
          </Button>
          {form.status !== 'published' ? (
            <Button size="sm" icon={Globe} loading={publishing} onClick={() => onPublish(form)}>
              Publish
            </Button>
          ) : (
            <Button size="sm" variant="warning" icon={EyeOff} loading={publishing} onClick={() => onPublish({ ...form, status: 'draft' })}>
              Unpublish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PageBuilderPage() {
  const qc = useQueryClient();
  const [selectedPage, setSelectedPage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: pages = [], isLoading, isError } = useQuery({
    queryKey: ['pages'],
    queryFn: () => api.get('/pages').then(r => r.data.data || r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      selectedPage?.id
        ? api.put(`/pages/${selectedPage.id}`, data).then(r => r.data)
        : api.post('/pages', data).then(r => r.data),
    onSuccess: (res) => {
      toast.success('Page saved');
      qc.invalidateQueries({ queryKey: ['pages'] });
      setSelectedPage(res.data || res);
    },
    onError: () => toast.error('Failed to save page'),
  });

  const publishMutation = useMutation({
    mutationFn: (data) =>
      selectedPage?.id
        ? api.post(`/pages/${selectedPage.id}/publish`, data).then(r => r.data)
        : Promise.reject(new Error('Save first')),
    onSuccess: (res) => {
      toast.success(res.data?.status === 'published' ? 'Page published' : 'Page unpublished');
      qc.invalidateQueries({ queryKey: ['pages'] });
      setSelectedPage(res.data || res);
    },
    onError: () => toast.error('Save the page first before publishing'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/pages/${id}`),
    onSuccess: () => {
      toast.success('Page deleted');
      qc.invalidateQueries({ queryKey: ['pages'] });
      setDeleteTarget(null);
      setSelectedPage(null);
    },
    onError: () => toast.error('Failed to delete page'),
  });

  function createNew() {
    setSelectedPage({ title: '', slug: '', status: 'draft', components: [] });
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Page Builder</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Create and manage dynamic custom pages</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Pages List */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pages</CardTitle>
              <Button size="xs" icon={Plus} onClick={createNew}>New</Button>
            </CardHeader>
            <CardContent className="p-1">
              {isLoading && (
                <div className="space-y-2 p-2">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />)}
                </div>
              )}
              {isError && (
                <p className="text-xs text-red-500 p-3 text-center">Failed to load pages</p>
              )}
              {!isLoading && pages.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">No pages yet</p>
              )}
              {pages.map(page => (
                <div
                  key={page.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer group transition-colors ${
                    selectedPage?.id === page.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-slate-200'
                  }`}
                  onClick={() => setSelectedPage(page)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{page.title || 'Untitled'}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge variant={page.status === 'published' ? 'success' : 'default'} className="text-[10px]">
                      {page.status === 'published' ? 'Live' : 'Draft'}
                    </Badge>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(page); }}
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
          {selectedPage ? (
            <PageEditor
              page={selectedPage}
              onSave={data => saveMutation.mutate(data)}
              onPublish={data => {
                if (selectedPage?.id) {
                  publishMutation.mutate(data);
                } else {
                  saveMutation.mutate({ ...data, status: 'published' });
                }
              }}
              saving={saveMutation.isPending}
              publishing={publishMutation.isPending}
            />
          ) : (
            <Card className="min-h-80">
              <CardContent className="flex flex-col items-center justify-center h-80">
                <FileText className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
                <p className="text-sm font-medium text-gray-400 dark:text-slate-500">Select a page to edit</p>
                <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">or create a new one</p>
                <Button size="sm" icon={Plus} className="mt-4" onClick={createNew}>Create New Page</Button>
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
        title="Delete Page"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
