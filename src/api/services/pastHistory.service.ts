import api from '../client';
import type { PastHistorySection, PastHistorySubmission, PastHistoryResponse } from '../../types/pastHistory.types';
import type { ApiResponse } from '../../types/common.types';

export const PastHistoryService = {
    getQuestions: async (): Promise<ApiResponse<PastHistorySection[]>> => {
        const response = await api.get('/past-history/questions');
        return response.data;
    },

    createPastHistory: async (data: PastHistorySubmission): Promise<ApiResponse<PastHistoryResponse>> => {
        const response = await api.post('/past-history', data);
        return response.data;
    },

    getPastHistoryByPatient: async (patient_id: string | number): Promise<ApiResponse<PastHistoryResponse[]>> => {
        const response = await api.get('/past-history', { params: { patient_id } });
        return response.data;
    },

    getPastHistoryById: async (id: string | number): Promise<ApiResponse<PastHistoryResponse>> => {
        const response = await api.get(`/past-history/${id}`);
        return response.data;
    }
};
