// FILE: resources/js/src/pages/Branding/BrandingPage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Palette, Building2, Image, Type, LayoutGrid, LogIn, Upload, X, Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useBranding } from '../../contexts/BrandingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';

const TABS = [
  { id: 'company',    label: 'Company',    icon: Building2 },
  { id: 'colors',     label: 'Colors',     icon: Palette },
  { id: 'assets',     label: 'Assets',     icon: Image },
  { id: 'typography', label: 'Typography', icon: Type },
  { id: 'components', label: 'Components', icon: LayoutGrid },
  { id: 'login',      label: 'Login',      icon: LogIn },
];

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Montserrat',
  'Source Sans Pro', 'Nunito', 'Raleway', 'Ubuntu', 'Noto Sans', 'DM Sans',
];

const COLOR_FIELDS = [
  { key: 'primary_color',   label: 'Primary Color' },
  { key: 'secondary_color', label: 'Secondary Color' },
  { key: 'accent_color',    label: 'Accent Color' },
  { key: 'success_color',   label: 'Success Color' },
  { key: 'danger_color',    label: 'Danger Color' },
  { key: 'warning_color',   label: 'Warning Color' },
  { key: 'info_color',      label: 'Info Color' },
];

const ASSET_FIELDS = [
  { key: 'logo',                 label: 'Main Logo',             hint: 'Recommended: 200×60px PNG' },
  { key: 'dark_logo',            label: 'Dark Mode Logo',        hint: 'Used on dark backgrounds' },
  { key: 'light_logo',           label: 'Light Mode Logo',       hint: 'Used on light backgrounds' },
  { key: 'favicon',              label: 'Favicon',               hint: 'Recommended: 32×32px ICO/PNG' },
  { key: 'apple_icon',           label: 'Apple Touch Icon',      hint: 'Recommended: 180×180px PNG' },
  { key: 'splash_logo',          label: 'Splash / Loading Logo', hint: 'Shown on app loading screen' },
  { key: 'login_background',     label: 'Login Background',      hint: 'Full-page background image' },
  { key: 'dashboard_background', label: 'Dashboard Background',  hint: 'Optional dashboard bg' },
  { key: 'banner',               label: 'Banner Image',          hint: 'Top banner / hero image' },
  { key: 'footer_image',         label: 'Footer Image',          hint: 'Footer decorative image' },
  { key: 'email_header',         label: 'Email Header',          hint: 'Used in outgoing emails' },
];

