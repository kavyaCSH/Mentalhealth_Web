import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Activity,
    ChevronLeft,
    Calendar,
    Clock,
    AlertTriangle,
    TrendingUp,
    Shield,
    CheckCircle2,
    Lightbulb,
    BarChart3,
    FileText,
    Brain,
    Heart,
    Moon,
    Coffee
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { AssessmentService } from '../../api/services/assessment.service';
import type { AssessmentResult } from '../../types/assessment.types';

// ─── Severity styling ────────────────────────────────────────────────────────
const getSeverityStyle = (severity?: string, interpretation?: string) => {
    const key = String(severity || interpretation || '').toLowerCase();
    if (key.includes('severe') || key.includes('high'))
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: AlertTriangle, gauge: '#ef4444' };
    if (key.includes('moderate') || key.includes('medium'))
        return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: TrendingUp, gauge: '#f97316' };
    if (key.includes('mild') || key.includes('low'))
        return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: Shield, gauge: '#6366f1' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2, gauge: '#10b981' };
};

const getCategoryIcon = (slug?: string) => {
    const props = { size: 28 };
    switch (slug?.toLowerCase()) {
        case 'anxiety': return <Activity {...props} />;
        case 'depression': return <Heart {...props} />;
        case 'sleep': return <Moon {...props} />;
        case 'lifestyle': return <Coffee {...props} />;
        case 'mania': return <Activity {...props} />;
        default: return <Brain {...props} />;
    }
};

