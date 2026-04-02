import api from '../client';
import type { SpecialistStatsResponse, PatientStatsResponse } from '../../types/stats.types';

export const DashboardService = {
    getPatientDashboard: async () => {
        const response = await api.get('dashboards/patient');
        return response.data;
    },
    getPatientStatistics: async (): Promise<PatientStatsResponse | any> => {
        const response = await api.get('dashboards/patient/statistics');
        return response.data;
    },
    getSpecialistDashboard: async () => {
        const response = await api.get('dashboards/specialist');
        return response.data;
    },
    getSpecialistPatientStatistics: async (): Promise<SpecialistStatsResponse> => {
        const response = await api.get('dashboards/specialist/patient-statistics');
        return response.data;
    },
    getHealth: async () => {
        const response = await api.get('health');
        return response.data;
    }
};
