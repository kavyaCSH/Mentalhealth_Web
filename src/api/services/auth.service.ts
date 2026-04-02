import api from '../client';
import type { User } from '../../types/user.types';
import type { ApiResponse } from '../../types/common.types';
import type { UserRole } from '../../types/user.types';

export interface LoginData {
    username: string;
    password?: string;
    role: UserRole;
}

export interface RegisterData extends Partial<User> {
    password?: string;
    role: UserRole;
}

export const AuthService = {
    login: async (data: LoginData): Promise<{ user: User; token: string }> => {
        const response = await api.post('auth/login', data);
        return response.data?.data ?? response.data;
    },

    register: async (userData: RegisterData): Promise<ApiResponse<User>> => {
        const response = await api.post('auth/register', userData);
        return response.data?.data ?? response.data;
    },

    forgotPassword: async (email: string): Promise<{ resetToken?: string }> => {
        const response = await api.post('auth/forgot-password', { email });
        return response.data?.data ?? response.data;
    },

    resetPassword: async (token: string, data: { password?: string }): Promise<{ token: string; user: User }> => {
        const response = await api.put(`auth/reset-password/${token}`, data);
        return response.data?.data ?? response.data;
    },

    getMe: async (): Promise<User> => {
        const response = await api.get('auth/me');
        return response.data?.data ?? response.data;
    },
};
