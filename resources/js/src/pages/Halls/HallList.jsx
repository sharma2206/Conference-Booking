import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useHalls, useDeleteHall } from '../../hooks/useHalls';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState } from '../../components/ui/Table';
import { ConfirmModal } from '../../components/ui/Modal';
import { cn } from '../../lib/utils';

const statusVariant = { active: 'success', inactive: 'default', maintenance: 'warning' };

export default function HallList() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useHalls({ page, search, status, per_page: 12 });
  const halls = data?.data || [];
  const meta = data?.meta;

  const deleteMutation = useDeleteHall({
    onSuccess: () => { toast.success('Hall deleted'); setDeleteTarget(null); },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hall Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage conference halls and meeting rooms</p>
        </div>
        {hasPermission('hall.create') && (
          <Button onClick={() => navigate('/halls/new')}>
            <Plus className="h-4 w-4" /> Add Hall
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search halls…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>Hall</Th>
              <Th>Code</Th>
              <Th>Building / Location</Th>
              <Th>Capacity</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : halls.length === 0 ? (
              <EmptyState icon={Building2} title="No halls found" description="Add your first conference hall" />
            ) : halls.map(hall => (
              <Tr key={hall.id} onClick={() => navigate(`/halls/${hall.id}`)}>
                <Td>
                  <div>
                    <p className="font-medium text-gray-900">{hall.name}</p>
                    {hall.description && <p className="text-xs text-gray-400 truncate max-w-xs">{hall.description}</p>}
                  </div>
                </Td>
                <Td><span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{hall.code}</span></Td>
                <Td>
                  <p>{hall.building || '—'}</p>
                  <p className="text-xs text-gray-400">{hall.location}</p>
                </Td>
                <Td><span className="font-semibold">{hall.capacity}</span> <span className="text-gray-400 text-xs">pax</span></Td>
                <Td>
                  <Badge variant={statusVariant[hall.status] || 'default'}>{hall.status}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    {hasPermission('hall.edit') && (
                      <button
                        onClick={() => navigate(`/halls/${hall.id}/edit`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {hasPermission('hall.delete') && (
                      <button
                        onClick={() => setDeleteTarget(hall)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Hall"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
