import api from '../client';
import type { AssessmentQuestion } from '../../types/assessment.types';

export interface KnowledgeBaseResponse {
    success: boolean;
    data: AssessmentQuestion[];
}

export interface SelfAssessmentAspectsResponse {
    success: boolean;
    data: {
        aspects: {
            name: string;
            description: string;
            questions: AssessmentQuestion[];
        }[];
    };
}

export const KnowledgeBaseService = {
    /** 
     * GET /api/v1/questions
     * Fetches the full list of clinical questions with optional category filtering.
     */
    listQuestions: async (category?: string): Promise<AssessmentQuestion[]> => {
        const params = category ? { category } : {};
        const response = await api.get('questions', { params });
        const data = response.data?.data ?? response.data;
        return Array.isArray(data) ? data : data?.questions || [];
    },

    /**
     * POST /api/v1/questions
     * Adds a new question to the clinical repository.
     * Automatically triggers a WRITE event in the Audit Log on the backend.
     */
    createQuestion: async (question: Partial<AssessmentQuestion>): Promise<AssessmentQuestion> => {
        const response = await api.post('questions', question);
        return response.data?.data ?? response.data;
    },

    /**
     * GET /api/v1/questions/self-assessments
     * Returns questions organized into wellness "Aspects".
     */
    getSelfAssessmentAspects: async (): Promise<any> => {
        const response = await api.get('questions/self-assessments');
        return response.data?.data ?? response.data;
    }
};
