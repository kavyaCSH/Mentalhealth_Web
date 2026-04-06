import api from '../client';
import type {
    AssessmentQuestion,
    SubmitAssessmentPayload,
    AssessmentResult,
    AssessmentMaster,
    SelfAssessmentQuestion,
    SelfAssessmentSubmission,
    SelfAssessmentResult,
    ProfessionalAssessmentPatientInfo,
    ProfessionalAssessmentTopics,
    ProfessionalAssessmentSubmission
} from '../../types/assessment.types';

// ─── Service ───────────────────────────────────────────────────────────

export const AssessmentService = {

    // ════════════════════════════════════════════
    //  MODERN: Self-Assessment API (Patients)
    // ════════════════════════════════════════════

    /** GET /self-assessments/questions — flat list for patients */
    getSelfAssessmentQuestions: async (): Promise<{ success: boolean; code: number; data: { count: number; questions: SelfAssessmentQuestion[] } }> => {
        try {
            const response = await api.get('self-assessments/questions');
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                // Fallback to legacy endpoint
                const legacyRes = await api.get('questions/self-assessments');
                const aspects = legacyRes.data?.data?.aspects || legacyRes.data?.aspects || [];
                const allQuestions: SelfAssessmentQuestion[] = [];
                aspects.forEach((aspect: any) => {
                    if (Array.isArray(aspect.questions)) {
                        aspect.questions.forEach((q: any) => {
                            allQuestions.push({ ...q, category: aspect.name || q.category || 'general' });
                        });
                    }
                });
                return { success: true, code: 200, data: { count: allQuestions.length, questions: allQuestions } };
            }
            throw error;
        }
    },

    /** POST /self-assessments/submit — submit patient responses */
    submitSelfAssessment: async (data: SelfAssessmentSubmission): Promise<{ success: boolean; code: number; data: SelfAssessmentResult }> => {
        try {
            const now = new Date();
            const payload = {
                ...data,
                date: data.date || now.toISOString().split('T')[0],
                time: data.time || now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }),
                wellnessAspect: data.wellnessAspect || 'mental_health'
            };
            const response = await api.post('self-assessments/submit', payload);
            const rawData = response.data?.data ?? response.data;
            return {
                ...response.data,
                data: normalizeAssessment(rawData)
            };
        } catch (error: any) {
            if (error.response?.status === 404) {
                const response = await api.post('assessments', {
                    aspect: data.wellnessAspect || 'general',
                    selectedAnswers: data.responses.map(r => ({
                        questionId: r.questionId,
                        answer: { optionId: r.optionId, score: 0, text: '' }
                    })),
                    notes: data.notes
                });
                return response.data;
            }
            throw error;
        }
    },

    /** GET /self-assessments/history — patient's own history */
    getSelfAssessmentHistory: async (params?: { page?: number; limit?: number }): Promise<any> => {
        try {
            const response = await api.get('self-assessments/history', { params });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                const response = await api.get('assessments', { params });
                return response.data;
            }
            throw error;
        }
    },

    /** GET /self-assessments/:id — get specific assessment detail */
    getSelfAssessmentDetail: async (id: string | number): Promise<any> => {
        try {
            const response = await api.get(`self-assessments/${id}`);
            const data = response.data?.data ?? response.data;
            return normalizeAssessment(data);
        } catch (error: any) {
            if (error.response?.status === 404) {
                const response = await api.get(`assessments/${id}`);
                const data = response.data?.data ?? response.data;
                return normalizeAssessment(data);
            }
            throw error;
        }
    },

    // ════════════════════════════════════════════
    //  MODERN: Professional Assessment API (Staff)
    // ════════════════════════════════════════════

    /** GET /professional-assessments/questions?patientId=X — DSM-5 grouped */
    getProfessionalQuestions: async (patientId: string | number): Promise<{ success: boolean; code: number; data: { patient: ProfessionalAssessmentPatientInfo; topics: ProfessionalAssessmentTopics } }> => {
        try {
            const response = await api.get('professional-assessments/questions', { params: { patientId } });
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                // Fallback to legacy resource masters
                const mastersRes = await api.get('resource/masters/all', { params: { is_active: 1, master_type_slug: 'mental_health' } });
                const masters = mastersRes.data?.data?.masters || mastersRes.data?.masters || [];
                const topics: ProfessionalAssessmentTopics = {};
                masters.forEach((m: any) => { topics[m.slug || m.id] = []; });
                return {
                    success: true, code: 200,
                    data: { patient: { userId: Number(patientId), firstName: 'Patient', age: 0, gender: 'N/A' }, topics }
                };
            }
            throw error;
        }
    },

    /** POST /professional-assessments/submit — clinician submits for a patient */
    submitProfessionalAssessment: async (data: ProfessionalAssessmentSubmission): Promise<{ success: boolean; code: number; data: SelfAssessmentResult }> => {
        try {
            const response = await api.post('professional-assessments/submit', data);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404 || error.response?.status === 403 || error.response?.status === 400) {
                const legacyPayload = {
                    patientId: data.patientId,
                    slug: data.category,
                    notes: data.notes || 'Professional evaluation synthesis',
                    responses: data.responses,
                    // Double check consultId in fallback just in case it's an ObjectId string
                    consultId: data.consultId && !isNaN(Number(data.consultId)) ? Number(data.consultId) : undefined
                };

                const response = await api.post('assessments', legacyPayload);
                return response.data;
            }
            throw error;
        }
    },

    /** GET /professional-assessments/patient/:patientId */
    getPatientProfessionalHistory: async (patientId: string | number): Promise<AssessmentResult[]> => {
        try {
            const response = await api.get(`professional-assessments/patient/${patientId}`);
            const data = response.data?.data ?? response.data;
            return (Array.isArray(data) ? data : (data?.assessments || data?.history || [])).filter(Boolean).map(normalizeAssessment);
        } catch (error: any) {
            const status = error.response?.status;
            // Handle both 404 (Not Found) and 400 (Lazy Enroll 'Patient record not found' error)
            if (status === 404 || status === 400) {
                const response = await api.get(`assessments/patient/${patientId}`);
                const data = response.data?.data ?? response.data;
                return (Array.isArray(data) ? data : []).filter(Boolean).map(normalizeAssessment);
            }
            throw error;
        }
    },

    // ════════════════════════════════════════════
    //  LEGACY: Backward-Compatible Endpoints
    // ════════════════════════════════════════════

    getMastersList: async (params?: Record<string, unknown>): Promise<AssessmentMaster[]> => {
        const res = await api.get('resource/masters', { params });
        const data = res.data?.data ?? res.data;
        return Array.isArray(data) ? data : data?.masters || [];
    },

    getMasters: async (userId?: string | number, params?: Record<string, unknown>): Promise<Record<string, unknown>> => {
        const url = userId ? `resource/masters/all/${userId}` : 'resource/masters/all';
        const response = await api.get(url, { params });
        return response.data;
    },

    getQuestions: async (
        patientId?: string | number,
        category?: string
    ): Promise<{ questions: AssessmentQuestion[]; profile?: { userId?: string | number; firstName?: string; age?: number; gender?: string }; count?: number }> => {
        const params: Record<string, string> = {};
        if (patientId) { params.patientId = String(patientId); params.patient = String(patientId); }
        if (category) params.category = category;
        const res = await api.get('questions/assessment', { params });
        const data = res.data?.data ?? res.data;
        if (data?.questions && Array.isArray(data.questions)) {
            return { questions: data.questions, profile: data.profile, count: data.count };
        }
        return { questions: Array.isArray(data) ? data : [], profile: undefined, count: 0 };
    },

    submitAssessment: async (payload: SubmitAssessmentPayload): Promise<AssessmentResult> => {
        const res = await api.post('assessments', payload);
        const data = res.data?.data ?? res.data;
        return normalizeAssessment(data);
    },

    getOwnHistory: async (page = 1, limit = 10, category?: string): Promise<{ assessments: AssessmentResult[]; total: number }> => {
        const params: Record<string, string | number> = { page, limit };
        if (category && category !== 'all') params.category = category;
        
        try {
            // Priority 1: Use patient-specific self-assessment history endpoint
            const res = await api.get('self-assessments/history', { params });
            const data = res.data?.data ?? res.data;
            let assessments: any[] = [];
            let total = 0;

            if (Array.isArray(data)) {
                assessments = data;
                total = data.length;
            } else if (data) {
                assessments = data.assessments || data.history || data.data || [];
                total = Number(data.total ?? data.count ?? assessments.length);
            }

            return {
                assessments: (Array.isArray(assessments) ? assessments : []).filter(Boolean).map(normalizeAssessment),
                total
            };
        } catch (err: any) {
            // Priority 2: Fallback to unified or legacy assessments endpoint
            console.warn('Primary history sync failed, attempting legacy vault fallback...', err);
            try {
                const legacyRes = await api.get('assessments', { params });
                const lData = legacyRes.data?.data ?? legacyRes.data;
                
                let lAssessments: any[] = [];
                let lTotal = 0;

                if (Array.isArray(lData)) {
                    lAssessments = lData;
                    lTotal = lData.length;
                } else {
                    lAssessments = Array.isArray(lData.assessments) ? lData.assessments : (lData.data?.assessments || lData.data || []);
                    lTotal = Number(lData.total ?? lData.count ?? lAssessments.length ?? 0);
                }

                return {
                    assessments: lAssessments.filter(Boolean).map(normalizeAssessment),
                    total: lTotal
                };
            } catch (fallbackErr) {
                if (fallbackErr instanceof Error && (fallbackErr as any).response?.status === 400 && (fallbackErr as any).response?.data?.message?.includes('not found')) {
                    return { assessments: [], total: 0 };
                }
                console.error('All assessment history sync attempts failed', fallbackErr);
                throw fallbackErr;
            }
        }
    },

    getDetail: async (id: string): Promise<AssessmentResult> => {
        const res = await api.get(`assessments/${id}`);
        const data = res.data?.data ?? res.data;
        return normalizeAssessment(data);
    },

    getPatientHistory: async (patientId: string): Promise<AssessmentResult[]> => {
        const res = await api.get(`assessments/patient/${patientId}`);
        const data = res.data?.data ?? res.data;
        return (Array.isArray(data) ? data : []).filter(Boolean).map(normalizeAssessment);
    },

    getAllAdmin: async (): Promise<AssessmentResult[]> => {
        const res = await api.get('assessments/admin');
        const data = res.data?.data ?? res.data;
        return (Array.isArray(data) ? data : []).filter(Boolean).map(normalizeAssessment);
    },

    update: async (id: string, payload: { notes?: string; status?: string }): Promise<AssessmentResult> => {
        const res = await api.patch(`assessments/${id}`, payload);
        const data = res.data?.data ?? res.data;
        return normalizeAssessment(data);
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`assessments/${id}`);
    }
};

