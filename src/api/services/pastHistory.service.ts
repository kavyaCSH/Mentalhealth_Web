import api from '../client';
import type { PastHistorySection, PastHistorySubmission, PastHistoryResponse } from '../../types/pastHistory.types';
import type { ApiResponse } from '../../types/common.types';

export const PastHistoryService = {
    getQuestions: async (): Promise<ApiResponse<PastHistorySection[]>> => {
        const response = await api.get('past-history/questions');
        return response.data;
    },

    createPastHistory: async (data: PastHistorySubmission): Promise<ApiResponse<PastHistoryResponse>> => {
        const response = await api.post('past-history', data);
        return response.data;
    },

    extractFromNarrative: async (narrative: string, patient_id: string | number): Promise<ApiResponse<Partial<PastHistoryResponse>>> => {
        const response = await api.post('past-history/extract', { narrative, patient_id });
        return response.data;
    },

    getPastHistoryByPatient: async (patient_id: string | number): Promise<ApiResponse<PastHistoryResponse[]>> => {
        const response = await api.get('past-history', { params: { patient_id } });
        return response.data;
    },

    getPastHistoryById: async (id: string | number): Promise<ApiResponse<PastHistoryResponse>> => {
        const response = await api.get(`past-history/${id}`);
        return response.data;
    },

    updatePastHistory: async (id: string | number, data: Partial<PastHistorySubmission>): Promise<ApiResponse<PastHistoryResponse>> => {
        const response = await api.patch(`past-history/${id}`, data);
        return response.data;
    },

    deletePastHistory: async (id: string | number): Promise<ApiResponse<unknown>> => {
        const response = await api.delete(`past-history/${id}`);
        return response.data;
    }
};
