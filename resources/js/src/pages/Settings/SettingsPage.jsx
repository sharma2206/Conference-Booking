import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Settings, Calendar, Clock, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Modal, ConfirmModal } from '../../components/ui/Modal';

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'booking', label: 'Booking Rules', icon: Clock },
  { id: 'notifications', label: 'Notifications', icon: Mail },
  { id: 'holidays', label: 'Holidays', icon: Calendar },
  { id: 'security', label: 'Security', icon: Shield },
];

function SettingsGroup({ group, label }) {
  const qc = useQueryClient();
  const [fields, setFields] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['settings', group],
    queryFn: () => api.get(API.SETTINGS_GROUP(group)).then(r => r.data.data || r.data),
  });

  useEffect(() => {
    if (data) {
      const obj = {};
      if (Array.isArray(data)) {
        data.forEach(s => { obj[s.key] = s.value; });
      } else {
        Object.entries(data).forEach(([k, v]) => { obj[k] = v; });
      }
      setFields(obj);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.put(API.SETTINGS, { settings: fields }).then(r => r.data),
    onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['settings', group] }); },
    onError: () => toast.error('Save failed'),
  });

  if (isLoading) return <div className="py-8 text-center text-sm text-gray-400">Loading…</div>;

  const entries = Object.entries(fields);

  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-3 gap-4 items-center">
          <label className="text-sm font-medium text-gray-700 col-span-1 capitalize">
            {key.replace(/_/g, ' ')}
          </label>
          <div className="col-span-2">
            {typeof value === 'boolean' || value === 'true' || value === 'false' ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value === true || value === 'true'}
                  onChange={e => setFields(p => ({ ...p, [key]: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-600">{key.replace(/_/g, ' ')}</span>
              </label>
            ) : (
              <input
                type={key.includes('time') ? 'time' : key.includes('password') || key.includes('secret') ? 'password' : 'text'}
                value={value ?? ''}
                onChange={e => setFields(p => ({ ...p, [key]: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>
      ))}

      {entries.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No settings in this group.</p>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
          Save {label} Settings
        </Button>
      </div>
    </div>
  );
}

function HolidaysTab() {
  const qc = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => api.get(API.SETTINGS_HOLIDAYS).then(r => r.data.data || r.data),
  });

  const addMutation = useMutation({
    mutationFn: () => api.post(API.SETTINGS_HOLIDAYS, { name, date }).then(r => r.data),
    onSuccess: () => { toast.success('Holiday added'); qc.invalidateQueries({ queryKey: ['holidays'] }); setAddModal(false); setName(''); setDate(''); },
    onError: () => toast.error('Failed to add holiday'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(API.SETTINGS_HOLIDAY(id)),
    onSuccess: () => { toast.success('Holiday deleted'); qc.invalidateQueries({ queryKey: ['holidays'] }); setDeleteTarget(null); },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddModal(true)}><Plus className="h-3.5 w-3.5" /> Add Holiday</Button>
      </div>
      {isLoading ? <div className="text-center text-sm text-gray-400">Loading…</div> : (
        <div className="space-y-2">
          {holidays.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No holidays configured.</p>
          ) : holidays.map(h => (
            <div key={h.id} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{h.name}</p>
                <p className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button onClick={() => setDeleteTarget(h)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add Holiday" size="sm">
        <div className="p-5 space-y-4">
          <Input label="Holiday Name" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Independence Day" />
          <Input label="Date" required type="date" value={date} onChange={e => setDate(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAddModal(false)}>Cancel</Button>
            <Button size="sm" loading={addMutation.isPending} disabled={!name || !date} onClick={() => addMutation.mutate()}>Add</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete Holiday"
        message={`Delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const groupMap = {
    general: 'general',
    booking: 'booking',
    notifications: 'notifications',
    security: 'security',
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure system preferences</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Sidebar */}
        <nav className="xl:col-span-1 space-y-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="xl:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>{TABS.find(t => t.id === activeTab)?.label} Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 'holidays' ? (
                <HolidaysTab />
              ) : (
                <SettingsGroup group={groupMap[activeTab] || activeTab} label={TABS.find(t => t.id === activeTab)?.label} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