const AssessmentResultPage = () => {
    const { id, patientId } = useParams<{ id: string; patientId: string }>();
    const navigate = useNavigate();
    const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            setIsLoading(true);
            setError(null);
            try {
                // Attempt to fetch from modern self-assessment first, then fallback to generic
                let rawData;
                try {
                    const res = await AssessmentService.getSelfAssessmentDetail(id);
                    rawData = res.data || res;
                } catch (fallbackErr) {
                    if (fallbackErr instanceof Error && (fallbackErr as any).response?.status === 400 && (fallbackErr as any).response?.data?.message?.includes('not found')) {
                        rawData = null;
                    } else {
                        rawData = await AssessmentService.getDetail(id);
                    }
                }

                if (rawData && (rawData.id || rawData._id || rawData.slug || rawData.score !== undefined)) {
                    setAssessment(rawData);
                } else {
                    setError('The requested assessment record could not be found or is empty.');
                }
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || 'Failed to load assessment result.');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Assessment Details...</p>
            </div>
        );
    }

    if (error || !assessment) {
        return (
            <div className="p-8 max-w-3xl  text-center py-20">
                <AlertTriangle className="text-orange-500 mx-auto mb-4" size={48} />
                <h2 className="text-2xl font-black text-slate-900 mb-2">Unable to Load</h2>
                <p className="text-slate-500 mb-8">{error || 'Assessment not found.'}</p>
                <Button onClick={() => navigate(patientId ? `/patients/${patientId}/history` : '/history')}>Back to History</Button>
            </div>
        );
    }

    const style = getSeverityStyle(assessment.severity, assessment.interpretation);
    const SeverityIcon = style.icon;
    const recs = assessment.recommendations || [];

    return (
        <div className="p-8 max-w-4xl  space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <header className="flex items-center justify-between">
                <button
                    onClick={() => navigate(patientId ? `/patients/${patientId}?view=focused` : '/history')}
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm"
                >
                    <ChevronLeft size={18} /> {patientId ? 'Back to Patient Record' : 'Back to History'}
                </button>
            </header>

            {/* Title */}
            <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${style.bg} ${style.color}`}>
                    {getCategoryIcon(assessment.slug)}
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">
                        {assessment.category || assessment.slug || 'General'} Assessment
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5 capitalize">
                            <Calendar size={14} className="text-slate-300" />
                            {assessment.date && !assessment.date.includes(',') ? new Date(assessment.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : assessment.date || 'Recent Report'}
                        </span>
                        {assessment.time && (
                            <span className="flex items-center gap-1.5 lowercase">
                                <Clock size={14} className="text-slate-300" />
                                {assessment.time}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Score Card */}
            <div className="glass-card p-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: style.gauge }}></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8 pb-8 border-b border-slate-50">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinical Interpretation</p>
                        <h2 className="text-2xl font-black text-slate-900">{assessment.interpretation || 'Completed'}</h2>
                        {assessment.severity && (
                            <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.color} ${style.border} border`}>
                                <SeverityIcon size={12} />
                                {assessment.severity}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className={`px-8 py-6 rounded-2xl border flex flex-col items-center justify-center min-w-[140px] ${style.bg} ${style.color} ${style.border}`}>
                            <span className="text-4xl font-black">
                                {assessment.score ?? assessment.totalScore ?? 0}
                            </span>
                            {(assessment.maxScore || assessment.maxPossibleScore || assessment.totalPossibleScore) && (
                                <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">
                                    / {assessment.maxScore || assessment.maxPossibleScore || assessment.totalPossibleScore}
                                </span>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Raw Score</span>
                        </div>

                        {assessment.tScore !== undefined && assessment.tScore !== null && (
                            <div className={`px-8 py-4 rounded-2xl border flex flex-col items-center justify-center min-w-[140px] bg-white border-slate-100 shadow-sm`}>
                                <span className="text-3xl font-black text-slate-800">{assessment.tScore}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest mt-1 text-slate-400">T-Score</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Score bar */}
                {assessment.percentage != null && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <BarChart3 size={12} /> Score Distribution
                            </span>
                            <span className="text-sm font-black text-slate-600">{assessment.percentage}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(assessment.percentage, 100)}%` }}
                                transition={{ duration: 1.2, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: style.gauge }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Recommendations */}
            {recs.length > 0 && (
                <div className="glass-card p-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-5">
                        <Lightbulb size={14} /> Recommendations
                    </h3>
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

            {/* Detailed Breakdown Fallback */}
            {(assessment.responses?.length || (assessment as any).selectedAnswers) && (
                <div className="space-y-6 pt-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 ml-1">
                        <FileText size={14} className="text-indigo-500" /> Full Response Breakdown
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        {(assessment.responses?.length ? assessment.responses : Object.entries((assessment as any).selectedAnswers || {}).map(([qId, ans]) => ({
                            questionText: `Assessment Inquiry Item ${qId}`,
                            selectedAnswer: String(ans),
                            score: 0
                        }))).map((resp, i) => {
                            const isId = (val: string) => /^[0-9a-fA-F]{24}$/.test(String(val || ''));
                            const displayAnswer = (resp as any).answerText || (resp as any).selectedAnswer || 
                                (!isId((resp as any).selectedOption || (resp as any).optionId) 
                                    ? String((resp as any).selectedOption || (resp as any).optionId) 
                                    : 'Response Captured');
                            
                            return (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/30 transition-all"
                                >
                                    <div className="flex items-start gap-5 flex-1 max-w-2xl">
                                        <div className="w-10 h-10 bg-slate-50 border border-slate-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-colors">
                                            <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-sm font-bold text-slate-900 leading-snug group-hover:text-indigo-900 transition-colors">
                                                {(resp as any).questionText || `Clinical Item ${i + 1}`}
                                            </p>
                                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-slate-50/50 border border-slate-50 rounded-lg group-hover:bg-white group-hover:border-indigo-50 transition-all">
                                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mr-1">Answer</div>
                                                <span className="text-xs font-black text-indigo-600">
                                                    {displayAnswer}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="shrink-0 flex items-center gap-4 pl-14 md:pl-0">
                                        <div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
                                        <div className={`px-4 py-2 rounded-xl flex flex-col items-center justify-center min-w-[70px] border transition-all ${
                                            (resp as any).score ? 'bg-indigo-50 border-indigo-100 shadow-sm shadow-indigo-50' : 'bg-slate-50 border-slate-50 opacity-40'
                                        }`}>
                                            <span className={`text-sm font-black leading-none ${(resp as any).score ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                {(resp as any).score ? `+${(resp as any).score}` : '0'}
                                            </span>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">pts</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Notes */}
            {assessment.notes && (
                <div className="glass-card p-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Clinical Notes</h3>
                    <p className="text-slate-700 font-medium leading-relaxed">{assessment.notes}</p>
                </div>
            )}

            {/* Footer */}
            <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="flex-1 py-4 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl" onClick={() => navigate(patientId ? `/patients/${patientId}?view=focused` : '/history')}>
                    {patientId ? 'Back to Patient Record' : 'Back to History'}
                </Button>
            </div>
        </div>
    );
};

export default AssessmentResultPage;
