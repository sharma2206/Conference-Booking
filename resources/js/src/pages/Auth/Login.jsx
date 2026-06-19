import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBranding } from '../../contexts/BrandingContext';

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const { branding } = useBranding();

  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (!result.success) {
      setError('root', { message: result.error?.message || 'Invalid credentials' });
    }
  };

  const companyName  = branding.company_name  || 'Conference Booking';
  const loginTitle   = branding.login_title   || 'Welcome back';
  const loginWelcome = branding.login_welcome || `Sign in to ${companyName}`;
  const loginFooter  = branding.login_footer  || `© ${new Date().getFullYear()} ${companyName}`;
  const primaryColor = branding.primary_color || '#3b82f6';
  const announcementEnabled = branding.announcement_bar_enabled;
  const announcement = branding.announcement_bar;

  // Background style
  let bgStyle = {};
  if (branding.bg_type === 'image' && branding.bg_image_url) {
    bgStyle = { backgroundImage: `url(${branding.bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  } else if (branding.bg_type === 'color' && branding.bg_color) {
    bgStyle = { background: branding.bg_color };
  } else {
    bgStyle = { background: 'linear-gradient(135deg, #eef2ff 0%, #fff 50%, #eff6ff 100%)' };
  }

  return (
    <div className="min-h-screen flex flex-col" style={bgStyle}>
      {/* Announcement bar */}
      {announcementEnabled && announcement && (
        <div className="w-full px-4 py-2 text-center text-sm font-medium text-white" style={{ background: primaryColor }}>
          {announcement}
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/60">
          {/* Logo / Brand */}
          <div className="flex flex-col items-center mb-8">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={companyName} className="h-14 object-contain mb-4" />
            ) : (
              <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-4" style={{ background: primaryColor }}>
                <Building2 className="h-7 w-7 text-white" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{loginTitle}</h1>
            <p className="text-sm text-gray-500 mt-1 text-center">{loginWelcome}</p>
          </div>

          {errors.root && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className={`w-full px-3 py-2.5 rounded-lg border text-sm shadow-sm focus:outline-none focus:ring-2 transition ${
                  errors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
                }`}
                {...register('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full px-3 py-2.5 pr-10 rounded-lg border text-sm shadow-sm focus:outline-none focus:ring-2 transition ${
                    errors.password ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                Remember me
              </label>
              <Link to="/forgot-password" className="font-medium hover:underline" style={{ color: primaryColor }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors hover:opacity-90"
              style={{ background: primaryColor, borderRadius: `${branding.button_radius || 8}px` }}
            >
              {loading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Terms / Privacy */}
          {(branding.terms_url || branding.privacy_url) && (
            <div className="flex items-center justify-center gap-3 mt-4 text-xs text-gray-400">
              {branding.terms_url   && <a href={branding.terms_url}   target="_blank" rel="noopener noreferrer" className="hover:underline">Terms of Service</a>}
              {branding.terms_url && branding.privacy_url && <span>·</span>}
              {branding.privacy_url && <a href={branding.privacy_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy Policy</a>}
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-4">{loginFooter}</p>
        </div>
      </div>
    </div>
  );
}
