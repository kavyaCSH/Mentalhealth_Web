export interface TreatmentStage {
    id: string;
    title: string;
    stage?: string; // Alias for title from some API responses
    status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
    notes?: string;
    description?: string;
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
}

export interface UpdateStageStatusPayload {
    status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
    notes?: string;
}
