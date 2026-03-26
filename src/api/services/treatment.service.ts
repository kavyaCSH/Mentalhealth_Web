import api from '../client';
import type {
    InitializeTreatmentPayload,
    UpdateStageStatusPayload,
    TreatmentProgress
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
    }
};
