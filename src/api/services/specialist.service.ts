import api from '../client';

export const SpecialistService = {
    getSpecialists: async (role?: string): Promise<any> => {
        const url = role ? `/specialists?role=${role}` : '/specialists';
        const response = await api.get(url);
        return response.data;
    },
    getDirectory: async (): Promise<any> => {
        const response = await api.get('/specialists/schedule/directory');
        return response.data;
    },
    setAvailability: async (data: Record<string, unknown>) => {
        const response = await api.post('/specialists/schedule', data);
        return response.data;
    }
};
