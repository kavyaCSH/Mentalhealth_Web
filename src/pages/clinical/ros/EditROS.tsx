import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { 
    ChevronLeft, 
    ChevronRight, 
    Save, 
    AlertCircle, 
    Activity,
    CheckCircle2,
    Brain,
    Stethoscope,
    Loader2
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ROSService } from '../../../api/services/ros.service';
import type { ROSSection } from '../../../types/ros.types';

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

const EditROS = () => {
    const { patientId: userId, rosId } = useParams<{ patientId: string; rosId: string }>();
    const navigate = useNavigate();
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

    useEffect(() => {
        const fetchExistingData = async () => {
            if (!rosId) return;
            try {
                setIsLoading(true);
                // 1. Fetch Questionnaire Template
                const questionsRes = await ROSService.getQuestions();
                const qData = questionsRes.data || questionsRes;
                if (Array.isArray(qData)) {
                    setSections(qData);
                }

                // 2. Fetch Existing Data
                const rosRes = await ROSService.getROSById(rosId, userId);
                const exData = rosRes.data || rosRes;
                
                // 3. Hydrate state
                const populatedResponses: Record<string, any> = {};
                const sectionNames = ['psychiatric', 'medical', 'neurological', 'cardiovascular', 'respiratory', 'gastrointestinal', 'musculoskeletal', 'endocrine'];
                
                sectionNames.forEach(secName => {
                    if ((exData as any)[secName]) {
                        populatedResponses[secName] = (exData as any)[secName];
                    }
                });
                
                setResponses(populatedResponses);
                
            } catch (err) {
                console.error('Failed to load ROS details:', err);
                setError('Could not load the existing review data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchExistingData();
    }, [rosId]);

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

    const handleSubmit = async () => {
        if (!userId || !rosId) return;
        setIsSaving(true);
        setError(null);
        
        try {
            const submissionData: any = {};
            
            sections.forEach(s => {
                const sectionKey = s.section;
                const sectionData = responses[sectionKey] || {};
                
                // Include empty sections too to allow clearing out data if needed
                submissionData[sectionKey] = sectionData;
            });

            await ROSService.updateROS(rosId, submissionData);
            
            alert('Review of Systems updated successfully!');
            navigateBack();
        } catch (err: any) {
            console.error('Failed to update ROS:', err);
            setError(err.response?.data?.message || err.message || 'Failed to update clinical review.');
        } finally {
            setIsSaving(false);
        }
    };

    const navigateBack = () => {
        if (isPatient) {
            navigate('/records');
        } else {
            navigate(`/patients/${userId}/ros`);
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
                <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Hydrating Review Data...</p>
            </div>
        );
    }

    if (!sections.length) return null;

    const currentSection = sections[currentStep];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-fade-in pb-24">
            <header className="flex items-center gap-6">
                <button
                    onClick={navigateBack}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Stethoscope className="text-indigo-600" size={32} />
                        Update Review of Systems
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Modify Systemic Symptom Review</p>
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
                                            Save Changes
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
                                    <Stethoscope size={20} strokeWidth={1.5} />
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
                                                    layoutId="active-indicator-edit-ros"
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

export default EditROS;
