// FILE: resources/js/src/pages/Branding/ThemesPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Copy, Trash2, Check, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useBranding } from '../../contexts/BrandingContext';
import { BUILTIN_THEMES, COLOR_FIELDS, applyTheme } from '../../lib/themeEngine';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmModal } from '../../components/ui/Modal';

const FONT_OPTIONS = ['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Montserrat', 'Lato', 'Nunito', 'DM Sans'];

const DEFAULT_FORM = {
  name: '',
  primary:       '#3b82f6',
  secondary:     '#1e293b',
  accent:        '#8b5cf6',
  success:       '#10b981',
  danger:        '#ef4444',
  warning:       '#f59e0b',
  info:          '#06b6d4',
  font_family:   'Inter',
  button_radius: 8,
  card_radius:   12,
  dark_mode:     false,
};

// Mini live preview panel inside the modal
function ThemePreview({ config }) {
  return (
    <div className="rounded-xl p-4 space-y-3 border border-gray-200 dark:border-slate-700" style={{ background: config.secondary || '#1e293b' }}>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded" style={{ background: config.primary || '#3b82f6' }} />
        <span className="text-white text-xs font-semibold">{config.name || 'Theme Preview'}</span>
      </div>
      <button
        className="w-full py-1.5 text-white text-xs font-medium"
        style={{ background: config.primary || '#3b82f6', borderRadius: `${config.button_radius || 8}px` }}
      >
        Primary Button
      </button>
      <div className="flex gap-1.5">
        {COLOR_FIELDS.map(f => (
          <div
            key={f.key}
            className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
            style={{ background: config[f.key] || '#ccc' }}
            title={f.label}
          />
        ))}
      </div>
      <div className="rounded p-2 bg-white/10" style={{ borderRadius: `${config.card_radius || 12}px` }}>
        <p className="text-white/70 text-xs">Card component</p>
        <p className="text-white text-xs font-medium">Sample content</p>
      </div>
      <div className="flex gap-1.5">
        <span className="px-2 py-0.5 text-white text-xs rounded-full" style={{ background: config.success || '#10b981' }}>Active</span>
        <span className="px-2 py-0.5 text-white text-xs rounded-full" style={{ background: config.danger || '#ef4444' }}>Error</span>
        <span className="px-2 py-0.5 text-white text-xs rounded-full" style={{ background: config.warning || '#f59e0b' }}>Warning</span>
      </div>
    </div>
  );
}