// ─── Normalization Helper ─────────────────────────────────────────────

function normalizeAssessment(data: Record<string, unknown> | null | undefined): AssessmentResult {
    if (!data) return {} as AssessmentResult;

    // Support nested data structures
    const assessment = (data.assessment || data.data || data) as Record<string, unknown>;

    // Defensive score extraction
    const rawScore = Number(
        assessment.totalScore ?? 
        assessment.score ?? 
        assessment.rawScore ?? 
        assessment.raw_score ?? 
        assessment.total_score ?? 
        assessment.value ?? 
        assessment.total ?? 
        0
    );
    const maxScore = Number(
        assessment.maxScore ?? 
        assessment.max_score ?? 
        assessment.maxPossibleScore ?? 
        assessment.totalPossibleScore ?? 
        assessment.max ?? 
        100
    );

    let percentage = (assessment.percentage ?? assessment.percentageScore ?? assessment.percentage_score) as number | undefined;
    if (percentage == null && maxScore > 0) { percentage = (rawScore / maxScore) * 100; }
    if (typeof percentage === 'number') { percentage = Math.round(percentage * 100) / 100; }

    const slug = assessment.slug || assessment.type || assessment.category_slug || assessment.assessment_slug || assessment.category || assessment.category_name;
    let clinical = (assessment.clinicalResults && slug) ? (assessment.clinicalResults as Record<string, Record<string, unknown>>)[slug as string] : {};
    
    if (!(clinical as any)?.interpretation && assessment.clinicalResults) {
        const clinicalResults = assessment.clinicalResults as Record<string, Record<string, unknown>>;
        const firstKey = Object.keys(clinicalResults)[0];
        if (firstKey) clinical = clinicalResults[firstKey];
    }

    let tScore = assessment.tScore ?? assessment.t_score ?? (clinical as Record<string, unknown>)?.tScore;
    if (tScore != null) { tScore = Math.round(Number(tScore) * 100) / 100; }

    const interpretation = String(
        assessment.interpretation || 
        clinical.interpretation || 
        assessment.severity || 
        clinical.severity || 
        assessment.clinical_interpretation || 
        'Completed'
    );
    const finalRawScore = typeof rawScore === 'number' ? Math.round(rawScore * 100) / 100 : (rawScore as number);

    const createdAt = (assessment.date as string) || (assessment.createdAt as string);
    const dateStr = createdAt ? new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date Unknown';

    const finalId = String(assessment._id || assessment.id || assessment.uuid || Math.random().toString(36).substr(2, 9));

    return {
        ...assessment,
        id: finalId,
        _id: finalId,
        totalScore: finalRawScore,
        score: finalRawScore,
        maxScore: maxScore as number,
        maxPossibleScore: maxScore as number,
        totalPossibleScore: maxScore as number,
        percentage: percentage as number,
        tScore: tScore as number,
        interpretation: interpretation,
        severity: interpretation,
        slug: String(slug || 'general'),
        category: String(assessment.category || assessment.category_name || assessment.category_slug || slug || 'General Assessment'),
        date: dateStr,
        time: (assessment.time as string) || (createdAt ? new Date(createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined),
        responses: (() => {
            const res = assessment.responses || assessment.selectedAnswers || assessment.questions || [];
            if (!Array.isArray(res)) return [];
            return res.map((r: any, ri: number) => ({
                ...r,
                questionId: r.questionId || r.question_id || `q-${ri}`,
                optionId: r.optionId || r.option_id || r.answer?.optionId || r.selectedOption,
                questionText: r.questionText || r.question_text || r.question || `Assessment Item ${ri + 1}`,
                answerText: r.answerText || r.answer_text || r.answer?.text || r.selectedAnswer || 'Response Recorded',
                score: r.score ?? r.answer?.score ?? 0
            }));
        })(),
    } as unknown as AssessmentResult;
}
