// FILE: resources/js/src/pages/EmailBranding/EmailBrandingPage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail, Settings2, Eye, Send, Upload, X, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const EMAIL_TEMPLATES = [
  { key: 'booking_confirmation',  label: 'Booking Confirmation',  variables: ['{{user_name}}', '{{booking_id}}', '{{hall_name}}', '{{date}}', '{{time}}', '{{company_name}}'] },
  { key: 'booking_approval',      label: 'Booking Approval',      variables: ['{{user_name}}', '{{booking_id}}', '{{hall_name}}', '{{approved_by}}', '{{company_name}}'] },
  { key: 'booking_rejection',     label: 'Booking Rejection',     variables: ['{{user_name}}', '{{booking_id}}', '{{reason}}', '{{company_name}}'] },
  { key: 'booking_cancellation',  label: 'Booking Cancellation',  variables: ['{{user_name}}', '{{booking_id}}', '{{hall_name}}', '{{company_name}}'] },
  { key: 'booking_reminder',      label: 'Booking Reminder',      variables: ['{{user_name}}', '{{hall_name}}', '{{date}}', '{{time}}', '{{minutes_before}}'] },
  { key: 'visitor_invitation',    label: 'Visitor Invitation',    variables: ['{{visitor_name}}', '{{host_name}}', '{{date}}', '{{time}}', '{{location}}', '{{company_name}}'] },
  { key: 'catering_order',        label: 'Catering Order',        variables: ['{{user_name}}', '{{order_id}}', '{{items}}', '{{total}}', '{{date}}'] },
  { key: 'password_reset',        label: 'Password Reset',        variables: ['{{user_name}}', '{{reset_link}}', '{{expires_in}}', '{{company_name}}'] },
  { key: 'welcome_email',         label: 'Welcome Email',         variables: ['{{user_name}}', '{{login_url}}', '{{company_name}}', '{{tagline}}'] },
  { key: 'resource_approval',     label: 'Resource Approval',     variables: ['{{user_name}}', '{{resource_name}}', '{{return_date}}', '{{company_name}}'] },
];

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /><title>Email</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr>
          <td style="background:{{brand_primary}};padding:24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">{{company_name}}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p>Hello {{user_name}},</p>
            <p>Your email content goes here.</p>
            <p>Best regards,<br/>The {{company_name}} Team</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f8f8;padding:16px 40px;text-align:center;font-size:12px;color:#666;">
            © {{year}} {{company_name}}. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const TABS = ['Templates', 'SMTP Settings'];

// SMTP Settings tab
function SmtpSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    mail_from_name: '',
    mail_from_address: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['smtp-settings'],
    queryFn: () => api.get('/settings/smtp').then(r => r.data.data || r.data).catch(() => ({})),
  });

  useEffect(() => { if (data) setForm(p => ({ ...p, ...data })); }, [data]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: (d) => api.put('/settings/smtp', d).then(r => r.data),
    onSuccess: () => { toast.success('SMTP settings saved'); qc.invalidateQueries({ queryKey: ['smtp-settings'] }); },
    onError: () => toast.error('Failed to save SMTP settings'),
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/settings/smtp/test').then(r => r.data),
    onSuccess: () => toast.success('Test email sent successfully'),
    onError: () => toast.error('Failed to send test email. Check your SMTP settings.'),
  });

  if (isLoading) return <div className="py-8 text-center text-sm text-gray-400">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="SMTP Host" value={form.smtp_host} onChange={e => set('smtp_host', e.target.value)} placeholder="smtp.gmail.com" />
        <Input label="SMTP Port" type="number" value={form.smtp_port} onChange={e => set('smtp_port', e.target.value)} placeholder="587" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Username" value={form.smtp_username} onChange={e => set('smtp_username', e.target.value)} placeholder="noreply@example.com" />
        <Input label="Password" type="password" value={form.smtp_password} onChange={e => set('smtp_password', e.target.value)} placeholder="••••••••" />
      </div>
      <Select label="Encryption" value={form.smtp_encryption} onChange={e => set('smtp_encryption', e.target.value)}>
        <option value="tls">TLS (STARTTLS)</option>
        <option value="ssl">SSL</option>
        <option value="none">None</option>
      </Select>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="From Name" value={form.mail_from_name} onChange={e => set('mail_from_name', e.target.value)} placeholder="Conference Booking" />
        <Input label="From Address" type="email" value={form.mail_from_address} onChange={e => set('mail_from_address', e.target.value)} placeholder="noreply@example.com" />
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
        <Button variant="secondary" size="sm" icon={Send} loading={testMutation.isPending} onClick={() => testMutation.mutate()}>
          Send Test Email
        </Button>
        <Button size="sm" loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
          Save SMTP Settings
        </Button>
      </div>
    </div>
  );
}

