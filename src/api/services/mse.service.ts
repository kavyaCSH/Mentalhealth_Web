import api from '../client';
import type { MSESection, MSESubmission, MSEResponse } from '../../types/mse.types';
import type { ApiResponse } from '../../types/common.types';

export const MSEService = {
    getQuestions: async (params?: { age?: number; gender?: string; view?: 'professional' | 'patient' }): Promise<ApiResponse<MSESection[]>> => {
        const response = await api.get('mse/questions', { params });
        return response.data;
    },

    createMSE: async (data: MSESubmission): Promise<ApiResponse<MSEResponse>> => {
        const response = await api.post('mse', data);
        return response.data;
    },

    listMSE: async (params: { 
        patient_id?: string | number; 
        startDate?: string; 
        endDate?: string; 
        color_code?: string;
        insight_level?: string;
        memory?: string;
    }): Promise<ApiResponse<MSEResponse[]>> => {
        const response = await api.get('mse', { params });
        return response.data;
    },

    listMSEByPatient: async (patient_id: string | number): Promise<ApiResponse<MSEResponse[]>> => {
        const response = await api.get('mse', { params: { patient_id } });
        return response.data;
    },

    getMSEById: async (id: string | number): Promise<ApiResponse<MSEResponse>> => {
        const response = await api.get(`mse/${id}`);
        return response.data;
    },

    updateMSE: async (id: string | number, data: Partial<MSESubmission>): Promise<ApiResponse<MSEResponse>> => {
        const response = await api.patch(`mse/${id}`, data);
        return response.data;
    },

    deleteMSE: async (id: string | number): Promise<ApiResponse<unknown>> => {
        const response = await api.delete(`mse/${id}`);
        return response.data;
    },

    extractFromNarrative: async (narrative: string, patientId: string | number): Promise<ApiResponse<any>> => {
        const response = await api.post('mse/extract', { narrative, patientId });
        return response.data;
    }
};
