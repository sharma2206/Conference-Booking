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

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"           element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      {/* Protected routes — Suspense boundary is inside ProtectedRoute */}
      <Route element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"         element={<Dashboard />} />
        <Route path="/halls"             element={<HallList />} />
        <Route path="/halls/new"         element={<HallForm />} />
        <Route path="/halls/:id"         element={<HallDetails />} />
        <Route path="/halls/:id/edit"    element={<HallForm />} />
        <Route path="/bookings"          element={<BookingList />} />
        <Route path="/bookings/new"      element={<BookingForm />} />
        <Route path="/bookings/:id"      element={<BookingDetails />} />
        <Route path="/bookings/:id/edit" element={<BookingForm />} />
        <Route path="/calendar"          element={<CalendarPage />} />
        <Route path="/approvals"         element={<ApprovalsPage />} />
        <Route path="/users"             element={<UsersPage />} />
        <Route path="/roles"             element={<RolesPage />} />
        <Route path="/departments"       element={<DepartmentsPage />} />
        <Route path="/visitors"          element={<VisitorsPage />} />
        <Route path="/catering"          element={<CateringPage />} />
        <Route path="/resources"         element={<ResourcesPage />} />
        <Route path="/reports"           element={<ReportsPage />} />
        <Route path="/audit-logs"        element={<AuditLogsPage />} />
        <Route path="/settings"          element={<SettingsPage />} />
        <Route path="/profile"           element={<ProfilePage />} />
        <Route path="/notifications"     element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
