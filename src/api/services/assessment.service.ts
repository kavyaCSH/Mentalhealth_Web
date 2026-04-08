import api from '../client';
import type {
    AssessmentResult,
    AssessmentMaster,
    AssessmentQuestion,
    SelfAssessmentQuestion,
    SelfAssessmentSubmission,
    SelfAssessmentResult,
    ProfessionalAssessmentPatientInfo,
    ProfessionalAssessmentTopics,
    ProfessionalAssessmentSubmission,
    SubmitAssessmentPayload
} from '../../types/assessment.types';

// ─── Service ───────────────────────────────────────────────────────────

export const AssessmentService = {

    // ════════════════════════════════════════════
    //  MODERN: Self-Assessment API (Patients)
    // ════════════════════════════════════════════

    /** GET /self-assessments/questions — flat list for patients */
    getQuestions: async (patientId?: string | number, category?: string): Promise<{ success: boolean; questions: AssessmentQuestion[]; profile?: ProfessionalAssessmentPatientInfo }> => {
        try {
            if (patientId) {
                // Clinician flow: fetch grouped professional questions
                const res = await AssessmentService.getProfessionalQuestions(patientId);
                const topics = res.data?.topics || {};
                const questions = topics[category || ''] || [];
                return { success: true, questions, profile: res.data?.patient };
            } else {
                // Patient flow: fetch flat list, optionally filtered by category slug
                const res = await AssessmentService.getSelfAssessmentQuestions();
                let questions = res.data?.questions || [];
                if (category) {
                    questions = questions.filter(q => 
                        (q.category === category) || 
                        ((q as any).topic === category) ||
                        (q.category?.toLowerCase() === category.toLowerCase())
                    );
                }
                return { success: true, questions };
            }
        } catch (error) {
            console.error('[AssessmentService] getQuestions failed:', error);
            return { success: false, questions: [] };
        }
    },

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

    /** GET /self-assessments/history — Simplified wrapper for history archive */
    getSelfAssessmentHistory: async (params?: Record<string, unknown>): Promise<{ assessments: AssessmentResult[]; total: number; data?: any }> => {
        try {
            const res = await api.get('self-assessments/history', { params });
            const data = res.data?.data ?? res.data;
            const items = Array.isArray(data) ? data : (data.assessments || data.history || []);
            return {
                assessments: items.map(normalizeAssessment),
                total: data.total || items.length,
                data: data 
            };
        } catch (err) {
            console.warn('Self assessment history fetch failing, falling back to legacy vault...', err);
            try {
                const res = await api.get('assessments', { params });
                const data = res.data?.data ?? res.data;
                const items = Array.isArray(data) ? data : (data.assessments || data.history || []);
                return {
                    assessments: items.map(normalizeAssessment),
                    total: data.total || items.length,
                    data: data
                };
            } catch (fallbackErr) {
                return { assessments: [], total: 0 };
            }
        }
    },

    /** GET /self-assessments/:id — get specific assessment detail */
    getSelfAssessmentDetail: async (id: string | number): Promise<AssessmentResult> => {
        try {
            const response = await api.get(`self-assessments/${id}`);
            const data = response.data?.data ?? response.data;
            return normalizeAssessment(data);
        } catch (error: any) {
            const response = await api.get(`assessments/${id}`);
            const data = response.data?.data ?? response.data;
            return normalizeAssessment(data);
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
            const legacyPayload = {
                patientId: data.patientId,
                slug: data.category,
                notes: data.notes || 'Professional evaluation synthesis',
                responses: data.responses,
                consultId: data.consultId && !isNaN(Number(data.consultId)) ? Number(data.consultId) : undefined
            };
            const response = await api.post('assessments', legacyPayload);
            return response.data;
        }
    },

    /** GET /professional-assessments/patient/:patientId — fetch clinician submissions for a patient */
    getPatientProfessionalHistory: async (patientId: string | number): Promise<AssessmentResult[]> => {
        try {
            // Updated modern endpoint aligned with mobile backend
            const res = await api.get(`professional-assessments/patient/${patientId}`);
            const data = res.data?.data ?? res.data;
            const items = Array.isArray(data) ? data : (data.assessments || data.history || []);
            return items.map(normalizeAssessment);
        } catch (err) {
            try {
                // Secondary fallback for existing/staged history records
                const res = await api.get(`professional-assessments/history/${patientId}`);
                const data = res.data?.data ?? res.data;
                const items = Array.isArray(data) ? data : (data.assessments || data.history || []);
                return items.map(normalizeAssessment);
            } catch {
                try {
                    // Tertiary legacy fallback
                    const response = await api.get(`assessments/patient/${patientId}`);
                    const data = response.data?.data ?? response.data;
                    return (Array.isArray(data) ? data : []).filter(Boolean).map(normalizeAssessment);
                } catch {
                    return [];
                }
            }
        }
    },

    // ════════════════════════════════════════════
    //  LEGACY: Backward-Compatible Endpoints
    // ════════════════════════════════════════════
    
    submitAssessment: async (payload: SubmitAssessmentPayload): Promise<AssessmentResult> => {
        const response = await api.post('assessments', payload);
        const data = response.data?.data ?? response.data;
        return normalizeAssessment(data);
    },

    getMastersList: async (params?: Record<string, unknown>): Promise<AssessmentMaster[]> => {
        const res = await api.get('resource/masters', { params });
        const data = res.data?.data ?? res.data;
        return Array.isArray(data) ? data : data?.masters || [];
    },

    getDetail: async (id: string): Promise<AssessmentResult> => {
        const res = await api.get(`assessments/${id}`);
        const data = res.data?.data ?? res.data;
        return normalizeAssessment(data);
    },

    update: async (id: string, payload: { notes?: string; status?: string }): Promise<AssessmentResult> => {
        const res = await api.patch(`assessments/${id}`, payload);
        const data = res.data?.data ?? res.data;
        return normalizeAssessment(data);
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`assessments/${id}`);
    },

    getAllAdmin: async (): Promise<AssessmentResult[]> => {
        const res = await api.get('assessments/admin');
        const data = res.data?.data ?? res.data;
        return (Array.isArray(data) ? data : []).filter(Boolean).map(normalizeAssessment);
    }
};

