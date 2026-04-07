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
    previous_diagnosis?: string[];
    hospitalizations?: {
        year: string;
        reason: string;
        location: string;
        duration: string;
    }[];
    suicide_attempts?: {
        year: string;
        method: string;
        intent: string;
    }[];
    medication_trials?: {
        name: string;
        dose: string;
        duration: string;
        response: string;
        side_effects: string;
    }[];
    psychotherapy_history?: string;
    previous_episodes?: string | string[];
    previous_treatments?: string | string[];
}

export interface MedicalHistory {
    chronic_conditions?: string[];
    surgeries?: {
        procedure: string;
        year: string;
    }[];
    head_injury?: {
        detected: boolean;
        loss_of_consciousness: boolean;
        details: string;
    };
    seizures?: {
        detected: boolean;
        frequency: string;
        last_seizure: string;
    };
    allergies?: string[];
}

export interface FamilyHistory {
    conditions?: {
        relative: string;
        condition: string;
        outcome: string;
    }[];
    suicide_in_family?: boolean;
    substance_abuse_in_family?: boolean;
}

export interface SubstanceUseHistory {
    alcohol?: {
        status: string;
        quantity: string;
        frequency: string;
        last_use: string;
    };
    tobacco_nicotine?: {
        status: string;
        type: string;
        quantity: string;
    };
    illicit_drugs?: {
        drug: string;
        status: string;
        frequency: string;
        last_use: string;
    }[];
    caffeine?: string;
    prescription_misuse?: string;
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
    substance_use?: string | null;
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
    patient: string | number;
    consult_id?: string | number;
    status?: string;
    narrative?: string;
    psychiatric_history?: PsychiatricHistory;
    medical_history?: MedicalHistory;
    family_history?: FamilyHistory;
    substance_use?: SubstanceUseHistory;
    social_history?: SocialHistory;
    trauma_history?: DetailedTraumaHistory;
    developmental_history?: DevelopmentalHistory;
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
