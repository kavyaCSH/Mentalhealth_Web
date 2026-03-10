import api from '../client';
import type { Notification } from '../../types/common.types';

export const NotificationService = {
    getNotifications: async (params?: Record<string, unknown>): Promise<Notification[]> => {
        const response = await api.get('/notifications', { params });
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : data?.notifications || [];
    },
    markAsRead: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async (): Promise<{ success: boolean }> => {
        const response = await api.put('/notifications/read-all');
        return response.data;
    }
};
