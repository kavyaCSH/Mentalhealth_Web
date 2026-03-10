import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
    ChevronLeft,
    ChevronRight,
    Activity,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    TrendingUp,
    Shield,
    Lightbulb,
    BarChart3,
    User
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { AssessmentService } from '../../api/services/assessment.service';
import type { AssessmentQuestion, AssessmentResult, AssessmentResponse, SubmitAssessmentPayload } from '../../types/assessment.types';
import type { RootState } from '../../store';

interface NormalisedOption {
    value: number;
    label: string;
    optionId: string;
    score: number;
}

interface NormalisedQuestion {
    id: string;
    text: string;
    category: string;
    type: string;
    uiType?: string;
    maxOptionScore: number;
    options: NormalisedOption[];
}

// ─── Severity color mapping ─────────────────────────────────────────────────
const getSeverityStyle = (severity?: string, interpretation?: string) => {
    const key = (severity || interpretation || '').toLowerCase();
    if (key.includes('severe') || key.includes('high'))
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: AlertTriangle, glow: 'shadow-red-100', gauge: '#ef4444' };
    if (key.includes('moderate') || key.includes('medium'))
        return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: TrendingUp, glow: 'shadow-orange-100', gauge: '#f97316' };
    if (key.includes('mild') || key.includes('low'))
        return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: Shield, glow: 'shadow-indigo-100', gauge: '#6366f1' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2, glow: 'shadow-emerald-100', gauge: '#10b981' };
};

// ─── Score color helper ──────────────────────────────────────────────────────
const getScoreColor = (score: number, maxScore: number) => {
    if (maxScore === 0) return 'bg-slate-200 text-slate-600';
    const ratio = score / maxScore;
    if (ratio >= 0.75) return 'bg-red-100 text-red-700';
    if (ratio >= 0.5) return 'bg-orange-100 text-orange-700';
    if (ratio >= 0.25) return 'bg-indigo-100 text-indigo-700';
    return 'bg-emerald-100 text-emerald-700';
};

