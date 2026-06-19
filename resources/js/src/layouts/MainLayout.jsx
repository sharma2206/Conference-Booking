import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  LayoutDashboard, Building2, CalendarDays, Users, Shield, Building,
  ClipboardList, UserCheck, Coffee, Package, BarChart3, Settings,
  LogOut, Bell, ChevronDown, ChevronLeft, ChevronRight, Menu, X,
  User, FileText, Calendar, Sun, Moon, Search,
  Palette, Layers, LogIn, Navigation, Puzzle, LayoutGrid,
  FileEdit, Mail, PieChart, FolderOpen,
} from 'lucide-react';
import { logoutUser } from '../store/authSlice';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import api from '../api/axios';
import { API } from '../api/endpoints';

const NAV_ITEMS = [
  { path: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard, permission: null },
  { path: '/halls',       label: 'Halls',        icon: Building2,      permission: 'hall.view' },
  { path: '/bookings',    label: 'Bookings',     icon: CalendarDays,   permission: 'booking.view' },
  { path: '/calendar',    label: 'Calendar',     icon: Calendar,       permission: 'booking.view' },
  { path: '/approvals',   label: 'Approvals',    icon: ClipboardList,  permission: 'booking.approve' },
  { path: '/departments', label: 'Departments',  icon: Building,       permission: 'department.view' },
  { path: '/users',       label: 'Users',        icon: Users,          permission: 'user.view' },
  { path: '/roles',       label: 'Roles',        icon: Shield,         permission: 'role.view' },
  { path: '/visitors',    label: 'Visitors',     icon: UserCheck,      permission: 'visitor.view' },
  { path: '/catering',    label: 'Catering',     icon: Coffee,         permission: 'catering.view' },
  { path: '/resources',   label: 'Resources',    icon: Package,        permission: 'resource.view' },
  { path: '/reports',     label: 'Reports',      icon: BarChart3,      permission: 'report.view' },
  { path: '/audit-logs',  label: 'Audit Logs',   icon: FileText,       permission: 'audit.view' },
  { path: '/settings',    label: 'Settings',     icon: Settings,       permission: 'settings.view' },
  // White-label sub-pages (listed after /settings so breadcrumb exact-match wins)
  { type: 'separator', label: 'White Label',     permission: 'settings.view' },
  { path: '/settings/branding',            label: 'Brand Settings',    icon: Palette,     permission: 'settings.view' },
  { path: '/settings/themes',              label: 'Themes',            icon: Layers,      permission: 'settings.view' },
  { path: '/settings/login-customization', label: 'Login Page',        icon: LogIn,       permission: 'settings.view' },
  { path: '/settings/navigation',          label: 'Navigation',        icon: Navigation,  permission: 'settings.view' },
  { path: '/settings/modules',             label: 'Modules',           icon: Puzzle,      permission: 'settings.view' },
  { path: '/settings/dashboard-builder',   label: 'Dashboard Builder', icon: LayoutGrid,  permission: 'settings.view' },
  { path: '/settings/page-builder',        label: 'Page Builder',      icon: FileEdit,    permission: 'settings.view' },
  { path: '/settings/email-branding',      label: 'Email Templates',   icon: Mail,        permission: 'settings.view' },
  { path: '/settings/report-builder',      label: 'Report Builder',    icon: PieChart,    permission: 'settings.view' },
  { path: '/settings/file-manager',        label: 'File Manager',      icon: FolderOpen,  permission: 'settings.view' },
];

