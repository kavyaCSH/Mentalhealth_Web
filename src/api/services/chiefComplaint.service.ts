import api from '../client';
import type { ApiResponse } from '../../types/common.types';

export interface ChiefComplaintResponse {
    id?: string | number;
    _id?: string;
    chiefComplaintId?: number | string;
    patient: string;
    patient_id?: string | number;
    narrative: string;
    consult_id?: string;
    structured?: {
        severity?: string;
        duration?: string;
        symptoms?: string[];
        mood_markers?: string[];
    };
    audio_url?: string;
    createdAt?: string;
}

export const ChiefComplaintService = {
    createComplaint: async (formData: FormData): Promise<ApiResponse<ChiefComplaintResponse>> => {
        const response = await api.post('/chief-complaints', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    listComplaints: async (params: { consult_id?: string; patient?: string; patient_id?: string | number; patientId?: string | number; page?: number; limit?: number }) => {
        const response = await api.get('/chief-complaints', { params });
        return response.data;
    },

    getById: async (id: string | number) => {
        const response = await api.get(`/chief-complaints/${id}`);
        return response.data;
    },

    updateComplaint: async (id: string | number, data: any): Promise<ApiResponse<ChiefComplaintResponse>> => {
        const response = await api.patch(`/chief-complaints/${id}`, data);
        return response.data;
    },

    deleteComplaint: async (id: string | number): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/chief-complaints/${id}`);
        return response.data;
    }
};
