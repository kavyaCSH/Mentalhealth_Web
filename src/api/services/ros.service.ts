import api from '../client';
import type { ROSSection, ROSSubmission, ROSResponse } from '../../types/ros.types';
import type { ApiResponse } from '../../types/common.types';

export const ROSService = {
    getQuestions: async (): Promise<ApiResponse<ROSSection[]>> => {
        const response = await api.get('ros/questions');
        return response.data;
    },

    createROS: async (data: ROSSubmission): Promise<ApiResponse<ROSResponse>> => {
        const response = await api.post('ros', data);
        return response.data;
    },

    extractFromNarrative: async (narrative: string, patient_id: string | number): Promise<ApiResponse<Partial<ROSResponse>>> => {
        const response = await api.post('ros/extract', { narrative, patient_id });
        return response.data;
    },

    getROSByPatient: async (patient_id: string | number): Promise<ApiResponse<ROSResponse[]>> => {
        const response = await api.get('ros', { params: { patient_id } });
        return response.data;
    },

    getROSById: async (id: string | number, patient_id?: string): Promise<ApiResponse<ROSResponse>> => {
        if (patient_id) {
            try {
                const listRes = await ROSService.getROSByPatient(patient_id);
                const list = listRes?.data || listRes || [];
                const item = (list as ROSResponse[]).find(r =>
                    String(r.id || r.rosId) === String(id) ||
                    String(r._id) === String(id)
                );

                if (item) return { success: true, message: "Found in list", data: item };
            } catch (e) {
                console.warn('[ROSService] List fallback failed:', e);
            }
        }
        const response = await api.get(`ros/${id}`);
        return response.data;
    },

    updateROS: async (id: string | number, data: Partial<ROSSubmission>): Promise<ApiResponse<ROSResponse>> => {
        const response = await api.put(`ros/${id}`, data);
        return response.data;
    },

    deleteROS: async (id: string | number): Promise<ApiResponse<void>> => {
        const response = await api.delete(`ros/${id}`);
        return response.data;
    }
};
