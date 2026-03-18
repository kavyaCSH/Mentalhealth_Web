export type MSEQuestionType = 'select' | 'multiselect' | 'text' | 'boolean' | 'number' | 'group';

export interface MSEFollowUp {
    key: string;
    label: string;
    type: MSEQuestionType;
    options?: string[];
    placeholder?: string;
}

export interface MSEQuestion {
    key: string;
    label: string;
    type: MSEQuestionType;
    options?: string[];
    placeholder?: string;
    min?: number;
    max?: number;
    items?: {
        key: string;
        label: string;
        type: MSEQuestionType;
    }[];
    follow_up?: MSEFollowUp[];
}

export interface MSESection {
    section: string;
    title: string;
    description: string;
    questions: MSEQuestion[];
}

export interface MSEResponseItem {
    questionCode: string;
    value: unknown;
}

export interface MSESubmission {
    patient_id: string | number;
    consult_id?: string | number;
    responses: MSEResponseItem[];
}

export interface AIAnalysis {
    affect_recognition: string;
    speech_tempo_analysis: string;
    emotional_tone_mapping: string[];
    psychomotor_markers: string[];
    clinical_formulation: string;
    diagnostic_impressions: string[];
}

export interface MSEResponse {
    mseId: number | string;
    consult_id: string | null;
    patient: string;
    status: string;
    ai_analysis: AIAnalysis;
    color_code: string;
    createdAt: string;
    [key: string]: unknown;
}
