// FILE: resources/js/src/contexts/BrandingContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

export { useTheme } from './ThemeContext';

const BrandingContext = createContext(null);

const DEFAULTS = {
  company_name: 'Conference Booking',
  short_name: 'CB',
  tagline: 'Book your space, inspire your team',
  description: '',
  primary_color: '#3b82f6',
  secondary_color: '#1e293b',
  accent_color: '#8b5cf6',
  success_color: '#10b981',
  danger_color: '#ef4444',
  warning_color: '#f59e0b',
  info_color: '#06b6d4',
  font_family: 'Inter',
  font_size: '14',
  heading_style: 'normal',
  button_radius: '8',
  button_style: 'filled',
  button_shadow: 'none',
  table_header_color: '#f8fafc',
  table_border_style: 'default',
  card_border_radius: '12',
  card_background: '#ffffff',
  login_title: 'Welcome Back',
  login_welcome: 'Sign in to manage your conference halls',
  login_footer: '© 2025 Conference Booking. All rights reserved.',
  terms_url: '',
  privacy_url: '',
  announcement_bar: '',
  announcement_bar_enabled: false,
  logo_url: null,
  dark_logo_url: null,
  light_logo_url: null,
  favicon_url: null,
};

function injectCssVars(config) {
  const root = document.documentElement;
  const map = {
    primary_color:      '--brand-primary',
    secondary_color:    '--brand-secondary',
    accent_color:       '--brand-accent',
    success_color:      '--brand-success',
    danger_color:       '--brand-danger',
    warning_color:      '--brand-warning',
    info_color:         '--brand-info',
    font_family:        '--brand-font-family',
    font_size:          '--brand-font-size',
    button_radius:      '--brand-btn-radius',
    card_border_radius: '--brand-card-radius',
  };
  Object.entries(map).forEach(([key, cssVar]) => {
    if (config[key] != null) root.style.setProperty(cssVar, config[key]);
  });
  if (config.font_family) {
    root.style.setProperty('font-family', `"${config.font_family}", ui-sans-serif, system-ui, sans-serif`);
  }
}

export function BrandingProvider({ children }) {
  const [branding, setBranding]       = useState(DEFAULTS);
  const [loading, setLoading]         = useState(true);
  const [activeTheme, setActiveTheme] = useState(null);

  const fetchBranding = useCallback(async () => {
    try {
      const r = await api.get('/branding/public');
      // publicConfig() returns { data: { branding: {...}, css_variables, generated_at }, theme }
      const payload = r.data.data || r.data;
      const raw     = payload.branding || payload; // flatten nested branding key
      const config  = { ...DEFAULTS, ...raw };
      setBranding(config);
      injectCssVars(config);
      if (payload.theme || r.data.theme) setActiveTheme(payload.theme || r.data.theme);
    } catch {
      injectCssVars(DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranding(); }, [fetchBranding]);

  const refresh = useCallback(() => fetchBranding(), [fetchBranding]);

  return (
    <BrandingContext.Provider value={{ branding, loading, activeTheme, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error('useBranding must be used within BrandingProvider');
  return ctx;
}
