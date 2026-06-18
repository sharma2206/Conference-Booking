import api from "../api/axios";
import API_ENDPOINTS from "../api/endpoint";

const hallService = {
    list: async () => {
        const response = await api.get(API_ENDPOINTS.HALLS);
        return response.data;
    },
    get: async (id) => {
        const response = await api.get(`${API_ENDPOINTS.HALLS}/${id}`);
        return response.data;
    },
    create: async (hallData) => {
        const response = await api.post(API_ENDPOINTS.HALLS, hallData);
        return response.data;
    },
    update: async (id, hallData) => {
        const response = await api.put(
            `${API_ENDPOINTS.HALLS}/${id}`,
            hallData,
        );
        return response.data;
    },
};

export default hallService;
