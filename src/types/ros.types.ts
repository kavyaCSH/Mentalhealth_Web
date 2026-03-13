export type ROSQuestionType = 'select' | 'multiselect' | 'text' | 'boolean' | 'number' | 'date';

export interface ROSFollowUp {
    key: string;
    label: string;
    type: ROSQuestionType;
    options?: string[];
    placeholder?: string;
    min?: number;
    max?: number;
}

export interface ROSQuestion {
    key: string;
    label: string;
    type: ROSQuestionType;
    description?: string;
    options?: string[];
    placeholder?: string;
    min?: number;
    max?: number;
    follow_up?: ROSFollowUp[];
}

export interface ROSSection {
    section: string;
    title: string;
    description: string;
    questions: ROSQuestion[];
}

export interface ROSSubmission {
    patient_id: string | number;
    consult_id?: string | number | null;
    extra_notes?: string;
    // The keys are flattened on the backend usually or grouped by section
    // Based on the user's POST example, it's grouped by section but includes follow-ups at the same level
    [key: string]: any;
}

export interface ROSResponse {
    rosId: number;
    consult_id?: string | number | null;
    status: string;
    psychiatric: Record<string, any>;
    medical: Record<string, any>;
    extra_notes?: string;
    organic_red_flags: string[];
    medication_induced_risk: string[];
    substance_induced_probability: string;
    ai_notes: string;
    color_code: string;
    createdAt: string;
}
