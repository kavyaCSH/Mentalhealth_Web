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
    const key = (severity || interpretation || '').toLowerCase();
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
            try {
                const data = await AssessmentService.getDetail(id);
                setAssessment(data);
            } catch (err: unknown) {
                const error = err as { message?: string };
                setError(error.message || 'Failed to load assessment result.');
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
    const displayVal = assessment.percentage ?? assessment.score ?? assessment.totalScore ?? 0;
    const scoreDisplay = typeof displayVal === 'number' ? Math.round(displayVal * 100) / 100 : displayVal;
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
                        {assessment.slug || 'General'} Assessment
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-slate-300" />
                            {new Date(assessment.date || assessment.createdAt || '').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {assessment.time && (
                            <span className="flex items-center gap-1.5">
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
                            <span className="text-4xl font-black">{scoreDisplay}</span>
                            {assessment.maxScore && (
                                <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60">
                                    / {assessment.maxScore}
                                </span>
                            )}
                            <span className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Raw Score</span>
                        </div>

                        {assessment.tScore !== undefined && assessment.tScore !== null && (
                            <div className={`px-8 py-4 rounded-2xl border flex flex-col items-center justify-center min-w-[140px] bg-slate-50 border-slate-100`}>
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

            {/* Question Responses */}
            {assessment.responses && assessment.responses.length > 0 && (
                <div className="glass-card p-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-5">
                        <FileText size={14} /> Response Breakdown
                    </h3>
                    <div className="space-y-3">
                        {assessment.responses.map((resp, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-black">{i + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800">{resp.questionText || `Question ${i + 1}`}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-xs font-bold text-slate-500">
                                            Answer: <span className="text-indigo-600">{String(resp.selectedOption || resp.optionId)}</span>
                                        </span>
                                        {resp.score != null && (
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${style.bg} ${style.color}`}>
                                                {resp.score} pts
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
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
                <Button variant="outline" className="flex-1 py-4" onClick={() => navigate(patientId ? `/patients/${patientId}?view=focused` : '/history')}>
                    {patientId ? 'Back to Patient Record' : 'Back to History'}
                </Button>
                <Button variant="primary" className="flex-1 py-4" onClick={() => navigate(patientId ? `/clinical/assessments?patientId=${patientId}` : '/assessments')}>
                    {patientId ? 'Assign Another' : 'Take Another Assessment'}
                </Button>
            </div>
        </div>
    );
};

export default AssessmentResultPage;
