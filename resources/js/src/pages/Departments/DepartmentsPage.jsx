import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building, Edit2, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState } from '../../components/ui/Table';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

export default function DepartmentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formModal, setFormModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['departments', page, search],
    queryFn: () => api.get(API.DEPARTMENTS, { params: { page, search, per_page: 15 } }).then(r => r.data),
  });
  const depts = data?.data || [];
  const meta = data?.meta;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' },
  });

  const openCreate = () => { setEditDept(null); reset({ status: 'active' }); setFormModal(true); };
  const openEdit = (d) => {
    setEditDept(d);
    reset({ name: d.name, code: d.code, description: d.description || '', status: d.status });
    setFormModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (editDept) return api.put(API.DEPARTMENT(editDept.id), payload).then(r => r.data);
      return api.post(API.DEPARTMENTS, payload).then(r => r.data);
    },
    onSuccess: () => {
      toast.success(editDept ? 'Department updated' : 'Department created');
      qc.invalidateQueries({ queryKey: ['departments'] });
      setFormModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(API.DEPARTMENT(id)),
    onSuccess: () => { toast.success('Department deleted'); qc.invalidateQueries({ queryKey: ['departments'] }); setDeleteTarget(null); },
    onError: () => toast.error('Cannot delete this department'),
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage organizational departments</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Department</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search departments…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>Department</Th>
              <Th>Code</Th>
              <Th>Head</Th>
              <Th>Users</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : depts.length === 0 ? (
              <EmptyState icon={Building} title="No departments" description="Add organizational departments" />
            ) : depts.map(d => (
              <Tr key={d.id}>
                <Td>
                  <p className="font-medium text-gray-900">{d.name}</p>
                  {d.description && <p className="text-xs text-gray-400 truncate max-w-xs">{d.description}</p>}
                </Td>
                <Td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{d.code}</span></Td>
                <Td>{d.head?.name || '—'}</Td>
                <Td>{d.users_count ?? '—'}</Td>
                <Td><Badge variant={d.status === 'active' ? 'success' : 'default'}>{d.status}</Badge></Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal isOpen={formModal} onClose={() => setFormModal(false)} title={editDept ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department Name" required error={errors.name?.message} {...register('name')} />
            <Input label="Code" required placeholder="e.g. IT" error={errors.code?.message} {...register('code')} />
          </div>
          <Textarea label="Description" rows={2} {...register('description')} />
          <Select label="Status" {...register('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={() => setFormModal(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editDept ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Department"
        message={`Delete "${deleteTarget?.name}"? All associated data will be affected.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
