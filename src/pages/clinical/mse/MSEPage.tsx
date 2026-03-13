import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    ChevronRight, 
    Save, 
    AlertCircle, 
    Activity,
    CheckCircle2,
    Brain,
    Sparkles,
    Zap,
    Target,
    User,
    Mic,
    Smile,
    Heart,
    Workflow,
    ClipboardList,
    FileText,
    Eye,
    Shield,
    Database
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { MSEService } from '../../../api/services/mse.service';
import { MSE_FALLBACK_QUESTIONNAIRE } from '../../../constants/mse.constants';
import type { MSESection, MSEQuestion, MSEResponse } from '../../../types/mse.types';

const FindingItem = ({ label, value }: { label: string; value: any }) => {
    if (value === null || value === undefined || value === '') return null;
    
    // Strict filtering for "unremarkable" or "absent" findings
    if (value === false) return null;
    if (value === 'None') return null;
    if (Array.isArray(value) && value.length === 0) return null;
    
    let displayValue = '';
    if (typeof value === 'boolean') {
        displayValue = value ? 'Present / Normal' : 'Absent / Noted';
    } else if (Array.isArray(value)) {
        displayValue = value.join(', ');
    } else if (typeof value === 'object') {
        const activeEntries = Object.entries(value)
            .filter(([_, v]) => v === true || (typeof v === 'string' && v.length > 0 && v !== 'None'));
            
        if (activeEntries.length === 0) return null;
        
        displayValue = activeEntries
            .map(([k, _]) => k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '))
            .join(', ');
    } else {
        displayValue = String(value);
    }

    if (!displayValue || displayValue === 'No specific markers') return null;

    return (
        <div className="flex justify-between items-start py-3 border-b border-slate-50 last:border-none group">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label.replace(/_/g, ' ')}</span>
            <span className="text-xs font-bold text-slate-700 text-right max-w-[60%] group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{displayValue}</span>
        </div>
    );
};

