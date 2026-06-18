import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Coffee, ShoppingCart, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState } from '../../components/ui/Table';
import { Modal, ConfirmModal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';

const menuSchema = z.object({
  name: z.string().min(2, 'Name required'),
  category: z.string().min(1, 'Category required'),
  price: z.coerce.number().min(0, 'Price required'),
  unit: z.string().min(1, 'Unit required'),
  description: z.string().optional(),
  is_available: z.boolean().default(true),
});

const TABS = ['Menus', 'Orders'];

export default function CateringPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('Menus');
  const [page, setPage] = useState(1);
  const [formModal, setFormModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: menusData, isLoading: menusLoading } = useQuery({
    queryKey: ['catering-menus', page],
    queryFn: () => api.get(API.CATERING_MENUS, { params: { page, per_page: 15 } }).then(r => r.data),
    enabled: tab === 'Menus',
  });
  const menus = menusData?.data || [];
  const menusMeta = menusData?.meta;

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['catering-orders', page],
    queryFn: () => api.get(API.CATERING_ORDERS, { params: { page, per_page: 15 } }).then(r => r.data),
    enabled: tab === 'Orders',
  });
  const orders = ordersData?.data || [];
  const ordersMeta = ordersData?.meta;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(menuSchema),
    defaultValues: { is_available: true },
  });

  const openCreate = () => { setEditItem(null); reset({ is_available: true }); setFormModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    reset({ name: item.name, category: item.category, price: item.price, unit: item.unit, description: item.description || '', is_available: item.is_available });
    setFormModal(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editItem) return api.put(API.CATERING_MENU(editItem.id), data).then(r => r.data);
      return api.post(API.CATERING_MENUS, data).then(r => r.data);
    },
    onSuccess: () => {
      toast.success(editItem ? 'Menu item updated' : 'Menu item created');
      qc.invalidateQueries({ queryKey: ['catering-menus'] });
      setFormModal(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(API.CATERING_MENU(id)),
    onSuccess: () => { toast.success('Item deleted'); qc.invalidateQueries({ queryKey: ['catering-menus'] }); setDeleteTarget(null); },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Catering Management</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Manage menus and catering orders</p>
        </div>
        {tab === 'Menus' && (
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Menu Item</Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Menus' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <Table>
            <Thead>
              <tr>
                <Th>Item</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Unit</Th>
                <Th>Available</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </Thead>
            <Tbody>
              {menusLoading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Loading…</td></tr>
              ) : menus.length === 0 ? (
                <EmptyState icon={Coffee} title="No menu items" description="Add catering menu items" />
              ) : menus.map(m => (
                <Tr key={m.id}>
                  <Td>
                    <p className="font-medium text-gray-900 dark:text-white">{m.name}</p>
                    {m.description && <p className="text-xs text-gray-400 dark:text-slate-500">{m.description}</p>}
                  </Td>
                  <Td><Badge variant="info">{m.category}</Badge></Td>
                  <Td>₹{parseFloat(m.price).toFixed(2)}</Td>
                  <Td>{m.unit}</Td>
                  <Td><Badge variant={m.is_available ? 'success' : 'default'}>{m.is_available ? 'Yes' : 'No'}</Badge></Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination meta={menusMeta} onPageChange={setPage} />
        </div>
      )}

      {tab === 'Orders' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <Table>
            <Thead>
              <tr>
                <Th>Order #</Th>
                <Th>Booking</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </Thead>
            <Tbody>
              {ordersLoading ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-gray-400">Loading…</td></tr>
              ) : orders.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="No orders" description="Catering orders will appear here" />
              ) : orders.map(o => (
                <Tr key={o.id}>
                  <Td><span className="font-mono text-xs">#{o.id}</span></Td>
                  <Td>{o.booking?.title || `Booking #${o.booking_id}`}</Td>
                  <Td>₹{parseFloat(o.total_cost || 0).toFixed(2)}</Td>
                  <Td><Badge variant={{ pending: 'warning', confirmed: 'success', delivered: 'info', cancelled: 'danger' }[o.status] || 'default'}>{o.status}</Badge></Td>
                  <Td>{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          <Pagination meta={ordersMeta} onPageChange={setPage} />
        </div>
      )}

      <Modal isOpen={formModal} onClose={() => setFormModal(false)} title={editItem ? 'Edit Menu Item' : 'Add Menu Item'}>
        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Item Name" required error={errors.name?.message} {...register('name')} />
            <Select label="Category" required error={errors.category?.message} {...register('category')}>
              <option value="">Select</option>
              <option value="beverages">Beverages</option>
              <option value="snacks">Snacks</option>
              <option value="meals">Meals</option>
              <option value="desserts">Desserts</option>
            </Select>
            <Input label="Price (₹)" type="number" step="0.01" min="0" required error={errors.price?.message} {...register('price')} />
            <Input label="Unit" placeholder="per person / per cup" required error={errors.unit?.message} {...register('unit')} />
          </div>
          <Input label="Description" {...register('description')} />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-gray-300 dark:border-slate-600 text-blue-600" {...register('is_available')} />
            <span className="text-sm text-gray-700 dark:text-slate-300">Available for ordering</span>
          </label>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={() => setFormModal(false)}>Cancel</Button>
            <Button type="submit" loading={saveMutation.isPending}>{editItem ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Menu Item"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
