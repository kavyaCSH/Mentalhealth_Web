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

export interface PastHistorySubmission {
    patient_id: string | number;
    consultId?: string | number;
    responses: PastHistoryResponseItem[];
}

export interface PastHistoryResponse {
    pastHistoryId: number | string;
    consult_id: string | null;
    patient: string;
    status: string;
    risk_flags: unknown[];
    treatment_resistance_risk: string;
    genetic_risk_summary: string;
    ai_notes: string;
    color_code: string;
    createdAt: string;
    [key: string]: unknown;
}