const MSEPage = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    
    const [sections, setSections] = useState<MSESection[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MSEResponse | null>(null);

    useEffect(() => {
        const fetchQuestionnaire = async () => {
            try {
                setIsLoading(true);
                const res = await MSEService.getQuestions();
                const data = res.data || res;
                if (Array.isArray(data) && data.length > 0) {
                    setSections(data);
                } else {
                    setSections(MSE_FALLBACK_QUESTIONNAIRE);
                }
            } catch (err) {
                console.error('Failed to fetch MSE questionnaire:', err);
                setSections(MSE_FALLBACK_QUESTIONNAIRE);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestionnaire();
    }, []);

    const handleValueChange = (section: string, key: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] || {}),
                [key]: value
            }
        }));
    };

    const handleMultiselectToggle = (section: string, key: string, option: string) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentArr = Array.isArray(currentSection[key]) ? [...currentSection[key]] : [];
            const newArr = currentArr.includes(option) 
                ? currentArr.filter((o: string) => o !== option)
                : [...currentArr, option];
            
            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [key]: newArr
                }
            };
        });
    };

    const THEMES: Record<string, any> = {
        blue: {
            active: 'bg-blue-600 border-blue-600 text-white',
            done: 'bg-blue-50 border-blue-100 text-blue-700',
            iconActive: 'text-white',
            iconDone: 'text-blue-600',
            dot: 'bg-blue-500',
            bgSoft: 'bg-blue-50',
            textSoft: 'text-blue-600',
            textSoftAlt: 'text-blue-400',
            borderSoft: 'border-blue-100',
            borderFocus: 'focus:border-blue-500',
            hoverBorder: 'hover:border-blue-200',
            shadow: 'ring-blue-400/20'
        },
        indigo: {
            active: 'bg-indigo-600 border-indigo-600 text-white',
            done: 'bg-indigo-50 border-indigo-100 text-indigo-700',
            iconActive: 'text-white',
            iconDone: 'text-indigo-600',
            dot: 'bg-indigo-500',
            bgSoft: 'bg-indigo-50',
            textSoft: 'text-indigo-600',
            textSoftAlt: 'text-indigo-400',
            borderSoft: 'border-indigo-100',
            borderFocus: 'focus:border-indigo-500',
            hoverBorder: 'hover:border-indigo-200',
            shadow: 'ring-indigo-400/20'
        },
        violet: {
            active: 'bg-violet-600 border-violet-600 text-white',
            done: 'bg-violet-50 border-violet-100 text-violet-700',
            iconActive: 'text-white',
            iconDone: 'text-violet-600',
            dot: 'bg-violet-500',
            bgSoft: 'bg-violet-50',
            textSoft: 'text-violet-600',
            textSoftAlt: 'text-violet-400',
            borderSoft: 'border-violet-100',
            borderFocus: 'focus:border-violet-500',
            hoverBorder: 'hover:border-violet-200',
            shadow: 'ring-violet-400/20'
        },
        rose: {
            active: 'bg-rose-600 border-rose-600 text-white',
            done: 'bg-rose-50 border-rose-100 text-rose-700',
            iconActive: 'text-white',
            iconDone: 'text-rose-600',
            dot: 'bg-rose-500',
            bgSoft: 'bg-rose-50',
            textSoft: 'text-rose-600',
            textSoftAlt: 'text-rose-400',
            borderSoft: 'border-rose-100',
            borderFocus: 'focus:border-rose-500',
            hoverBorder: 'hover:border-rose-200',
            shadow: 'ring-rose-400/20'
        },
        pink: {
            active: 'bg-pink-600 border-pink-600 text-white',
            done: 'bg-pink-50 border-pink-100 text-pink-700',
            iconActive: 'text-white',
            iconDone: 'text-pink-600',
            dot: 'bg-pink-500',
            bgSoft: 'bg-pink-50',
            textSoft: 'text-pink-600',
            textSoftAlt: 'text-pink-400',
            borderSoft: 'border-pink-100',
            borderFocus: 'focus:border-pink-500',
            hoverBorder: 'hover:border-pink-200',
            shadow: 'ring-pink-400/20'
        },
        amber: {
            active: 'bg-amber-600 border-amber-600 text-white',
            done: 'bg-amber-50 border-amber-100 text-amber-700',
            iconActive: 'text-white',
            iconDone: 'text-amber-600',
            dot: 'bg-amber-500',
            bgSoft: 'bg-amber-50',
            textSoft: 'text-amber-600',
            textSoftAlt: 'text-amber-400',
            borderSoft: 'border-amber-100',
            borderFocus: 'focus:border-amber-500',
            hoverBorder: 'hover:border-amber-200',
            shadow: 'ring-amber-400/20'
        },
        orange: {
            active: 'bg-orange-600 border-orange-600 text-white',
            done: 'bg-orange-50 border-orange-100 text-orange-700',
            iconActive: 'text-white',
            iconDone: 'text-orange-600',
            dot: 'bg-orange-500',
            bgSoft: 'bg-orange-50',
            textSoft: 'text-orange-600',
            textSoftAlt: 'text-orange-400',
            borderSoft: 'border-orange-100',
            borderFocus: 'focus:border-orange-500',
            hoverBorder: 'hover:border-orange-200',
            shadow: 'ring-orange-400/20'
        },
        cyan: {
            active: 'bg-cyan-600 border-cyan-600 text-white',
            done: 'bg-cyan-50 border-cyan-100 text-cyan-700',
            iconActive: 'text-white',
            iconDone: 'text-cyan-600',
            dot: 'bg-cyan-500',
            bgSoft: 'bg-cyan-50',
            textSoft: 'text-cyan-600',
            textSoftAlt: 'text-cyan-400',
            borderSoft: 'border-cyan-100',
            borderFocus: 'focus:border-cyan-500',
            hoverBorder: 'hover:border-cyan-200',
            shadow: 'ring-cyan-400/20'
        },
        yellow: {
            active: 'bg-yellow-600 border-yellow-600 text-white',
            done: 'bg-yellow-50 border-yellow-100 text-yellow-700',
            iconActive: 'text-white',
            iconDone: 'text-yellow-600',
            dot: 'bg-yellow-500',
            bgSoft: 'bg-yellow-50',
            textSoft: 'text-yellow-600',
            textSoftAlt: 'text-yellow-400',
            borderSoft: 'border-yellow-100',
            borderFocus: 'focus:border-yellow-500',
            hoverBorder: 'hover:border-yellow-200',
            shadow: 'ring-yellow-400/20'
        },
        emerald: {
            active: 'bg-emerald-600 border-emerald-600 text-white',
            done: 'bg-emerald-50 border-emerald-100 text-emerald-700',
            iconActive: 'text-white',
            iconDone: 'text-emerald-600',
            dot: 'bg-emerald-500',
            bgSoft: 'bg-emerald-50',
            textSoft: 'text-emerald-600',
            textSoftAlt: 'text-emerald-400',
            borderSoft: 'border-emerald-100',
            borderFocus: 'focus:border-emerald-500',
            hoverBorder: 'hover:border-emerald-200',
            shadow: 'ring-emerald-400/20'
        },
        sky: {
            active: 'bg-sky-600 border-sky-600 text-white',
            done: 'bg-sky-50 border-sky-100 text-sky-700',
            iconActive: 'text-white',
            iconDone: 'text-sky-600',
            dot: 'bg-sky-500',
            bgSoft: 'bg-sky-50',
            textSoft: 'text-sky-600',
            textSoftAlt: 'text-sky-400',
            borderSoft: 'border-sky-100',
            borderFocus: 'focus:border-sky-500',
            hoverBorder: 'hover:border-sky-200',
            shadow: 'ring-sky-400/20'
        }
    };

    const getSectionColor = (section: string) => {
        switch (section?.toLowerCase()) {
            case 'appearance': return 'blue';
            case 'behavior': return 'indigo';
            case 'speech': return 'violet';
            case 'mood': return 'rose';
            case 'affect': return 'pink';
            case 'thought_form': return 'amber';
            case 'thought_content': return 'orange';
            case 'perception': return 'cyan';
            case 'insight': return 'yellow';
            case 'judgment': return 'emerald';
            case 'cognition': return 'sky';
            default: return 'indigo';
        }
    };

    const getTheme = (section: string) => {
        const color = getSectionColor(section);
        return THEMES[color] || THEMES.indigo;
    };

    const getSectionIcon = (section: string) => {
        switch (section?.toLowerCase()) {
            case 'appearance': return <User size={18} />;
            case 'behavior': return <Activity size={18} />;
            case 'speech': return <Mic size={18} />;
            case 'mood': return <Smile size={18} />;
            case 'affect': return <Heart size={18} />;
            case 'thought_form': return <Workflow size={18} />;
            case 'thought_content': return <FileText size={18} />;
            case 'perception': return <Eye size={18} />;
            case 'insight': return <Zap size={18} />;
            case 'judgment': return <Shield size={18} />;
            case 'cognition': return <Database size={18} />;
            default: return <Brain size={18} />;
        }
    };

    const handleSubmit = async () => {
        if (!userId) return;
        setIsSaving(true);
        setError(null);
        
        try {
            // Flatten the responses
            const flattenedResponses: { questionCode: string; value: any }[] = [];
            
            // Final submission: Flatten everything
            Object.values(responses).forEach((sectionData) => {
                Object.entries(sectionData).forEach(([questionKey, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        if (Array.isArray(value) && value.length === 0) return;
                        flattenedResponses.push({ questionCode: questionKey, value });
                    }
                });
            });

            if (flattenedResponses.length === 0) {
                throw new Error('Please answer at least one question before submitting.');
            }

            const res = await MSEService.createMSE({
                patient_id: userId,
                responses: flattenedResponses
            });
            
            // Handle both ApiResponse wrapper and direct response
            const responseData = (res as any).data || res;
            
            // Final submission
            setResult(responseData as MSEResponse);
        } catch (err: any) {
            console.error('Failed to save MSE:', err);
            setError(err.response?.data?.message || 'Failed to save the MSE. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderQuestion = (section: string, question: MSEQuestion) => {
        const value = responses[section]?.[question.key];
        const theme = getTheme(section);

        switch (question.type) {
            case 'select':
                return (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {question.options?.map(option => (
                            <button
                                key={option}
                                onClick={() => handleValueChange(section, question.key, option)}
                                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                    value === option 
                                    ? theme.active 
                                    : `bg-slate-50 border-transparent text-slate-600 ${theme.hoverBorder}`
                                }`}
                            >
                                <span className="text-xs font-black uppercase tracking-tight">{option}</span>
                            </button>
                        ))}
                    </div>
                );

            case 'multiselect':
                return (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {question.options?.map(option => {
                            const isSelected = Array.isArray(value) && value.includes(option);
                            return (
                                <button
                                    key={option}
                                    onClick={() => handleMultiselectToggle(section, question.key, option)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                                        isSelected 
                                        ? theme.active 
                                        : `bg-slate-50 border-transparent text-slate-600 ${theme.hoverBorder}`
                                    }`}
                                >
                                    <span className="text-xs font-black uppercase tracking-tight">{option}</span>
                                </button>
                            );
                        })}
                    </div>
                );

            case 'boolean':
                return (
                    <div className="space-y-4 mt-4">
                        <div className="flex gap-4">
                            {[true, false].map(v => (
                                <button
                                    key={v ? 'Yes' : 'No'}
                                    onClick={() => handleValueChange(section, question.key, v)}
                                    className={`flex-1 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[10px] ${
                                        value === v 
                                        ? (v ? theme.active : 'bg-slate-800 border-slate-800 text-white shadow-md')
                                        : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                                    }`}
                                >
                                    {v ? 'Yes / Present' : 'No / Absent'}
                                </button>
                            ))}
                        </div>
                        {value === true && question.follow_up && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`pl-6 border-l-4 ${theme.borderSoft} space-y-6 mt-4`}
                            >
                                {question.follow_up.map(fu => (
                                    <div key={fu.key} className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{fu.label}</p>
                                        {renderQuestion(section, fu)}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                );

            case 'text':
                return (
                    <div className="mt-4">
                        <textarea
                            value={value || ''}
                            onChange={(e) => handleValueChange(section, question.key, e.target.value)}
                            placeholder={question.placeholder}
                            className={`w-full min-h-[120px] p-6 bg-slate-50 border-2 border-transparent rounded-3xl text-sm font-medium ${theme.borderFocus} focus:bg-white outline-none transition-all resize-none placeholder:text-slate-300 font-bold`}
                        />
                    </div>
                );

            case 'number':
                return (
                    <div className="mt-4 flex items-center gap-6">
                        <input
                            type="number"
                            value={value || ''}
                            min={question.min}
                            max={question.max}
                            onChange={(e) => handleValueChange(section, question.key, e.target.value)}
                            placeholder={question.placeholder}
                            className={`w-32 p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-black ${theme.borderFocus} focus:bg-white outline-none transition-all shadow-sm`}
                        />
                        {question.max && (
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maximum Score</span>
                                <span className="text-sm font-black text-slate-900">{question.max} Points</span>
                            </div>
                        )}
                    </div>
                );

            case 'group':
                return (
                    <div className="mt-4 grid gap-3 bg-slate-50 p-6 rounded-2xl">
                        {question.items?.map(item => (
                            <div key={item.key} className="space-y-2">
                                <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{item.label}</span>
                                {renderQuestion(section, item)}
                            </div>
                        ))}
                    </div>
                );

            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Hydrating Clinical Questionnaire...</p>
            </div>
        );
    }

    if (!sections.length) return null;

    if (result) {
        const isValueMeaningful = (v: any): boolean => {
            if (v === null || v === undefined || v === '' || v === false || v === 'None') return false;
            if (Array.isArray(v) && v.length === 0) return false;
            if (typeof v === 'object' && !Array.isArray(v)) {
                return Object.values(v).some(val => val === true || (typeof val === 'string' && val.length > 0 && val !== 'None'));
            }
            return true;
        };

        const assessedSections = sections.filter(s => {
            const sectionData = (result as any)[s.section];
            if (!sectionData) return false;
            return Object.values(sectionData).some(v => isValueMeaningful(v));
        });

        const isAiAnalysisMeaningful = (text: string): boolean => {
            if (!text) return false;
            const lackOfAssessmentMarkers = [
                'not assessed', 'cannot be determined', 'lack of assessment', 'no information', 'insufficient data'
            ];
            return !lackOfAssessmentMarkers.some(marker => text.toLowerCase().includes(marker));
        };

        const pendingSections = sections.filter(s => 
            !assessedSections.find(as => as.section === s.section)
        );

        return (
            <div className="p-8 max-w-6xl mx-auto animate-fade-in pb-24 space-y-12">
                <header className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-indigo-100">
                                Patient Assessment Complete
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">
                                ID: {userId?.slice(-8).toUpperCase()} • {new Date().toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Sparkles className="text-indigo-600" size={32} />
                            Diagnostic Evaluation
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline"
                            onClick={() => setResult(null)}
                            leftIcon={<ChevronLeft size={18} />}
                            className="rounded-2xl h-12 px-6 font-black uppercase text-xs tracking-widest border-2"
                        >
                            Refine Assessment
                        </Button>
                        <Button 
                            variant="primary"
                            onClick={() => navigate(`/patients/${userId}/health`)}
                            className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest bg-slate-900 border-none shadow-xl shadow-slate-200"
                        >
                            Return to Profile
                        </Button>
                    </div>
                </header>

                <div className="grid gap-10">
                    <section className="card-premium p-12 bg-white border-slate-100 relative overflow-hidden shadow-2xl shadow-indigo-50/50 ring-1 ring-slate-100">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
                            <Brain size={240} />
                        </div>
                        
                        <div className="relative space-y-12">
                            <header className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <Sparkles size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">AI Clinical Intelligence</h2>
                                        <p className="text-xl font-black text-slate-900 tracking-tight">Full Diagnostic Formulation</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {result.ai_analysis.emotional_tone_mapping.map((tone, idx) => (
                                        <span key={idx} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-tight border border-slate-100 italic">
                                            {tone}
                                        </span>
                                    ))}
                                </div>
                            </header>

                            <div className="grid lg:grid-cols-12 gap-12">
                                {/* Main Narrative */}
                                <div className="lg:col-span-12 space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={14} />
                                            Clinical Formulation
                                        </h3>
                                        <p className="text-xl font-black text-slate-800 leading-relaxed tracking-tight">
                                            "{result.ai_analysis.clinical_formulation}"
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                                        {isAiAnalysisMeaningful(result.ai_analysis.affect_recognition) && (
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Affective State</h4>
                                                <p className="text-sm font-bold text-slate-600 leading-relaxed">{result.ai_analysis.affect_recognition}</p>
                                            </div>
                                        )}
                                        {isAiAnalysisMeaningful(result.ai_analysis.speech_tempo_analysis) && (
                                            <div className="space-y-3">
                                                <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Speech Dynamics</h4>
                                                <p className="text-sm font-bold text-slate-600 leading-relaxed">{result.ai_analysis.speech_tempo_analysis}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Structured Findings Column */}
                                <div className="lg:col-span-12 space-y-8 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                            <Target size={14} className="text-indigo-600" />
                                            Diagnostic Impressions
                                        </h3>
                                        <div className="space-y-3">
                                            {result.ai_analysis.diagnostic_impressions?.map((item, idx) => (
                                                <div key={idx} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 group hover:border-indigo-200 transition-colors">
                                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full shrink-0" />
                                                    <p className="text-[11px] font-black text-slate-700 leading-tight uppercase tracking-tight">{item}</p>
                                                </div>
                                            ))}
                                            {(!result.ai_analysis.diagnostic_impressions || result.ai_analysis.diagnostic_impressions.length === 0) && (
                                                <p className="text-[10px] font-bold text-slate-400 italic">No diagnostic impressions recorded.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Psychomotor Markers</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {result.ai_analysis.psychomotor_markers.map((marker, idx) => (
                                                <div key={idx} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-tight flex items-center gap-2">
                                                    <Activity size={12} />
                                                    {marker}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid lg:grid-cols-12 gap-10">
                        {/* Domain Coverage Summary */}
                        <div className="lg:col-span-12 space-y-6">
                            <div className="card-premium p-8 bg-emerald-50/50 border-emerald-100">
                                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={14} />
                                    Assessed Domains ({assessedSections.length})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {assessedSections.map(s => (
                                        <span key={s.section} className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm">
                                            {s.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="card-premium p-8 bg-slate-50 border-slate-200/50">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <AlertCircle size={14} />
                                    Clinical Gaps ({pendingSections.length})
                                </h3>
                                <div className="flex flex-wrap gap-2 opacity-60">
                                    {pendingSections.map(s => (
                                        <span key={s.section} className="px-3 py-1.5 bg-slate-200/50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-tight">
                                            {s.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Clinical Observations (Raw Data) */}
                        <div className="lg:col-span-12 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Detailed Findings</h2>
                            </div>
                            
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assessedSections.map(s => {
                                    const sectionData = (result as any)[s.section];
                                    if (!sectionData) return null;
                                    
                                    // Pre-filter section data to see if there's anything to show
                                    const hasData = Object.values(sectionData).some(v => {
                                        if (v === null || v === undefined || v === '' || v === false || v === 'None') return false;
                                        if (Array.isArray(v) && v.length === 0) return false;
                                        if (typeof v === 'object' && !Array.isArray(v)) {
                                            return Object.values(v).some(val => val === true || (typeof val === 'string' && val.length > 0 && val !== 'None'));
                                        }
                                        return true;
                                    });

                                    if (!hasData) return null;
                                    
                                    return (
                                        <div key={s.section} className="card-premium p-8 bg-white border-slate-100 group transition-all">
                                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                                                <div className={`p-2 rounded-lg ${getTheme(s.section).bgSoft} ${getTheme(s.section).textSoft}`}>
                                                    {getSectionIcon(s.section)}
                                                </div>
                                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{s.title}</h3>
                                            </div>
                                            <div className="space-y-1">
                                                {Object.entries(sectionData).map(([key, value]) => (
                                                    <FindingItem key={key} label={key} value={value} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentSection = sections[currentStep];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-fade-in pb-24">
            <header className="flex items-center gap-6">
                <button
                    onClick={() => navigate(`/patients/${userId}/health`)}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Brain className="text-indigo-600" size={32} />
                        Clinical Evaluation
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Mental Status Examination Framework (MSE)</p>
                </div>
            </header>

            <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-x px-2">
                {sections.map((s, idx) => {
                    const theme = getTheme(s.section);
                    const isActive = idx === currentStep;
                    const isDone = responses[s.section] && Object.keys(responses[s.section]).length > 0;
                    
                    return (
                        <button
                            key={s.section}
                            onClick={() => setCurrentStep(idx)}
                            className={`flex-shrink-0 snap-start px-8 py-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 min-w-[200px] relative ${
                                isActive 
                                ? `${theme.active} -translate-y-1` 
                                : isDone 
                                    ? `${theme.done}` 
                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                            }`}
                        >
                            <div className={`${isActive ? theme.iconActive : isDone ? theme.iconDone : 'text-slate-300'}`}>
                                {getSectionIcon(s.section)}
                            </div>
                            <span className="text-[10px] font-black whitespace-nowrap uppercase tracking-widest">{s.title}</span>
                            
                            {isDone && !isActive && (
                                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${theme.dot} shadow-sm`} />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="grid lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3 space-y-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSection.section}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="card-premium p-12 bg-white border-slate-100 relative overflow-hidden ring-1 ring-slate-100 shadow-xl shadow-slate-100/50"
                        >
                            {/* Decorative Icon Background */}
                            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] ${getTheme(currentSection.section).textSoft}`}>
                                {React.cloneElement(getSectionIcon(currentSection.section) as React.ReactElement<any>, { size: 120 })}
                            </div>

                            <div className="relative space-y-12">
                                {/* Section Header */}
                                <header className="space-y-4 pb-8 border-b border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${getTheme(currentSection.section).bgSoft} flex items-center justify-center ${getTheme(currentSection.section).textSoft}`}>
                                            {getSectionIcon(currentSection.section)}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentSection.title}</h2>
                                            <p className="text-slate-500 font-medium max-w-2xl leading-relaxed text-sm">{currentSection.description}</p>
                                        </div>
                                    </div>
                                </header>

                                {/* Questions List */}
                                <div className="space-y-12 py-4">
                                    {currentSection.questions.map(q => (
                                        <div key={q.key} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-6 ${getTheme(currentSection.section).dot} rounded-full`} />
                                                <label className="text-xs font-black text-slate-800 uppercase tracking-[0.1em]">{q.label}</label>
                                            </div>
                                            <div className="max-w-2xl">
                                                {renderQuestion(currentSection.section, q)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex items-center gap-4 pt-12 border-t border-slate-50">
                                    <Button
                                        variant="outline"
                                        disabled={currentStep === 0}
                                        onClick={() => setCurrentStep(prev => prev - 1)}
                                        leftIcon={<ChevronLeft size={18} />}
                                        className="h-14 px-10 rounded-2xl border-2 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Previous
                                    </Button>

                                    {currentStep < sections.length - 1 ? (
                                        <Button
                                            variant="primary"
                                            onClick={() => setCurrentStep(prev => prev + 1)}
                                            rightIcon={<ChevronRight size={18} />}
                                            className={`h-14 px-12 rounded-2xl ${getTheme(currentSection.section).active} font-black tracking-widest uppercase text-[10px] shadow-lg transition-transform active:scale-95 ml-auto`}
                                        >
                                            Next Section
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            className="h-14 px-14 rounded-2xl bg-slate-900 border-slate-900 hover:bg-black shadow-2xl shadow-slate-200 font-black tracking-widest uppercase text-[10px] ml-auto"
                                            onClick={() => handleSubmit()}
                                            isLoading={isSaving}
                                            leftIcon={<Save size={18} />}
                                        >
                                            Finalize Assessment
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="space-y-8">
                    <div className="card-premium p-10 bg-slate-900 border-none shadow-2xl relative overflow-hidden h-fit sticky top-12 ring-1 ring-white/5">
                        <div className="relative">
                            <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                                <div>
                                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Clinical Intake</h3>
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Evaluation Framework Progress</p>
                                </div>
                                <div className="text-slate-700">
                                    <ClipboardList size={20} strokeWidth={1.5} />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                {sections.map((s, idx) => {
                                    const isDone = responses[s.section] && Object.keys(responses[s.section]).length > 0;
                                    const isActive = idx === currentStep;
                                    const theme = getTheme(s.section);
                                    
                                    return (
                                        <div 
                                            key={s.section} 
                                            className={`relative flex items-center gap-4 py-3.5 px-4 rounded-2xl transition-all duration-300 cursor-pointer group ${
                                                isActive ? 'bg-white/10 ring-1 ring-white/10' : 'hover:bg-white/5'
                                            }`}
                                            onClick={() => setCurrentStep(idx)}
                                        >
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 scale-90 ${
                                                isActive 
                                                ? `${theme.dot} shadow-xl ${theme.shadow} scale-100` 
                                                : isDone 
                                                    ? 'bg-emerald-500/10 text-emerald-500' 
                                                    : 'bg-slate-800 text-slate-600'
                                            }`}>
                                                {isDone && !isActive ? <CheckCircle2 size={14} /> : React.cloneElement(getSectionIcon(s.section) as React.ReactElement<any>, { size: 14, strokeWidth: 2.5 })}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <span className={`text-[10px] font-black tracking-widest uppercase whitespace-nowrap transition-all ${
                                                    isActive ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400'
                                                }`}>
                                                    {s.title}
                                                </span>
                                            </div>

                                            {isActive && (
                                                <motion.div 
                                                    layoutId="active-indicator-mse"
                                                    className={`w-1 h-3 rounded-full ${theme.dot}`}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold shadow-2xl animate-shake">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}
        </div>
    );
};

export default MSEPage;
