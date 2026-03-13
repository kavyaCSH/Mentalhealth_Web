import api from '../client';
import type { ROSSection, ROSSubmission, ROSResponse } from '../../types/ros.types';
import type { ApiResponse } from '../../types/common.types';

export const ROSService = {
    getQuestions: async (): Promise<ApiResponse<ROSSection[]>> => {
        const response = await api.get('/ros/questions');
        return response.data;
    },

    createROS: async (data: ROSSubmission): Promise<ApiResponse<ROSResponse>> => {
        const response = await api.post('/ros', data);
        return response.data;
    },

    getROSByPatient: async (patient_id: string | number): Promise<ApiResponse<ROSResponse[]>> => {
        const response = await api.get('/ros', { params: { patient_id } });
        return response.data;
    },

    getROSById: async (id: string | number): Promise<ApiResponse<ROSResponse>> => {
        const response = await api.get(`/ros/${id}`);
        return response.data;
    }
};
