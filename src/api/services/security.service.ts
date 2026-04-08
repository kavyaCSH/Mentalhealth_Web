import api from '../client';
import type { ApiAccessRule } from '../../types/system.types';

export const SecurityService = {
    /**
     * GET /api/v1/api-access
     * Description: Returns the complete registry of role-to-resource permission mappings.
     */
    listAccessRules: async (): Promise<ApiAccessRule[]> => {
        const response = await api.get('api-access');
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : data?.rules || [];
    },

    /**
     * POST /api/v1/api-access
     * Description: Adds a new access rule mapping roles to resources.
     */
    createAccessRule: async (rule: Partial<ApiAccessRule>): Promise<ApiAccessRule> => {
        const response = await api.post('api-access', rule);
        return response.data?.data ?? response.data;
    },

    /**
     * PUT /api/v1/api-access/:id
     * Description: Updates an existing permission mapping.
     */
    updateAccessRule: async (id: string, rule: Partial<ApiAccessRule>): Promise<ApiAccessRule> => {
        const response = await api.put(`api-access/${id}`, rule);
        return response.data?.data ?? response.data;
    },

    /**
     * DELETE /api/v1/api-access/:id
     * Description: Revokes a permission mapping from the registry.
     */
    deleteAccessRule: async (id: string): Promise<{ success: boolean }> => {
        const response = await api.delete(`api-access/${id}`);
        return response.data;
    }
};
