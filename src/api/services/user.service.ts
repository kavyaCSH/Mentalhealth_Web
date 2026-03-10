import api from '../client';
import type { User, Patient } from '../../types/user.types';

export const UserService = {
    updateMyProfile: async (data: Partial<User>): Promise<User> => {
        const response = await api.put('/users/update-me', data);
        return response.data?.data ?? response.data;
    },
    listUsers: async (params: { role?: string; search?: string }): Promise<User[]> => {
        const response = await api.get('/users/list', { params });
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : data?.users || [];
    },
    getUserStats: async (): Promise<unknown> => {
        const response = await api.get('/users/stats');
        return response.data?.data ?? response.data;
    },
    toggleUserStatus: async (userId: string): Promise<{ success: boolean }> => {
        const response = await api.put(`/users/${userId}/toggle-status`);
        return response.data;
    },
    getUserById: async (id: string): Promise<User | Patient> => {
        const response = await api.get(`/users/${id}`);
        return response.data?.data ?? response.data;
    },
    getMySubordinates: async (): Promise<(User | Patient)[]> => {
        const response = await api.get('/users/my-subordinates');
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : [];
    },
    createUserByRole: async (role: string, data: Partial<User>): Promise<User> => {
        const response = await api.post(`/users/create-by-role/${role}`, data);
        return response.data?.data ?? response.data;
    }
};
