import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Edit2, Trash2, RefreshCw } from 'lucide-react';
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
  name: z.string().min(2, 'Name required'),
  type: z.string().min(1, 'Type required'),
  total_quantity: z.coerce.number().int().min(1),
  description: z.string().optional(),
  status: z.enum(['available', 'unavailable']),
});

export default function ResourcesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [formModal, setFormModal] = useState(false);
  const [editResource, setEditResource] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['resources', page],
    queryFn: () => api.get(API.RESOURCES, { params: { page, per_page: 15 } }).then(r => r.data),
  });
  const resources = data?.data || [];
  const meta = data?.meta;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'available' },
  });

  const openCreate = () => { setEditResource(null); reset({ status: 'available' }); setFormModal(true); };
  const openEdit = (r) => {
    setEditResource(r);
    reset({ name: r.name, type: r.type, total_quantity: r.total_quantity, description: r.description || '', status: r.status });
    setFormModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editResource) return api.put(API.RESOURCE(editResource.id), data).then(r => r.data);
      return api.post(API.RESOURCES, data).then(r => r.data);
    },
    onSuccess: () => {
      toast.success(editResource ? 'Resource updated' : 'Resource created');
      qc.invalidateQueries({ queryKey: ['resources'] });
      setFormModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(API.RESOURCE(id)),
    onSuccess: () => { toast.success('Resource deleted'); qc.invalidateQueries({ queryKey: ['resources'] }); setDeleteTarget(null); },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Resources</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage bookable resources and equipment</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Resource</Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>Resource</Th>
              <Th>Type</Th>
              <Th>Total</Th>
              <Th>Available</Th>
              <Th>Booked</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : resources.length === 0 ? (
              <EmptyState icon={Package} title="No resources" description="Add equipment and resources" />
            ) : resources.map(r => {
              const available = r.available_quantity ?? (r.total_quantity - (r.booked_quantity || 0));
              return (
                <Tr key={r.id}>
                  <Td>
                    <p className="font-medium text-gray-900 dark:text-white">{r.name}</p>
                    {r.description && <p className="text-xs text-gray-400 dark:text-slate-500">{r.description}</p>}
                  </Td>
                  <Td><Badge variant="info">{r.type}</Badge></Td>
                  <Td>{r.total_quantity}</Td>
                  <Td>
                    <span className={`font-semibold ${available > 0 ? 'text-green-600' : 'text-red-500'}`}>{available}</span>
                  </Td>
                  <Td>{r.booked_quantity || 0}</Td>
                  <Td><Badge variant={r.status === 'available' ? 'success' : 'default'}>{r.status}</Badge></Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal isOpen={formModal} onClose={() => setFormModal(false)} title={editResource ? 'Edit Resource' : 'Add Resource'}>
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Resource Name" required error={errors.name?.message} {...register('name')} />
            <Select label="Type" required error={errors.type?.message} {...register('type')}>
              <option value="">Select type</option>
              <option value="laptop">Laptop</option>
              <option value="projector">Projector</option>
              <option value="speaker">Speaker</option>
              <option value="microphone">Microphone</option>
              <option value="whiteboard">Whiteboard</option>
              <option value="camera">Camera</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Total Quantity" type="number" min={1} required error={errors.total_quantity?.message} {...register('total_quantity')} />
            <Select label="Status" {...register('status')}>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </Select>
          </div>
          <Textarea label="Description" rows={2} {...register('description')} />
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={() => setFormModal(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editResource ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Resource"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
