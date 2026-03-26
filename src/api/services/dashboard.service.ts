import api from '../client';

export const DashboardService = {
    getPatientDashboard: async () => {
        const response = await api.get('dashboards/patient');
        return response.data;
    },
    getPatientStatistics: async () => {
        const response = await api.get('dashboards/patient/statistics');
        return response.data;
    },
    getSpecialistDashboard: async () => {
        const response = await api.get('dashboards/specialist');
        return response.data;
    },
    getHealth: async () => {
        const response = await api.get('health');
        return response.data;
    }
};