// ---------- Live Color Preview Sidebar ----------
function ColorPreview({ colors }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Live Preview</p>
      <div
        className="rounded-xl p-4 space-y-3 border border-gray-200 dark:border-slate-700"
        style={{ background: colors.secondary_color || '#1e293b' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded" style={{ background: colors.primary_color || '#3b82f6' }} />
          <span className="text-white text-xs font-medium">Brand Primary</span>
        </div>
        <button
          className="w-full py-1.5 px-3 rounded text-white text-xs font-medium"
          style={{
            background: colors.primary_color || '#3b82f6',
            borderRadius: `${colors.button_radius || 8}px`,
          }}
        >
          Primary Button
        </button>
        <div className="flex gap-1.5">
          {COLOR_FIELDS.map(f => (
            <div
              key={f.key}
              className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0"
              style={{ background: colors[f.key] || '#ccc' }}
              title={f.label}
            />
          ))}
        </div>
        <div
          className="rounded p-2 bg-white/10"
          style={{ borderRadius: `${colors.card_border_radius || 12}px` }}
        >
          <p className="text-white text-xs opacity-70">Card preview</p>
          <p className="text-white text-xs font-medium mt-0.5">Sample Card Content</p>
        </div>
      </div>
    </div>
  );
}

// ---------- Asset Upload Field ----------
function AssetUploadField({ fieldKey, label, hint, currentUrl, onUpload }) {
  const [preview, setPreview] = useState(currentUrl || null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setPreview(currentUrl || null); }, [currentUrl]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('key', fieldKey);
      const r = await api.post('/branding/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onUpload(fieldKey, r.data.url || r.data.data?.url);
      toast.success(`${label} uploaded`);
    } catch {
      toast.error(`Failed to upload ${label}`);
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</p>
          {hint && <p className="text-xs text-gray-400 dark:text-slate-500">{hint}</p>}
        </div>
        {preview && (
          <button
            onClick={() => { setPreview(null); onUpload(fieldKey, null); }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {preview ? (
        <div className="relative w-full h-24 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
          <img src={preview} alt={label} className="w-full h-full object-contain" />
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors bg-gray-50 dark:bg-slate-800">
          <Upload className="h-5 w-5 text-gray-400 dark:text-slate-500 mb-1" />
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {uploading ? 'Uploading…' : 'Click to upload'}
          </span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
        </label>
      )}
    </div>
  );
}

// ---------- Main Page ----------
export default function BrandingPage() {
  const [activeTab, setActiveTab] = useState('company');
  const { refresh } = useBranding();
  const qc = useQueryClient();

  const { data: brandingData, isLoading, isError } = useQuery({
    queryKey: ['branding'],
    queryFn: () => api.get('/branding').then(r => {
      // Response: { data: { general: { company_name: {value,type,...} }, colors: {...} } }
      // Flatten to: { company_name: 'Conference Booking', primary_color: '#3b82f6', ... }
      const grouped = r.data.data || r.data;
      const flat = {};
      Object.values(grouped).forEach(group => {
        if (group && typeof group === 'object') {
          Object.entries(group).forEach(([key, setting]) => {
            flat[key] = typeof setting === 'object' && setting !== null ? setting.value : setting;
          });
        }
      });
      return flat;
    }),
  });

  const [form, setForm] = useState({});
  useEffect(() => { if (brandingData) setForm(brandingData); }, [brandingData]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const saveMutation = useMutation({
    // Controller expects: { settings: [{key, value}, ...] }
    mutationFn: (flat) => {
      const settings = Object.entries(flat).map(([key, value]) => ({ key, value }));
      return api.post('/branding', { settings }).then(r => r.data);
    },
    onSuccess: () => {
      toast.success('Branding settings saved');
      qc.invalidateQueries({ queryKey: ['branding'] });
      refresh();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save branding settings'),
  });

  function saveTab() {
    saveMutation.mutate(form);
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-5">
        <div className="h-8 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Failed to load branding settings.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => qc.invalidateQueries({ queryKey: ['branding'] })}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Branding & White-Label</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Customize your application's look and feel</p>
      </div>

      {/* Tab Nav */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-slate-700 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{TABS.find(t => t.id === activeTab)?.label} Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Company Tab */}
              {activeTab === 'company' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Company Name" required value={form.company_name || ''} onChange={e => set('company_name', e.target.value)} placeholder="Conference Booking" />
                    <Input label="Short Name / Acronym" value={form.short_name || ''} onChange={e => set('short_name', e.target.value)} placeholder="CB" />
                  </div>
                  <Input label="Tagline" value={form.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="Book your space, inspire your team" />
                  <Textarea label="Description" value={form.description || ''} onChange={e => set('description', e.target.value)} rows={4} placeholder="Brief description of your organization…" />
                </>
              )}

              {/* Colors Tab */}
              {activeTab === 'colors' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={form[key] || '#3b82f6'}
                          onChange={e => set(key, e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                        />
                        <input
                          type="text"
                          value={form[key] || ''}
                          onChange={e => set(key, e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Assets Tab */}
              {activeTab === 'assets' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {ASSET_FIELDS.map(({ key, label, hint }) => (
                    <AssetUploadField
                      key={key}
                      fieldKey={key}
                      label={label}
                      hint={hint}
                      currentUrl={form[`${key}_url`] || null}
                      onUpload={(k, url) => set(`${k}_url`, url)}
                    />
                  ))}
                </div>
              )}

              {/* Typography Tab */}
              {activeTab === 'typography' && (
                <div className="space-y-5">
                  <Select
                    label="Font Family"
                    value={form.font_family || 'Inter'}
                    onChange={e => set('font_family', e.target.value)}
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </Select>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Base Font Size: <span className="font-bold text-blue-600">{form.font_size || 14}px</span>
                    </label>
                    <input
                      type="range" min={12} max={18} step={1}
                      value={form.font_size || 14}
                      onChange={e => set('font_size', e.target.value)}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 dark:text-slate-500">
                      <span>12px (Small)</span>
                      <span>18px (Large)</span>
                    </div>
                  </div>
                  <Select
                    label="Heading Style"
                    value={form.heading_style || 'normal'}
                    onChange={e => set('heading_style', e.target.value)}
                  >
                    <option value="normal">Normal Weight</option>
                    <option value="bold">Bold</option>
                    <option value="light">Light</option>
                    <option value="italic">Italic</option>
                  </Select>
                  {/* Preview */}
                  <div className="rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-2" style={{ fontFamily: `"${form.font_family || 'Inter'}", sans-serif`, fontSize: `${form.font_size || 14}px` }}>
                    <p className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-sans">Typography Preview</p>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontWeight: form.heading_style === 'light' ? 300 : form.heading_style === 'bold' ? 800 : 700, fontStyle: form.heading_style === 'italic' ? 'italic' : 'normal' }}>
                      Conference Hall Booking
                    </h2>
                    <p className="text-gray-600 dark:text-slate-300">Reserve your space for meetings, events, and workshops with ease.</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Small print and metadata text appears at this size.</p>
                  </div>
                </div>
              )}

              {/* Components Tab */}
              {activeTab === 'components' && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Button Border Radius: <span className="font-bold text-blue-600">{form.button_radius || 8}px</span>
                    </label>
                    <input
                      type="range" min={0} max={24} step={1}
                      value={form.button_radius || 8}
                      onChange={e => set('button_radius', e.target.value)}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex gap-3 mt-2">
                      <button
                        className="px-4 py-2 text-sm text-white font-medium bg-blue-600"
                        style={{ borderRadius: `${form.button_radius || 8}px` }}
                      >
                        Sample Button
                      </button>
                      <button
                        className="px-4 py-2 text-sm font-medium border border-blue-600 text-blue-600"
                        style={{ borderRadius: `${form.button_radius || 8}px` }}
                      >
                        Outline Button
                      </button>
                    </div>
                  </div>

                  <Select label="Button Style" value={form.button_style || 'filled'} onChange={e => set('button_style', e.target.value)}>
                    <option value="filled">Filled</option>
                    <option value="outline">Outline</option>
                    <option value="soft">Soft / Ghost</option>
                  </Select>

                  <Select label="Button Shadow" value={form.button_shadow || 'none'} onChange={e => set('button_shadow', e.target.value)}>
                    <option value="none">None</option>
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </Select>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Card Border Radius: <span className="font-bold text-blue-600">{form.card_border_radius || 12}px</span>
                    </label>
                    <input
                      type="range" min={0} max={24} step={1}
                      value={form.card_border_radius || 12}
                      onChange={e => set('card_border_radius', e.target.value)}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Table Header Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.table_header_color || '#f8fafc'}
                        onChange={e => set('table_header_color', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                      />
                      <span className="text-sm text-gray-600 dark:text-slate-300 font-mono">{form.table_header_color || '#f8fafc'}</span>
                    </div>
                  </div>

                  <Select label="Table Border Style" value={form.table_border_style || 'default'} onChange={e => set('table_border_style', e.target.value)}>
                    <option value="default">Default</option>
                    <option value="striped">Striped Rows</option>
                    <option value="bordered">All Borders</option>
                    <option value="minimal">Minimal</option>
                  </Select>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Card Background Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={form.card_background || '#ffffff'}
                        onChange={e => set('card_background', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                      />
                      <span className="text-sm text-gray-600 dark:text-slate-300 font-mono">{form.card_background || '#ffffff'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Tab */}
              {activeTab === 'login' && (
                <div className="space-y-4">
                  <Input label="Login Page Title" value={form.login_title || ''} onChange={e => set('login_title', e.target.value)} placeholder="Welcome Back" />
                  <Textarea label="Welcome Message" value={form.login_welcome || ''} onChange={e => set('login_welcome', e.target.value)} rows={3} placeholder="Sign in to manage your conference halls" />
                  <Textarea label="Footer Text" value={form.login_footer || ''} onChange={e => set('login_footer', e.target.value)} rows={2} placeholder="© 2025 Conference Booking" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Terms of Service URL" type="url" value={form.terms_url || ''} onChange={e => set('terms_url', e.target.value)} placeholder="https://…" />
                    <Input label="Privacy Policy URL" type="url" value={form.privacy_url || ''} onChange={e => set('privacy_url', e.target.value)} placeholder="https://…" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!form.announcement_bar_enabled}
                        onChange={e => set('announcement_bar_enabled', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Show Announcement Bar</span>
                    </label>
                    {form.announcement_bar_enabled && (
                      <Input
                        label="Announcement Text"
                        value={form.announcement_bar || ''}
                        onChange={e => set('announcement_bar', e.target.value)}
                        placeholder="System maintenance scheduled for Sunday 2AM…"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-slate-700">
                <Button onClick={saveTab} loading={saveMutation.isPending} icon={Eye}>
                  Save {TABS.find(t => t.id === activeTab)?.label} Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Sidebar */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ColorPreview colors={form} />
              {form.logo_url && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Logo</p>
                  <img src={form.logo_url} alt="Logo" className="max-h-12 object-contain rounded" />
                </div>
              )}
              {form.company_name && (
                <div className="mt-4 space-y-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Identity</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{form.company_name}</p>
                  {form.tagline && <p className="text-xs text-gray-500 dark:text-slate-400">{form.tagline}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
