import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider } from './contexts/ThemeContext';
import { BrandingProvider } from './contexts/BrandingContext';
import AppRoutes from './routes/AppRoutes';
import { fetchCurrentUser, selectIsAuthenticated } from './store/authSlice';

function AppBootstrap({ children }) {
  const dispatch        = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // FE-04: refresh user roles/permissions from server on every app load
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, dispatch]);

  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrandingProvider>
      <BrowserRouter>
        <AppBootstrap>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: '',
              style: {
                background: 'var(--toast-bg, #fff)',
                color: 'var(--toast-color, #111827)',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                fontSize: '0.875rem',
                maxWidth: '380px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </AppBootstrap>
      </BrowserRouter>
      </BrandingProvider>
    </ThemeProvider>
  );
}
