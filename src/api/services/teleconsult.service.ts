import api from '../client';
import type { Consultation, ApiResponse } from '../../types/common.types';

export const TeleConsultService = {
    createConsultation: async (data: Record<string, unknown>): Promise<ApiResponse<Consultation>> => {
        const response = await api.post('/resource/consults', data);
        return response.data;
    },
    listConsultations: async (params: Record<string, unknown>): Promise<ApiResponse<{ consults: Consultation[] }>> => {
        const response = await api.get('/resource/consults', { params });
        return response.data;
    },
    getBillingPreview: async (id: string) => {
        const response = await api.get(`/resource/consults/${id}/billing`);
        return response.data;
    },
    generateInvoice: async (id: string) => {
        const response = await api.post(`/resource/consults/${id}/invoice`);
        return response.data;
    },
    cancelConsultation: async (id: string) => {
        const response = await api.patch(`/resource/consults/${id}/cancel`, {});
        return response.data;
    },
    getConsultationDetail: async (id: string) => {
        const response = await api.get(`/resource/consults/${id}`);
        return response.data;
    },
    updateConsultationStatus: async (id: string, status: string, notes?: string) => {
        const payload: Record<string, unknown> = {
            consult_status: status,
            additional_info: {
                consult_id: id
            }
        };
        if (notes) {
            (payload.additional_info as Record<string, unknown>).doctor_notes = notes;
        }
        const response = await api.patch(`/resource/consults/${id}`, payload);
        return response.data;
    },
    rescheduleConsultation: async (id: string, newTime: string) => {
        const response = await api.patch(`/resource/consults/${id}/reschedule`, { new_scheduled_at: newTime });
        return response.data;
    },
    getBilling: async (id: string) => {
        const response = await api.get(`/resource/consults/${id}/billing`);
        return response.data;
    },
    tokenValidate: async (token: string, type: string = 'subscriber') => {
        const response = await api.get('consults/token-validate', { params: { token, type } });
        return response.data;
    }
};
