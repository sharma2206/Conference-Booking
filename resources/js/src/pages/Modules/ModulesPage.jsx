// FILE: resources/js/src/pages/Modules/ModulesPage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, Building2, Calendar, CalendarCheck, CheckSquare,
  Users, Shield, UserCheck, UtensilsCrossed, Package, BarChart3,
  ClipboardList, Settings, Plus, Trash2, ChevronDown, ChevronUp,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal, ConfirmModal } from '../../components/ui/Modal';

const ICON_MAP = {
  LayoutDashboard, Building2, Calendar, CalendarCheck, CheckSquare,
  Users, Shield, UserCheck, UtensilsCrossed, Package, BarChart3,
  ClipboardList, Settings,
};

const SYSTEM_MODULES = [
  { name: 'Dashboard',   slug: 'dashboard',   icon: 'LayoutDashboard', description: 'Main overview and statistics dashboard',                  permission_prefix: 'dashboard',   is_system: true },
  { name: 'Halls',       slug: 'halls',        icon: 'Building2',       description: 'Conference hall management and availability',             permission_prefix: 'halls',       is_system: true },
  { name: 'Bookings',    slug: 'bookings',     icon: 'Calendar',        description: 'Booking creation, management, and lifecycle',             permission_prefix: 'bookings',    is_system: true },
  { name: 'Calendar',    slug: 'calendar',     icon: 'CalendarCheck',   description: 'Calendar view of all bookings and events',               permission_prefix: 'calendar',    is_system: true },
  { name: 'Approvals',   slug: 'approvals',    icon: 'CheckSquare',     description: 'Approval workflow for pending bookings',                  permission_prefix: 'approvals',   is_system: true },
  { name: 'Departments', slug: 'departments',  icon: 'Building2',       description: 'Organizational departments and hierarchy',               permission_prefix: 'departments', is_system: true },
  { name: 'Users',       slug: 'users',        icon: 'Users',           description: 'User accounts, profiles, and management',               permission_prefix: 'users',       is_system: true },
  { name: 'Roles',       slug: 'roles',        icon: 'Shield',          description: 'Role-based access control and permissions',              permission_prefix: 'roles',       is_system: true },
  { name: 'Visitors',    slug: 'visitors',     icon: 'UserCheck',       description: 'External visitor management and check-in/out',          permission_prefix: 'visitors',    is_system: true },
  { name: 'Catering',    slug: 'catering',     icon: 'UtensilsCrossed', description: 'Catering menus, orders, and cost tracking',             permission_prefix: 'catering',    is_system: true },
  { name: 'Resources',   slug: 'resources',    icon: 'Package',         description: 'Bookable equipment and resource inventory',             permission_prefix: 'resources',   is_system: true },
  { name: 'Reports',     slug: 'reports',      icon: 'BarChart3',       description: 'Analytics, reports, and data exports',                  permission_prefix: 'reports',     is_system: true },
  { name: 'Audit Logs',  slug: 'audit',        icon: 'ClipboardList',   description: 'System activity and security audit trail',              permission_prefix: 'audit',       is_system: true },
  { name: 'Settings',    slug: 'settings',     icon: 'Settings',        description: 'Application configuration and branding settings',       permission_prefix: 'settings',    is_system: true },
];

