import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Heart, Activity, Moon, Coffee, Zap, Shield, Flame, Eye, Pill, Baby,
    Dice1, PersonStanding, Crosshair, Sparkles, HeartCrack, Star, ChevronLeft,
    CheckCircle2, AlertCircle, ClipboardList, ArrowRight, Clock
} from 'lucide-react';
import { AssessmentService } from '../../api/services/assessment.service';
import type { SelfAssessmentQuestion } from '../../types/assessment.types';

const CAT_STYLE: Record<string, { icon: string; color: string; label: string }> = {
    general: { icon: 'Brain', color: '#6366f1', label: 'General Well-being' },
    depression: { icon: 'Heart', color: '#10b981', label: 'Depression' },
    anxiety: { icon: 'Activity', color: '#3b82f6', label: 'Anxiety' },
    adhd: { icon: 'Sparkles', color: '#f59e0b', label: 'ADHD' },
    panic_disorder: { icon: 'Zap', color: '#ef4444', label: 'Panic Disorder' },
    sleep: { icon: 'Moon', color: '#8b5cf6', label: 'Sleep' },
    stress: { icon: 'Flame', color: '#f97316', label: 'Stress' },
    psychosis: { icon: 'Eye', color: '#64748b', label: 'Psychosis' },
    ocd: { icon: 'Crosshair', color: '#7c3aed', label: 'OCD' },
    mania: { icon: 'Zap', color: '#d97706', label: 'Mania / Energy' },
    anger: { icon: 'Flame', color: '#dc2626', label: 'Anger' },
    somatic: { icon: 'PersonStanding', color: '#0d9488', label: 'Somatic' },
    social_anxiety: { icon: 'Eye', color: '#4f46e5', label: 'Social Anxiety' },
    substance_use: { icon: 'Pill', color: '#475569', label: 'Substance Use' },
    eating_disorder: { icon: 'Coffee', color: '#059669', label: 'Eating' },
    purpose: { icon: 'Star', color: '#ca8a04', label: 'Purpose' },
    social: { icon: 'Heart', color: '#ec4899', label: 'Social Support' },
    family: { icon: 'Heart', color: '#db2777', label: 'Relationships' },
    financial: { icon: 'Shield', color: '#4b5563', label: 'Financial Stress' },
    'self-image': { icon: 'Sparkles', color: '#7c3aed', label: 'Self-image' },
};
const DEF_CAT = { icon: 'Brain', color: '#6366f1', label: 'Assessment' };

const Ico = ({ name, size = 20, color = 'white' }: { name: string; size?: number; color?: string }) => {
    const p = { size, color };
    switch (name) {
        case 'Brain': return <Brain {...p} />;
        case 'Heart': return <Heart {...p} />;
        case 'Activity': return <Activity {...p} />;
        case 'Moon': return <Moon {...p} />;
        case 'Coffee': return <Coffee {...p} />;
        case 'Zap': return <Zap {...p} />;
        case 'Shield': return <Shield {...p} />;
        case 'Flame': return <Flame {...p} />;
        case 'Eye': return <Eye {...p} />;
        case 'Pill': return <Pill {...p} />;
        case 'Baby': return <Baby {...p} />;
        case 'Dice1': return <Dice1 {...p} />;
        case 'PersonStanding': return <PersonStanding {...p} />;
        case 'Crosshair': return <Crosshair {...p} />;
        case 'Sparkles': return <Sparkles {...p} />;
        case 'HeartCrack': return <HeartCrack {...p} />;
        case 'Star': return <Star {...p} />;
        default: return <Brain {...p} />;
    }
};

type View = 'landing' | 'quiz' | 'success' | 'history' | 'detail';

// Add hex2rgba utility
const hex2rgba = (hex: string, a: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
};

