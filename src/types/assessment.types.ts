// ─── Assessment Types ───────────────────────────────────────────────────────────

export interface AssessmentQuestion {
    _id: string;
    id?: string;
    questionId?: string | number;
    text: string;
    category: string;
    type: string;
    uiType?: string;
    options: {
        _id: string;
        text: string;
        score: number;
    }[];
}

export interface AssessmentMaster {
    id?: string;
    _id?: string;
    name?: string;
    slug?: string;
    description?: string;
    duration?: string;
    is_active?: number;
    master_type_slug?: string;
    text?: string;
    title?: string;
}

export interface AssessmentResponse {
    questionId: number | string;
    optionId: string;
}

export interface SubmitAssessmentPayload {
    patientId: number | string;
    slug: string;
    date: string;
    time: string;
    notes: string;
    responses: AssessmentResponse[];
}

export interface AssessmentResult {
    _id?: string;
    id?: string;
    patientId?: string | number;
    slug?: string;
    category?: string;
    type?: string;
    date?: string;
    time?: string;
    notes?: string;
    score?: number;
    rawScore?: number;
    totalScore?: number;
    maxScore?: number;
    maxPossibleScore?: number;
    percentage?: number;
    interpretation?: string;
    severity?: string;
    tScore?: number;
    clinicalResults?: Record<string, Record<string, unknown>>;
    recommendations?: string[];
    recommendation?: string; // UI fallback
    responses?: {
        questionId: string | number;
        optionId: string;
        questionText?: string;
        selectedOption?: string;
        score?: number;
    }[];
    status?: string;
    colorClass?: string; // UI augmentation
    severityStyle?: Record<string, unknown>; // UI augmentation (contains icons)
    source?: string; // UI augmentation
    createdAt?: string;
    updatedAt?: string;
}