// Theme form — create / edit
function ThemeModal({ isOpen, onClose, editTheme }) {
  const qc = useQueryClient();
  const { refresh } = useBranding();
  const [form, setForm] = useState(editTheme ? { ...DEFAULT_FORM, ...editTheme } : { ...DEFAULT_FORM });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) =>
      editTheme
        ? api.put(`/themes/${editTheme.id}`, data).then(r => r.data)
        : api.post('/themes', data).then(r => r.data),
    onSuccess: () => {
      toast.success(editTheme ? 'Theme updated' : 'Theme created');
      qc.invalidateQueries({ queryKey: ['themes'] });
      refresh();
      onClose();
    },
    onError: () => toast.error('Failed to save theme'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editTheme ? 'Edit Theme' : 'Create Theme'} size="xl">
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
        {/* Form */}
        <div className="space-y-4">
          <Input label="Theme Name" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="My Custom Theme" />

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Colors</p>
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={form[key] || '#3b82f6'}
                  onChange={e => set(key, e.target.value)}
                  className="w-9 h-9 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-800 flex-shrink-0"
                />
                <input
                  type="text"
                  value={form[key] || ''}
                  onChange={e => set(key, e.target.value)}
                  className="w-28 px-2 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <span className="text-sm text-gray-600 dark:text-slate-400 flex-1">{label}</span>
              </div>
            ))}
          </div>

          <Select label="Font Family" value={form.font_family} onChange={e => set('font_family', e.target.value)}>
            {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </Select>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Button Radius: <strong>{form.button_radius}px</strong>
            </label>
            <input type="range" min={0} max={24} value={form.button_radius} onChange={e => set('button_radius', Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Card Radius: <strong>{form.card_radius}px</strong>
            </label>
            <input type="range" min={0} max={24} value={form.card_radius} onChange={e => set('card_radius', Number(e.target.value))} className="w-full accent-blue-600" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!form.dark_mode} onChange={e => set('dark_mode', e.target.checked)} className="rounded border-gray-300 text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Enable Dark Mode by default</span>
          </label>
        </div>

        {/* Live Preview */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Live Preview</p>
          <ThemePreview config={form} />
        </div>
      </div>

      <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-slate-700">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" loading={mutation.isPending} disabled={!form.name} onClick={() => mutation.mutate(form)}>
          {editTheme ? 'Update Theme' : 'Create Theme'}
        </Button>
      </div>
    </Modal>
  );
}

// Theme Card
function ThemeCard({ theme, isActive, isSystem, onActivate, onEdit, onDelete, onDuplicate, activating }) {
  const colors = [
    theme.primary   || theme.json_config?.primary   || '#3b82f6',
    theme.secondary || theme.json_config?.secondary || '#1e293b',
    theme.accent    || theme.json_config?.accent    || '#8b5cf6',
    theme.success   || theme.json_config?.success   || '#10b981',
    theme.danger    || theme.json_config?.danger    || '#ef4444',
    theme.warning   || theme.json_config?.warning   || '#f59e0b',
    theme.info      || theme.json_config?.info      || '#06b6d4',
  ];

  return (
    <Card className={`relative transition-all ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
      <CardContent className="p-4 space-y-3">
        {/* Color swatches */}
        <div className="flex gap-1.5">
          {colors.map((c, i) => (
            <div key={i} className="flex-1 h-6 rounded" style={{ background: c }} />
          ))}
        </div>

        {/* Name + badges */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{theme.name}</p>
            {theme.font_family && <p className="text-xs text-gray-400 dark:text-slate-500">{theme.font_family}</p>}
          </div>
          <div className="flex gap-1 flex-wrap justify-end">
            {isActive && <Badge variant="primary" dot>Active</Badge>}
            {isSystem && <Badge variant="default">System</Badge>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {!isActive && (
            <Button size="xs" loading={activating} onClick={() => onActivate(theme.id)}>
              <Check className="h-3 w-3" /> Activate
            </Button>
          )}
          {!isSystem && (
            <Button size="xs" variant="secondary" onClick={() => onEdit(theme)}>
              <Sliders className="h-3 w-3" /> Edit
            </Button>
          )}
          <Button size="xs" variant="secondary" onClick={() => onDuplicate(theme)}>
            <Copy className="h-3 w-3" /> Duplicate
          </Button>
          {!isSystem && (
            <Button size="xs" variant="danger" onClick={() => onDelete(theme)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ThemesPage() {
  const qc = useQueryClient();
  const { refresh } = useBranding();
  const [createModal, setCreateModal] = useState(false);
  const [editTheme, setEditTheme] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activatingId, setActivatingId] = useState(null);

  const { data: themes = [], isLoading, isError } = useQuery({
    queryKey: ['themes'],
    queryFn: () => api.get('/themes').then(r => r.data.data || r.data),
  });

  const { data: activeThemeData } = useQuery({
    queryKey: ['active-theme'],
    queryFn: () => api.get('/themes/active').then(r => r.data.data || r.data).catch(() => null),
  });
  const activeThemeId = activeThemeData?.id;

  const activateMutation = useMutation({
    mutationFn: (id) => api.post(`/themes/${id}/activate`).then(r => r.data),
    onSuccess: (_, id) => {
      toast.success('Theme activated');
      qc.invalidateQueries({ queryKey: ['themes'] });
      qc.invalidateQueries({ queryKey: ['active-theme'] });
      refresh();
      setActivatingId(null);
    },
    onError: () => { toast.error('Failed to activate theme'); setActivatingId(null); },
  });

  const duplicateMutation = useMutation({
    mutationFn: (theme) => api.post('/themes', { ...theme, name: `${theme.name} (Copy)`, id: undefined }).then(r => r.data),
    onSuccess: () => { toast.success('Theme duplicated'); qc.invalidateQueries({ queryKey: ['themes'] }); },
    onError: () => toast.error('Failed to duplicate theme'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/themes/${id}`),
    onSuccess: () => { toast.success('Theme deleted'); qc.invalidateQueries({ queryKey: ['themes'] }); setDeleteTarget(null); },
    onError: () => toast.error('Failed to delete theme'),
  });

  function handleActivate(id) {
    setActivatingId(id);
    activateMutation.mutate(id);
  }

  // Merge built-in themes with DB themes
  const builtinList = Object.entries(BUILTIN_THEMES).map(([slug, t]) => ({
    id: `builtin-${slug}`,
    slug,
    name: t.name,
    is_system: true,
    ...t,
  }));

  const allThemes = [...builtinList, ...themes.filter(t => !t.is_system)];

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-5">
        <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Theme Manager</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Choose or create a visual theme for your application</p>
        </div>
        <Button icon={Plus} onClick={() => setCreateModal(true)}>Create Theme</Button>
      </div>

      {isError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-600 dark:text-red-400">
          Failed to load themes from server. Showing built-in themes only.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allThemes.map(theme => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={theme.id === activeThemeId}
            isSystem={theme.is_system}
            activating={activatingId === theme.id && activateMutation.isPending}
            onActivate={handleActivate}
            onEdit={setEditTheme}
            onDelete={setDeleteTarget}
            onDuplicate={t => duplicateMutation.mutate(t)}
          />
        ))}
      </div>

      {/* Create / Edit Modal */}
      {(createModal || editTheme) && (
        <ThemeModal
          isOpen
          onClose={() => { setCreateModal(false); setEditTheme(null); }}
          editTheme={editTheme}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Theme"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
