import api from '../client';
import type { ApiResponse } from '../../types/common.types';

export interface SymptomRecord {
    id?: string | number;
    patientId: string | number;
    consult_id?: number | string;
    scores: Record<string, number>;
    notes?: string;
    createdAt?: string;
    color_code?: string;
    symptomId?: string | number;
}

export const SymptomService = {
    saveSymptomScores: async (data: {
        patientId: string | number;
        consult_id?: number | string;
        scores: Record<string, number>;
        notes?: string;
    }): Promise<ApiResponse<SymptomRecord>> => {
        const response = await api.post('symptoms', data);
        return response.data;
    },

    getPatientSymptomHistory: async (
        patientId: string | number,
        page: number = 1,
        limit: number = 10
    ): Promise<ApiResponse<{ symptoms: SymptomRecord[] }>> => {
        const response = await api.get(`symptoms/patient/${patientId}`, {
            params: { page, limit }
        });
        return response.data;
    },

    getSymptomDetail: async (id: string | number): Promise<ApiResponse<SymptomRecord>> => {
        const response = await api.get(`symptoms/${id}`);
        return response.data; 
    }
};