// ─── Normalization Helper ─────────────────────────────────────────────

function normalizeAssessment(data: Record<string, unknown> | null | undefined): AssessmentResult {
    if (!data) return {} as AssessmentResult;
    const assessment = (data.assessment || data.data || data) as Record<string, unknown>;

    const rawScoreValue = assessment.totalScore ?? assessment.score ?? assessment.rawScore ?? assessment.raw_score ?? assessment.total_score ?? assessment.value ?? assessment.total ?? 0;
    const rawScore = Number(rawScoreValue) || 0;

    const maxScoreValue = assessment.maxScore ?? assessment.max_score ?? assessment.maxPossibleScore ?? assessment.totalPossibleScore ?? assessment.max ?? 100;
    const maxScore = Number(maxScoreValue) || 100;

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
    const clinicalData = clinical as Record<string, unknown>;
    let tScore = assessment.tScore ?? assessment.t_score ?? clinicalData?.tScore ?? clinicalData?.t_score;
    if (tScore != null) { tScore = Math.round(Number(tScore) * 100) / 100; }

    if (percentage == null) {
        percentage = (clinicalData?.percentage ?? clinicalData?.percentageScore ?? clinicalData?.percentage_score ?? clinicalData?.percentile) as number | undefined;
    }
    if (typeof percentage === 'number') { percentage = Math.round(percentage * 100) / 100; }

    const interpretation = String(
        assessment.interpretation || clinical.interpretation || assessment.severity || clinical.severity || assessment.clinical_interpretation || 'Completed'
    );
    const finalRawScore = typeof rawScore === 'number' ? Math.round(rawScore * 100) / 100 : (rawScore as number);
    const createdAt = (assessment.date as string) || (assessment.createdAt as string);
    const dateStr = createdAt ? new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Date Unknown';
    const finalId = String(assessment._id || assessment.id || assessment.uuid || Math.random().toString(36).substr(2, 9));
    const isProfessional = !!(tScore != null || assessment.clinicianId || assessment.clinician_id || assessment.clinicalResults || assessment.assessment_type === 'professional' || assessment.consultId);

    return {
        ...assessment,
        id: finalId,
        _id: finalId,
        isProfessional,
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
            const a = assessment as any;
            const raw = a.responses || a.selectedAnswers || a.questions || a.data?.responses || [];
            if (!Array.isArray(raw)) {
                if (typeof raw === 'object' && raw !== null) {
                    return Object.entries(raw).map(([qId, val]: [string, any]) => ({
                        questionId: qId,
                        optionId: String(typeof val === 'object' ? (val.optionId || val.id || val.selectedOption) : val),
                        questionText: `Clinical Parameter ${qId}`,
                        answerText: 'Response Recorded',
                        score: Number(val.score || 0)
                    }));
                }
                return [];
            }
            return raw.map((r: any, ri: number) => ({
                ...r,
                questionId: r.questionId || r.question_id || r.question?.id || r.id || `q-${ri}`,
                optionId: r.optionId || r.option_id || r.answer?.optionId || r.selectedOption || r.selectedOptionId,
                questionText: r.questionText || r.question_text || r.question?.text || r.question || `Assessment Item ${ri + 1}`,
                answerText: r.answerText || r.answer_text || r.answer?.text || r.selectedAnswer || r.selectedOptionText || 'Response Recorded',
                score: Number(r.score ?? r.answer?.score ?? 0)
            })).filter(r => r.optionId != null);
        })(),
    } as unknown as AssessmentResult;
}
