import api from '../client';
import type { CentralAnalytics, CentralAnalyticsResponse, HeatMapNode, HeatMapResponse } from '../../types/analytics.types';

export const AnalyticsService = {
    /**
     * Aggregates platform-wide consultation data, risk distribution, and city breakdowns.
     * Endpoint: GET /api/v1/analytics/dashboard
     */
    getCentralAnalytics: async (): Promise<CentralAnalytics> => {
        const response = await api.get<CentralAnalyticsResponse>('analytics/dashboard');
        return response.data.data;
    },

    /**
     * Fetches all consultations with valid GPS coordinates and a finalized primary diagnosis.
     * Endpoint: GET /api/v1/analytics/heat-map
     */
    getHeatMapData: async (): Promise<HeatMapNode[]> => {
        const response = await api.get<HeatMapResponse>('analytics/heat-map');
        return response.data.data;
    }
};
