import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, UserCheck, LogIn, LogOut, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  purpose: z.string().min(3, 'Purpose required'),
  host_user_id: z.coerce.number().optional().nullable(),
  booking_id: z.coerce.number().optional().nullable(),
  expected_arrival: z.string().optional(),
  id_type: z.string().optional(),
  id_number: z.string().optional(),
});

const statusVariant = {
  expected: 'info', checked_in: 'success', checked_out: 'default',
  approved: 'success', rejected: 'danger',
};

export default function VisitorsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formModal, setFormModal] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['visitors', page, search],
    queryFn: () => api.get(API.VISITORS, { params: { page, search, per_page: 15 } }).then(r => r.data),
  });
  const visitors = data?.data || [];
  const meta = data?.meta;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (d) => api.post(API.VISITORS, d).then(r => r.data),
    onSuccess: () => { toast.success('Visitor registered'); qc.invalidateQueries({ queryKey: ['visitors'] }); setFormModal(false); reset(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Registration failed'),
  });

  const checkInMutation = useMutation({
    mutationFn: (id) => api.post(API.VISITOR_CHECKIN(id)).then(r => r.data),
    onSuccess: () => { toast.success('Visitor checked in'); refetch(); },
    onError: (e) => toast.error(e.response?.data?.message || 'Check-in failed'),
  });

  const checkOutMutation = useMutation({
    mutationFn: (id) => api.post(API.VISITOR_CHECKOUT(id)).then(r => r.data),
    onSuccess: () => { toast.success('Visitor checked out'); refetch(); },
    onError: () => toast.error('Check-out failed'),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.post(API.VISITOR_APPROVE(id)).then(r => r.data),
    onSuccess: () => { toast.success('Visitor approved by security'); refetch(); },
    onError: () => toast.error('Approval failed'),
  });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Visitor Management</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Track and manage facility visitors</p>
        </div>
        <Button onClick={() => { reset(); setFormModal(true); }}>
          <Plus className="h-4 w-4" /> Register Visitor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder="Search visitors…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>Visitor</Th>
              <Th>Company</Th>
              <Th>Purpose</Th>
              <Th>Expected</Th>
              <Th>Check In</Th>
              <Th>Check Out</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="py-12 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : visitors.length === 0 ? (
              <EmptyState icon={UserCheck} title="No visitors" description="Register a new visitor" />
            ) : visitors.map(v => (
              <Tr key={v.id}>
                <Td>
                  <p className="font-medium text-gray-900 dark:text-white">{v.name}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{v.phone || v.email}</p>
                </Td>
                <Td>{v.company || '—'}</Td>
                <Td><p className="truncate max-w-xs text-xs text-gray-600 dark:text-slate-400">{v.purpose}</p></Td>
                <Td>{v.expected_arrival ? formatDate(v.expected_arrival) : '—'}</Td>
                <Td>{v.check_in_at ? new Date(v.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Td>
                <Td>{v.check_out_at ? new Date(v.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Td>
                <Td><Badge variant={statusVariant[v.status] || 'default'}>{v.status?.replace('_', ' ')}</Badge></Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {v.status === 'expected' && (
                      <button
                        onClick={() => approveMutation.mutate(v.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {!v.check_in_at && (
                      <button
                        onClick={() => checkInMutation.mutate(v.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="Check In"
                      >
                        <LogIn className="h-4 w-4" />
                      </button>
                    )}
                    {v.check_in_at && !v.check_out_at && (
                      <button
                        onClick={() => checkOutMutation.mutate(v.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                        title="Check Out"
                      >
                        <LogOut className="h-4 w-4" />
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

      <Modal isOpen={formModal} onClose={() => setFormModal(false)} title="Register Visitor" size="lg">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="p-5 grid grid-cols-2 gap-4">
          <Input label="Visitor Name" required error={errors.name?.message} {...register('name')} />
          <Input label="Phone" placeholder="+91 98765 43210" {...register('phone')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Company / Organization" {...register('company')} />
          <Input label="Expected Arrival" type="datetime-local" {...register('expected_arrival')} />
          <Select label="ID Type" {...register('id_type')}>
            <option value="">Select ID type</option>
            <option value="aadhar">Aadhar Card</option>
            <option value="pan">PAN Card</option>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving License</option>
          </Select>
          <Input label="ID Number" {...register('id_number')} />
          <Input label="Purpose of Visit" required error={errors.purpose?.message} {...register('purpose')} className="col-span-2" />
          <div className="col-span-2 flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={() => setFormModal(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Register</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
