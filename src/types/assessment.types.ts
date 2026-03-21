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

export interface SelfAssessmentQuestion extends AssessmentQuestion {
    topic?: string;
}

export interface SelfAssessmentSubmission {
    responses: AssessmentResponse[];
    date?: string;
    time?: string;
    notes?: string;
    wellnessAspect?: string;
}

export interface SelfAssessmentResult {
    assessmentId: number;
    totalScore: number;
    percentage: number;
}

export interface ProfessionalAssessmentPatientInfo {
    userId: number;
    firstName: string;
    age: number;
    gender: string;
}

export type ProfessionalAssessmentTopics = Record<string, AssessmentQuestion[]>;

export interface ProfessionalAssessmentSubmission {
    patientId: string | number;
    consultId?: string | number;
    category: string;
    responses: AssessmentResponse[];
    notes?: string;
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
    assessmentId?: number;
    slug?: string;
    category?: string;
    type?: string;
    assessment_type?: string;
    date?: string;
    time?: string;
    notes?: string;
    score?: number;
    rawScore?: number;
    totalScore?: number;
    maxScore?: number;
    maxPossibleScore?: number;
    totalPossibleScore?: number;
    percentage?: number;
    interpretation?: string;
    severity?: string;
    tScore?: number;
    clinicalResults?: Record<string, Record<string, unknown>>;
    recommendations?: string[];
    recommendation?: string;
    status?: string;
    isSelfAssessment?: boolean;
    responses?: {
        questionId: string | number;
        optionId: string;
        question?: string;
        questionText?: string;
        answerText?: string;
        selectedOption?: string;
        score?: number;
        _id?: string;
    }[];
    colorClass?: string;
    severityStyle?: Record<string, unknown>;
    source?: string;
    createdAt?: string;
    updatedAt?: string;
}
