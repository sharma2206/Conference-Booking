// FILE: resources/js/src/pages/Branding/LoginCustomPage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, Plus, Trash2, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useBranding } from '../../contexts/BrandingContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';

function Toggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</p>
        {hint && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SliderImageList({ images, onAdd, onRemove, onMove }) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('field', 'slider_image');
      const r = await api.post('/branding/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onAdd(r.data.url || r.data.data?.url);
      toast.success('Image added to slider');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">Slider Images</p>
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 transition-colors">
            <Plus className="h-3 w-3" />
            {uploading ? 'Uploading…' : 'Add Image'}
          </span>
          <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
        </label>
      </div>
      <div className="space-y-2">
        {images.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg">
            No slider images. Add at least 2 images.
          </p>
        )}
        {images.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <img src={url} alt={`Slide ${idx + 1}`} className="w-16 h-10 object-cover rounded flex-shrink-0" />
            <p className="flex-1 text-xs text-gray-500 dark:text-slate-400 truncate">{url.split('/').pop()}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => onMove(idx, idx - 1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onMove(idx, idx + 1)} disabled={idx === images.length - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onRemove(idx)} className="p-1 text-gray-400 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mini Login Preview
function LoginPreview({ form }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 text-xs">
      {/* Background area */}
      <div
        className="h-32 flex items-center justify-center relative"
        style={{
          background: form.bg_type === 'color'
            ? (form.bg_color || '#1e293b')
            : form.bg_image_url
            ? `url(${form.bg_image_url}) center/cover`
            : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        }}
      >
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 shadow-lg w-36 space-y-2">
          <p className="text-[10px] font-bold text-gray-900 dark:text-white text-center">{form.login_title || 'Welcome Back'}</p>
          <p className="text-[9px] text-gray-400 dark:text-slate-500 text-center leading-tight">{form.login_welcome || 'Sign in to continue'}</p>
          <div className="space-y-1.5">
            <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded-md" />
            <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded-md" />
            <div className="h-5 bg-blue-600 rounded-md" />
          </div>
        </div>
      </div>
      {/* Footer */}
      <div className="px-3 py-1.5 bg-gray-50 dark:bg-slate-900 text-[9px] text-gray-400 dark:text-slate-600 text-center truncate">
        {form.login_footer || '© 2025 Conference Booking'}
      </div>
    </div>
  );
}

export default function LoginCustomPage() {
  const qc = useQueryClient();
  const { refresh } = useBranding();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['branding-login'],
    queryFn: () => api.get('/branding').then(r => r.data.data || r.data),
  });

  const [form, setForm] = useState({
    login_title: '',
    login_welcome: '',
    login_footer: '',
    terms_url: '',
    privacy_url: '',
    announcement_bar: '',
    announcement_bar_enabled: false,
    company_video: '',
    bg_type: 'color',
    bg_color: '#1e293b',
    bg_image_url: null,
    bg_slider_images: [],
    otp_login_enabled: false,
    google_login: false,
    microsoft_login: false,
    sso_enabled: false,
    sso_provider: 'saml',
    sso_url: '',
  });

  useEffect(() => {
    if (data) {
      setForm(prev => ({
        ...prev,
        login_title: data.login_title || '',
        login_welcome: data.login_welcome || '',
        login_footer: data.login_footer || '',
        terms_url: data.terms_url || '',
        privacy_url: data.privacy_url || '',
        announcement_bar: data.announcement_bar || '',
        announcement_bar_enabled: !!data.announcement_bar_enabled,
        company_video: data.company_video || '',
        bg_type: data.bg_type || 'color',
        bg_color: data.bg_color || '#1e293b',
        bg_image_url: data.bg_image_url || null,
        bg_slider_images: Array.isArray(data.bg_slider_images) ? data.bg_slider_images : [],
        otp_login_enabled: !!data.otp_login_enabled,
        google_login: !!data.google_login,
        microsoft_login: !!data.microsoft_login,
        sso_enabled: !!data.sso_enabled,
        sso_provider: data.sso_provider || 'saml',
        sso_url: data.sso_url || '',
      }));
    }
  }, [data]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: (payload) => api.post('/branding', payload).then(r => r.data),
    onSuccess: () => {
      toast.success('Login customization saved');
      qc.invalidateQueries({ queryKey: ['branding-login'] });
      refresh();
    },
    onError: () => toast.error('Failed to save login settings'),
  });

  const [bgUploading, setBgUploading] = useState(false);
  async function handleBgUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('field', 'login_background');
      const r = await api.post('/branding/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('bg_image_url', r.data.url || r.data.data?.url);
      toast.success('Background uploaded');
    } catch {
      toast.error('Failed to upload background');
    } finally {
      setBgUploading(false);
      e.target.value = '';
    }
  }

  function moveSlide(from, to) {
    if (to < 0 || to >= form.bg_slider_images.length) return;
    const imgs = [...form.bg_slider_images];
    [imgs[from], imgs[to]] = [imgs[to], imgs[from]];
    set('bg_slider_images', imgs);
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-5">
        <div className="h-8 w-56 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Login Page Customization</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Customize the login page appearance and authentication options</p>
      </div>

      {isError && (
        <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 text-sm text-yellow-700 dark:text-yellow-400">
          Could not load existing settings. Your changes will be saved as new values.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        <div className="xl:col-span-3 space-y-5">

          {/* Content */}
          <Card>
            <CardHeader><CardTitle>Login Content</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input label="Login Title" value={form.login_title} onChange={e => set('login_title', e.target.value)} placeholder="Welcome Back" />
              <Textarea label="Welcome Message" value={form.login_welcome} onChange={e => set('login_welcome', e.target.value)} rows={3} placeholder="Sign in to manage your conference halls" />
              <Textarea label="Footer Text" value={form.login_footer} onChange={e => set('login_footer', e.target.value)} rows={2} placeholder="© 2025 Conference Booking" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Terms of Service URL" type="url" value={form.terms_url} onChange={e => set('terms_url', e.target.value)} placeholder="https://…" />
                <Input label="Privacy Policy URL" type="url" value={form.privacy_url} onChange={e => set('privacy_url', e.target.value)} placeholder="https://…" />
              </div>
              <Input label="Company Video URL" type="url" value={form.company_video} onChange={e => set('company_video', e.target.value)} placeholder="https://youtube.com/embed/…" hint="Shown as background or side video on login page" />
              <div className="space-y-2">
                <Toggle
                  label="Show Announcement Bar"
                  hint="Display a banner message at the top of the login page"
                  checked={form.announcement_bar_enabled}
                  onChange={v => set('announcement_bar_enabled', v)}
                />
                {form.announcement_bar_enabled && (
                  <Input value={form.announcement_bar} onChange={e => set('announcement_bar', e.target.value)} placeholder="Scheduled maintenance on Sunday 2AM…" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Background */}
          <Card>
            <CardHeader><CardTitle>Background</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Select label="Background Type" value={form.bg_type} onChange={e => set('bg_type', e.target.value)}>
                <option value="color">Solid Color</option>
                <option value="image">Single Image</option>
                <option value="slider">Image Slider</option>
              </Select>

              {form.bg_type === 'color' && (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.bg_color || '#1e293b'}
                    onChange={e => set('bg_color', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-300 dark:border-slate-600 cursor-pointer p-0.5 bg-white dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    value={form.bg_color || ''}
                    onChange={e => set('bg_color', e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="#1e293b"
                  />
                </div>
              )}

              {form.bg_type === 'image' && (
                <div className="space-y-3">
                  {form.bg_image_url ? (
                    <div className="relative h-40 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                      <img src={form.bg_image_url} alt="Login background" className="w-full h-full object-cover" />
                      <button
                        onClick={() => set('bg_image_url', null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-gray-50 dark:bg-slate-800">
                      <Upload className="h-6 w-6 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-400">{bgUploading ? 'Uploading…' : 'Click to upload background image'}</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleBgUpload} />
                    </label>
                  )}
                </div>
              )}

              {form.bg_type === 'slider' && (
                <SliderImageList
                  images={form.bg_slider_images}
                  onAdd={url => set('bg_slider_images', [...form.bg_slider_images, url])}
                  onRemove={idx => set('bg_slider_images', form.bg_slider_images.filter((_, i) => i !== idx))}
                  onMove={moveSlide}
                />
              )}
            </CardContent>
          </Card>

          {/* Authentication Options */}
          <Card>
            <CardHeader><CardTitle>Authentication Options</CardTitle></CardHeader>
            <CardContent>
              <Toggle
                label="OTP / Passwordless Login"
                hint="Allow users to sign in via one-time password sent to their email"
                checked={form.otp_login_enabled}
                onChange={v => set('otp_login_enabled', v)}
              />
              <Toggle
                label="Google Login"
                hint="Show 'Sign in with Google' button on login page"
                checked={form.google_login}
                onChange={v => set('google_login', v)}
              />
              <Toggle
                label="Microsoft Login"
                hint="Show 'Sign in with Microsoft' button on login page"
                checked={form.microsoft_login}
                onChange={v => set('microsoft_login', v)}
              />
            </CardContent>
          </Card>

          {/* SSO */}
          <Card>
            <CardHeader><CardTitle>Single Sign-On (SSO)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                label="Enable SSO"
                hint="Redirect users to your identity provider for authentication"
                checked={form.sso_enabled}
                onChange={v => set('sso_enabled', v)}
              />
              {form.sso_enabled && (
                <>
                  <Select label="SSO Provider" value={form.sso_provider} onChange={e => set('sso_provider', e.target.value)}>
                    <option value="saml">SAML 2.0</option>
                    <option value="oauth">OAuth 2.0 / OIDC</option>
                  </Select>
                  <Input
                    label="SSO URL"
                    type="url"
                    value={form.sso_url}
                    onChange={e => set('sso_url', e.target.value)}
                    placeholder={form.sso_provider === 'saml' ? 'https://idp.example.com/sso/saml' : 'https://auth.example.com/oauth/authorize'}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate(form)} loading={saveMutation.isPending}>
              Save Login Settings
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
            <CardContent>
              <LoginPreview form={form} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
