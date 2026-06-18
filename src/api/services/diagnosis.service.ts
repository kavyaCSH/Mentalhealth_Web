import api from '../client';
import type { AIDiagnosisRequest, AIDiagnosisResponse } from '../../types/diagnosis.types';

export const DiagnosisService = {
    /**
     * Generate AI clinical diagnosis based on patient narrative / symptom description.
     * Endpoint: POST /api/v1/diagnosis/ai
     * Authentication: Bearer token (auto-injected by axios interceptor)
     */
    generateAIDiagnosis: async (payload: AIDiagnosisRequest): Promise<AIDiagnosisResponse> => {
        const response = await api.post<AIDiagnosisResponse>('diagnosis/ai', payload);
        return response.data;
    },

    /**
     * Get list of previous AI clinical diagnoses for a patient.
     * Endpoint: GET /api/v1/diagnosis/ai
     */
    getAIDiagnosisHistory: async (userId: number): Promise<any> => {
        const response = await api.get(`diagnosis/ai`, {
            params: { user_id: userId }
        });
        return response.data;
    },
};
