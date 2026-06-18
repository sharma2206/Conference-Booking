import API_ENDPOINTS from "../api/endpoint";
import api from "../api/axios";

const authService = {
    login: async (credentials) => {
        try {
            const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
            const { token } = response.data;

            localStorage.setItem("token", token);

            return response.data;
        } catch (error) {
            throw error;
        }
    },
    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },
    register: async (userData) => {
        try {
            const response = await api.post(API_ENDPOINTS.REGISTER, userData);
            const { token } = response.data;

            if (token) {
                localStorage.setItem("token", token);
            }

            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default authService;
