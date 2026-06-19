import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

export default function RolesPage() {
  const qc = useQueryClient();
  const [formModal, setFormModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);

  const { data: rolesData = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles-full'],
    queryFn: () => api.get(API.ROLES).then(r => r.data.data ?? r.data),
  });

  const { data: allPerms = [] } = useQuery({
    queryKey: ['all-permissions'],
    queryFn: () => api.get(API.ALL_PERMISSIONS).then(r => r.data.data ?? r.data),
  });

  const groups = allPerms.reduce((acc, p) => {
    const [mod] = p.name.split('.');
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const openCreate = () => { setEditRole(null); setRoleName(''); setSelectedPerms([]); setFormModal(true); };
  const openEdit = (role) => {
    setEditRole(role);
    setRoleName(role.name);
    setSelectedPerms(role.permissions?.map(p => p.name ?? p) ?? []);
    setFormModal(true);
  };

  const togglePerm = (name) => {
    setSelectedPerms(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const toggleGroup = (groupPerms) => {
    const names = groupPerms.map(p => p.name);
    const allSelected = names.every(n => selectedPerms.includes(n));
    if (allSelected) {
      setSelectedPerms(prev => prev.filter(p => !names.includes(p)));
    } else {
      setSelectedPerms(prev => [...new Set([...prev, ...names])]);
    }
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editRole) return api.put(API.ROLE(editRole.id), data).then(r => r.data);
      return api.post(API.ROLES, data).then(r => r.data);
    },
    onSuccess: () => {
      toast.success(editRole ? 'Role updated' : 'Role created');
      qc.invalidateQueries({ queryKey: ['roles-full'] });
      setFormModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(API.ROLE(id)),
    onSuccess: () => {
      toast.success('Role deleted');
      qc.invalidateQueries({ queryKey: ['roles-full'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Cannot delete this role'),
  });

  const handleSave = () => {
    if (!roleName.trim()) return toast.error('Role name is required');
    saveMutation.mutate({ name: roleName, permissions: selectedPerms });
  };

  // super-admin: never edit or delete. Other built-in roles: editable but not deletable.
  const UNDELETABLE_ROLES = ['super-admin', 'admin', 'facility-manager', 'department-head', 'employee'];
  const UNEDITABLE_ROLES  = ['super-admin'];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage access control roles</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Create Role</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rolesLoading ? (
          <p className="text-sm text-gray-400 dark:text-slate-500">Loading roles…</p>
        ) : rolesData.map(role => (
          <div
            key={role.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                    {role.name.replace(/-/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {role.permissions_count ?? role.permissions?.length ?? 0} permissions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!UNEDITABLE_ROLES.includes(role.name) && (
                  <button
                    onClick={() => openEdit(role)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    aria-label={`Edit ${role.name}`}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                )}
                {!UNDELETABLE_ROLES.includes(role.name) && (
                  <button
                    onClick={() => setDeleteTarget(role)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label={`Delete ${role.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {role.permissions?.slice(0, 5).map(p => (
                <span
                  key={p.name ?? p}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded text-xs"
                >
                  {p.name ?? p}
                </span>
              ))}
              {(role.permissions?.length ?? 0) > 5 && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 rounded text-xs">
                  +{role.permissions.length - 5} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Role form modal */}
      <Modal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        title={editRole ? 'Edit Role' : 'Create Role'}
        size="xl"
      >
        <div className="p-5 space-y-5">
          <Input
            label="Role Name"
            required
            value={roleName}
            onChange={e => setRoleName(e.target.value)}
            placeholder="e.g. conference-manager"
            disabled={editRole && UNDELETABLE_ROLES.includes(editRole.name)}
            hint={editRole && UNDELETABLE_ROLES.includes(editRole.name) ? 'Built-in role name cannot be changed' : undefined}
          />

          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Permissions</p>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {Object.entries(groups).map(([mod, perms]) => {
                const names = perms.map(p => p.name);
                const allSelected = names.every(n => selectedPerms.includes(n));
                const someSelected = names.some(n => selectedPerms.includes(n));
                return (
                  <div key={mod} className="border border-gray-100 dark:border-slate-700 rounded-lg p-3">
                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={() => toggleGroup(perms)}
                        className="rounded border-gray-300 dark:border-slate-600 text-blue-600"
                      />
                      <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 capitalize">
                        {mod}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 pl-5">
                      {perms.map(p => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedPerms.includes(p.name)}
                            onChange={() => togglePerm(p.name)}
                            className="rounded border-gray-300 dark:border-slate-600 text-blue-600"
                          />
                          <span className="text-xs text-gray-600 dark:text-slate-400">
                            {p.name.split('.')[1] ?? p.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-700">
            <p className="text-xs text-gray-400 dark:text-slate-500">{selectedPerms.length} permissions selected</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setFormModal(false)}>Cancel</Button>
              <Button loading={saveMutation.isPending} onClick={handleSave}>
                {editRole ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Role"
        message={`Delete role "${deleteTarget?.name}"? Users with this role will lose their permissions.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
