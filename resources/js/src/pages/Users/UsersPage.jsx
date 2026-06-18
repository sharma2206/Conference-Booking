import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState } from '../../components/ui/Table';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { Modal, ConfirmModal } from '../../components/ui/Modal';

const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Min 8 characters').optional().or(z.literal('')),
  department_id: z.coerce.number().optional().nullable(),
  designation: z.string().optional(),
  phone: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  status: z.enum(['active', 'inactive']),
});

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formModal, setFormModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => api.get(API.USERS, { params: { page, search, per_page: 15 } }).then(r => r.data),
  });
  const users = data?.data ?? [];
  const meta = data?.meta;

  const { data: deptsData } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => api.get(API.DEPARTMENTS_ALL).then(r => r.data.data ?? r.data),
  });
  const departments = deptsData ?? [];

  const { data: rolesData } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => api.get(API.ROLES).then(r => r.data.data ?? r.data),
  });
  const roles = rolesData ?? [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: { status: 'active' },
  });

  const openCreate = () => { setEditUser(null); reset({ status: 'active' }); setFormModal(true); };
  const openEdit = (u) => {
    setEditUser(u);
    reset({
      name: u.name, email: u.email, password: '',
      department_id: u.department_id ?? null,
      designation: u.designation ?? '',
      phone: u.phone ?? '',
      role: u.roles?.[0]?.name ?? u.roles?.[0] ?? '',
      status: u.status ?? 'active',
    });
    setFormModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editUser) return api.put(API.USER(editUser.id), data).then(r => r.data);
      return api.post(API.USERS, data).then(r => r.data);
    },
    onSuccess: () => {
      toast.success(editUser ? 'User updated' : 'User created');
      qc.invalidateQueries({ queryKey: ['users'] });
      setFormModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(API.USER(id)),
    onSuccess: () => {
      toast.success('User deleted');
      qc.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Delete failed'),
  });

  const onSubmit = (data) => {
    const payload = { ...data };
    if (!payload.password) delete payload.password;
    saveMutation.mutate(payload);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage system users and their roles</p>
        </div>
        {hasPermission('user.create') && (
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add User</Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>User</Th>
              <Th>Employee ID</Th>
              <Th>Department</Th>
              <Th>Designation</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <SkeletonTable rows={8} cols={7} />
            ) : users.length === 0 ? (
              <EmptyState icon={Users} title="No users found" description="Add system users" />
            ) : users.map(u => (
              <Tr key={u.id}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 select-none">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="dark:text-slate-400 font-mono text-xs">{u.employee_id || '—'}</Td>
                <Td className="dark:text-slate-300">{u.department?.name || '—'}</Td>
                <Td className="dark:text-slate-300">{u.designation || '—'}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {u.roles?.map(r => (
                      <Badge key={r.id ?? r} variant="info" className="text-xs">
                        {r.name ?? r}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td>
                  <Badge variant={u.status === 'active' ? 'success' : 'default'}>{u.status}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {hasPermission('user.edit') && (
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        aria-label={`Edit ${u.name}`}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {hasPermission('user.delete') && (
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label={`Delete ${u.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      {/* User form modal */}
      <Modal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        title={editUser ? 'Edit User' : 'Add User'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" required error={errors.name?.message} className="sm:col-span-2" {...register('name')} />
          <Input label="Email" required type="email" error={errors.email?.message} {...register('email')} />
          <Input
            label="Password"
            type="password"
            placeholder={editUser ? 'Leave blank to keep' : 'Min 8 chars'}
            error={errors.password?.message}
            {...register('password')}
          />
          <Select label="Department" error={errors.department_id?.message} {...register('department_id')}>
            <option value="">Select department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Input label="Designation" placeholder="e.g. Manager" {...register('designation')} />
          <Input label="Phone" placeholder="+1 555 0123" {...register('phone')} />
          <Select label="Role" required error={errors.role?.message} {...register('role')}>
            <option value="">Select role</option>
            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </Select>
          <Select label="Status" {...register('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={() => setFormModal(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>
              {editUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete User"
        message={`Delete user "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
