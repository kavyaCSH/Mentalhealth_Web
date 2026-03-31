import api from '../client';
import type { ApiResponse } from '../../types/common.types';

export interface HPIResponse {
    id?: string | number;
    _id?: string;
    hpiId?: number | string;
    patient_id: string;
    consultId?: string;
    narrative: string;
    structured?: {
        onset?: string;
        duration?: string;
        course?: string;
        mood_features?: string[];
        anxiety_features?: string[];
        psychotic_features?: string[];
        sleep?: string;
        appetite?: string;
        energy?: string;
        cognitive?: string[];
        suicidal_ideation?: string;
        previous_episodes?: string;
        treatment_response?: string;
    };
    dsm5_mapping?: string[];
    severity_index?: number;
    color_code?: string;
    recommendations?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export const HPIService = {
    createHPI: async (data: { patient_id: string; consultId?: string; narrative: string }): Promise<ApiResponse<HPIResponse>> => {
        const response = await api.post('history-of-illness', data);
        return response.data;
    },

    getHPIList: async (params: { patient_id: string; page?: number; limit?: number }): Promise<ApiResponse<HPIResponse[]>> => {
        const response = await api.get('history-of-illness', { params: { ...params, page: params.page ?? 1, limit: params.limit ?? 10 } });
        return response.data;
    },

    getHPIById: async (id: string | number, patient_id?: string): Promise<ApiResponse<HPIResponse>> => {
        if (patient_id) {
            try {
                const listRes = await HPIService.getHPIList({ patient_id });
                const list = listRes?.data || listRes || [];
                const item = (list as HPIResponse[]).find(h =>
                    String(h.id) === String(id) ||
                    String(h._id) === String(id) ||
                    String(h.hpiId) === String(id)
                );

                if (item) return { success: true, message: "Found in list", data: item };
            } catch (e) {
                console.warn('[HPIService] List fallback failed:', e);
            }
        }

        const response = await api.get(`history-of-illness/${id}`);
        return response.data;
    },

    updateHPI: async (id: string | number, data: { narrative: string }): Promise<ApiResponse<HPIResponse>> => {
        const response = await api.patch(`history-of-illness/${id}`, data);
        return response.data;
    },

    deleteHPI: async (id: string | number): Promise<ApiResponse<unknown>> => {
        const response = await api.delete(`history-of-illness/${id}`);
        return response.data;
    },

    // ── AI Extraction & Detailed Saving Flow (Mobile Parity) ───────────────────────────────────
    extractHPI: async (data: { patient_id: string | number; narrative: string }): Promise<ApiResponse<any>> => {
        // Step 1 — Preview only, does NOT save to DB
        const response = await api.post('history-of-illness/extract', data);
        return response.data;
    },

    extractFromNarrative: async (narrative: string, patient_id?: string | number): Promise<any> => {
        // Step 1 — Preview only, does NOT save to DB
        const response = await api.post('history-of-illness/extract', { narrative, patient_id });
        return response.data;
    },

    submitHPI: async (data: any): Promise<ApiResponse<HPIResponse>> => {
        // Step 2 — Confirm and persist the extracted/edited HPI
        const response = await api.post('history-of-illness', data);
        return response.data;
    },
};