function SidebarContent({ collapsed, onLinkClick, visibleItems }) {
  const location = useLocation();
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5" aria-label="Main navigation">
      {visibleItems.map((item) => {
        if (item.type === 'separator') {
          return (
            <div key={`sep-${item.label}`} className={cn(
              'pt-4 pb-1 px-2.5',
              'md:hidden',
              !collapsed && 'lg:block',
            )}>
              <hr className="border-slate-700/60 mb-2" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
            </div>
          );
        }
        const { path, label, icon: Icon } = item;
        const active = location.pathname === path || location.pathname.startsWith(path + '/');
        return (
          <Link
            key={path}
            to={path}
            title={label}
            onClick={onLinkClick}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
              'px-2.5 py-2',
              active
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
              'md:justify-center md:px-2',
              !collapsed && 'lg:justify-start lg:px-2.5',
              collapsed  && 'lg:justify-center lg:px-2',
            )}
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" aria-hidden="true" />
            <span className={cn(
              'truncate',
              'md:hidden',
              !collapsed && 'lg:inline',
            )}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function useBreadcrumbs() {
  const location = useLocation();
  // Exact-match first so /settings/branding wins over /settings
  const activeItem = NAV_ITEMS.filter(n => !n.type).find(n =>
    location.pathname === n.path
  ) ?? NAV_ITEMS.filter(n => !n.type).find(n =>
    location.pathname.startsWith(n.path + '/')
  );
  if (!activeItem) return [];
  const crumbs = [{ label: activeItem.label, path: activeItem.path }];
  const sub = location.pathname.slice(activeItem.path.length).replace(/^\//, '');
  if (!sub) return crumbs;
  const segs = sub.split('/');
  if (segs[0] === 'new') {
    crumbs.push({ label: 'New' });
  } else if (segs[0]) {
    const displayId = /^\d+$/.test(segs[0]) ? `#${segs[0]}` : segs[0];
    crumbs.push({ label: displayId, path: `${activeItem.path}/${segs[0]}` });
    if (segs[1] === 'edit') crumbs.push({ label: 'Edit' });
  }
  return crumbs;
}

export default function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [collapsed, setCollapsed]         = useState(false);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifications, setNotifications] = useState([]);

  const { user, hasPermission }       = useAuth();

  // Filter nav items — separators shown when user has the required permission
  const visibleItems = NAV_ITEMS.filter(item =>
    !item.permission || hasPermission(item.permission)
  );
  const { isDark, toggle: toggleTheme } = useTheme();
  const dispatch                     = useDispatch();
  const location                     = useLocation();
  const navigate                     = useNavigate();
  const notifRef                     = useRef(null);
  const userMenuRef                  = useRef(null);
  const breadcrumbs                  = useBreadcrumbs();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setMobileOpen(false);
      setUserMenuOpen(false);
      setNotifOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // FE-06: poll for unread count every 60s (not on every navigation)
  useEffect(() => {
    const fetchUnread = () => {
      if (document.visibilityState !== 'visible') return;
      api.get(API.NOTIFICATIONS_UNREAD)
        .then(r => setUnreadCount(r.data.count ?? 0))
        .catch((e) => console.error('Failed to fetch notification count', e));
    };

    fetchUnread(); // initial fetch on mount
    const interval = setInterval(fetchUnread, 60_000);
    document.addEventListener('visibilitychange', fetchUnread);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', fetchUnread);
    };
  }, []);

  const openNotif = async () => {
    if (!notifOpen) {
      try {
        const r = await api.get(API.NOTIFICATIONS, { params: { per_page: 8 } });
        setNotifications(r.data.data ?? []);
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    }
    setNotifOpen(v => !v);
  };

  const markAllRead = async () => {
    try {
      await api.post(API.NOTIFICATIONS_MARK_READ);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    } catch (e) {
      console.error('Failed to mark notifications as read', e);
      toast.error('Could not mark notifications as read');
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  const userRole    = (user?.roles?.[0]?.name ?? user?.roles?.[0] ?? 'user').replace(/-/g, ' ');

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 overflow-hidden">
      {/* Skip navigation link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
      >
        Skip to main content
      </a>

      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden',
          'transition-opacity duration-300',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        id="sidebar"
        aria-label="Application sidebar"
        className={cn(
          'flex flex-col flex-shrink-0',
          'bg-slate-900 dark:bg-slate-950',
          // Mobile: fixed overlay drawer
          'fixed inset-y-0 left-0 z-40 w-64',
          // Tablet+: part of normal flow
          'md:relative md:z-auto',
          // Mobile animation via transform
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          // Width: tablet always icon-only, desktop follows collapsed state
          'md:w-16',
          !collapsed ? 'lg:w-64' : 'lg:w-16',
          'transition-all duration-300 ease-in-out',
        )}
      >
        {/* Brand */}
        <div className="flex items-center h-16 border-b border-slate-800 dark:border-slate-700 flex-shrink-0 px-3 gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className={cn(
            'text-white font-semibold text-sm truncate flex-1',
            'md:hidden',
            !collapsed && 'lg:block',
          )}>
            Conference Booking
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 text-slate-400 hover:text-white transition-colors md:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <SidebarContent collapsed={collapsed} onLinkClick={() => setMobileOpen(false)} visibleItems={visibleItems} />

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className={cn(
            'hidden lg:flex items-center justify-center h-10',
            'border-t border-slate-800 dark:border-slate-700',
            'text-slate-500 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-700',
            'transition-colors',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" aria-hidden="true" />
            : <ChevronLeft  className="h-4 w-4" aria-hidden="true" />
          }
        </button>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header className={cn(
          'h-16 flex-shrink-0 z-20',
          'bg-white dark:bg-slate-800',
          'border-b border-gray-200 dark:border-slate-700',
          'flex items-center gap-2 sm:gap-3 px-4 sm:px-6',
        )}>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            aria-controls="sidebar"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm flex-1 min-w-0 overflow-hidden">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1 shrink-0 last:shrink last:min-w-0">
                {i > 0 && (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-gray-300 dark:text-slate-600 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                {i < breadcrumbs.length - 1 && crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors hidden sm:inline whitespace-nowrap"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>

          {/* Right-side actions */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

            {/* Search — navigates to /bookings?search=<query> on Enter */}
            <form
              role="search"
              className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg px-3 py-1.5 w-40 md:w-48 lg:w-60"
              onSubmit={(e) => {
                e.preventDefault();
                const q = e.currentTarget.elements.search.value.trim();
                if (q) navigate(`/bookings?search=${encodeURIComponent(q)}`);
              }}
            >
              <Search className="h-4 w-4 text-gray-400 dark:text-slate-400 flex-shrink-0" aria-hidden="true" />
              <input
                name="search"
                type="search"
                placeholder="Search bookings…"
                className="bg-transparent text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 outline-none w-full"
                aria-label="Search bookings"
              />
            </form>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark
                ? <Sun  className="h-5 w-5" aria-hidden="true" />
                : <Moon className="h-5 w-5" aria-hidden="true" />
              }
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={openNotif}
                className="relative p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={notifOpen}
                aria-haspopup="dialog"
              >
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    className="absolute top-1 right-1 h-4 min-w-4 px-0.5 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold"
                    aria-hidden="true"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  role="dialog"
                  aria-label="Notifications panel"
                  className={cn(
                    'absolute right-0 mt-2 w-80 max-w-[calc(100vw-1rem)]',
                    'bg-white dark:bg-slate-800',
                    'rounded-2xl shadow-2xl',
                    'border border-gray-100 dark:border-slate-700',
                    'z-50 animate-fade-in',
                  )}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-700/50">
                    {notifications.length === 0 ? (
                      <li className="py-10 text-center">
                        <Bell className="h-8 w-8 text-gray-200 dark:text-slate-600 mx-auto mb-2" aria-hidden="true" />
                        <p className="text-sm text-gray-400 dark:text-slate-500">No notifications</p>
                      </li>
                    ) : notifications.map(n => (
                      <li
                        key={n.id}
                        className={cn(
                          'px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors',
                          !n.read_at && 'bg-blue-50/60 dark:bg-blue-900/10',
                        )}
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                          {n.data?.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {n.data?.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700">
                    <Link
                      to="/notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
                aria-label="User menu"
              >
                <div
                  className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 select-none"
                  aria-hidden="true"
                >
                  {userInitial}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight max-w-[6rem]">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.name}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-slate-400 capitalize truncate">
                    {userRole}
                  </span>
                </div>
                <ChevronDown
                  className={cn(
                    'hidden sm:block h-3.5 w-3.5 text-gray-400 dark:text-slate-400 transition-transform duration-200',
                    userMenuOpen && 'rotate-180',
                  )}
                  aria-hidden="true"
                />
              </button>

              {userMenuOpen && (
                <div
                  role="menu"
                  aria-label="User options"
                  className={cn(
                    'absolute right-0 mt-2 w-52',
                    'bg-white dark:bg-slate-800',
                    'rounded-2xl shadow-2xl',
                    'border border-gray-100 dark:border-slate-700',
                    'z-50 py-1 animate-fade-in',
                  )}
                >
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <User className="h-4 w-4 text-gray-400 dark:text-slate-400" aria-hidden="true" />
                    Profile
                  </Link>
                  {hasPermission('settings.view') && (
                    <Link
                      to="/settings"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="h-4 w-4 text-gray-400 dark:text-slate-400" aria-hidden="true" />
                      Settings
                    </Link>
                  )}
                  <hr className="my-1 border-gray-100 dark:border-slate-700" />
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
