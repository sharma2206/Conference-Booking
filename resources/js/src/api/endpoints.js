export const API = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  REFRESH: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  ENABLE_2FA: '/auth/2fa/enable',
  DISABLE_2FA: '/auth/2fa/disable',

  // Dashboard
  DASHBOARD_SUMMARY: '/dashboard/summary',
  DASHBOARD_HALL_UTILIZATION: '/dashboard/hall-utilization',
  DASHBOARD_BOOKING_TRENDS: '/dashboard/booking-trends',
  DASHBOARD_DEPARTMENT_USAGE: '/dashboard/department-usage',
  DASHBOARD_UPCOMING: '/dashboard/upcoming-bookings',

  // Halls
  HALLS: '/halls',
  HALL: (id) => `/halls/${id}`,
  HALL_AVAILABILITY: (id) => `/halls/${id}/availability`,
  HALL_IMAGE: (id) => `/halls/${id}/images`,

  // Bookings
  BOOKINGS: '/bookings',
  BOOKING: (id) => `/bookings/${id}`,
  BOOKING_APPROVE: (id) => `/bookings/${id}/approve`,
  BOOKING_REJECT: (id) => `/bookings/${id}/reject`,
  BOOKING_CALENDAR: '/bookings/calendar',
  BOOKING_RECURRING: '/bookings/recurring',
  PENDING_APPROVALS: '/pending-approvals',

  // Departments
  DEPARTMENTS: '/departments',
  DEPARTMENTS_ALL: '/departments/all',
  DEPARTMENT: (id) => `/departments/${id}`,

  // Users
  USERS: '/users',
  USER: (id) => `/users/${id}`,
  USER_AVATAR: (id) => `/users/${id}/avatar`,
  USER_PASSWORD: (id) => `/users/${id}/password`,
  USER_ROLES: '/user-roles',

  // Roles & Permissions
  ROLES: '/roles',
  ROLE: (id) => `/roles/${id}`,
  PERMISSIONS: '/permissions',
  ALL_PERMISSIONS: '/all-permissions',

  // Visitors
  VISITORS: '/visitors',
  VISITOR: (id) => `/visitors/${id}`,
  VISITOR_CHECKIN: (id) => `/visitors/${id}/check-in`,
  VISITOR_CHECKOUT: (id) => `/visitors/${id}/check-out`,
  VISITOR_APPROVE: (id) => `/visitors/${id}/approve`,

  // Catering
  CATERING_MENUS: '/catering/menus',
  CATERING_MENU: (id) => `/catering/menus/${id}`,
  CATERING_ORDERS: '/catering/orders',
  CATERING_ORDER_STATUS: (id) => `/catering/orders/${id}/status`,
  CATERING_MONTHLY: '/catering/monthly-cost',

  // Resources
  RESOURCES: '/resources',
  RESOURCE: (id) => `/resources/${id}`,
  RESOURCE_REQUEST: '/resources/request',
  RESOURCE_RETURN: (id) => `/booking-resources/${id}/return`,

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_UNREAD: '/notifications/unread-count',
  NOTIFICATIONS_MARK_READ: '/notifications/mark-read',
  NOTIFICATION: (id) => `/notifications/${id}`,

  // Reports
  REPORTS_BOOKINGS: '/reports/bookings',
  REPORTS_HALLS: '/reports/hall-utilization',
  REPORTS_DEPARTMENTS: '/reports/department-wise',
  REPORTS_TOP_HALLS: '/reports/top-halls',
  REPORTS_MONTHLY: '/reports/monthly',
  REPORTS_EXCEL: '/reports/export/excel',
  REPORTS_PDF: '/reports/export/pdf',

  // Audit
  AUDIT_LOGS: '/audit/logs',
  AUDIT_ACTIVITY: '/audit/activity',
  AUDIT_MODULES: '/audit/modules',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_GROUP: (group) => `/settings/group/${group}`,
  SETTINGS_HOLIDAYS: '/settings/holidays',
  SETTINGS_HOLIDAY: (id) => `/settings/holidays/${id}`,
  SETTINGS_WORKFLOWS: '/settings/workflows',
  SETTINGS_WORKFLOW: (id) => `/settings/workflows/${id}`,
};
