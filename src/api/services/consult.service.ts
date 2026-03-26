import api from '../client';
import type { Consultation, ApiResponse } from '../../types/common.types';

export const ConsultService = {
    listConsultations: async (params?: Record<string, unknown>): Promise<Consultation[]> => {
        const response = await api.get('resource/consults', { params });
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : data?.consults || [];
    },

    createConsultation: async (data: Partial<Consultation>): Promise<ApiResponse<Consultation>> => {
        const response = await api.post('resource/consults', data);
        return response.data;
    },

    cancelConsultation: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.patch(`resource/consults/${id}/cancel`, {});
        return response.data;
    },

    createConsultationAdmin: async (data: Partial<Consultation>): Promise<Consultation> => {
        const response = await api.post('consultations', data);
        return response.data?.data ?? response.data;
    },

    updateConsultation: async (id: string, data: Partial<Consultation>): Promise<Consultation> => {
        const response = await api.patch(`resource/consults/${id}`, data);
        return response.data?.data ?? response.data;
    }
};