const QuestionnairePage = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetPatientId = searchParams.get('patientId');
    const { user } = useSelector((state: RootState) => state.auth);

    const [questions, setQuestions] = useState<NormalisedQuestion[]>([]);
    const [rawApiQuestions, setRawApiQuestions] = useState<AssessmentQuestion[]>([]); // keep raw from API
    const [profile, setProfile] = useState<{ userId?: string | number; firstName?: string; age?: number; gender?: string } | null>(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [runningScore, setRunningScore] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<AssessmentResult | null>(null);

    // ── Fetch questions using category slug ──────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const patientId = targetPatientId || user?.id;
                const response = await AssessmentService.getQuestions(
                    patientId ? String(patientId) : undefined,
                    categoryId // this is the slug from the resource master
                );

                if (response.questions.length > 0) {
                    // Store raw API questions for submit payload
                    setRawApiQuestions(response.questions);

                    const normalised: NormalisedQuestion[] = response.questions.map((q: AssessmentQuestion) => {
                        const maxOptionScore = Math.max(...(q.options || []).map(o => o.score ?? 0), 0);
                        return {
                            id: q._id || q.id || String(q.questionId),
                            text: q.text,
                            category: q.category,
                            type: q.type,
                            uiType: q.uiType,
                            maxOptionScore,
                            options: (q.options || []).map(o => ({
                                value: o.score ?? 0,
                                label: o.text,
                                optionId: o._id,
                                score: o.score ?? 0,
                            }))
                        };
                    });
                    setQuestions(normalised);
                    if (response.profile) setProfile(response.profile);
                } else {
                    setQuestions([]);
                }
            } catch {
                setError('Failed to load assessment questions from the server.');
                setQuestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (categoryId) load();
    }, [categoryId, targetPatientId, user?.id]);

    // ── Compute running score whenever answers change ────────────────────────
    useEffect(() => {
        const total = Object.values(answers).reduce((sum, val) => sum + val, 0);
        setRunningScore(total);
    }, [answers]);

    // ── Max possible score ───────────────────────────────────────────────────
    const maxPossibleScore = questions.reduce((sum, q) => sum + (q.maxOptionScore || 0), 0);

    // ── Answer handling ──────────────────────────────────────────────────────
    const handleAnswer = (questionId: string, value: number, optionId?: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
        if (optionId) setSelectedOptions(prev => ({ ...prev, [questionId]: optionId }));

        if (currentStep < questions.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 400);
        }
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            // Build responses using raw API questions for accurate questionId
            const submissionResponses: AssessmentResponse[] = questions.map((q, index: number) => {
                const rawQ = rawApiQuestions[index];
                const optId = selectedOptions[q.id];
                return {
                    questionId: rawQ?.questionId || rawQ?._id || rawQ?.id || q.id,
                    optionId: optId || ''
                };
            }).filter(r => r.questionId != null && r.optionId);

            // Resolve patientId from profile.userId (e.g. 9)
            const resolvedPatientId = profile?.userId || targetPatientId || user?.id;

            const payload: SubmitAssessmentPayload = {
                patientId: resolvedPatientId || 0,
                slug: categoryId || '',
                date: dateStr,
                time: timeStr,
                notes: '',
                responses: submissionResponses
            };

            console.log('📋 Submit payload:', JSON.stringify(payload, null, 2));

            const backendResult = await AssessmentService.submitAssessment(payload);

            // ── Use NORMALIZED BACKEND RESULT  ──
            const style = backendResult.severityStyle || getSeverityStyle(backendResult.severity, backendResult.interpretation);
            setResult({
                ...backendResult,
                severityStyle: style,
                source: 'backend'
            });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            const errorMsg = error.response?.data?.message || 'Failed to submit assessment.';
            setError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSubmit = Object.keys(answers).length === questions.length;
    const progressPercentage = (Object.keys(answers).length / questions.length) * 100 || 0;

    // ── Loading state ────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Clinical Assessment...</p>
            </div>
        );
    }

    // ── Results view ─────────────────────────────────────────────────────────
    if (result) {
        const style = result.severityStyle || getSeverityStyle(result.severity, result.interpretation);
        const SeverityIcon = style.icon as any;
        const scoreDisplay = result.percentage ?? result.score ?? result.totalScore ?? 0;
        const recs: string[] = Array.isArray(result.recommendations) ? result.recommendations : [result.recommendation || ''];

        return (
            <div className="p-8 max-w-3xl mx-auto space-y-8 animate-fade-in py-16">
                {/* Completion header */}
                <div className="text-center mb-6">
                    <div className={`w-24 h-24 ${style.bg} ${style.color} rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl ${style.glow}`}>
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Assessment Complete</h1>
                    <p className="text-slate-500 font-medium">
                        Your results have been scored and analyzed by the clinical system.
                    </p>
                </div>

                {/* Score + Interpretation Card */}
                <div className="glass-card p-10 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-2 h-full`} style={{ backgroundColor: style.gauge }}></div>

                    {/* Score section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8 pb-8 border-b border-slate-50">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinical Interpretation</p>
                            <h2 className="text-2xl font-black text-slate-900">{result.interpretation}</h2>
                            {result.severity && (
                                <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.color} ${style.border} border`}>
                                    <SeverityIcon size={12} />
                                    {result.severity}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <div className={`px-8 py-6 rounded-2xl border flex flex-col items-center justify-center min-w-[140px] ${style.bg} ${style.color} ${style.border}`}>
                                <span className="text-4xl font-black">{scoreDisplay}</span>
                                {result.maxScore && (
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">
                                        / {result.maxScore}
                                    </span>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Raw Score</span>
                            </div>

                            {result.tScore !== undefined && result.tScore !== null && (
                                <div className={`px-8 py-4 rounded-2xl border flex flex-col items-center justify-center min-w-[140px] bg-slate-50 border-slate-100`}>
                                    <span className="text-3xl font-black text-slate-800">{result.tScore}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-1 text-slate-400">T-Score</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Score bar */}
                    {result.percentage != null && (
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <BarChart3 size={12} /> Score Distribution
                                </span>
                                <span className="text-sm font-black text-slate-600">{result.percentage}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(result.percentage, 100)}%` }}
                                    transition={{ duration: 1.2, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: style.gauge }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {recs.length > 0 && recs[0] && (
                        <div className="space-y-4 mb-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Lightbulb size={12} /> Recommendations
                            </p>
                            <div className="space-y-3">
                                {recs.map((rec: string, i: number) => (
                                    <div key={i} className="flex items-start gap-3 text-slate-700 font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${style.bg} ${style.color}`}>
                                            <span className="text-[10px] font-black">{i + 1}</span>
                                        </div>
                                        <span>{rec}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Source indicator */}
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-100 w-fit">
                        <Shield size={12} />
                        Clinically Scored by Backend System
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-50">
                        <Button variant="outline" className="flex-1 py-4" onClick={() => targetPatientId ? navigate(`/patients/${targetPatientId}`) : navigate('/history')}>
                            {targetPatientId ? 'Back to Patient Record' : 'View Full History'}
                        </Button>
                        <Button variant="primary" className="flex-1 py-4" onClick={() => navigate('/')}>
                            Return to Dashboard
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // ── No questions ─────────────────────────────────────────────────────────
    if (questions.length === 0) {
        return (
            <div className="p-8 max-w-3xl mx-auto text-center py-20">
                <AlertCircle className="text-orange-500 mx-auto mb-4" size={48} />
                <h2 className="text-2xl font-black text-slate-900 mb-2">Assessment Unavailable</h2>
                <p className="text-slate-500 mb-8">
                    {error || 'This assessment could not be loaded or contains no clinical questions for your profile.'}
                </p>
                <Button onClick={() => navigate('/assessments')}>Back to Center</Button>
            </div>
        );
    }

    // ── Question view ────────────────────────────────────────────────────────
    const question = questions[currentStep];
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 min-h-[80vh] flex flex-col pb-20">
            <header className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/assessments')}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm"
                >
                    <ChevronLeft size={18} /> Exit Assessment
                </button>
                <div className="flex items-center gap-4">
                    {/* Running score display */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <BarChart3 size={14} className="text-indigo-500" />
                        <span className="text-sm font-black text-slate-700">
                            {runningScore}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                            / {maxPossibleScore}
                        </span>
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        {currentStep + 1} / {questions.length}
                    </div>
                </div>
            </header>

            {/* Patient profile info */}
            {profile && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 rounded-xl border border-indigo-100 text-xs font-bold text-indigo-700 w-fit">
                    <User size={14} />
                    <span>{profile.firstName}</span>
                    <span className="text-indigo-400">|</span>
                    <span>Age {profile.age}</span>
                    <span className="text-indigo-400">|</span>
                    <span className="capitalize">{profile.gender}</span>
                </div>
            )}

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    className="h-full bg-indigo-500 rounded-full"
                />
            </div>

            <main className="flex-1 flex flex-col justify-center py-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-2xl mx-auto w-full"
                    >
                        <h2 className="text-3xl font-black text-slate-900 leading-tight mb-10 text-center">
                            {question.text}
                        </h2>

                        <div className="grid gap-4">
                            {(question.options).map((option, index: number) => {
                                const isSelected = selectedOptions[question.id] === option.optionId;
                                return (
                                    <button
                                        key={option.optionId || index}
                                        onClick={() => handleAnswer(question.id, option.value, option.optionId)}
                                        className={`p-5 text-left rounded-2xl border-2 transition-all duration-300 font-bold ${isSelected
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100 scale-[1.02]'
                                            : 'border-slate-100 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex-1">{option.label}</span>
                                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                                {/* Score badge */}
                                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black min-w-[40px] text-center ${isSelected
                                                    ? 'bg-indigo-200 text-indigo-800'
                                                    : getScoreColor(option.score, question.maxOptionScore)
                                                    }`}>
                                                    {option.score} pt{option.score !== 1 ? 's' : ''}
                                                </span>
                                                {isSelected && (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                        <CheckCircle2 size={20} className="text-indigo-600" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {answers[question.id] !== undefined && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 text-center"
                            >
                                <span className="text-xs font-bold text-slate-400">
                                    Selected score: <span className="text-indigo-600 font-black">{answers[question.id]}</span> / {question.maxOptionScore}
                                </span>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">
                    {error}
                </div>
            )}

            <footer className="flex items-center justify-between border-t border-slate-100 pt-6">
                <Button
                    variant="ghost"
                    disabled={currentStep === 0}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    leftIcon={<ChevronLeft size={18} />}
                >
                    Previous
                </Button>

                {/* Center: running total */}
                <div className="hidden sm:flex flex-col items-center">
                    <span className="text-2xl font-black text-slate-800">{runningScore}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Running Score ({answeredCount}/{questions.length} answered)
                    </span>
                </div>

                {currentStep === questions.length - 1 ? (
                    <Button
                        variant="primary"
                        disabled={!canSubmit || isSubmitting}
                        isLoading={isSubmitting}
                        onClick={handleSubmit}
                        className="px-10"
                    >
                        Submit Assessment
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        disabled={currentStep === questions.length - 1 || answers[questions[currentStep].id] === undefined}
                        onClick={() => setCurrentStep(prev => prev + 1)}
                        rightIcon={<ChevronRight size={18} />}
                    >
                        Next
                    </Button>
                )}
            </footer>
        </div>
    );
};

export default QuestionnairePage;
