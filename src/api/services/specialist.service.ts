import api from '../client';
import type { ApiResponse } from '../../types/common.types';

export const SpecialistService = {
    getSpecialists: async (role?: string): Promise<ApiResponse<Record<string, unknown>[]>> => {
        const url = role ? `/specialists?role=${role}` : '/specialists';
        const response = await api.get(url);
        return response.data;
    },
    getDirectory: async (): Promise<ApiResponse<Record<string, unknown>>> => {
        const response = await api.get('/specialists/schedule/directory');
        return response.data;
    },
    setAvailability: async (data: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
        const response = await api.post('/specialists/schedule', data);
        return response.data;
    }
};
