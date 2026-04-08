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

    initializeJourney: async (patientId: string | number) => {
        const response = await api.post('treatment/initialize', { patientId: String(patientId) });
        return response.data;
    },

    createTreatmentPlan: async (payload: any) => {
        const response = await api.post('treatment/plan', payload);
        return response.data;
    },

    getPatientProgress: async (patientId: string | number): Promise<TreatmentProgress> => {
        const idStr = String(patientId);
        const response: any = await api.get(`treatment/progress/${idStr}`);
        
        // Handle varying API response shapes (raw array vs { success, data })
        const rawList = Array.isArray(response.data) ? response.data : 
                      (Array.isArray(response) ? response : (response.data?.data || response.data?.history || []));
                      
        // Transform the raw list into the UI model (Mobile Parity: stage vs title)
        const stagesList = (rawList as any[])
            .sort((a, b) => (Number(a.order || 0) - Number(b.order || 0)))
            .map((s: any, i: number) => ({
                id: String(s._id || s.id || i),
                title: String(s.stage || s.title || 'Therapeutic Step'),
                status: s.status || 'pending',
                description: s.notes || s.description || '',
                createdAt: s.completedAt || s.createdAt || s.date || undefined,
                order: s.order || (i + 1)
            }));

        // Calculate metadata for UI enhancement
        const completedCount = stagesList.filter(s => s.status === 'completed').length;
        const overall_progress = stagesList.length > 0 
            ? Math.round((completedCount / stagesList.length) * 100) 
            : 0;

        return {
            stages: stagesList,
            overall_progress,
            patientId: idStr,
            diagnosis: 'Personalized Therapeutic Roadmap'
        };
    },

    getTreatmentHistory: async (patientId: string | number): Promise<any> => {
        const response = await api.get(`treatment/plan/history/${patientId}`);
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
