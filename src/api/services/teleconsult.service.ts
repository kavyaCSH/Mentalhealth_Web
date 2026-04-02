import api from '../client';
import type { Consultation, ApiResponse } from '../../types/common.types';

export const TeleConsultService = {
    createConsultation: async (data: Record<string, unknown>): Promise<ApiResponse<Consultation>> => {
        const response = await api.post('resource/consults', data);
        return response.data;
    },
    listConsultations: async (params?: {
        sort_order?: 'asc' | 'desc';
        limit?: number;
        page?: number;
        [key: string]: unknown;
    }): Promise<ApiResponse<{ consults: Consultation[] }>> => {
        const response = await api.get('resource/consults', { params: {
            sort_order: 'asc',
            limit: 10,
            page: 1,
            ...params
        }});
        return response.data;
    },
    getBillingPreview: async (id: string) => {
        const response = await api.get(`resource/consults/${id}/billing`);
        return response.data;
    },
    generateInvoice: async (id: string) => {
        const response = await api.post(`resource/consults/${id}/invoice`);
        return response.data;
    },
    cancelConsultation: async (id: string) => {
        const response = await api.patch(`resource/consults/${id}/cancel`, {});
        return response.data;
    },
    getConsultationDetail: async (id: string) => {
        const response = await api.get(`resource/consults/${id}`);
        return response.data;
    },
    updateConsultationStatus: async (id: string, status?: string, notes?: string) => {
        // EXACT mapping from mobile App's updateConsultationStatus in teleconsult.service.ts
        // Sending a lean payload to avoid backend 'consult_status is not defined' ReferenceError
        const payload: Record<string, any> = {};

        if (status) {
            payload.status = status;
            payload.consult_status = status; // Backup key
        }

        // If notes are provided during status update, they could go here if the backend supports it,
        // but mobile app prioritizes the /notes endpoint for session observations.
        if (notes) {
            payload.notes = notes;
        }

        const response = await api.patch(`resource/consults/${id}`, payload);
        return response.data;
    },
    rescheduleConsultation: async (id: string, newTime: string) => {
        const response = await api.patch(`resource/consults/${id}/reschedule`, { new_scheduled_at: newTime });
        return response.data;
    },
    getBilling: async (id: string) => {
        const response = await api.get(`resource/consults/${id}/billing`);
        return response.data;
    },
    tokenValidate: async (token: string, type: string = 'subscriber') => {
        const response = await api.get('consults/token-validate', { params: { token, type } });
        return response.data;
    },
    addClinicalNotes: async (id: string | number, notesData: { notes: string }): Promise<ApiResponse<any>> => {
        // Correct pathing for the production backend router
        const response = await api.post(`resource/consults/${id}/notes`, notesData);
        return response.data;
    },
    getTreatmentHistory: async (patientId: string | number): Promise<ApiResponse<any[]>> => {
        const response = await api.get(`resource/treatments/patient/${patientId}`);
        return response.data;
    },
    createTreatmentPlan: async (data: Record<string, any>): Promise<ApiResponse<any>> => {
        const response = await api.post('resource/treatments', data);
        return response.data;
    }
};
