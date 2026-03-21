import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Clock, Search, User, AlertCircle, Activity, ClipboardCheck,
    Brain, Heart, Moon, Coffee, Zap, Flame, Eye, Pill, Baby, PersonStanding,
    Sparkles, HeartCrack, Crosshair, Dice1, Shield, ChevronRight, CheckCircle2,
    ClipboardList, TrendingUp
} from 'lucide-react';
import { AssessmentService } from '../../api/services/assessment.service';
import Button from '../../components/ui/Button';
import type { AssessmentMaster, AssessmentQuestion, AssessmentResult } from '../../types/assessment.types';

// ─── Slug → icon + color mapping ──────────────────────────────────────────────
const slugStyleMap: Record<string, { icon: string; color: string; description: string }> = {
    depression:                  { icon: 'Heart',        color: 'emerald', description: 'Assess depressive symptoms, mood patterns, and emotional well-being.' },
    anxiety:                     { icon: 'Activity',     color: 'indigo',  description: 'Evaluate anxiety levels, worry patterns, and their impact on daily life.' },
    sleep:                       { icon: 'Moon',         color: 'pink',    description: 'Analyze sleep quality, disturbance patterns, and restfulness.' },
    mania:                       { icon: 'Zap',          color: 'orange',  description: 'Screen for manic episodes, elevated mood, and high-energy patterns.' },
    bipolar:                     { icon: 'Zap',          color: 'orange',  description: 'Screen for bipolar mood fluctuations.' },
    anger:                       { icon: 'Flame',        color: 'red',     description: 'Evaluate anger triggers, emotional distress, and coping mechanisms.' },
    anger_pediatric:             { icon: 'Flame',        color: 'red',     description: 'Assess anger and emotional regulation in children.' },
    substance_use:               { icon: 'Pill',         color: 'slate',   description: 'Screen for substance use behaviors and addiction risk factors.' },
    postpartum:                  { icon: 'Baby',         color: 'pink',    description: 'Evaluate postpartum depression symptoms in new mothers.' },
    somatic:                     { icon: 'PersonStanding', color: 'teal',  description: 'Assess physical symptoms linked to psychological distress.' },
    anxiety_pediatric:           { icon: 'Activity',     color: 'indigo',  description: 'Evaluate anxiety levels and worry patterns in children.' },
    repetitive_thoughts:         { icon: 'Brain',        color: 'purple',  description: 'Assess repetitive thoughts, compulsions, and obsessive behavioral patterns.' },
    repetitive_thoughts_pediatric:{ icon: 'Brain',       color: 'purple',  description: 'Screen for repetitive thoughts and behaviors in children.' },
    separation_anxiety:          { icon: 'HeartCrack',   color: 'pink',    description: 'Evaluate separation anxiety symptoms and attachment concerns.' },
    odd:                         { icon: 'Shield',       color: 'orange',  description: 'Screen for oppositional defiant disorder patterns in children.' },
    social_anxiety:              { icon: 'Eye',          color: 'indigo',  description: 'Assess social anxiety, avoidance behaviors, and performance fears.' },
    agoraphobia:                 { icon: 'Shield',       color: 'slate',   description: 'Evaluate fears related to open or crowded spaces and avoidance.' },
    panic_disorder:              { icon: 'Zap',          color: 'red',     description: 'Screen for recurrent panic attacks and related avoidance.' },
    adhd:                        { icon: 'Sparkles',     color: 'orange',  description: 'Assess attention deficit, hyperactivity, and impulsivity.' },
    ocd:                         { icon: 'Crosshair',    color: 'purple',  description: 'Evaluate obsessive-compulsive thoughts and ritual behaviors.' },
    psychosis:                   { icon: 'Eye',          color: 'slate',   description: 'Screen for psychotic symptoms including hallucinations and delusions.' },
    gambling:                    { icon: 'Dice1',        color: 'orange',  description: 'Assess gambling frequency, urges, and addiction risk factors.' },
    eating_disorder:             { icon: 'Coffee',       color: 'emerald', description: 'Screen for disordered eating patterns and body image concerns.' },
    pmdd:                        { icon: 'HeartCrack',   color: 'pink',    description: 'Evaluate premenstrual dysphoric disorder symptoms.' },
    autism_spectrum:             { icon: 'Sparkles',     color: 'indigo',  description: 'Screen for autism spectrum characteristics and social communication.' },
    ptsd_pediatric:              { icon: 'Shield',       color: 'red',     description: 'Screen for trauma and PTSD symptoms in children.' },
    acute_stress:                { icon: 'Flame',        color: 'orange',  description: 'Assess acute stress reactions following a traumatic event.' },
    dissociative_symptoms:       { icon: 'Eye',          color: 'purple',  description: 'Evaluate dissociative experiences and detachment symptoms.' },
    personality_inventory:       { icon: 'Brain',        color: 'indigo',  description: 'Comprehensive personality traits and behavioral pattern assessment.' },
    irritability:                { icon: 'Flame',        color: 'orange',  description: 'Assess levels of irritability, frustration, and emotional reactivity.' },
};

