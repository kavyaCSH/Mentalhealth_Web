// ─── Clinical Intelligence Types ────────────────────────────────────────────

export interface ModuleStatus {
    chief_complaints: 'completed' | 'pending' | 'in_progress';
    hpi: 'completed' | 'pending' | 'in_progress';
    ros: 'completed' | 'pending' | 'in_progress';
    past_history: 'completed' | 'pending' | 'in_progress';
    mse: 'completed' | 'pending' | 'in_progress';
    symptoms: 'completed' | 'pending' | 'in_progress';
}

export interface ClinicalSummary {
    patient: {
        name: string;
        age: number;
        gender: string;
    };
    summary: {
        total_modules_completed: number;
        modules_status: ModuleStatus;
        overall_color_code: string; // Hex: #4CAF50, #FDD835, #FB8C00, #E53935
    };
    clinical_data: {
        chief_complaints?: any[];
        hpi?: any[];
        ros?: any[];
        past_history?: any[];
        mse?: any[];
        symptoms?: any[];
    };
}

export interface DifferentialDiagnosis {
    condition: string;
    confidence: number;
    reasoning?: string;
}

export interface ClinicalInference {
    differential_diagnosis: DifferentialDiagnosis[];
    rule_outs: string[];
    criteria_matched: string[];
    criteria_missing: string[];
    red_flags: string[];
    risk_stratification: {
        score: number;
        level: 'low' | 'moderate' | 'high' | 'critical';
        description?: string;
    };
    recommendations?: string[];
    generated_at?: string;
}

export interface ClinicalSummaryResponse {
    success: boolean;
    data: ClinicalSummary;
}

export interface ClinicalInferenceResponse {
    success: boolean;
    data: ClinicalInference;
}
