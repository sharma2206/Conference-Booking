import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Auth pages — small, load eagerly
import Login from '../pages/Auth/Login';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword';

// Protected pages — lazy loaded for code splitting
const Dashboard       = lazy(() => import('../pages/Dashboard/Dashboard'));
const HallList        = lazy(() => import('../pages/Halls/HallList'));
const HallForm        = lazy(() => import('../pages/Halls/HallForm'));
const HallDetails     = lazy(() => import('../pages/Halls/HallDetails'));
const BookingList     = lazy(() => import('../pages/Bookings/BookingList'));
const BookingForm     = lazy(() => import('../pages/Bookings/BookingForm'));
const BookingDetails  = lazy(() => import('../pages/Bookings/BookingDetails'));
const CalendarPage    = lazy(() => import('../pages/Calendar/CalendarPage'));
const ApprovalsPage   = lazy(() => import('../pages/Approvals/ApprovalsPage'));
const UsersPage       = lazy(() => import('../pages/Users/UsersPage'));
const RolesPage       = lazy(() => import('../pages/Roles/RolesPage'));
const DepartmentsPage = lazy(() => import('../pages/Departments/DepartmentsPage'));
const VisitorsPage    = lazy(() => import('../pages/Visitors/VisitorsPage'));
const CateringPage    = lazy(() => import('../pages/Catering/CateringPage'));
const ResourcesPage   = lazy(() => import('../pages/Resources/ResourcesPage'));
const ReportsPage     = lazy(() => import('../pages/Reports/ReportsPage'));
const AuditLogsPage   = lazy(() => import('../pages/AuditLogs/AuditLogsPage'));
const SettingsPage    = lazy(() => import('../pages/Settings/SettingsPage'));
const ProfilePage     = lazy(() => import('../pages/Profile/ProfilePage'));
const NotificationsPage = lazy(() => import('../pages/Notifications/NotificationsPage'));

// White-label & branding pages — lazy loaded
const BrandingPage       = lazy(() => import('../pages/Branding/BrandingPage'));
const ThemesPage         = lazy(() => import('../pages/Branding/ThemesPage'));
const LoginCustomPage    = lazy(() => import('../pages/Branding/LoginCustomPage'));
const NavigationBuilder  = lazy(() => import('../pages/Navigation/NavigationBuilder'));
const ModulesPage        = lazy(() => import('../pages/Modules/ModulesPage'));
const DashboardBuilder   = lazy(() => import('../pages/DashboardBuilder/DashboardBuilder'));
const PageBuilderPage    = lazy(() => import('../pages/PageBuilder/PageBuilderPage'));
const EmailBrandingPage  = lazy(() => import('../pages/EmailBranding/EmailBrandingPage'));
const ReportBuilderPage  = lazy(() => import('../pages/ReportBuilder/ReportBuilderPage'));
const FileManagerPage    = lazy(() => import('../pages/FileManager/FileManagerPage'));

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"           element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* ── All authenticated users ────────────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/profile"       element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* ── Halls — requires hall.view ─────────────────────── */}
      <Route element={<ProtectedRoute permission="hall.view" />}>
        <Route path="/halls"          element={<HallList />} />
        <Route path="/halls/new"      element={<HallForm />} />
        <Route path="/halls/:id"      element={<HallDetails />} />
        <Route path="/halls/:id/edit" element={<HallForm />} />
      </Route>

      {/* ── Bookings — requires booking.view ───────────────── */}
      <Route element={<ProtectedRoute permission="booking.view" />}>
        <Route path="/bookings"          element={<BookingList />} />
        <Route path="/bookings/new"      element={<BookingForm />} />
        <Route path="/bookings/:id"      element={<BookingDetails />} />
        <Route path="/bookings/:id/edit" element={<BookingForm />} />
        <Route path="/calendar"          element={<CalendarPage />} />
      </Route>

      {/* ── Approvals — requires booking.approve ───────────── */}
      <Route element={<ProtectedRoute permission="booking.approve" />}>
        <Route path="/approvals" element={<ApprovalsPage />} />
      </Route>

      {/* ── Users — requires user.view ─────────────────────── */}
      <Route element={<ProtectedRoute permission="user.view" />}>
        <Route path="/users" element={<UsersPage />} />
      </Route>

      {/* ── Roles — requires role.view ─────────────────────── */}
      <Route element={<ProtectedRoute permission="role.view" />}>
        <Route path="/roles" element={<RolesPage />} />
      </Route>

      {/* ── Departments — requires department.view ─────────── */}
      <Route element={<ProtectedRoute permission="department.view" />}>
        <Route path="/departments" element={<DepartmentsPage />} />
      </Route>

      {/* ── Visitors — requires visitor.view ───────────────── */}
      <Route element={<ProtectedRoute permission="visitor.view" />}>
        <Route path="/visitors" element={<VisitorsPage />} />
      </Route>

      {/* ── Catering — requires catering.view ──────────────── */}
      <Route element={<ProtectedRoute permission="catering.view" />}>
        <Route path="/catering" element={<CateringPage />} />
      </Route>

      {/* ── Resources — requires resource.view ─────────────── */}
      <Route element={<ProtectedRoute permission="resource.view" />}>
        <Route path="/resources" element={<ResourcesPage />} />
      </Route>

      {/* ── Reports — requires report.view ─────────────────── */}
      <Route element={<ProtectedRoute permission="report.view" />}>
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      {/* ── Audit Logs — requires audit.view ───────────────── */}
      <Route element={<ProtectedRoute permission="audit.view" />}>
        <Route path="/audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* ── Settings — requires settings.view ──────────────── */}
      <Route element={<ProtectedRoute permission="settings.view" />}>
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* ── White-label & Branding — requires settings.view ─ */}
      <Route element={<ProtectedRoute permission="settings.view" />}>
        <Route path="/settings/branding"            element={<BrandingPage />} />
        <Route path="/settings/themes"              element={<ThemesPage />} />
        <Route path="/settings/login-customization" element={<LoginCustomPage />} />
        <Route path="/settings/navigation"          element={<NavigationBuilder />} />
        <Route path="/settings/modules"             element={<ModulesPage />} />
        <Route path="/settings/dashboard-builder"   element={<DashboardBuilder />} />
        <Route path="/settings/page-builder"        element={<PageBuilderPage />} />
        <Route path="/settings/email-branding"      element={<EmailBrandingPage />} />
        <Route path="/settings/report-builder"      element={<ReportBuilderPage />} />
        <Route path="/settings/file-manager"        element={<FileManagerPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
