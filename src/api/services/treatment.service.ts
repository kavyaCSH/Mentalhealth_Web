import api from '../client';
import type {
    InitializeTreatmentPayload,
    UpdateStageStatusPayload,
    TreatmentProgress,
    TreatmentPlanPayload,
    TreatmentPlan
} from '../../types/treatment.types';

export const TreatmentService = {
    initializeTreatment: async (payload: InitializeTreatmentPayload) => {
        const response = await api.post('treatment/initialize', payload);
        return response.data;
    },

    getPatientProgress: async (patientId: string | number): Promise<TreatmentProgress> => {
        const idStr = String(patientId);
        const response = await api.get(`treatment/progress/${idStr}`, {
            params: {
                patientId: idStr,
            }
        });
        return response.data;
    },

    updateStageStatus: async (stageId: string, payload: UpdateStageStatusPayload) => {
        const response = await api.patch(`treatment/${stageId}`, payload);
        return response.data;
    },

    /**
     * Record a formal clinical plan with medications and next steps.
     * Endpoint: POST /api/v1/treatment/plan
     */
    addTreatmentPlan: async (payload: TreatmentPlanPayload): Promise<TreatmentPlan> => {
        const response = await api.post('treatment/plan', payload);
        return response.data?.data ?? response.data;
    },

    /**
     * Get the full treatment plan history for a patient.
     * Endpoint: GET /api/v1/treatment/plan/history/:patientId
     */
    getPlanHistory: async (patientId: string | number): Promise<TreatmentPlan[]> => {
        const response = await api.get(`treatment/plan/history/${patientId}`);
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : [];
    }
};
