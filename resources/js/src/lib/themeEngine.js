// FILE: resources/js/src/lib/themeEngine.js

/**
 * Convert a hex color string to HSL components as a string "H S% L%"
 */
export function hexToHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const lig = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    sat = lig > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: hue = ((b - r) / d + 2) / 6; break;
      case b: hue = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(hue * 360)} ${Math.round(sat * 100)}% ${Math.round(lig * 100)}%`;
}

/**
 * Apply a full theme json_config to CSS variables on document.documentElement
 */
export function applyTheme(config) {
  if (!config) return;
  const root = document.documentElement;
  const colorMap = {
    primary:   '--brand-primary',
    secondary: '--brand-secondary',
    accent:    '--brand-accent',
    success:   '--brand-success',
    danger:    '--brand-danger',
    warning:   '--brand-warning',
    info:      '--brand-info',
  };
  Object.entries(colorMap).forEach(([key, cssVar]) => {
    const val = config[key] || config[`${key}_color`];
    if (val) root.style.setProperty(cssVar, val);
  });
  if (config.font_family)        root.style.setProperty('--brand-font-family', config.font_family);
  if (config.font_size)          root.style.setProperty('--brand-font-size', String(config.font_size));
  if (config.button_radius != null) root.style.setProperty('--brand-btn-radius', String(config.button_radius));
  if (config.card_radius != null)   root.style.setProperty('--brand-card-radius', String(config.card_radius));
  if (config.dark_mode) {
    root.classList.add('dark');
  }
}

/**
 * Generate a CSS :root { } block string from a config object
 */
export function generateCssRoot(config) {
  if (!config) return '';
  const lines = [':root {'];
  const colorMap = {
    primary:   '--brand-primary',
    secondary: '--brand-secondary',
    accent:    '--brand-accent',
    success:   '--brand-success',
    danger:    '--brand-danger',
    warning:   '--brand-warning',
    info:      '--brand-info',
  };
  Object.entries(colorMap).forEach(([key, cssVar]) => {
    const val = config[key] || config[`${key}_color`];
    if (val) lines.push(`  ${cssVar}: ${val};`);
  });
  if (config.font_family)        lines.push(`  --brand-font-family: "${config.font_family}";`);
  if (config.font_size)          lines.push(`  --brand-font-size: ${config.font_size}px;`);
  if (config.button_radius != null) lines.push(`  --brand-btn-radius: ${config.button_radius}px;`);
  if (config.card_radius != null)   lines.push(`  --brand-card-radius: ${config.card_radius}px;`);
  lines.push('}');
  return lines.join('\n');
}

/**
 * Built-in theme presets
 */
export const BUILTIN_THEMES = {
  corporate: {
    name: 'Corporate',
    primary:   '#1e40af',
    secondary: '#1e293b',
    accent:    '#3b82f6',
    success:   '#16a34a',
    danger:    '#dc2626',
    warning:   '#d97706',
    info:      '#0891b2',
    font_family: 'Inter',
    font_size: 14,
    button_radius: 6,
    card_radius: 8,
    dark_mode: false,
  },
  hospital: {
    name: 'Hospital',
    primary:   '#0891b2',
    secondary: '#164e63',
    accent:    '#06b6d4',
    success:   '#10b981',
    danger:    '#ef4444',
    warning:   '#f59e0b',
    info:      '#3b82f6',
    font_family: 'Inter',
    font_size: 14,
    button_radius: 4,
    card_radius: 8,
    dark_mode: false,
  },
  education: {
    name: 'Education',
    primary:   '#7c3aed',
    secondary: '#1e1b4b',
    accent:    '#a855f7',
    success:   '#10b981',
    danger:    '#ef4444',
    warning:   '#f59e0b',
    info:      '#06b6d4',
    font_family: 'Inter',
    font_size: 14,
    button_radius: 8,
    card_radius: 12,
    dark_mode: false,
  },
  dark: {
    name: 'Dark',
    primary:   '#818cf8',
    secondary: '#0f172a',
    accent:    '#a78bfa',
    success:   '#34d399',
    danger:    '#f87171',
    warning:   '#fbbf24',
    info:      '#38bdf8',
    font_family: 'Inter',
    font_size: 14,
    button_radius: 8,
    card_radius: 12,
    dark_mode: true,
  },
  light: {
    name: 'Light',
    primary:   '#3b82f6',
    secondary: '#f8fafc',
    accent:    '#8b5cf6',
    success:   '#10b981',
    danger:    '#ef4444',
    warning:   '#f59e0b',
    info:      '#06b6d4',
    font_family: 'Inter',
    font_size: 14,
    button_radius: 8,
    card_radius: 12,
    dark_mode: false,
  },
  blue: {
    name: 'Blue',
    primary:   '#1d4ed8',
    secondary: '#1e3a5f',
    accent:    '#60a5fa',
    success:   '#10b981',
    danger:    '#ef4444',
    warning:   '#f59e0b',
    info:      '#06b6d4',
    font_family: 'Inter',
    font_size: 14,
    button_radius: 8,
    card_radius: 12,
    dark_mode: false,
  },
  green: {
    name: 'Green',
    primary:   '#16a34a',
    secondary: '#14532d',
    accent:    '#4ade80',
    success:   '#22c55e',
    danger:    '#ef4444',
    warning:   '#f59e0b',
    info:      '#06b6d4',
    font_family: 'Inter',
    font_size: 14,
    button_radius: 8,
    card_radius: 12,
    dark_mode: false,
  },
  purple: {
    name: 'Purple',
    primary:   '#7c3aed',
    secondary: '#2e1065',
    accent:    '#c084fc',
    success:   '#10b981',
    danger:    '#ef4444',
    warning:   '#f59e0b',
    info:      '#06b6d4',
    font_family: 'Inter',
    font_size: 14,
    button_radius: 8,
    card_radius: 12,
    dark_mode: false,
  },
  custom: {
    name: 'Custom',
    primary:   '#3b82f6',
    secondary: '#1e293b',
    accent:    '#8b5cf6',
    success:   '#10b981',
    danger:    '#ef4444',
    warning:   '#f59e0b',
    info:      '#06b6d4',
    font_family: 'Inter',
    font_size: 14,
    button_radius: 8,
    card_radius: 12,
    dark_mode: false,
  },
};

/**
 * Color field definitions used across branding UI
 */
export const COLOR_FIELDS = [
  { key: 'primary',   label: 'Primary Color' },
  { key: 'secondary', label: 'Secondary Color' },
  { key: 'accent',    label: 'Accent Color' },
  { key: 'success',   label: 'Success Color' },
  { key: 'danger',    label: 'Danger Color' },
  { key: 'warning',   label: 'Warning Color' },
  { key: 'info',      label: 'Info Color' },
];
