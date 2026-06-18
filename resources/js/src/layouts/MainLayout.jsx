import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  LayoutDashboard, Building2, CalendarDays, Users, Shield, Building,
  ClipboardList, UserCheck, Coffee, Package, BarChart3, Settings,
  LogOut, Bell, ChevronDown, Menu, X, User, FileText, Calendar,
} from 'lucide-react';
import { logoutUser } from '../store/authSlice';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import api from '../api/axios';
import { API } from '../api/endpoints';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/halls', label: 'Halls', icon: Building2 },
  { path: '/bookings', label: 'Bookings', icon: CalendarDays },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/approvals', label: 'Approvals', icon: ClipboardList },
  { path: '/departments', label: 'Departments', icon: Building },
  { path: '/users', label: 'Users', icon: Users },
  { path: '/roles', label: 'Roles', icon: Shield },
  { path: '/visitors', label: 'Visitors', icon: UserCheck },
  { path: '/catering', label: 'Catering', icon: Coffee },
  { path: '/resources', label: 'Resources', icon: Package },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/audit-logs', label: 'Audit Logs', icon: FileText },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    api.get(API.NOTIFICATIONS_UNREAD).then(r => setUnreadCount(r.data.count || 0)).catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openNotif = async () => {
    if (!notifOpen) {
      try {
        const r = await api.get(API.NOTIFICATIONS, { params: { per_page: 8 } });
        setNotifications(r.data.data || []);
      } catch {}
    }
    setNotifOpen(v => !v);
  };

  const markAllRead = async () => {
    await api.post(API.NOTIFICATIONS_MARK_READ);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const activeLabel = navItems.find(n => location.pathname === n.path || location.pathname.startsWith(n.path + '/'))?.label || '';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={cn('flex flex-col bg-slate-900 flex-shrink-0 transition-all duration-200', collapsed ? 'w-16' : 'w-60')}>
        {/* Brand */}
        <div className={cn('flex items-center h-16 border-b border-slate-800', collapsed ? 'justify-center px-2' : 'px-4 gap-2.5')}>
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          {!collapsed && <span className="text-white font-semibold text-sm truncate">Conference Booking</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                to={path}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-colors',
                  active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                  collapsed && 'justify-center'
                )}
              >
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed && <span className="truncate font-medium">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex items-center justify-center h-10 border-t border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-10">
          <p className="text-base font-semibold text-gray-800">{activeLabel}</p>
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={openNotif} className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0
                      ? <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
                      : notifications.map(n => (
                          <div key={n.id} className={cn('px-4 py-3 hover:bg-gray-50 transition-colors', !n.read_at && 'bg-blue-50/50')}>
                            <p className="text-sm font-medium text-gray-900 leading-tight">{n.data?.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.data?.message}</p>
                          </div>
                        ))
                    }
                  </div>
                  <div className="px-4 py-2.5 border-t border-gray-100">
                    <Link to="/notifications" className="text-xs text-blue-600 hover:underline" onClick={() => setNotifOpen(false)}>
                      View all →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User */}
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 leading-none truncate max-w-24">{user?.name}</p>
                  <p className="text-xs text-gray-400 capitalize truncate max-w-24">
                    {(user?.roles?.[0]?.name || user?.roles?.[0] || 'user').replace(/-/g, ' ')}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
                  <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
