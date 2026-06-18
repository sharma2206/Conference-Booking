import api from "../api/axios";
import API_ENDPOINTS from "../api/endpoint";

const bookingService = {
    list: async () => {
        const response = await api.get(API_ENDPOINTS.BOOKINGS);
        return response.data;
    },
    get: async (id) => {
        const response = await api.get(`${API_ENDPOINTS.BOOKINGS}/${id}`);
        return response.data;
    },
    create: async (bookingData) => {
        const response = await api.post(API_ENDPOINTS.BOOKINGS, bookingData);
        return response.data;
    },
    update: async (id, bookingData) => {
        const response = await api.put(
            `${API_ENDPOINTS.BOOKINGS}/${id}`,
            bookingData,
        );
        return response.data;
    },
    approve: async (id) => {
        const response = await api.post(API_ENDPOINTS.BOOKING_APPROVE(id));
        return response.data;
    },
    reject: async (id, reason) => {
        const response = await api.post(API_ENDPOINTS.BOOKING_REJECT(id), {
            reason,
        });
        return response.data;
    },
};

export default bookingService;
