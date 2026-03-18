import api from '../client';
import type {
    AssessmentQuestion,
    SubmitAssessmentPayload,
    AssessmentResult,
    AssessmentMaster
} from '../../types/assessment.types';

// ─── Service ───────────────────────────────────────────────────────────

export const AssessmentService = {
    getMastersList: async (params?: Record<string, unknown>): Promise<AssessmentMaster[]> => {
        const res = await api.get('/resource/masters', { params });
        const data = res.data?.data ?? res.data;
        return Array.isArray(data) ? data : data?.masters || [];
    },

    getMasters: async (userId?: string | number, params?: Record<string, unknown>): Promise<Record<string, unknown>> => {
        const url = userId ? `/resource/masters/all/${userId}` : '/resource/masters/all';
        const response = await api.get(url, { params });
        return response.data;
    },

    getQuestions: async (
        patientId?: string | number,
        category?: string
    ): Promise<{ questions: AssessmentQuestion[]; profile?: { userId?: string | number; firstName?: string; age?: number; gender?: string }; count?: number }> => {
        const params: Record<string, string> = {};
        if (patientId) {
            params.patientId = String(patientId);
            params.patient = String(patientId);
        }
        if (category) params.category = category;

        const res = await api.get('/questions/assessment', { params });
        const data = res.data?.data ?? res.data;

        if (data?.questions && Array.isArray(data.questions)) {
            return { questions: data.questions, profile: data.profile, count: data.count };
        }
        return { questions: Array.isArray(data) ? data : [], profile: undefined, count: 0 };
    },

    submitAssessment: async (payload: SubmitAssessmentPayload): Promise<AssessmentResult> => {
        const res = await api.post('/assessments', payload);
        const data = res.data?.data ?? res.data;
        return normalizeAssessment(data);
    },

    getOwnHistory: async (
        page = 1,
        limit = 10,
        category?: string
    ): Promise<{ assessments: AssessmentResult[]; total: number }> => {
        const params: Record<string, string | number> = { page, limit };
        if (category && category !== 'all') params.category = category;

        const res = await api.get('/assessments', { params });
        const data = res.data?.data ?? res.data;

        if (Array.isArray(data)) {
            return { 
                assessments: data.filter(Boolean).map(normalizeAssessment), 
                total: data.length 
            };
        }

        // Handle deeply nested or alternative data structures
        const assessments = Array.isArray(data.assessments)
            ? data.assessments
            : (data.data?.assessments || data.data || []);

        return {
            assessments: (Array.isArray(assessments) ? assessments : []).filter(Boolean).map(normalizeAssessment),
            total: Number(data.total ?? data.count ?? assessments.length ?? 0),
        };
    },

    getDetail: async (id: string): Promise<AssessmentResult> => {
        const res = await api.get(`/assessments/${id}`);
        const data = res.data?.data ?? res.data;
        return normalizeAssessment(data);
    },

    getPatientHistory: async (patientId: string): Promise<AssessmentResult[]> => {
        const res = await api.get(`/assessments/patient/${patientId}`);
        const data = res.data?.data ?? res.data;
        return (Array.isArray(data) ? data : []).filter(Boolean).map(normalizeAssessment);
    },

    getAllAdmin: async (): Promise<AssessmentResult[]> => {
        const res = await api.get('/assessments/admin');
        const data = res.data?.data ?? res.data;
        return (Array.isArray(data) ? data : []).filter(Boolean).map(normalizeAssessment);
    },

    update: async (
        id: string,
        payload: { notes?: string; status?: string }
    ): Promise<AssessmentResult> => {
        const res = await api.patch(`/assessments/${id}`, payload);
        const data = res.data?.data ?? res.data;
        return normalizeAssessment(data);
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/assessments/${id}`);
    }
};

// ─── Normalization Helper ─────────────────────────────────────────────

function normalizeAssessment(data: Record<string, unknown> | null | undefined): AssessmentResult {
    if (!data) return {} as AssessmentResult;

    // API sometimes returns score, rawScore, total_score, or totalScore
    const rawScore = Number(data.totalScore ?? data.score ?? data.rawScore ?? data.raw_score ?? data.total_score ?? 0);
    const maxScore = Number(data.maxScore ?? data.max_score ?? data.maxPossibleScore ?? 100);

    // Ensure percentage is calculated if missing but scores are present
    let percentage = (data.percentage ?? data.percentageScore) as number | undefined;
    if (percentage == null && maxScore > 0) {
        percentage = (rawScore / maxScore) * 100;
    }

    // Format to 2 decimal places if it's a float
    if (typeof percentage === 'number') {
        percentage = Math.round(percentage * 100) / 100;
    }

    // Extract Clinical Data (mobile parity)
    const slug = data.slug || data.type || data.category_slug || data.assessment_slug || data.category || data.category_name;
    let clinical = (data.clinicalResults && slug) ? (data.clinicalResults as Record<string, Record<string, unknown>>)[slug as string] : {};

    // If slug lookup failed but clinical results exist, try to find the first non-empty interpretation
    if (!clinical?.interpretation && data.clinicalResults) {
        const clinicalResults = data.clinicalResults as Record<string, Record<string, unknown>>;
        const firstKey = Object.keys(clinicalResults)[0];
        if (firstKey) clinical = clinicalResults[firstKey];
    }

    let tScore = data.tScore ?? data.t_score ?? (clinical as Record<string, unknown>)?.tScore;
    if (tScore != null) {
        tScore = Math.round(Number(tScore) * 100) / 100;
    }

    const interpretation = (data.interpretation as string) || (clinical as Record<string, unknown>)?.interpretation || (data.severity as string) || (clinical as Record<string, unknown>)?.severity;

    const finalRawScore = typeof rawScore === 'number' ? Math.round(rawScore * 100) / 100 : (rawScore as number);

    return {
        ...data,
        id: data._id || data.id,
        totalScore: finalRawScore,
        score: finalRawScore, // Ensure both are synced
        maxScore: maxScore as number,
        maxPossibleScore: maxScore as number,
        percentage: percentage as number,
        tScore: tScore as number,
        interpretation: interpretation as string,
        severity: interpretation as string,
        slug: slug as string,
        category: (data.category as string) || (data.category_name as string),
        date: (data.date as string) || (data.createdAt as string),
        time: (data.time as string) || (data.createdAt ? new Date(data.createdAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined),
    } as unknown as AssessmentResult;
}
