// ─── AI Diagnosis Types ──────────────────────────────────────────────────────

export interface AIDiagnosisRequest {
    user_id: number;
    narrative: string;
}

export interface NewDiagnosisCondition {
    condition: string;
    dsm5_code?: string;
    specifiers?: string[];
}

export interface PrescriptionItem {
    name: string;
    dose: string;
    duration: string;
    instructions: string;
}

export interface AIDiagnosisData {
    // Nested schema
    diagnosis?: {
        primary?: NewDiagnosisCondition;
        secondary?: NewDiagnosisCondition;
        stressors?: string[];
        severity?: string;
    };
    prescription?: PrescriptionItem[];

    // Flat schema
    primaryDiagnosis?: string;
    confidence?: number; // 0 to 1
    severity?: string;
    riskLevel?: string;
    symptomsIdentified?: string[];
    recommendations?: string[];

    // Keep local fields just in case
    generated_at?: string;
    narrative?: string;
}

export interface AIDiagnosisResponse {
    success?: boolean;
    code?: number;
    message?: string;
    data?: AIDiagnosisData;
    [key: string]: any;
}
