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
    // ── Clinical / Admin routes ────────────────────────────────────────────────
    createComplaint: async (formData: FormData): Promise<ApiResponse<ChiefComplaintResponse>> => {
        const response = await api.post('/chief-complaints', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    listComplaints: async (params: {
        consult_id?: string;
        patient?: string;
        patient_id?: string | number;
        patientId?: string | number;
        page?: number;
        limit?: number;
    }) => {
        const response = await api.get('/chief-complaints', { params });
        return response.data;
    },

    getById: async (id: string, patient_id?: string): Promise<ApiResponse<ChiefComplaintResponse>> => {
        if (patient_id) {
            try {
                const listRes = await ChiefComplaintService.listComplaints({ patientId: patient_id });
                const list = listRes?.data || listRes || [];
                const item = (list as ChiefComplaintResponse[]).find(h =>
                    String((h as any).id) === String(id) ||
                    String((h as any)._id) === String(id)
                );
                if (item) return { success: true, message: 'Found in list', data: item };
            } catch (e) {
                console.warn('[ChiefComplaintService] List fallback failed:', e);
            }
        }
        const response = await api.get(`/chief-complaints/${id}`);
        return response.data;
    },

    updateComplaint: async (
        id: string | number,
        data: any,
        patient_id?: string | number
    ): Promise<ApiResponse<ChiefComplaintResponse>> => {
        const response = await api.patch(`/chief-complaints/${id}`, data, {
            params: patient_id ? { patient_id } : {},
        });
        return response.data;
    },

    deleteComplaint: async (
        id: string | number,
        patient_id?: string | number
    ): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/chief-complaints/${id}`, {
            params: patient_id ? { patient_id } : {},
        });
        return response.data;
    },

    // ── Patient-scoped routes (/patients/:patientId/chief-complaints) ──────────
    // Backend authorizes these endpoints for the patient role.

    listPatientComplaints: async (patientId: string): Promise<ApiResponse<ChiefComplaintResponse[]>> => {
        const response = await api.get(`/chief-complaints`, { params: { patient_id: patientId } });
        return response.data;
    },

    getPatientComplaintById: async (
        patientId: string,
        ccId: string | number
    ): Promise<ApiResponse<ChiefComplaintResponse>> => {
        try {
            const listRes = await ChiefComplaintService.listPatientComplaints(patientId);
            const list: ChiefComplaintResponse[] = Array.isArray(listRes?.data)
                ? listRes.data
                : Array.isArray(listRes)
                ? (listRes as any)
                : [];
            const item = list.find(
                h =>
                    String((h as any).chiefComplaintId) === String(ccId) ||
                    String((h as any).id) === String(ccId) ||
                    String((h as any)._id) === String(ccId)
            );
            if (item) return { success: true, message: 'Found in list', data: item };
        } catch (e) {
            console.warn('[ChiefComplaintService] Patient list fallback failed:', e);
        }
        const response = await api.get(`/chief-complaints/${ccId}`, {
            params: { patient_id: patientId }
        });
        return response.data;
    },

    createPatientComplaint: async (
        patientId: string,
        narrative: string
    ): Promise<ApiResponse<ChiefComplaintResponse>> => {
        const response = await api.post(`/chief-complaints`, { patient_id: patientId, narrative });
        return response.data;
    },

    updatePatientComplaint: async (
        patientId: string,
        ccId: string | number,
        data: { narrative: string }
    ): Promise<ApiResponse<ChiefComplaintResponse>> => {
        const response = await api.patch(`/chief-complaints/${ccId}`, data, {
            params: { patient_id: patientId }
        });
        return response.data;
    },

    deletePatientComplaint: async (
        patientId: string,
        ccId: string | number
    ): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/chief-complaints/${ccId}`, {
            params: { patient_id: patientId }
        });
        return response.data;
    },
};
