import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import Login from '../pages/Auth/Login';
import ForgotPassword from '../pages/Auth/ForgotPassword';
import ResetPassword from '../pages/Auth/ResetPassword';

import Dashboard from '../pages/Dashboard/Dashboard';
import HallList from '../pages/Halls/HallList';
import HallForm from '../pages/Halls/HallForm';
import HallDetails from '../pages/Halls/HallDetails';
import BookingList from '../pages/Bookings/BookingList';
import BookingForm from '../pages/Bookings/BookingForm';
import BookingDetails from '../pages/Bookings/BookingDetails';
import CalendarPage from '../pages/Calendar/CalendarPage';
import ApprovalsPage from '../pages/Approvals/ApprovalsPage';
import UsersPage from '../pages/Users/UsersPage';
import RolesPage from '../pages/Roles/RolesPage';
import DepartmentsPage from '../pages/Departments/DepartmentsPage';
import VisitorsPage from '../pages/Visitors/VisitorsPage';
import CateringPage from '../pages/Catering/CateringPage';
import ResourcesPage from '../pages/Resources/ResourcesPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import AuditLogsPage from '../pages/AuditLogs/AuditLogsPage';
import SettingsPage from '../pages/Settings/SettingsPage';
import ProfilePage from '../pages/Profile/ProfilePage';
import NotificationsPage from '../pages/Notifications/NotificationsPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/halls" element={<HallList />} />
        <Route path="/halls/new" element={<HallForm />} />
        <Route path="/halls/:id" element={<HallDetails />} />
        <Route path="/halls/:id/edit" element={<HallForm />} />
        <Route path="/bookings" element={<BookingList />} />
        <Route path="/bookings/new" element={<BookingForm />} />
        <Route path="/bookings/:id" element={<BookingDetails />} />
        <Route path="/bookings/:id/edit" element={<BookingForm />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/approvals" element={<ApprovalsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/visitors" element={<VisitorsPage />} />
        <Route path="/catering" element={<CateringPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
