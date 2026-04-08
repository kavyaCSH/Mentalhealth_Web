import api from '../client';
import type { Notification, BroadcastPayload, TargetedPayload, ApiResponse } from '../../types/common.types';

export const NotificationService = {
    getNotifications: async (params?: Record<string, unknown>): Promise<ApiResponse<{ notifications: Notification[], unreadCount: number, total: number }>> => {
        const response = await api.get('notifications', { params });
        return response.data;
    },
    markAsRead: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.put(`notifications/${id}/read`);
        return response.data;
    },
    markAllAsRead: async (): Promise<{ success: boolean }> => {
        const response = await api.put('notifications/read-all');
        return response.data;
    },
    broadcastNotification: async (payload: BroadcastPayload): Promise<ApiResponse<any>> => {
        const response = await api.post('notifications/broadcast', payload);
        return response.data;
    },
    sendTargetedNotification: async (payload: TargetedPayload): Promise<ApiResponse<any>> => {
        const response = await api.post('notifications/send', payload);
        return response.data;
    },
    triggerAIEngagement: async (): Promise<ApiResponse<any>> => {
        const response = await api.post('notifications/ai-engagement');
        return response.data;
    }
};