const EMPTY_FORM = {
  name: '',
  slug: '',
  icon: '',
  description: '',
  url: '',
  menu_position: '',
  permission_prefix: '',
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function getPermissions(prefix) {
  return [`${prefix}.view`, `${prefix}.create`, `${prefix}.edit`, `${prefix}.delete`];
}

// Module form modal
function ModuleModal({ isOpen, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function handleNameChange(val) {
    const slug = slugify(val);
    setForm(p => ({ ...p, name: val, slug, permission_prefix: slug.replace(/-/g, '_') }));
  }

  const mutation = useMutation({
    mutationFn: (data) => api.post('/modules', data).then(r => r.data),
    onSuccess: () => {
      toast.success('Module created. Permissions auto-generated.');
      qc.invalidateQueries({ queryKey: ['modules'] });
      onClose();
    },
    onError: () => toast.error('Failed to create module'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Custom Module" size="md">
      <div className="p-5 space-y-4">
        <Input label="Module Name" required value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Asset Management" />
        <Input label="Slug (auto-generated)" value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="asset-management" hint="Used in routes and API" />
        <Input label="Icon (Lucide icon name)" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="Package" hint="See lucide.dev for icon names" />
        <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Manage organization assets and inventory…" />
        <Input label="Route Path" value={form.url} onChange={e => set('url', e.target.value)} placeholder="/asset-management" hint="Frontend route for this module" />
        <Input label="Menu Position" type="number" value={form.menu_position} onChange={e => set('menu_position', e.target.value)} placeholder="15" hint="Lower numbers appear first in menu" />
        <Input label="Permission Prefix" value={form.permission_prefix} onChange={e => set('permission_prefix', e.target.value)} placeholder="asset_management" hint="Auto-permissions: prefix.view, .create, .edit, .delete" />

        {form.permission_prefix && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Auto-generated Permissions:</p>
            <div className="flex flex-wrap gap-1.5">
              {getPermissions(form.permission_prefix).map(p => (
                <code key={p} className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full font-mono">{p}</code>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" loading={mutation.isPending} disabled={!form.name || !form.slug} onClick={() => mutation.mutate(form)}>
            Create Module
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Single module card
function ModuleCard({ mod, onToggle, onDelete, toggling }) {
  const IconComp = ICON_MAP[mod.icon] || Settings;
  const [showPerms, setShowPerms] = useState(false);
  const perms = getPermissions(mod.permission_prefix || mod.slug);

  return (
    <Card className={`transition-all ${!mod.is_active && !mod.is_system ? 'opacity-70' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <IconComp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{mod.name}</p>
                {mod.is_system && <Lock className="h-3 w-3 text-gray-400 dark:text-slate-500" title="System module" />}
              </div>
              <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{mod.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge variant={mod.is_active !== false ? 'success' : 'default'} dot>
              {mod.is_active !== false ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {mod.description && (
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{mod.description}</p>
        )}

        {/* Permissions toggle */}
        <button
          onClick={() => setShowPerms(p => !p)}
          className="flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {showPerms ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {perms.length} permissions
        </button>

        {showPerms && (
          <div className="flex flex-wrap gap-1.5">
            {perms.map(p => (
              <code key={p} className="px-2 py-0.5 text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-full font-mono">{p}</code>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-700">
          {!mod.is_system && (
            <Button
              size="xs"
              variant={mod.is_active !== false ? 'secondary' : 'primary'}
              loading={toggling}
              onClick={() => onToggle(mod)}
            >
              {mod.is_active !== false ? 'Disable' : 'Enable'}
            </Button>
          )}
          {mod.is_system && (
            <span className="text-xs text-gray-400 dark:text-slate-500">System module — always active</span>
          )}
          {!mod.is_system && (
            <Button size="xs" variant="danger" onClick={() => onDelete(mod)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ModulesPage() {
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const { data: customModules = [], isLoading, isError } = useQuery({
    queryKey: ['modules'],
    queryFn: () => api.get('/modules').then(r => r.data.data || r.data).catch(() => []),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => api.patch(`/modules/${id}`, { is_active: !is_active }).then(r => r.data),
    onSuccess: () => { toast.success('Module status updated'); qc.invalidateQueries({ queryKey: ['modules'] }); setTogglingId(null); },
    onError: () => { toast.error('Failed to update module'); setTogglingId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/modules/${id}`),
    onSuccess: () => { toast.success('Module deleted'); qc.invalidateQueries({ queryKey: ['modules'] }); setDeleteTarget(null); },
    onError: () => toast.error('Failed to delete module'),
  });

  // Merge system + custom
  const allModules = [
    ...SYSTEM_MODULES.map(m => ({ ...m, id: m.slug, is_active: true })),
    ...customModules.filter(c => !SYSTEM_MODULES.find(s => s.slug === c.slug)),
  ];

  function handleToggle(mod) {
    setTogglingId(mod.id);
    toggleMutation.mutate({ id: mod.id, is_active: mod.is_active });
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-5">
        <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Module Manager</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Enable, disable, and add custom modules to your application</p>
        </div>
        <Button icon={Plus} onClick={() => setCreateModal(true)}>Add Module</Button>
      </div>

      {isError && (
        <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 text-sm text-yellow-700 dark:text-yellow-400">
          Could not load custom modules. Showing system modules only.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {allModules.map(mod => (
          <ModuleCard
            key={mod.id || mod.slug}
            mod={mod}
            onToggle={handleToggle}
            onDelete={setDeleteTarget}
            toggling={togglingId === mod.id && toggleMutation.isPending}
          />
        ))}
      </div>

      <ModuleModal isOpen={createModal} onClose={() => setCreateModal(false)} />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Module"
        message={`Delete the "${deleteTarget?.name}" module? All associated permissions will also be removed.`}
        confirmText="Delete Module"
        variant="danger"
      />
    </div>
  );
}
