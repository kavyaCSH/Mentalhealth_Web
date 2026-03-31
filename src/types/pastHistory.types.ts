export type PastHistoryQuestionType = 'select' | 'multiselect' | 'text' | 'textarea' | 'boolean' | 'number' | 'date' | 'array' | 'boolean_group';

export interface PastHistoryFollowUp {
    key: string;
    label: string;
    type: PastHistoryQuestionType;
    options?: string[];
    placeholder?: string;
    min?: number;
    max?: number;
}

export interface PastHistoryQuestion {
    key: string;
    label: string;
    professional_label?: string;
    patient_label?: string;
    type: PastHistoryQuestionType;
    description?: string;
    options?: string[];
    allow_custom?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    follow_up?: PastHistoryFollowUp[];
    fields?: PastHistoryQuestion[]; // For boolean_group
    item_structure?: PastHistoryQuestion[]; // For array type
    is_required?: boolean;
}

export interface PastHistorySection {
    section: string;
    title: string;
    description?: string;
    questions: PastHistoryQuestion[];
}

export interface PastHistoryResponseItem {
    questionCode: string;
    value: unknown;
}

export interface PsychiatricHistory {
    previous_episodes?: string;
    hospitalizations?: string;
    previous_treatments?: string;
    previous_diagnosis?: string[];
    medication_trials?: any[];
    suicide_attempts?: any[];
    psychotherapy_history?: string;
}

export interface MedicalHistory {
    chronic_conditions?: any[];
    surgeries?: any[];
    allergies?: any[];
    head_injury?: {
        detected: boolean;
        loss_of_consciousness: boolean;
        details: any;
    };
    seizures?: {
        detected: boolean;
        frequency: any;
        last_seizure: any;
    };
}

export interface FamilyHistory {
    paternal?: string;
    maternal?: string;
    siblings?: string;
    conditions?: any[];
    suicide_in_family?: boolean;
    substance_abuse_in_family?: boolean;
}

export interface SubstanceUseHistory {
    alcohol?: {
        status: string | null;
        quantity: string | null;
        frequency: string | null;
        last_use: string | null;
    };
    tobacco_nicotine?: {
        status: string | null;
        type: string | null;
        quantity: string | null;
    };
    illicit_drugs?: any[];
    caffeine?: string | null;
    prescription_misuse?: string | null;
}

export interface SocialHistory {
    education?: string | null;
    employment?: string | null;
    marital_status?: string | null;
    living_situation?: string | null;
    legal_history?: {
        legal_issues: boolean;
        legal_details: string | null;
    };
    spiritual_beliefs?: string | null;
    strengths_hobbies?: string | null;
}

export interface DetailedTraumaHistory {
    physical_abuse?: boolean;
    emotional_abuse?: boolean;
    sexual_abuse?: boolean;
    significant_losses?: string | null;
    military_service?: boolean;
    trauma_notes?: string | null;
}

export interface DevelopmentalHistory {
    pregnancy_complications?: string | null;
    delivery_type?: string | null;
    milestones?: string | null;
    childhood_behavior?: string | null;
    school_performance?: string | null;
}

export interface PastHistorySubmission {
    patient_id: string | number;
    consult_id?: string | number;
    narrative?: string;
    psychiatric_history?: PsychiatricHistory;
    medical_history?: MedicalHistory;
    family_history?: FamilyHistory;
    substance_use?: string | SubstanceUseHistory;
    social_history?: SocialHistory;
    trauma_history?: string | DetailedTraumaHistory;
    developmental_history?: DevelopmentalHistory;
    status?: string;
    responses?: PastHistoryResponseItem[];
}

export interface PastHistoryResponse {
    id?: string | number;
    _id?: string;
    pastHistoryId?: number | string;
    patient_id: string | number;
    consult_id?: string | number | null;
    patient: string | any;
    status: string;
    narrative?: string;
    psychiatric_history?: PsychiatricHistory;
    medical_history?: MedicalHistory;
    family_history?: FamilyHistory;
    substance_use?: string | SubstanceUseHistory;
    social_history?: SocialHistory;
    trauma_history?: string | DetailedTraumaHistory;
    developmental_history?: DevelopmentalHistory;
    ai_notes?: string;
    color_code?: string;
    risk_flags?: string[];
    genetic_risk_summary?: string;
    treatment_resistance_risk?: string;
    createdAt: string;
    updatedAt?: string;
    [key: string]: unknown;
}
