// FILE: resources/js/src/pages/Navigation/NavigationBuilder.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, ChevronRight, ChevronDown, GripVertical,
  Edit2, Trash2, Plus, ChevronUp, Save, Eye, EyeOff, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';

const BADGE_COLORS = ['blue', 'green', 'red', 'yellow', 'purple', 'cyan', 'gray'];

const VISIBILITY_TYPES = [
  { value: 'all',        label: 'All Users' },
  { value: 'role',       label: 'By Role' },
  { value: 'department', label: 'By Department' },
  { value: 'user',       label: 'Specific Users' },
];

const EMPTY_FORM = {
  label: '',
  icon: '',
  route: '',
  url: '',
  permission: '',
  badge: '',
  badge_color: 'blue',
  parent_id: '',
  visibility_type: 'all',
  visibility_values: [],
  is_active: true,
  sort_order: 0,
};

// Renders a single nav item row
function NavItem({ item, depth, allItems, onEdit, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const [expanded, setExpanded] = useState(true);
  const children = allItems.filter(i => String(i.parent_id) === String(item.id));

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg group hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
          !item.is_active ? 'opacity-50' : ''
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {children.length > 0 ? (
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 dark:text-slate-500 flex-shrink-0">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        <GripVertical className="h-4 w-4 text-gray-300 dark:text-slate-600 flex-shrink-0 cursor-grab" />

        <span className="text-sm font-medium text-gray-700 dark:text-slate-200 flex-1 truncate">{item.label}</span>

        {item.icon && (
          <span className="text-xs text-gray-400 dark:text-slate-500 font-mono hidden sm:block">{item.icon}</span>
        )}

        {item.badge && (
          <Badge variant={item.badge_color || 'primary'} className="text-[10px]">{item.badge}</Badge>
        )}

        {!item.is_active && <Badge variant="default">Hidden</Badge>}

        <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
          <button onClick={() => onMoveUp(item)} disabled={!canMoveUp} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onMoveDown(item)} disabled={!canMoveDown} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onEdit(item)} className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onDelete(item)} className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {expanded && children.map((child, idx) => (
        <NavItem
          key={child.id}
          item={child}
          depth={depth + 1}
          allItems={allItems}
          onEdit={onEdit}
          onDelete={onDelete}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          canMoveUp={idx > 0}
          canMoveDown={idx < children.length - 1}
        />
      ))}
    </div>
  );
}

