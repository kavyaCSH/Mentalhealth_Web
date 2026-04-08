export interface TreatmentStage {
    id: string;
    title: string;
    stage?: string; // Alias for title from some API responses
    status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'skipped';
    notes?: string;
    description?: string;
    order?: number;
    createdAt?: string;
}

export interface TreatmentProgress {
    stages: TreatmentStage[];
    overall_progress: number;
    patientId: string;
    diagnosis: string;
}

export interface InitializeTreatmentPayload {
    patient_id?: string | number;
    patientId?: string | number;
    userId?: string | number;
    patient?: string;
    diagnosis: string;
    goals: string[];
    customStages?: {
        stage: string;
        order: number;
        status: string;
    }[];
}

export interface UpdateStageStatusPayload {
    status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'skipped';
    notes?: string;
}

export interface TreatmentPlan {
    _id?: string;
    patientId: string | number;
    consultId?: string | number;
    plan: string;
    medications: string;
    next_steps: string;
    clinician?: {
        userId?: number;
        firstName?: string;
        lastName?: string;
        role?: string;
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface TreatmentPlanPayload {
    patientId: string | number;
    consultId?: string | number;
    plan: string;
    medications: string;
    next_steps: string;
}

export interface TreatmentPlanHistoryResponse {
    success: boolean;
    data: TreatmentPlan[];
}
