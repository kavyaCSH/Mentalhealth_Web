import api from '../client';
import type { ApiResponse } from '../../types/common.types';

export const SpecialistService = {
    getSpecialists: async (role?: string): Promise<ApiResponse<Record<string, unknown>[]>> => {
        const url = role ? `/specialists?role=${role}` : '/specialists';
        const response = await api.get(url);
        return response.data;
    },
    getDirectory: async (params?: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
        const response = await api.get('/specialists/schedule/directory', { params });
        return response.data;
    },
    getAvailableSlots: async (params: { 
        specialist_id?: number | string; 
        date?: string; 
        startDate?: string; 
        endDate?: string; 
        time?: string;
        role?: string;
        available?: boolean;
    }): Promise<ApiResponse<{ slots: any[] }>> => {
        const response = await api.get('/specialists/schedule/slots', { params });
        return response.data;
    },
    setAvailability: async (data: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> => {
        const response = await api.post('/specialists/schedule', data);
        return response.data;
    },
    getMySchedule: async (params?: { type?: string; isActive?: boolean }): Promise<ApiResponse<any>> => {
        const response = await api.get('/specialists/schedule/me', { params });
        return response.data;
    },
    createScheduleBlock: async (data: any): Promise<ApiResponse<any>> => {
        const response = await api.post('/specialists/schedule/me', data);
        return response.data;
    },
    updateScheduleBlock: async (id: number | string, data: any): Promise<ApiResponse<any>> => {
        const response = await api.put(`/specialists/schedule/${id}`, data);
        return response.data;
    },
    deleteScheduleBlock: async (id: number | string): Promise<ApiResponse<any>> => {
        const response = await api.delete(`/specialists/schedule/${id}`);
        return response.data;
    },
    upsertWeeklySchedule: async (data: any | any[]): Promise<ApiResponse<any>> => {
        const response = await api.put('/specialists/schedule/me/weekly', data);
        return response.data;
    },
    getSpecialistSchedule: async (specialistId: number | string): Promise<ApiResponse<any>> => {
        const response = await api.get(`/specialists/schedule/${specialistId}`);
        return response.data;
    }
};
