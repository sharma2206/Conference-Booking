import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser, selectAuth, selectUser } from '../store/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector(selectAuth);
  const user = useSelector(selectUser);

  const login = async (credentials) => {
    const result = await dispatch(loginUser(credentials));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
      return { success: true };
    }
    return { success: false, error: result.payload };
  };

  const logout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const hasRole = (role) => {
    if (!user?.roles) return false;
    const roles = Array.isArray(user.roles) ? user.roles : [];
    return roles.some(r => (typeof r === 'string' ? r : r.name) === role);
  };

  const hasAnyRole = (roles) => roles.some(r => hasRole(r));

  const hasPermission = (permission) => {
    if (!user) return false;
    if (hasRole('super-admin')) return true;
    const perms = user.permissions || [];
    return perms.some(p => (typeof p === 'string' ? p : p.name) === permission);
  };

  const hasAnyPermission = (permissions) => {
    if (!user) return false;
    if (hasRole('super-admin')) return true;
    return permissions.some(p => hasPermission(p));
  };

  // Alias for cleaner component usage
  const can = hasPermission;

  return {
    user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    can,
  };
}