// Template preview iframe
function TemplatePreview({ html }) {
  const [show, setShow] = useState(false);
  if (!html) return null;
  return (
    <div className="space-y-2">
      <Button size="xs" variant="secondary" icon={Eye} onClick={() => setShow(p => !p)}>
        {show ? 'Hide Preview' : 'Preview Email'}
      </Button>
      {show && (
        <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <iframe
            srcDoc={html}
            title="Email Preview"
            className="w-full h-96 bg-white"
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}

export default function EmailBrandingPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('Templates');
  const [selectedKey, setSelectedKey] = useState(null);
  const [form, setForm] = useState({ subject: '', html: '', logo_url: null });
  const [logoUploading, setLogoUploading] = useState(false);

  const selectedDef = EMAIL_TEMPLATES.find(t => t.key === selectedKey);

  const { data: templates = {}, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => api.get('/email-templates').then(r => r.data.data || r.data).catch(() => ({})),
  });

  useEffect(() => {
    if (selectedKey && templates[selectedKey]) {
      setForm({
        subject:   templates[selectedKey].subject || '',
        html:      templates[selectedKey].html || DEFAULT_HTML,
        logo_url:  templates[selectedKey].logo_url || null,
      });
    } else if (selectedKey) {
      setForm({ subject: selectedDef?.label || '', html: DEFAULT_HTML, logo_url: null });
    }
  }, [selectedKey, templates]);

  const saveMutation = useMutation({
    mutationFn: (data) => api.put(`/email-templates/${selectedKey}`, data).then(r => r.data),
    onSuccess: () => { toast.success('Template saved'); qc.invalidateQueries({ queryKey: ['email-templates'] }); },
    onError: () => toast.error('Failed to save template'),
  });

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('field', 'email_logo');
      const r = await api.post('/branding/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(p => ({ ...p, logo_url: r.data.url || r.data.data?.url }));
      toast.success('Logo uploaded');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  }

  function insertVariable(v) {
    setForm(p => ({ ...p, html: p.html + v }));
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Email Branding</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Customize email templates and SMTP settings</p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'SMTP Settings' && (
        <Card>
          <CardHeader><CardTitle>SMTP Configuration</CardTitle></CardHeader>
          <CardContent><SmtpSettings /></CardContent>
        </Card>
      )}

      {activeTab === 'Templates' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
          {/* Template list */}
          <div className="xl:col-span-1">
            <Card>
              <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
              <CardContent className="p-1">
                {EMAIL_TEMPLATES.map(tmpl => (
                  <button
                    key={tmpl.key}
                    onClick={() => setSelectedKey(tmpl.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      selectedKey === tmpl.key
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{tmpl.label}</span>
                    {templates[tmpl.key] && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 ml-auto" title="Customized" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Template editor */}
          <div className="xl:col-span-3">
            {!selectedKey ? (
              <Card className="min-h-80">
                <CardContent className="flex flex-col items-center justify-center h-80">
                  <Mail className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm text-gray-400 dark:text-slate-500">Select a template to edit</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedDef?.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      label="Subject Line"
                      value={form.subject}
                      onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                      placeholder="Your booking has been confirmed"
                    />

                    {/* Logo */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Email Logo</label>
                      {form.logo_url ? (
                        <div className="flex items-center gap-3">
                          <img src={form.logo_url} alt="Email logo" className="h-10 object-contain rounded border border-gray-200 dark:border-slate-700 p-1 bg-white" />
                          <Button size="xs" variant="secondary" onClick={() => setForm(p => ({ ...p, logo_url: null }))}>
                            <X className="h-3 w-3" /> Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300">
                          <Upload className="h-4 w-4" />
                          {logoUploading ? 'Uploading…' : 'Upload Logo'}
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                      )}
                    </div>

                    {/* Variables */}
                    {selectedDef?.variables?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Available Variables</p>
                        <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                          {selectedDef.variables.map(v => (
                            <button
                              key={v}
                              onClick={() => insertVariable(v)}
                              className="px-2 py-0.5 text-xs font-mono bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                              title="Click to insert"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* HTML editor */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">HTML Template</label>
                        <button
                          onClick={() => setForm(p => ({ ...p, html: DEFAULT_HTML }))}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" /> Reset to default
                        </button>
                      </div>
                      <textarea
                        value={form.html}
                        onChange={e => setForm(p => ({ ...p, html: e.target.value }))}
                        rows={16}
                        className="block w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-xs shadow-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        spellCheck={false}
                      />
                    </div>

                    {/* Preview */}
                    <TemplatePreview html={form.html} />

                    <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-700">
                      <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
                        Save Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
