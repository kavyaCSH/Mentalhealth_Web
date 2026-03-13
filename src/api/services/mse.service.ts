import api from '../client';
import type { MSESection, MSESubmission, MSEResponse } from '../../types/mse.types';
import type { ApiResponse } from '../../types/common.types';

export const MSEService = {
    getQuestions: async (): Promise<ApiResponse<MSESection[]>> => {
        const response = await api.get('/mse/questions');
        return response.data;
    },

    createMSE: async (data: MSESubmission): Promise<ApiResponse<MSEResponse>> => {
        const response = await api.post('/mse', data);
        return response.data;
    },

    listMSEByPatient: async (patient_id: string | number): Promise<ApiResponse<MSEResponse[]>> => {
        const response = await api.get('/mse', { params: { patient_id } });
        return response.data;
    },

    getMSEById: async (id: string | number): Promise<ApiResponse<MSEResponse>> => {
        const response = await api.get(`/mse/${id}`);
        return response.data;
    }
};
