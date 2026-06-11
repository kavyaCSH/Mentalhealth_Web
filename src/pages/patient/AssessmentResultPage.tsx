import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patientId');
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
                    rawData = (res as any).data || res;
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
            <div className="p-8 max-w-3xl text-center py-20">
                <AlertTriangle className="text-orange-500 mx-auto mb-4" size={48} />
                <h2 className="text-2xl font-black text-main mb-2">Unable to Load</h2>
                <p className="text-muted mb-8">{error || 'Assessment not found.'}</p>
                <Button onClick={() => navigate(patientId ? `/history/professional/${patientId}` : '/history')}>Back to History</Button>
            </div>
        );
    }

    const style = getSeverityStyle(assessment.severity, assessment.interpretation);
    const recs = assessment.recommendations || [];

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-10 animate-fade-in pb-32">
            {/* Header Navigation */}
            <header className="flex items-center justify-between">
                <button
                    onClick={() => navigate(patientId ? `/history/professional/${patientId}` : '/history')}
                    className="flex items-center gap-3 text-muted hover:text-indigo-600 transition-all font-black text-[10px] uppercase tracking-widest group"
                >
                    <div className="p-2 bg-page rounded-xl group-hover:bg-indigo-50 transition-colors">
                        <ChevronLeft size={16} />
                    </div>
                    {patientId ? 'Back to Professional History' : 'Back to History'}
                </button>
            </header>

            {/* Assessment Title & Origin Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-100 ${style.bg} ${style.color}`}>
                        {getCategoryIcon(assessment.slug)}
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-main tracking-tight leading-none mb-3">
                            {assessment.category || assessment.slug || 'General'} Result
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${assessment.isProfessional ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white shadow-lg shadow-amber-100'}`}>
                                {assessment.isProfessional ? 'Clinical Assessment' : 'Patient Self-Check'}
                            </span>
                            <span className="px-3 py-1 bg-slate-100 text-muted rounded-lg text-[9px] font-black uppercase tracking-widest">{assessment.slug || 'standard'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Premium Result Summary Card ── */}
            <div className="relative group">
                {/* Decorative Background Shapes */}
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
                <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-violet-500/10 blur-3xl rounded-full group-hover:scale-125 transition-transform duration-1000" />

                <div className="relative z-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl shadow-indigo-200 overflow-hidden border border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center gap-12 relative z-20">
                        {/* Circular Score Metric */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-40 h-40 rounded-full bg-card/10 backdrop-blur-md border-2 border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <span className="text-6xl font-black">{assessment.score ?? assessment.totalScore ?? 0}</span>
                            <div className="w-10 h-0.5 bg-card/30 my-2 rounded-full" />
                            <span className="text-sm font-black opacity-60">
                                {assessment.maxScore || assessment.maxPossibleScore || 100}
                            </span>
                        </div>

                        {/* Interpretation Content */}
                        <div className="flex-1 space-y-6">
                            <div>
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-3">Clinical Synthesis</p>
                                <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
                                    {assessment.interpretation || 'No Interpretation Found'}
                                </h2>
                            </div>

                            {assessment.percentage != null && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Severity Index</span>
                                        <span className="text-sm font-black">{assessment.percentage}%</span>
                                    </div>
                                    <div className="h-2.5 bg-card/10 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(assessment.percentage, 100)}%` }}
                                            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                            className="h-full bg-card rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Meta Footer */}
                    <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-8 relative z-20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-card/10 rounded-lg"><Calendar size={14} /></div>
                            <span className="text-xs font-black uppercase tracking-widest">{assessment.date || 'Date Unknown'}</span>
                        </div>
                        {assessment.time && (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-card/10 rounded-lg"><Clock size={14} /></div>
                                <span className="text-xs font-black uppercase tracking-widest">{assessment.time}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3 ml-auto">
                            <div className="p-2 bg-card/10 rounded-lg"><Brain size={14} /></div>
                            <span className="text-xs font-black uppercase tracking-widest italic opacity-80">Electronic Record Validated</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations Grid */}
            {recs.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-2">
                        <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                        <h3 className="text-sm font-black text-main uppercase tracking-widest flex items-center gap-2">
                            Clinical Guidance <Lightbulb size={16} className="text-amber-500" />
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recs.map((rec: string, i: number) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card p-6 rounded-3xl border border-border-card flex gap-4 hover:border-indigo-100 transition-all shadow-sm group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-black text-xs group-hover:scale-110 transition-transform">
                                    {i + 1}
                                </div>
                                <p className="text-sm font-semibold text-main opacity-90 leading-relaxed pt-1">{rec}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Detailed Breakdown */}
            {(assessment.responses?.length || (assessment as any).selectedAnswers) && (
                <div className="space-y-6 pt-6">
                    <div className="flex items-center gap-3 ml-2">
                        <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                        <h3 className="text-sm font-black text-main uppercase tracking-widest flex items-center gap-2">
                            Itemized Analysis <FileText size={16} className="text-indigo-600" />
                        </h3>
                    </div>
                    
                    <div className="space-y-4">
                        {(assessment.responses?.length ? assessment.responses : Object.entries((assessment as any).selectedAnswers || {}).map(([qId, ans]) => ({
                            questionText: `Clinical Parameter ${qId}`,
                            selectedAnswer: String(ans),
                            score: 0
                        }))).map((resp, i) => {
                            const isId = (val: string) => /^[0-9a-fA-F]{24}$/.test(String(val || ''));
                            const displayAnswer = (resp as any).answerText || (resp as any).selectedAnswer || 
                                (!isId((resp as any).selectedOption || (resp as any).optionId) 
                                    ? String((resp as any).selectedOption || (resp as any).optionId) 
                                    : 'Affirmative Response');
                            
                            return (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group bg-card p-6 md:p-8 rounded-[2.5rem] border border-border-card flex flex-col md:flex-row md:items-center justify-between gap-8 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50/50 transition-all"
                                >
                                    <div className="flex items-start gap-6 flex-1">
                                        <div className="w-12 h-12 bg-page border border-slate-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 transition-all group-hover:scale-110">
                                            <span className="text-[11px] font-black text-muted group-hover:text-indigo-600">
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-[17px] font-black text-main leading-tight group-hover:text-indigo-900 transition-colors tracking-tight">
                                                {(resp as any).questionText || (resp as any).question?.text || `Item Analysis ${i + 1}`}
                                            </p>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[9px] font-black text-muted uppercase tracking-widest italic">Subjective Response</p>
                                                <div className="inline-flex items-center gap-3 px-4 py-2 bg-page rounded-xl group-hover:bg-indigo-50/30 transition-all border border-transparent group-hover:border-indigo-100">
                                                    <span className="text-sm font-black text-indigo-600">
                                                        {displayAnswer}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="shrink-0 flex items-center gap-6 pl-16 md:pl-0">
                                        <div className="h-10 w-[1.5px] bg-slate-100 hidden md:block" />
                                        <div className={`px-6 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[90px] border transition-all ${
                                            (resp as any).score ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-page border-border-card opacity-50'
                                        }`}>
                                            <span className="text-lg font-black leading-none">
                                                {(resp as any).score ? `+${(resp as any).score}` : '0'}
                                            </span>
                                            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${(resp as any).score ? 'text-indigo-100' : 'text-muted'}`}>pts</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Clinical Notes Section */}
            {assessment.notes && (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 ml-2">
                        <div className="w-1 h-5 bg-indigo-600 rounded-full" />
                        <h3 className="text-sm font-black text-main uppercase tracking-widest flex items-center gap-2">
                            Clinician Annotations <Brain size={16} className="text-indigo-600" />
                        </h3>
                    </div>
                    <div className="bg-page p-8 rounded-[2.5rem] border border-border-card relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileText size={80} />
                        </div>
                        <p className="text-lg font-semibold text-main opacity-90 leading-relaxed italic relative z-10">"{assessment.notes}"</p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="pt-10 flex flex-col sm:flex-row gap-5">
                <Button 
                    variant="outline" 
                    className="flex-1 py-6 border-border-card text-muted rounded-3xl hover:bg-page hover:text-indigo-600 transition-all font-black uppercase tracking-[0.2em] text-[10px]" 
                    onClick={() => navigate(patientId ? `/history/professional/${patientId}` : '/history')}
                >
                    {patientId ? 'Back to Clinical Archive' : 'Return to Comprehensive Hub'}
                </Button>
                <Button 
                    variant="primary" 
                    className="flex-1 py-6 rounded-3xl shadow-xl shadow-indigo-100 font-black uppercase tracking-[0.2em] text-[10px] bg-slate-900"
                    onClick={() => window.print()}
                >
                    Generate Clinical PDF
                </Button>
            </div>
        </div>
    );
};

export default AssessmentResultPage;
