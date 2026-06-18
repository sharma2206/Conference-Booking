const API_ENDPOINTS = {
    LOGIN: "/login",
    LOGOUT: "/logout",
    REGISTER: "/register",
    USERS: "/users",
    CONFERENCES: "/conferences",
    BOOKINGS: "/bookings",
    BOOKING_APPROVE: (id) => `/bookings/${id}/approve`,
    BOOKING_REJECT: (id) => `/bookings/${id}/reject`,
    HALLS: "/halls",
    DASHBOARD_SUMMARY: "/dashboard/summary",
    REPORTS_BOOKINGS: "/reports/bookings",
};

export default API_ENDPOINTS;
