import api from '../client';
import type { SystemSettingResponse } from '../../types/system.types';

export const SystemService = {
    /**
     * Get a specific system setting by key (e.g., 'web_version')
     */
    getSystemSetting: async (key: string): Promise<SystemSettingResponse> => {
        const response = await api.get(`system-settings/${key}`);
        return response.data;
    },

    /**
     * Update a system setting by key
     */
    updateSystemSetting: async (key: string, value: string): Promise<SystemSettingResponse> => {
        const response = await api.post('system-settings', { key, value });
        return response.data;
    },

    /**
     * Helper to fetch the current web version specifically
     */
    getWebVersion: async (): Promise<string> => {
        try {
            const res = await SystemService.getSystemSetting('web_version');
            return res.data.value;
        } catch (error) {
            console.error('Failed to fetch web version:', error);
            return '1.0.0'; // Fallback
        }
    },

    /**
     * Helper to update the web version
     */
    updateWebVersion: async (version: string): Promise<SystemSettingResponse> => {
        return SystemService.updateSystemSetting('web_version', version);
    }
};
