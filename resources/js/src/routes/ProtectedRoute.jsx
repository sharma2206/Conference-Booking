import { Suspense } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectIsAuthenticated } from '../store/authSlice';
import { useAuth } from '../hooks/useAuth';
import MainLayout from '../layouts/MainLayout';
import Forbidden from '../components/Forbidden';

function PageLoader() {
  return (
    <div
      className="flex items-center justify-center min-h-64"
      role="status"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-3">
        <svg
          className="animate-spin h-8 w-8 text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-gray-500 dark:text-slate-400">Loading…</span>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute — wraps authenticated routes.
 *
 * Props:
 *   permission  – (string)  single permission required (e.g. "hall.view")
 *   permissions – (string[]) any of these permissions required (OR logic)
 *
 * If neither is provided, only authentication is checked (all logged-in users pass).
 */
export default function ProtectedRoute({ permission, permissions }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { hasPermission, hasAnyPermission } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Permission check
  let allowed = true;
  if (permission) {
    allowed = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = hasAnyPermission(permissions);
  }

  return (
    <MainLayout>
      <Suspense fallback={<PageLoader />}>
        {allowed ? <Outlet /> : <Forbidden />}
      </Suspense>
    </MainLayout>
  );
}
