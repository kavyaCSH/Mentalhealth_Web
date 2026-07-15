import api from '../client';
import { AssessmentService } from './assessment.service';
import type { User, Patient, ClinicalNote } from '../../types/user.types';

export const UserService = {
    updateMyProfile: async (data: Partial<User> | FormData): Promise<User> => {
        const response = await api.put('users/update-me', data);
        return response.data?.data ?? response.data;
    },
    updateProfileImage: async (formData: FormData): Promise<User> => {
        const response = await api.put('users/update-me', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data?.data ?? response.data;
    },
    listUsers: async (params: { 
        role?: string; 
        search?: string; 
        page?: number; 
        limit?: number; 
        isActive?: boolean; 
        isVerified?: boolean;
        hospital?: string;
        professional?: string;
    }): Promise<{ users: User[], total: number, pagination?: any }> => {
        const response = await api.get('users/list', { params });
        const data = response.data?.data ?? response.data;

        let users = [];
        let total = 0;
        let pagination = null;

        if (Array.isArray(data)) {
            users = data.map((u: any) => ({ ...u, id: u.id || u._id }));
            total = data.length;
        } else {
            users = (data?.users || []).map((u: any) => ({ ...u, id: u.id || u._id }));
            pagination = data?.pagination || null;
            total = pagination?.total || data?.totalCount || data?.total || users.length;
        }

        return { users, total, pagination };
    },
    getUserStats: async (): Promise<unknown> => {
        const response = await api.get('users/stats');
        return response.data?.data ?? response.data;
    },
    toggleUserStatus: async (userId: string): Promise<{ success: boolean; message?: string }> => {
        const response = await api.put(`users/${userId}/toggle-status`);
        return response.data;
    },
    getUserById: async (id: string): Promise<User | Patient> => {
        const response = await api.get(`users/${id}`);
        return response.data?.data ?? response.data;
    },
    getMySubordinates: async (): Promise<(User | Patient)[]> => {
        const response = await api.get('users/my-subordinates');
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : [];
    },
    createUserByRole: async (role: string, data: Partial<User>): Promise<User> => {
        const response = await api.post(`users/${role}`, data);
        return response.data?.data ?? response.data;
    },
    toggleVerification: async (userId: string): Promise<User> => {
        const response = await api.put(`users/${userId}/toggle-verification`);
        return response.data?.data ?? response.data;
    },
    getPatientView: async (): Promise<any> => {
        const response = await api.get('users/patient-view');
        return response.data?.data ?? response.data;
    },
    deepEnroll: async (): Promise<void> => {
        try {
            // Trigger multiple backend hooks for lazy patient creation
            await Promise.allSettled([
                api.get('users/patient-view'),
                AssessmentService.getSelfAssessmentQuestions(),
                api.get('dashboards/patient/statistics')
            ]);
        } catch (err) {
            console.warn('Deep enrollment ping failed', err);
        }
    },
    updateUserById: async (userId: string, data: Partial<User>): Promise<User> => {
        const response = await api.put(`users/${userId}`, data);
        return response.data?.data ?? response.data;
    },
    getClinicalNotes: async (id: string | number): Promise<ClinicalNote[]> => {
        const response = await api.get(`users/${id}/notes`);
        return response.data?.data ?? response.data ?? [];
    },
    addClinicalNote: async (id: string | number, noteData: { content: string }): Promise<ClinicalNote> => {
        const response = await api.post(`users/${id}/notes`, noteData);
        return response.data?.data ?? response.data;
    }
};