const defaultStyle = { icon: 'Brain', color: 'indigo', description: 'Select a standardized clinical tool to evaluate patient mental health markers.' };

const colorMap: Record<string, { bg: string; text: string; border: string; badgeBg: string }> = {
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  badgeBg: 'bg-indigo-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badgeBg: 'bg-emerald-100' },
    pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200',    badgeBg: 'bg-pink-100' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200',  badgeBg: 'bg-orange-100' },
    red:     { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     badgeBg: 'bg-red-100' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-200',  badgeBg: 'bg-purple-100' },
    teal:    { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-200',    badgeBg: 'bg-teal-100' },
    slate:   { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',   badgeBg: 'bg-slate-200' },
};

const getIcon = (iconName: string, cls: string) => {
    const props = { size: 28, className: cls };
    switch (iconName) {
        case 'Brain':         return <Brain {...props} />;
        case 'Heart':         return <Heart {...props} />;
        case 'Activity':      return <Activity {...props} />;
        case 'Moon':          return <Moon {...props} />;
        case 'Coffee':        return <Coffee {...props} />;
        case 'Zap':           return <Zap {...props} />;
        case 'Shield':        return <Shield {...props} />;
        case 'Flame':         return <Flame {...props} />;
        case 'Eye':           return <Eye {...props} />;
        case 'Pill':          return <Pill {...props} />;
        case 'Baby':          return <Baby {...props} />;
        case 'Dice1':         return <Dice1 {...props} />;
        case 'PersonStanding':return <PersonStanding {...props} />;
        case 'Crosshair':     return <Crosshair {...props} />;
        case 'Sparkles':      return <Sparkles {...props} />;
        case 'HeartCrack':    return <HeartCrack {...props} />;
        default:              return <Brain {...props} />;
    }
};

// ─── DSM-5 Category Hub ────────────────────────────────────────────────────────
interface TopicCard {
    slug: string;
    title: string;
    questions: AssessmentQuestion[];
    icon: string;
    color: string;
    description: string;
}

interface UIMaster extends AssessmentMaster {
    title: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
}

const ClinicalAssessmentCenter = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetPatientId = searchParams.get('patientId');
    const targetPatientName = searchParams.get('patientName');

    // Mode: 'hub' = DSM-5 topic selection, 'list' = flat assessment list
    const [mode, setMode] = useState<'hub' | 'list'>('hub');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

    // Hub data (professional flow)
    const [topics, setTopics] = useState<Record<string, AssessmentQuestion[]>>({});
    const [patientInfo, setPatientInfo] = useState<{ userId: number; firstName: string; age: number; gender: string } | null>(null);

    // List data (flat masters, fallback or non-patient flow)
    const [assessments, setAssessments] = useState<UIMaster[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedResult, setSubmittedResult] = useState<AssessmentResult | null>(null);

    useEffect(() => { fetchData(); }, [targetPatientId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (targetPatientId) {
                // Professional: fetch DSM-5 grouped topics
                const res = await AssessmentService.getProfessionalQuestions(targetPatientId);
                if (res.success || res.code === 200) {
                    setTopics(res.data?.topics || {});
                    setPatientInfo(res.data?.patient || null);
                    setMode('hub');
                }
            } else {
                // No patient context: show flat list of masters
                const response = await AssessmentService.getMastersList({ is_active: 1, master_type_slug: 'mental_health', limit: 100, page: 1 });
                const categoriesArray = Array.isArray(response) ? response : [];
                const mapped: UIMaster[] = categoriesArray.map((item: AssessmentMaster) => {
                    const style = (item.slug ? slugStyleMap[item.slug] : null) || defaultStyle;
                    return {
                        id: item.slug || item.id || item._id || '',
                        title: item.name || item.text || item.title || 'Unknown Assessment',
                        slug: item.slug || '',
                        duration: item.duration || '5-10 mins',
                        description: item.description || style.description,
                        icon: style.icon, color: style.color,
                    };
                });
                setAssessments(mapped);
                setMode('list');
            }
        } catch (error) {
            console.error('Error fetching assessments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Topic cards derived from hub data ─────────────────────────────────────
    const topicCards: TopicCard[] = useMemo(() => Object.entries(topics).map(([slug, questions]) => {
        const style = slugStyleMap[slug] || defaultStyle;
        return { slug, title: slug.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), questions, ...style };
    }), [topics]);

    const filteredAssessments = assessments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStartAssessment = (slug: string) => {
        const url = `/assessments/${slug}${targetPatientId ? `?patientId=${targetPatientId}` : ''}`;
        navigate(url);
    };

    const handleViewHistory = (slug: string) => {
        if (targetPatientId) navigate(`/patients/${targetPatientId}/history?category=${slug}`);
    };

    const getTopicProgress = (topicSlug: string) => {
        const qs = topics[topicSlug] || [];
        if (!qs.length) return { answered: 0, total: 0, completed: false };
        const answered = qs.filter(q => answers[(q as any).questionId || (q as any)._id || (q as any).id] !== undefined).length;
        return { answered, total: qs.length, completed: answered === qs.length };
    };

    const handleSubmitProfessional = async () => {
        if (!targetPatientId || !selectedTopic) return;
        setIsSubmitting(true);
        try {
            const responsesArray = Object.entries(answers).map(([qId, optId]) => ({
                questionId: isNaN(Number(qId)) ? qId : Number(qId),
                optionId: String(optId),
            }));
            const response = await AssessmentService.submitProfessionalAssessment({
                patientId: Number(targetPatientId),
                category: selectedTopic,
                responses: responsesArray,
                notes: notes || undefined,
            });
            
            console.log('Professional submission response:', response);
            
            // Check for success in multiple ways to be robust
            if (response && (response.success || response.code === 201 || response.code === 200 || response.data)) {
                const resultData = response.data || response;
                setSubmittedResult(resultData);
                setAnswers({});
                setNotes('');
                // Optionally clear selectedTopic here to be safe, 
                // but the render logic now prioritizes submittedResult anyway.
            } else {
                console.error('Submission failed or returned unexpected structure:', response);
                alert('Assessment submitted but returned unexpected status.');
            }
        } catch (err) {
            console.error('Error submitting professional assessment:', err);
            alert('Failed to submit assessment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Clinical Assessments...</p>
            </div>
        );
    }

    // ── PROFESSIONAL FLOW: DSM-5 Hub ──────────────────────────────────────────
    if (mode === 'hub' && targetPatientId) {
        // Result view after submission (Check this FIRST)
        if (submittedResult) {
            const style = slugStyleMap[submittedResult.category || ''] || defaultStyle;
            const colors = colorMap[style.color] || colorMap.indigo;
            
            return (
                <div className="p-8 max-w-2xl mx-auto space-y-8 animate-fade-in pb-20">
                    <header className="text-center space-y-4">
                        <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center ${colors.bg} ${colors.text} shadow-lg shadow-indigo-100`}>
                            <CheckCircle2 size={40} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Evaluation Complete</h1>
                            <p className="text-slate-500 font-medium mt-1">Assessment recorded successfully in the patient's clinical vault.</p>
                        </div>
                    </header>

                    <div className="card-premium p-8 space-y-8 border-indigo-100 shadow-xl shadow-indigo-50/50">
                        <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div className="text-center px-6 border-r border-slate-100 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
                                <p className="text-4xl font-black text-slate-900 leading-none">
                                    {submittedResult.totalScore}
                                    <span className="text-xs text-slate-400 ml-1 font-medium">/ {submittedResult.maxPossibleScore || '--'}</span>
                                </p>
                            </div>
                            <div className="text-center px-6 flex-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Interpretation</p>
                                <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border inline-block ${colors.bg} ${colors.text} ${colors.border}`}>
                                    {submittedResult.interpretation || submittedResult.severity || 'Completed'}
                                </div>
                            </div>
                        </div>

                        {submittedResult.notes && (
                            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
                                <div className="flex items-center gap-2 text-amber-600">
                                    <ClipboardList size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Clinical Note</span>
                                </div>
                                <p className="text-sm font-bold text-amber-900 italic leading-relaxed">
                                    "{submittedResult.notes}"
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <Button 
                                variant="primary" 
                                className="w-full py-4 rounded-2xl shadow-lg shadow-indigo-100"
                                onClick={() => {
                                    setSubmittedResult(null);
                                    setSelectedTopic(null);
                                }}
                            >
                                Back to Assessment Center
                            </Button>
                            <button 
                                onClick={() => navigate(`/clinical/assessments/history?patientId=${targetPatientId}&topic=${submittedResult.category}`)}
                                className="w-full py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <TrendingUp size={14} /> View Longitudinal History <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Topic selected → show inline questions
        if (selectedTopic && topics[selectedTopic]) {
            const qs = topics[selectedTopic];
            const topicStyle = slugStyleMap[selectedTopic] || defaultStyle;
            const colors = colorMap[topicStyle.color] || colorMap.indigo;
            const isAllAnswered = qs.length > 0 && qs.every(q => answers[(q as any).questionId || (q as any)._id || (q as any).id] !== undefined);

            return (
                <div className="p-8 max-w-4xl space-y-8 animate-fade-in pb-28">
                    {/* Header */}
                    <header className="space-y-4">
                        <button onClick={() => { setSelectedTopic(null); setAnswers({}); }}
                            className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                            <ChevronLeft size={14} /> Back to Categories
                        </button>
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.bg} ${colors.text}`}>
                                {getIcon(topicStyle.icon, colors.text)}
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                    {selectedTopic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </h1>
                                <p className="text-slate-500 font-medium mt-1">{topicStyle.description}</p>
                            </div>
                        </div>
                    </header>

                    {/* Patient context banner */}
                    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${colors.bg} ${colors.border}`}>
                        <User size={16} className={colors.text} />
                        <p className={`text-sm font-bold ${colors.text}`}>Evaluating on behalf of {targetPatientName || `Patient #${targetPatientId}`}</p>
                    </div>

                    {/* Questions */}
                    {qs.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <AlertCircle size={40} className="text-slate-300 mx-auto mb-4" />
                            <p className="font-black text-slate-600">No questions found in this category.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {qs.map((q: any, idx: number) => {
                                const qId = q.questionId || q._id || q.id;
                                const selectedOptId = answers[qId];
                                return (
                                    <motion.div key={qId || idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                                        className="card-premium p-8">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-black ${colors.bg} ${colors.text}`}>{idx + 1}</div>
                                            <h3 className="text-lg font-bold text-slate-900 leading-relaxed">{q.text}</h3>
                                        </div>
                                        <div className="grid gap-3 pl-13">
                                            {(q.options || []).map((opt: any, oi: number) => {
                                                const optId = opt._id || opt.id || opt.value;
                                                const isSelected = selectedOptId === optId;
                                                return (
                                                    <button key={optId || oi} onClick={() => setAnswers(prev => ({ ...prev, [qId]: optId }))}
                                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${isSelected
                                                            ? `${colors.bg} ${colors.border} ${colors.text} shadow-sm scale-[1.01]`
                                                            : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? colors.border : 'border-slate-300'}`}>
                                                            {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${colors.text.replace('text-', 'bg-')}`} />}
                                                        </div>
                                                        <span className="font-medium flex-1">{opt.text}</span>
                                                        {opt.score !== undefined && (
                                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${isSelected ? colors.badgeBg : 'bg-slate-100 text-slate-500'}`}>
                                                                {opt.score} pts
                                                            </span>
                                                        )}
                                                        {isSelected && <CheckCircle2 size={18} className={colors.text} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* Notes */}
                            <div className="card-premium p-8">
                                <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <ClipboardCheck size={18} className="text-indigo-500" /> Additional Notes (Optional)
                                </h3>
                                <textarea
                                    value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                                    placeholder="Add clinical observations, medication context, or supplementary notes..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Sticky submit footer */}
                    {qs.length > 0 && (
                        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-8 py-4 flex items-center justify-between z-20">
                            <div className="text-sm font-bold text-slate-500">
                                {qs.filter((q: any) => answers[(q as any).questionId || (q as any)._id || (q as any).id] !== undefined).length} / {qs.length} answered
                            </div>
                            <Button variant="primary" disabled={!isAllAnswered || isSubmitting} isLoading={isSubmitting}
                                onClick={handleSubmitProfessional} className="px-10 py-3 rounded-2xl">
                                {isAllAnswered ? 'Submit Evaluation' : `${qs.length - qs.filter((q: any) => answers[(q as any).questionId || (q as any)._id || (q as any).id] !== undefined).length} remaining`}
                            </Button>
                        </div>
                    )}
                </div>
            );
        }


        // ── DSM-5 Category Hub ─────────────────────────────────────────────────
        return (
            <div className="p-8 max-w-7xl space-y-10 animate-fade-in pb-20">
                <header className="space-y-4">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                        <ChevronLeft size={14} /> Back
                    </button>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Assessment Center</h1>
                            <p className="text-slate-500 font-medium mt-1">DSM-5 Classification — Select a category to evaluate</p>
                        </div>
                        {targetPatientId && (
                            <div className="flex items-center gap-3 px-5 py-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Evaluating</p>
                                    <p className="text-sm font-bold text-indigo-900">{targetPatientName || `Patient #${targetPatientId}`}</p>
                                    {patientInfo && <p className="text-[10px] text-indigo-400 font-medium">{patientInfo.age}y · {patientInfo.gender}</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {topicCards.length === 0 ? (
                    <div className="text-center py-24 card-premium bg-slate-50/50 border-dashed border-2">
                        <AlertCircle size={48} className="mx-auto mb-4 text-slate-200" />
                        <p className="font-black text-slate-900 mb-1 uppercase tracking-widest text-sm">No Assessment Categories Found</p>
                        <p className="text-slate-400 font-medium text-sm">The backend may not support DSM-5 professional topics yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {topicCards.map((topic, i) => {
                            const colors = colorMap[topic.color] || colorMap.indigo;
                            const { answered, total, completed } = getTopicProgress(topic.slug);
                            return (
                                <motion.div key={topic.slug} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelectedTopic(topic.slug)}
                                    className={`card-premium group p-8 flex flex-col cursor-pointer hover:scale-[1.02] transition-transform duration-300 ${completed ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}>
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.bg} ${colors.text} group-hover:scale-110 transition-transform duration-300`}>
                                            {getIcon(topic.icon, colors.text)}
                                        </div>
                                        {completed ? (
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                                <CheckCircle2 size={12} /> Done
                                            </span>
                                        ) : total > 0 ? (
                                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors.bg} ${colors.text} ${colors.border}`}>
                                                {answered}/{total}
                                            </span>
                                        ) : null}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2">{topic.title}</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1 mb-6">{topic.description}</p>
                                    <div className={`flex items-center gap-2 text-sm font-black ${colors.text} group-hover:gap-4 transition-all`}>
                                        Start Evaluation <ChevronRight size={16} />
                                    </div>
                                    {total > 0 && (
                                        <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${colors.text.replace('text-', 'bg-')} rounded-full transition-all`} style={{ width: `${(answered / total) * 100}%` }} />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ── NON-PATIENT FLOW: Flat master list (or legacy fallback) ───────────────
    return (
        <div className="p-8 max-w-7xl space-y-10 animate-fade-in pb-20">
            <header className="space-y-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                    <ChevronLeft size={14} /> Back
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Assessment Center</h1>
                        <p className="text-slate-500 font-medium mt-1">Select a standardized clinical tool to evaluate patient mental health markers.</p>
                    </div>
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search clinical tools..." value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {filteredAssessments.length} TOOL{filteredAssessments.length !== 1 ? 'S' : ''} READY
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAssessments.length > 0 ? (
                    filteredAssessments.map((item, i) => {
                        const colors = colorMap[item.color] || colorMap.indigo;
                        return (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="card-premium group p-8 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colors.bg} ${colors.text} group-hover:scale-110 transition-transform duration-500`}>
                                            {getIcon(item.icon, colors.text)}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Clock size={12} /> {item.duration}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{item.title}</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">{item.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-8 mt-8 border-t border-slate-50">
                                    {targetPatientId && (
                                        <Button variant="outline"
                                            className="flex-1 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 py-3 text-[11px] font-black uppercase tracking-widest"
                                            onClick={() => handleViewHistory(item.slug || '')} leftIcon={<Clock size={16} />}>
                                            History
                                        </Button>
                                    )}
                                    <Button variant="primary"
                                        className={`${targetPatientId ? 'flex-[1.5]' : 'w-full'} rounded-2xl py-3 text-[11px] font-black uppercase tracking-widest`}
                                        onClick={() => handleStartAssessment(item.slug || '')} rightIcon={<ChevronRight size={18} />}>
                                        {targetPatientId ? 'Start' : 'Explore'}
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-24 text-center card-premium bg-slate-50/50 border-dashed border-2">
                        <AlertCircle size={48} className="mx-auto mb-4 text-slate-200" />
                        <p className="font-black text-slate-900 mb-1 uppercase tracking-widest text-sm">No Assessment Tools Found</p>
                        <p className="text-slate-400 font-medium text-sm">Try adjusting your search query.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicalAssessmentCenter;
