import api from '../client';
import type {
    ClinicalSummary,
    ClinicalSummaryResponse,
    ClinicalInference,
    ClinicalInferenceResponse
} from '../../types/clinical-intelligence.types';

export const ClinicalIntelligenceService = {
    /**
     * Get full clinical summary (6-module dossier) for a patient.
     * Endpoint: GET /api/v1/patients/:patientId/clinical-summary
     */
    getClinicalSummary: async (patientId: string | number, consultId?: string | number): Promise<ClinicalSummary> => {
        const params: Record<string, string> = {};
        if (consultId) params.consult_id = String(consultId);
        const response = await api.get<ClinicalSummaryResponse>(`patients/${patientId}/clinical-summary`, { params });
        return response.data.data;
    },

    /**
     * Generate AI clinical inference for a patient.
     * Endpoint: POST /api/v1/patients/:patientId/clinical-inference
     * Access: Psychiatrist & Super Admin Only (Audit-Logged)
     */
    generateInference: async (patientId: string | number, consultId?: string | number): Promise<ClinicalInference> => {
        const params: Record<string, string> = {};
        if (consultId) params.consult_id = String(consultId);
        const response = await api.post<ClinicalInferenceResponse>(`patients/${patientId}/clinical-inference`, {}, { params });
        return response.data.data;
    }
};
