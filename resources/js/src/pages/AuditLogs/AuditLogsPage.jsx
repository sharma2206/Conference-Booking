import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText } from 'lucide-react';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Table, Thead, Th, Tbody, Tr, Td, Pagination, EmptyState } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { formatDate } from '../../lib/utils';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [detail, setDetail] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search, module],
    queryFn: () => api.get(API.AUDIT_LOGS, { params: { page, search, module, per_page: 20 } }).then(r => r.data),
  });
  const logs = data?.data || [];
  const meta = data?.meta;

  const { data: modules = [] } = useQuery({
    queryKey: ['audit-modules'],
    queryFn: () => api.get(API.AUDIT_MODULES).then(r => r.data.data || r.data),
  });

  const actionBadge = {
    created: 'success', updated: 'warning', deleted: 'danger',
    approved: 'success', rejected: 'danger', login: 'info', logout: 'default',
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">System activity and change history</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={module}
          onChange={e => { setModule(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">All Modules</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>User</Th>
              <Th>Action</Th>
              <Th>Module</Th>
              <Th>Description</Th>
              <Th>IP</Th>
              <Th>Date & Time</Th>
            </tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Loading…</td></tr>
            ) : logs.length === 0 ? (
              <EmptyState icon={FileText} title="No audit logs" description="Activity will be tracked here" />
            ) : logs.map(log => (
              <Tr key={log.id} onClick={() => setDetail(log)}>
                <Td>
                  <p className="font-medium text-gray-900">{log.user?.name || log.causer?.name || 'System'}</p>
                  <p className="text-xs text-gray-400">{log.user?.email || log.causer?.email}</p>
                </Td>
                <Td>
                  <Badge variant={actionBadge[log.action] || 'default'}>
                    {log.action || log.event}
                  </Badge>
                </Td>
                <Td>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                    {log.module || log.subject_type?.split('\\').pop()}
                  </span>
                </Td>
                <Td>
                  <p className="text-sm text-gray-600 truncate max-w-xs">
                    {log.description || log.log_name}
                  </p>
                </Td>
                <Td><span className="text-xs font-mono text-gray-400">{log.ip_address || '—'}</span></Td>
                <Td>
                  <p className="text-sm">{formatDate(log.created_at)}</p>
                  <p className="text-xs text-gray-400">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Audit Log Detail" size="lg">
        {detail && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">User</p>
                <p className="font-medium">{detail.user?.name || detail.causer?.name || 'System'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Action</p>
                <Badge variant={actionBadge[detail.action] || 'default'}>{detail.action || detail.event}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Module</p>
                <p>{detail.module || detail.subject_type?.split('\\').pop()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Record ID</p>
                <p className="font-mono text-xs">{detail.record_id || detail.subject_id}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Description</p>
                <p>{detail.description || detail.log_name}</p>
              </div>
            </div>
            {(detail.old_values || detail.properties?.old) && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Changes</p>
                <pre className="bg-gray-50 rounded-lg p-3 text-xs overflow-auto max-h-48 text-gray-700">
                  {JSON.stringify(detail.old_values || detail.properties?.old, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