export default function AssessmentCenter() {
    const [view, setView] = useState<View>('landing');
    const [questions, setQs] = useState<SelfAssessmentQuestion[]>([]);
    const [idx, setIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [notes, setNotes] = useState('');
    const [result, setResult] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSub] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const q = questions[idx];
    const cat = q ? (CAT_STYLE[q.category] || DEF_CAT) : DEF_CAT;
    const selOpt = q ? answers[q.questionId as number] : undefined;
    const isLast = idx === questions.length - 1;
    const answered = Object.keys(answers).length;
    const progress = questions.length ? (answered / questions.length) * 100 : 0;
    const allDone = answered >= questions.length;

    // Auto-advance to success after submit
    useEffect(() => {
        if (showSuccess) {
            const t = setTimeout(() => {
                fetchHistory();
            }, 2200);
            return () => clearTimeout(t);
        }
    }, [showSuccess]);

    const start = async () => {
        setLoading(true); setError(null);
        try {
            const res = await AssessmentService.getSelfAssessmentQuestions();
            const qs = res?.data?.questions || [];
            if (!qs.length) throw new Error('No questions available.');
            setQs(qs); setIdx(0); setAnswers({}); setNotes(''); setView('quiz');
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || 'Failed to load.');
        } finally { setLoading(false); }
    };

    const fetchHistory = async () => {
        setLoading(true); setError(null);
        try {
            const res = await AssessmentService.getSelfAssessmentHistory();
            setHistory(res?.data || []);
            setView('history');
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to load history.');
        } finally { setLoading(false); }
    };

    const fetchDetail = async (id: string) => {
        setLoading(true); setError(null);
        try {
            const res = await AssessmentService.getSelfAssessmentDetail(id);
            setResult(res?.data || res);
            setView('detail');
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to load details.');
        } finally { setLoading(false); }
    };

    const pick = (optId: string) => {
        if (!q) return;
        setAnswers(p => ({ ...p, [q.questionId as number]: optId }));
    };

    const handleNext = async () => {
        if (!isLast) { setIdx(i => i + 1); return; }
        // Submit on last
        setSub(true); setError(null);
        try {
            const responses = questions
                .map(qq => ({ questionId: qq.questionId as number, optionId: answers[qq.questionId as number] || '' }))
                .filter(r => r.optionId);
            const res = await AssessmentService.submitSelfAssessment({ responses, notes: notes || undefined });
            setResult(res?.data || res);
            setShowSuccess(true);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Submission failed. Try again.');
        } finally { setSub(false); }
    };

    const reset = () => {
        setView('landing'); setAnswers({}); setNotes('');
        setIdx(0); setQs([]); setError(null); setShowSuccess(false); setResult(null);
    };

    // ══ LANDING (Dashboard Style) ════════════════════════════════════════
    if (view === 'landing') return (
        <div className="min-h-full bg-page/50 flex flex-col items-center py-12 px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-6xl space-y-10">

                {/* Header / Hero */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-card rounded-[32px] p-8 lg:p-12 border border-border-card shadow-sm">
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-xs font-black uppercase tracking-widest">
                            <Sparkles size={14} /> Mental Wellness Hub
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-main leading-[1.1] tracking-tight">
                            How are you feeling <br /><span className="text-indigo-600">today?</span>
                        </h1>
                        <p className="text-muted font-medium text-lg max-w-xl leading-relaxed">
                            Take a clinically-backed self-assessment to track your mental well-being across 15+ categories. Secure, private, and insightful.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <button onClick={start} disabled={loading}
                                className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50">
                                {loading ? <Activity size={20} className="animate-spin" /> : <><Brain size={20} /> Start New Assessment</>}
                            </button>
                            <button onClick={fetchHistory}
                                className="px-8 py-4 bg-card border-2 border-border-card text-main opacity-80 font-black rounded-2xl hover:bg-page transition-all flex items-center gap-3">
                                <Clock size={20} /> View History
                            </button>
                        </div>
                    </div>

                    {/* Visual Card */}
                    <div className="lg:w-80 shrink-0">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                <Brain size={180} />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="w-12 h-12 bg-card/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">Privacy First</div>
                                    <div className="text-xl font-black leading-tight">Your data is fully encrypted & private.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid of Info / Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { icon: <ClipboardList />, title: '20 Questions', desc: 'Comprehensive screening', color: 'bg-blue-500/10 text-blue-500' },
                        { icon: <Clock />, title: '5-8 Minutes', desc: 'Quick & effective', color: 'bg-amber-500/10 text-amber-500' },
                        { icon: <Activity />, title: '15+ Categories', desc: 'DSM-5 informed', color: 'bg-emerald-500/10 text-emerald-500' },
                        { icon: <Sparkles />, title: 'Instant Score', desc: 'Real-time analysis', color: 'bg-purple-500/10 text-purple-500' },
                    ].map((item, i) => (
                        <div key={i} className="bg-card p-6 rounded-3xl border border-border-card shadow-sm flex items-start gap-4 hover:translate-y-[-4px] transition-transform">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="font-black text-main">{item.title}</h3>
                                <p className="text-xs font-bold text-muted mt-0.5 uppercase tracking-wide">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="flex items-center gap-3 px-6 py-4 bg-error/10 border border-error/20 rounded-3xl text-sm font-bold text-error">
                        <AlertCircle size={20} /> {error}
                    </div>
                )}
            </motion.div>
        </div>
    );

    // ══ HISTORY (Dashboard Grid) ══════════════════════════════════════════
    if (view === 'history') return (
        <div className="min-h-full bg-page/50 flex flex-col items-center py-12 px-6">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-6xl space-y-10">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <button onClick={reset} className="flex items-center gap-2 text-xs font-black text-muted hover:text-indigo-600 transition-colors uppercase tracking-widest mb-2">
                            <ChevronLeft size={14} /> Back to Dashboard
                        </button>
                        <h2 className="text-3xl font-black text-main tracking-tight">Your Assessment Journey</h2>
                        <p className="text-muted font-medium">Review your historical mental wellness progress and insights.</p>
                    </div>
                    <button onClick={start} className="px-8 py-4 bg-card border border-border-card text-main font-black rounded-2xl shadow-sm hover:border-indigo-500/30 hover:text-indigo-500 transition-all flex items-center gap-3">
                        <Brain size={20} /> New Assessment
                    </button>
                </div>

                {!history.length ? (
                    <div className="bg-card rounded-[32px] p-24 text-center border border-border-card shadow-sm">
                        <div className="w-20 h-20 bg-page rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <ClipboardList size={40} className="text-muted opacity-50" />
                        </div>
                        <h3 className="text-xl font-black text-main mb-2">No Records Yet</h3>
                        <p className="text-muted font-medium max-w-sm mx-auto mb-8">Start your first assessment to begin tracking your mental wellness journey.</p>
                        <button onClick={start} className="text-indigo-600 font-black text-sm uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">Get Started Now</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((item: any, i: number) => (
                            <motion.button key={item._id} onClick={() => fetchDetail(item._id)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-card border border-border-card rounded-[28px] p-8 text-left hover:shadow-2xl hover:translate-y-[-8px] transition-all group relative overflow-hidden">

                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Activity size={80} />
                                </div>

                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                            {item.wellnessAspect || 'Wellness'}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}</span>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black text-main leading-tight">Mental Health <br />Self-Check</h3>
                                    </div>

                                    <div className="pt-4 border-t border-border-card grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-[10px] font-black text-muted opacity-60 uppercase tracking-widest mb-1">Score</div>
                                            <div className="text-lg font-black text-indigo-600">{item.totalScore} <span className="text-xs text-muted font-bold">pts</span></div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-muted opacity-60 uppercase tracking-widest mb-1">Progress</div>
                                            <div className="text-lg font-black text-emerald-500">{item.percentage}%</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-xs font-black text-main uppercase tracking-widest flex items-center gap-2">
                                            View Report <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );

    // ══ QUIZ (Two-Panel Layout) ══════════════════════════════════════════
    if (view === 'quiz' && q) return (
        <div className="flex h-full bg-page/50 overflow-hidden">

            {/* ── Left Sidebar: Question Navigation ── */}
            <div className="hidden lg:flex w-72 bg-card border-r border-border-card flex-col shrink-0">
                <div className="p-8 border-b border-border-card">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                            style={{ backgroundColor: cat.color }}>
                            <Ico name={cat.icon} size={20} color="white" />
                        </div>
                        <div>
                            <h2 className="font-black text-main text-sm leading-tight">{cat.label}</h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">Assessment</p>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-muted">
                            <span>Progress</span>
                            <span style={{ color: cat.color }}>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-border-card rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full"
                                style={{ backgroundColor: cat.color }}
                                animate={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-8">
                    <div>
                        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Questions</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {questions.map((_, i) => {
                                const isCurrent = i === idx;
                                const isDone = answers[questions[i].questionId as number] !== undefined;
                                return (
                                    <button key={i} onClick={() => setIdx(i)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all ${isCurrent ? 'scale-110 shadow-md ring-2 ring-offset-2' : ''
                                            }`}
                                        style={{
                                            backgroundColor: isCurrent ? cat.color : (isDone ? hex2rgba(cat.color, 0.1) : 'var(--card, #fff)'),
                                            color: isCurrent ? 'white' : (isDone ? cat.color : 'var(--muted, #94a3b8)'),
                                            borderColor: isCurrent ? 'transparent' : (isDone ? 'transparent' : 'var(--border-card, #f1f5f9)'),
                                            borderWidth: isDone ? 0 : 2,
                                            boxShadow: isCurrent ? `0 4px 12px ${hex2rgba(cat.color, 0.3)}` : 'none',
                                            '--tw-ring-color': cat.color
                                        } as any}>
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border-card">
                    <button onClick={reset} className="w-full py-3 text-muted font-bold text-xs uppercase tracking-widest hover:text-main opacity-80 transition-colors flex items-center justify-center gap-2">
                        <ChevronLeft size={14} /> Abandon Session
                    </button>
                </div>
            </div>

            {/* ── Main Content Area ── */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Mobile Header (Hidden on LG) */}
                <div className="lg:hidden bg-card border-b border-border-card p-4 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-muted uppercase tracking-widest">Question {idx + 1} / {questions.length}</span>
                        <span className="px-2 py-1 bg-page rounded-lg text-[10px] font-black text-muted uppercase">{cat.label}</span>
                    </div>
                    <div className="h-1.5 bg-border-card rounded-full overflow-hidden">
                        <motion.div className="h-full" style={{ backgroundColor: cat.color }} animate={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Question Display Area */}
                <div className="flex-1 overflow-auto py-8 lg:py-16 px-6 lg:px-12">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <AnimatePresence mode="wait">
                            <motion.div key={idx}
                                initial={{ opacity: 0, scale: 0.98, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.98, x: -20 }}
                                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>

                                <div className="space-y-10">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">
                                            <div className="w-8 h-1 bg-indigo-600 rounded-full" />
                                            Active Inquiry
                                        </div>
                                        <h2 className="text-3xl lg:text-4xl font-black text-main leading-tight">
                                            {q.text}
                                        </h2>
                                    </div>

                                    {/* Options Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(q.options || []).map((opt: any) => {
                                            const optId = opt._id;
                                            const isSelected = selOpt === optId;
                                            return (
                                                <motion.button key={optId} onClick={() => pick(optId)}
                                                    whileHover={{ scale: 1.01 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`group relative p-6 rounded-[24px] border-2 text-left transition-all ${isSelected ? 'shadow-xl bg-card' : 'hover:border-border-card hover:bg-page'
                                                        }`}
                                                    style={{
                                                        borderColor: isSelected ? cat.color : 'var(--border-card, #f1f5f9)',
                                                    }}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? '' : 'group-hover:border-indigo-300'
                                                            }`}
                                                            style={{
                                                                borderColor: isSelected ? cat.color : 'var(--border-card, #e2e8f0)',
                                                                backgroundColor: isSelected ? cat.color : 'transparent'
                                                            }}>
                                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-card" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`font-black tracking-tight transition-colors ${isSelected ? 'text-main' : 'text-muted'
                                                                }`}>{opt.text}</p>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>

                                    {/* Notes - Only on last question or long form? Let's keep it consistent. */}
                                    {isLast && (
                                        <div className="bg-card rounded-3xl border border-border-card p-8 space-y-4 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-page flex items-center justify-center text-muted">
                                                    <ClipboardList size={18} />
                                                </div>
                                                <h3 className="font-black text-main text-sm tracking-tight">Personal Context (Optional)</h3>
                                            </div>
                                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                                                placeholder="Write any specific observations or feelings you'd like to include..."
                                                className="w-full bg-page/50 border border-border-card rounded-2xl px-6 py-4 text-sm font-medium text-main opacity-90 placeholder:text-muted opacity-60 focus:outline-none focus:ring-4 transition-all"
                                                style={{ '--tw-ring-color': hex2rgba(cat.color, 0.1) } as any} />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-card border-t border-border-card p-6 lg:px-12 shrink-0">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                        <div className="hidden lg:block">
                            <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Step {idx + 1} of {questions.length}</p>
                        </div>

                        <div className="flex items-center gap-4 w-full lg:w-auto">
                            {idx > 0 && (
                                <button onClick={() => setIdx(i => i - 1)}
                                    className="px-8 py-4 text-muted font-black hover:text-indigo-600 transition-colors">
                                    Previous
                                </button>
                            )}
                            <button onClick={handleNext}
                                disabled={!selOpt || submitting || (isLast && !allDone)}
                                className={`flex-1 lg:flex-none px-12 py-4 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-30 disabled:shadow-none transition-all flex items-center justify-center gap-3 ${selOpt ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-card border border-border-card text-main'}`}
                            >
                                {submitting ? <Activity className="animate-spin" /> : (isLast ? 'Complete Assessment' : 'Continue')}
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Overlay / Snackbar */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 px-8 py-4 rounded-2xl text-white font-black shadow-2xl flex items-center gap-4">
                        <CheckCircle2 size={24} />
                        Generating your wellness report...
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    // ══ SUCCESS / DETAIL (Split Layout) ══════════════════════════════════════
    const isDetail = view === 'detail';

    return (
        <div className="min-h-full bg-card flex flex-col">

            {/* Top Navigation Bar */}
            <div className="bg-card border-b border-border-card px-8 py-6 shrink-0 z-20">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button onClick={isDetail ? fetchHistory : reset}
                            className="w-12 h-12 bg-page hover:bg-page rounded-2xl flex items-center justify-center text-muted transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl lg:text-3xl font-black text-main leading-tight">
                                {isDetail ? 'Assessment Insights' : 'Great work, your report is ready!'}
                            </h1>
                        </div>
                    </div>
                    {!isDetail && (
                        <div className="hidden md:flex items-center gap-3">
                            <div className="w-px h-10 bg-border-card mx-2" />
                            <button onClick={reset} className="px-6 py-3 bg-card border border-border-card text-main font-black rounded-xl shadow-sm hover:border-indigo-500/30 hover:text-indigo-500 transition-all flex items-center gap-2">
                                <Sparkles size={18} /> New Check-in
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                {/* ── Left Panel: Summary Score ── */}
                <div className="lg:w-[400px] border-r border-border-card p-8 lg:p-12 overflow-auto shrink-0 bg-page/30">
                    <div className="space-y-10 max-w-sm mx-auto lg:mx-0">

                        {/* Summary Card */}
                        <div className="bg-card rounded-[32px] p-8 lg:p-10 shadow-2xl shadow-indigo-100/50 border border-border-card relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
                                <Brain size={120} />
                            </div>
                            <div className="relative z-10 text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-indigo-600 rounded-[24px] flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                        <Star size={40} />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[11px] font-black text-muted uppercase tracking-[0.2em] mb-2">Total Wellness Points</div>
                                    <div className="text-6xl font-black text-main tracking-tight">
                                        {result?.totalScore ?? result?.score ?? '-'}
                                    </div>
                                    <div className="text-sm font-bold text-muted mt-2 uppercase">out of {result?.maxPossibleScore ?? result?.maxScore ?? '100'}</div>
                                </div>
                                <div className="pt-6 border-t border-border-card">
                                    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-black uppercase tracking-widest">
                                        <Shield size={14} /> {result?.interpretation ?? result?.severity ?? 'Optimized'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Status', val: result?.status ?? 'Checked', color: 'text-blue-500' },
                                { label: 'Category', val: result?.wellnessAspect ?? 'General', color: 'text-indigo-500' },
                            ].map(s => (
                                <div key={s.label} className="bg-card p-5 rounded-3xl border border-border-card shadow-sm">
                                    <div className="text-[9px] font-black text-muted opacity-60 uppercase tracking-widest mb-1.5">{s.label}</div>
                                    <div className={`text-sm font-black ${s.color} truncate`}>{s.val}</div>
                                </div>
                            ))}
                        </div>

                        {!isDetail && (
                            <div className="p-1 text-center">
                                <p className="text-xs font-medium text-muted max-w-[240px] mx-auto">
                                    Tracking your wellness regularly helps identify patterns and improve resilience.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Panel: Full Breakdown ── */}
                <div className="flex-1 bg-card overflow-auto p-8 lg:p-12">
                    <div className="max-w-4xl mx-auto space-y-12">

                        <div className="flex items-center justify-between border-b border-border-card pb-6">
                            <h2 className="text-2xl font-black text-main tracking-tight">Full Response Breakdown</h2>
                            <span className="px-4 py-2 bg-page rounded-xl text-xs font-black text-muted uppercase tracking-widest">
                                {result?.responses?.length || 0} Responses
                            </span>
                        </div>

                        <div className="space-y-4">
                            {result?.responses ? result.responses.map((r: any, i: number) => {
                                // Priority: answerText -> selectedOption (if not an ID) -> 'N/A'
                                const isId = (val: string) => /^[0-9a-fA-F]{24}$/.test(val || '');
                                const displayAnswer = r.answerText || (!isId(r.selectedOption) ? r.selectedOption : 'Option Selected');
                                const score = r.score ?? 0;

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="bg-page/50 p-6 rounded-3xl border border-border-card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-card hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/30 transition-all group"
                                    >
                                        <div className="flex items-start gap-5 flex-1 max-w-2xl">
                                            <div className="w-10 h-10 bg-card border border-border-card rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:border-indigo-500/30 transition-colors">
                                                <span className="text-[11px] font-black text-muted group-hover:text-indigo-500 transition-colors">
                                                    {String(i + 1).padStart(2, '0')}
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                <h3 className="text-sm font-bold text-main leading-snug group-hover:text-indigo-900 transition-colors">
                                                    {r.questionText || `Clinical Inquiry ${r.questionId}`}
                                                </h3>
                                                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-card border border-border-card rounded-lg shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-muted group-hover:bg-indigo-400 transition-colors" />
                                                    <span className="text-xs font-black text-main opacity-80 uppercase tracking-tight">
                                                        {displayAnswer}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="shrink-0 flex items-center gap-4 pl-14 md:pl-0">
                                            <div className="h-8 w-[1px] bg-border-card hidden md:block" />
                                            <div className={`px-4 py-2 rounded-xl flex flex-col items-center justify-center min-w-[64px] border transition-all ${score > 0 ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-page border-border-card opacity-60'
                                                }`}>
                                                <span className={`text-sm font-black leading-none ${score > 0 ? 'text-indigo-600' : 'text-muted'}`}>
                                                    {score > 0 ? `+${score}` : score}
                                                </span>
                                                <span className="text-[8px] font-black text-muted uppercase tracking-widest mt-0.5">pts</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div className="text-center py-20 bg-page/50 rounded-[32px] border border-dashed border-border-card">
                                    <ClipboardList size={40} className="mx-auto text-muted opacity-50 mb-4" />
                                    <p className="text-muted font-bold uppercase tracking-widest text-xs">No detailed breakdown available</p>
                                </div>
                            )}
                        </div>

                        {/* Recommendation section if available */}
                        {(result?.recommendation || result?.notes) && (
                            <div className="pt-12 border-t border-border-card">
                                <h3 className="text-xl font-black text-main tracking-tight mb-6">Recommendations & Notes</h3>
                                <div className="bg-indigo-600 rounded-[32px] p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Activity size={100} />
                                    </div>
                                    <div className="relative z-10 space-y-4">
                                        <div className="w-10 h-10 bg-card/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                            <Sparkles size={20} />
                                        </div>
                                        <p className="text-lg font-medium leading-relaxed italic opacity-90">
                                            "{result.recommendation || result.notes}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