export default function NavigationBuilder() {
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [visibilityInput, setVisibilityInput] = useState('');

  const { data: menuItems = [], isLoading, isError } = useQuery({
    queryKey: ['menus'],
    queryFn: () => api.get('/menus').then(r => r.data.data || r.data),
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['roles-all'],
    queryFn: () => api.get('/roles').then(r => r.data.data || r.data),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => api.get('/departments/all').then(r => r.data.data || r.data),
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function startEdit(item) {
    setEditItem(item);
    setForm({
      label: item.label || '',
      icon: item.icon || '',
      route: item.route || '',
      url: item.url || '',
      permission: item.permission || '',
      badge: item.badge || '',
      badge_color: item.badge_color || 'blue',
      parent_id: item.parent_id ? String(item.parent_id) : '',
      visibility_type: item.visibility_type || 'all',
      visibility_values: item.visibility_values || [],
      is_active: item.is_active !== false,
      sort_order: item.sort_order || 0,
    });
  }

  function startCreate() {
    setEditItem(null);
    setForm({ ...EMPTY_FORM });
  }

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editItem
        ? api.put(`/menus/${editItem.id}`, data).then(r => r.data)
        : api.post('/menus', data).then(r => r.data),
    onSuccess: () => {
      toast.success(editItem ? 'Menu item updated' : 'Menu item created');
      qc.invalidateQueries({ queryKey: ['menus'] });
      startCreate();
    },
    onError: () => toast.error('Failed to save menu item'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/menus/${id}`),
    onSuccess: () => {
      toast.success('Menu item deleted');
      qc.invalidateQueries({ queryKey: ['menus'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete menu item'),
  });

  const reorderMutation = useMutation({
    mutationFn: (items) => api.post('/menus/reorder', { items }),
    onSuccess: () => { toast.success('Order saved'); qc.invalidateQueries({ queryKey: ['menus'] }); },
    onError: () => toast.error('Failed to reorder'),
  });

  function moveItem(item, direction) {
    const siblings = menuItems
      .filter(i => String(i.parent_id || '') === String(item.parent_id || ''))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const idx = siblings.findIndex(i => i.id === item.id);
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= siblings.length) return;
    const updated = [...siblings];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    const payload = updated.map((i, order) => ({ id: i.id, sort_order: order, parent_id: i.parent_id }));
    reorderMutation.mutate(payload);
  }

  // Top-level items sorted
  const topLevel = menuItems
    .filter(i => !i.parent_id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  function addVisibilityValue() {
    if (!visibilityInput.trim()) return;
    set('visibility_values', [...(form.visibility_values || []), visibilityInput.trim()]);
    setVisibilityInput('');
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-5">
        <div className="h-8 w-56 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Navigation Builder</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage menu structure, icons, and visibility rules</p>
        </div>
      </div>

      {isError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
          Failed to load menu items.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Left: Menu Tree */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Menu Structure</CardTitle>
            <Button size="sm" icon={Plus} onClick={startCreate}>Add Item</Button>
          </CardHeader>
          <CardContent className="p-0">
            {menuItems.length === 0 ? (
              <div className="py-12 text-center">
                <LayoutDashboard className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400 dark:text-slate-500">No menu items yet. Add your first item.</p>
              </div>
            ) : (
              <div className="py-2">
                {topLevel.map((item, idx) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    depth={0}
                    allItems={menuItems}
                    onEdit={startEdit}
                    onDelete={setDeleteTarget}
                    onMoveUp={() => moveItem(item, 'up')}
                    onMoveDown={() => moveItem(item, 'down')}
                    canMoveUp={idx > 0}
                    canMoveDown={idx < topLevel.length - 1}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Edit/Add Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editItem ? `Edit: ${editItem.label}` : 'Add Menu Item'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Label"
              required
              value={form.label}
              onChange={e => set('label', e.target.value)}
              placeholder="Dashboard"
            />
            <Input
              label="Icon (Lucide icon name)"
              value={form.icon}
              onChange={e => set('icon', e.target.value)}
              placeholder="LayoutDashboard"
              hint="See lucide.dev for icon names"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Internal Route"
                value={form.route}
                onChange={e => { set('route', e.target.value); if (e.target.value) set('url', ''); }}
                placeholder="/dashboard"
              />
              <Input
                label="External URL"
                type="url"
                value={form.url}
                onChange={e => { set('url', e.target.value); if (e.target.value) set('route', ''); }}
                placeholder="https://…"
              />
            </div>

            <Input
              label="Required Permission"
              value={form.permission}
              onChange={e => set('permission', e.target.value)}
              placeholder="bookings.view"
              hint="Leave blank for all authenticated users"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Badge Text"
                value={form.badge}
                onChange={e => set('badge', e.target.value)}
                placeholder="New"
              />
              <Select label="Badge Color" value={form.badge_color} onChange={e => set('badge_color', e.target.value)}>
                {BADGE_COLORS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </Select>
            </div>

            <Select
              label="Parent Item"
              value={form.parent_id}
              onChange={e => set('parent_id', e.target.value)}
            >
              <option value="">— None (top-level) —</option>
              {menuItems.filter(i => !i.parent_id && i.id !== editItem?.id).map(i => (
                <option key={i.id} value={String(i.id)}>{i.label}</option>
              ))}
            </Select>

            <Select
              label="Visibility"
              value={form.visibility_type}
              onChange={e => { set('visibility_type', e.target.value); set('visibility_values', []); }}
            >
              {VISIBILITY_TYPES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
            </Select>

            {form.visibility_type !== 'all' && (
              <div className="space-y-2">
                {form.visibility_type === 'role' && (
                  <div className="flex flex-wrap gap-1.5">
                    {roles.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          const vals = form.visibility_values || [];
                          set('visibility_values', vals.includes(r.slug) ? vals.filter(v => v !== r.slug) : [...vals, r.slug]);
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          (form.visibility_values || []).includes(r.slug)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        {r.name || r.slug}
                      </button>
                    ))}
                  </div>
                )}
                {form.visibility_type === 'department' && (
                  <div className="flex flex-wrap gap-1.5">
                    {departments.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          const vals = form.visibility_values || [];
                          set('visibility_values', vals.includes(String(d.id)) ? vals.filter(v => v !== String(d.id)) : [...vals, String(d.id)]);
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          (form.visibility_values || []).includes(String(d.id))
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-blue-50'
                        }`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                )}
                {form.visibility_type === 'user' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={visibilityInput}
                        onChange={e => setVisibilityInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addVisibilityValue()}
                        placeholder="User email or ID"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button size="sm" variant="secondary" onClick={addVisibilityValue}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(form.visibility_values || []).map((v, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded-full">
                          {v}
                          <button onClick={() => set('visibility_values', form.visibility_values.filter((_, j) => j !== i))}>
                            <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={e => set('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-slate-300">Active (visible in menu)</span>
            </label>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
              {editItem && (
                <Button variant="secondary" size="sm" onClick={startCreate}>Cancel</Button>
              )}
              <Button
                size="sm"
                icon={Save}
                loading={saveMutation.isPending}
                disabled={!form.label}
                onClick={() => saveMutation.mutate(form)}
              >
                {editItem ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Menu Item"
        message={`Delete "${deleteTarget?.label}"? Any child items will also be removed.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
