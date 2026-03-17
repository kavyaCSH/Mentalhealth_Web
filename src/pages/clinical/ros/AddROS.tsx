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
    ClipboardList,
    Sparkles,
    Zap,
    FileText,
    Stethoscope
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ROSService } from '../../../api/services/ros.service';
import { UserService } from '../../../api/services/user.service';
import type { ROSSection, ROSResponse } from '../../../types/ros.types';


const AddROS = () => {
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = (currentUser as any)?.role === 'patient' || 
                      (currentUser as any)?.role === 'PATIENT' || 
                      (currentUser as any)?.group === 'PATIENT' ||
                      (currentUser as any)?.group === 'patient';
    
    const [sections, setSections] = useState<ROSSection[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ROSResponse | null>(null);

    useEffect(() => {
        const fetchQuestionnaire = async () => {
            try {
                setIsLoading(true);
                const res = await ROSService.getQuestions();
                const data = res.data || res;
                if (Array.isArray(data)) {
                    setSections(data);
                }
            } catch (err) {
                console.error('Failed to fetch ROS questionnaire:', err);
                setError('Failed to load Review of Systems components.');
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
        indigo: {
            active: 'bg-indigo-600 border-indigo-600 text-white',
            done: 'bg-indigo-50 border-indigo-100 text-indigo-700',
            iconActive: 'text-white',
            iconDone: 'text-indigo-600',
            dot: 'bg-indigo-500',
            bgSoft: 'bg-indigo-50',
            textSoft: 'text-indigo-600',
            borderSoft: 'border-indigo-100',
            borderFocus: 'focus:border-indigo-500',
            hoverBorder: 'hover:border-indigo-200',
            shadow: 'ring-indigo-400/20'
        },
        rose: {
            active: 'bg-rose-600 border-rose-600 text-white',
            done: 'bg-rose-50 border-rose-100 text-rose-700',
            iconActive: 'text-white',
            iconDone: 'text-rose-600',
            dot: 'bg-rose-500',
            bgSoft: 'bg-rose-50',
            textSoft: 'text-rose-600',
            borderSoft: 'border-rose-100',
            borderFocus: 'focus:border-rose-500',
            hoverBorder: 'hover:border-rose-200',
            shadow: 'ring-rose-400/20'
        }
    };

    const getTheme = (section: string) => {
        switch (section?.toLowerCase()) {
            case 'psychiatric': return THEMES.indigo;
            case 'medical': return THEMES.rose;
            default: return THEMES.indigo;
        }
    };

    const getSectionIcon = (section: string) => {
        switch (section?.toLowerCase()) {
            case 'psychiatric': return <Brain size={18} />;
            case 'medical': return <Activity size={18} />;
            default: return <Stethoscope size={18} />;
        }
    };

    const handleSubmit = async () => {
        if (!userId) return;
        setIsSaving(true);
        setError(null);
        
        try {
            // 1. Resolve hex ID from user profile
            let hexId = userId;
            
            // Optimization: Bypass unauthorized lookup if patient is submitting for self
            if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                hexId = currentUser?._id || currentUser?.id || hexId;
                console.log(`[AddROS] Using session identity for submission: ${hexId}`);
            } else {
                try {
                    const userProfile = await UserService.getUserById(userId!);
                    if (userProfile) {
                        hexId = userProfile._id || userProfile.id || hexId;
                        console.log(`[AddROS] Resolved Hex ID for submission: ${hexId}`);
                    }
                } catch (profileError) {
                    console.warn('[AddROS] Profile lookup failed, using parameter ID:', profileError);
                }
            }

            // Group by section for submission
            const submissionData: any = {
                patient_id: hexId,
                consult_id: null, // Can be integrated later
            };

            sections.forEach(s => {
                const sectionKey = s.section;
                const sectionData = responses[sectionKey] || {};
                
                // Only include sections that have some data
                if (Object.keys(sectionData).length > 0) {
                    submissionData[sectionKey] = sectionData;
                }
            });

            if (Object.keys(submissionData).length <= 2) { // Just patient_id and consult_id
                throw new Error('Please enter clinical data before finalizing the review.');
            }

            const res = await ROSService.createROS(submissionData);
            const responseData = (res as any).data || res;
            setResult(responseData as ROSResponse);
        } catch (err: any) {
            console.error('Failed to save ROS:', err);
            setError(err.response?.data?.message || err.message || 'Failed to save clinical review.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderQuestion = (section: string, question: any) => {
        const value = responses[section]?.[question.key];
        const theme = getTheme(section);

        switch (question.type) {
            case 'select':
                return (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {question.options?.map((option: string) => (
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
                        {question.options?.map((option: string) => {
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
                                    {v ? 'Yes / Present' : 'No / Denied'}
                                </button>
                            ))}
                        </div>
                        {value === true && question.follow_up && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className={`pl-6 border-l-4 ${theme.borderSoft} space-y-6 mt-4`}
                            >
                                {question.follow_up.map((fu: any) => (
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
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Hydrating Review Framework...</p>
            </div>
        );
    }

    if (!sections.length) return null;

    if (result) {
        return (
            <div className="p-8 max-w-6xl animate-fade-in pb-24 space-y-12">
                <header className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-indigo-100">
                                Review Complete
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">
                                ID: {userId?.slice(-8).toUpperCase()} • {new Date().toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Stethoscope className="text-indigo-600" size={32} />
                            Review of Systems
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="outline"
                            onClick={() => setResult(null)}
                            leftIcon={<ChevronLeft size={18} />}
                            className="rounded-2xl h-12 px-6 font-black uppercase text-xs tracking-widest border-2"
                        >
                            Refine Review
                        </Button>
                        <Button 
                            variant="primary"
                            onClick={() => navigate(`/patients/${userId}/ros`)}
                            className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest bg-slate-900 border-none shadow-xl shadow-slate-200"
                        >
                            Return to Profile
                        </Button>
                    </div>
                </header>

                <div className="grid gap-10">
                    <section className="card-premium p-12 bg-white border-slate-100 relative overflow-hidden shadow-2xl shadow-indigo-50/50 ring-1 ring-slate-100">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
                            <Sparkles size={240} />
                        </div>
                        
                        <div className="relative space-y-12">
                            <header className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <Activity size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">AI Systemic Correlation</h2>
                                        <p className="text-xl font-black text-slate-900 tracking-tight">Systemic Findings & Organic R/O</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-tight border border-rose-100 italic">
                                        Substance Induced: {result.substance_induced_probability}
                                    </span>
                                </div>
                            </header>

                            <div className="grid lg:grid-cols-12 gap-12">
                                <div className="lg:col-span-12 space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={14} />
                                            Clinical Review Notes
                                        </h3>
                                        <p className="text-xl font-black text-slate-800 leading-relaxed tracking-tight">
                                            "{result.ai_notes}"
                                        </p>
                                    </div>

                                    {result.extra_notes && (
                                        <div className="space-y-4 pt-8 border-t border-slate-50">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <ClipboardList size={14} />
                                                Provider Clinical Observations
                                            </h3>
                                            <p className="text-sm font-bold text-slate-600 leading-relaxed">
                                                {result.extra_notes}
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                                <AlertCircle size={14} />
                                                Organic Red Flags
                                            </h3>
                                            <div className="space-y-2">
                                                {result.organic_red_flags?.map((item, idx) => (
                                                    <p key={idx} className="text-xs font-bold text-slate-700 uppercase tracking-tight">• {item}</p>
                                                ))}
                                                {(!result.organic_red_flags || result.organic_red_flags.length === 0) && (
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">No systemic red flags detected.</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                                <Zap size={14} />
                                                Medication Risk
                                            </h3>
                                            <div className="space-y-2">
                                                {result.medication_induced_risk?.map((item, idx) => (
                                                    <p key={idx} className="text-xs font-bold text-slate-700 uppercase tracking-tight">• {item}</p>
                                                ))}
                                                {(!result.medication_induced_risk || result.medication_induced_risk.length === 0) && (
                                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Low medication-induced risk.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-12 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Detailed Systemic Findings</h2>
                            </div>
                            
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sections.map(s => {
                                    const sectionData = (result as any)[s.section];
                                    if (!sectionData) return null;
                                    
                                    const findings = Object.entries(sectionData)
                                        .filter(([_, value]) => {
                                            if (value === null || value === undefined || value === '') return false;
                                            if (Array.isArray(value) && value.length === 0) return false;
                                            return true;
                                        });

                                    if (findings.length === 0) return null;

                                    return (
                                        <div key={s.section} className="card-premium p-8 bg-white border-slate-100 group transition-all">
                                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                                                <div className={`p-2 rounded-lg ${getTheme(s.section).bgSoft} ${getTheme(s.section).textSoft}`}>
                                                    {getSectionIcon(s.section)}
                                                </div>
                                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{s.title}</h3>
                                            </div>
                                            <div className="space-y-1">
                                                {findings.map(([key, value]) => {
                                                    const label = key.replace(/_/g, ' ');
                                                    let displayValue = '';
                                                    
                                                    if (typeof value === 'boolean') {
                                                        displayValue = value ? 'YES / PRESENT' : 'NO / DENIED';
                                                    } else if (Array.isArray(value)) {
                                                        displayValue = value.join(', ');
                                                    } else {
                                                        displayValue = String(value);
                                                    }

                                                    const isPositive = value === true || (typeof value === 'string' && value.length > 0 && value !== 'None' && !key.includes('duration'));

                                                    return (
                                                        <div key={key} className="flex justify-between items-start py-3 border-b border-slate-50 last:border-none">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                                                            <span className={`text-xs font-bold uppercase tracking-tight text-right max-w-[60%] ${isPositive ? 'text-indigo-600' : 'text-slate-700'}`}>{displayValue}</span>
                                                        </div>
                                                    );
                                                })}
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
                    onClick={() => navigate(`/patients/${userId}/ros`)}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Stethoscope className="text-indigo-600" size={32} />
                        Review of Systems
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Systemic Symptom Review & Organic Rule-Out</p>
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
                                            Finalize Review
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
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Review Framework Progress</p>
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
                                                    layoutId="active-indicator-ros"
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
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold shadow-2xl animate-shake z-50">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}
        </div>
    );
};

export default AddROS;
