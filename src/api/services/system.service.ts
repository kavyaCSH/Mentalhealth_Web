import api from '../client';
import type { SystemSetting, SystemSettingResponse } from '../../types/system.types';

export const SystemService = {
    /**
     * Get a specific system setting by key (e.g., 'web_version')
     */
    getSystemSetting: async (key: string): Promise<SystemSettingResponse> => {
        const response = await api.get(`system-settings/${key}`);
        return response.data;
    },

    /**
     * Update/Create a system setting by key
     */
    updateSystemSetting: async (payload: Partial<SystemSetting>): Promise<SystemSettingResponse> => {
        const response = await api.post('system-settings', payload);
        return response.data;
    },

    /**
     * List all platform-level variables
     */
    listAllSettings: async (): Promise<SystemSetting[]> => {
        const response = await api.get('system-settings');
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : data?.settings || [];
    },

    /**
     * Helper to fetch the current web version specifically
     */
    getWebVersion: async (): Promise<string> => {
        try {
            const res = await SystemService.getSystemSetting('web_version');
            return res.data?.value || '1.0.0';
        } catch (error) {
            console.error('Failed to fetch web version:', error);
            return '1.0.0';
        }
    }
};
