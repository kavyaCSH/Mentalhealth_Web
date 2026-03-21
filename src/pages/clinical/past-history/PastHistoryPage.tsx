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
    ClipboardList,
    Sparkles,
    Zap,
    Users,
    History,
    Shield,
    FileText
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { PastHistoryService } from '../../../api/services/pastHistory.service';
import { UserService } from '../../../api/services/user.service';
import type { PastHistorySection, PastHistoryResponse } from '../../../types/pastHistory.types';

const FindingItem = ({ label, value }: { label: string; value: any }) => {
    if (value === null || value === undefined || value === '') return null;
    
    if (value === false) return null;
    if (value === 'None') return null;
    if (Array.isArray(value) && value.length === 0) return null;
    
    let displayValue = '';
    if (typeof value === 'boolean') {
        displayValue = value ? 'Confirmed / Present' : 'Denied / Absent';
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

    if (!displayValue || displayValue === 'No specific markers' || displayValue === 'Neutral') return null;

    return (
        <div className="flex justify-between items-start py-3 border-b border-slate-50 last:border-none group">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label.replace(/_/g, ' ')}</span>
            <span className="text-xs font-bold text-slate-700 text-right max-w-[60%] group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{displayValue}</span>
        </div>
    );
};

const PastHistoryPage = () => {
    const { patientId: userId, historyId } = useParams<{ patientId: string; historyId?: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = (currentUser as any)?.role === 'patient' || 
                      (currentUser as any)?.role === 'PATIENT' || 
                      (currentUser as any)?.group === 'PATIENT' ||
                      (currentUser as any)?.group === 'patient';
    
    const [sections, setSections] = useState<PastHistorySection[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PastHistoryResponse | null>(null);
    const [patient, setPatient] = useState<any>(null);

    useEffect(() => {
        const fetchQuestionnaire = async () => {
            try {
                const res = await PastHistoryService.getQuestions();
                const data = res.data || res;
                if (Array.isArray(data)) {
                    setSections(data);
                }
            } catch (err) {
                console.error('Failed to fetch Past History questionnaire:', err);
                setError('Failed to load questionnaire components.');
            }
        };

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (!userId || userId === 'undefined') {
                    if (!historyId) {
                        setIsLoading(false);
                        return;
                    }
                }

                // 1. Resolve Identity
                let hexId = userId;
                if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                    hexId = currentUser?._id || currentUser?.id || hexId;
                    if (currentUser) setPatient(currentUser);
                } else if (userId && userId !== 'undefined') {
                    try {
                        const userProfile = await UserService.getUserById(userId);
                        if (userProfile) {
                            hexId = userProfile._id || userProfile.id || hexId;
                            setPatient(userProfile);
                        }
                    } catch (e) {
                        console.warn('[PastHistory] Profile fetch failed:', e);
                    }
                }

                // 2. Fetch Questionnaire
                await fetchQuestionnaire();

                // 3. Fetch Existing Record if ID provided
                if (historyId) {
                    const res = await PastHistoryService.getPastHistoryById(historyId!);
                    const data = res.data || res;
                    setResult(data as PastHistoryResponse);
                }
            } catch (err: any) {
                console.error('[PastHistory] Fetch failed:', err);
                if (isPatient && err.response?.status === 403) {
                    setError('You do not have permission to view this clinical record.');
                } else {
                    setError('Could not load clinical history components. Please check connectivity.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId, historyId, isPatient, currentUser]);

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
        },
        amber: {
            active: 'bg-amber-600 border-amber-600 text-white',
            done: 'bg-amber-50 border-amber-100 text-amber-700',
            iconActive: 'text-white',
            iconDone: 'text-amber-600',
            dot: 'bg-amber-500',
            bgSoft: 'bg-amber-50',
            textSoft: 'text-amber-600',
            borderSoft: 'border-amber-100',
            borderFocus: 'focus:border-amber-500',
            hoverBorder: 'hover:border-amber-200',
            shadow: 'ring-amber-400/20'
        },
        emerald: {
            active: 'bg-emerald-600 border-emerald-600 text-white',
            done: 'bg-emerald-50 border-emerald-100 text-emerald-700',
            iconActive: 'text-white',
            iconDone: 'text-emerald-600',
            dot: 'bg-emerald-500',
            bgSoft: 'bg-emerald-50',
            textSoft: 'text-emerald-600',
            borderSoft: 'border-emerald-100',
            borderFocus: 'focus:border-emerald-500',
            hoverBorder: 'hover:border-emerald-200',
            shadow: 'ring-emerald-400/20'
        }
    };

    const getSectionColor = (section: string) => {
        switch (section?.toLowerCase()) {
            case 'psychiatric_history': return 'indigo';
            case 'medical_history': return 'rose';
            case 'substance_use': return 'amber';
            case 'family_history': return 'emerald';
            default: return 'indigo';
        }
    };

    const getTheme = (section: string) => {
        const color = getSectionColor(section);
        return THEMES[color] || THEMES.indigo;
    };

    const getSectionIcon = (section: string) => {
        switch (section?.toLowerCase()) {
            case 'psychiatric_history': return <Brain size={18} />;
            case 'medical_history': return <Activity size={18} />;
            case 'substance_use': return <Zap size={18} />;
            case 'family_history': return <Users size={18} />;
            default: return <ClipboardList size={18} />; // Changed from History to ClipboardList as History was removed
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        setError(null);
        
        try {
            // Resolve Hex ID
            let hexId = userId || currentUser?._id || currentUser?.id;
            
            if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                hexId = currentUser?._id || currentUser?.id || hexId;
                console.log(`[PastHistory] Using session identity for submission: ${hexId}`);
            } else if (userId && userId !== 'undefined') {
                try {
                    const userProfile = await UserService.getUserById(userId);
                    if (userProfile) {
                        hexId = userProfile._id || userProfile.id || hexId;
                        console.log(`[PastHistory] Resolved Hex ID for submission: ${hexId}`);
                    }
                } catch (profileError) {
                    console.warn('[PastHistory] Profile lookup failed, using parameter ID:', profileError);
                }
            }

            if (!hexId) throw new Error('Patient identity could not be verified.');

            const flattenedResponses: { questionCode: string; value: any }[] = [];
            
            Object.values(responses).forEach((sectionData) => {
                Object.entries(sectionData).forEach(([questionKey, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        if (Array.isArray(value) && value.length === 0) return;
                        flattenedResponses.push({ questionCode: questionKey, value });
                    }
                });
            });

            if (flattenedResponses.length === 0) {
                throw new Error('Please enter clinical history data before submitting.');
            }

            const res = await PastHistoryService.createPastHistory({
                patient_id: hexId!,
                responses: flattenedResponses
            });
            
            const responseData = (res as any).data || res;
            setResult(responseData as PastHistoryResponse);
        } catch (err: any) {
            console.error('Failed to save Past History:', err);
            setError(err.response?.data?.message || err.message || 'Failed to save clinical history.');
        } finally {
            setIsSaving(false);
        }
    };


    const navigateBack = () => {
        if (currentUser?.role === 'patient' || (currentUser as any)?.group === 'PATIENT') {
            navigate('/records');
        } else {
            navigate(`/patients/${userId}/health`);
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
                                        ? (v ? theme.active : 'bg-slate-800 border-slate-800 text-white')
                                        : 'bg-slate-50 border-transparent text-slate-400'
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
                            className={`w-full min-h-[100px] p-6 bg-slate-50 border-2 border-transparent rounded-3xl text-sm font-medium ${theme.borderFocus} focus:bg-white outline-none transition-all resize-none font-bold`}
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

            case 'date':
                return (
                    <div className="mt-4 flex items-center gap-6">
                        <input
                            type="date"
                            value={value || ''}
                            onChange={(e) => handleValueChange(section, question.key, e.target.value)}
                            className={`p-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-black ${theme.borderFocus} focus:bg-white outline-none transition-all shadow-sm text-slate-700`}
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
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Compiling Historical Framework...</p>
            </div>
        );
    }

    if (!sections.length) {
        return (
            <div className="p-8 max-w-6xl space-y-10">
                <header className="flex items-center gap-6">
                    <button
                        onClick={navigateBack}
                        className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 transition-all hover:shadow-md active:scale-95"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <History className="text-indigo-600" size={32} />
                            Past Clinical History
                        </h1>
                    </div>
                </header>
                <div className="card-premium p-20 text-center border-dashed border-slate-200 bg-slate-50/50">
                    <Activity size={48} className="mx-auto text-slate-300 mb-6 opacity-50" />
                    <h3 className="text-xl font-black text-slate-900 mb-2">Framework Discovery Failed</h3>
                    <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto italic">
                        {error || 'The clinical history questionnaire framework could not be initialized at this time.'}
                    </p>
                </div>
            </div>
        );
    }

    if (result) {
        const isValueMeaningful = (v: any): boolean => {
            if (v === null || v === undefined || v === '' || v === false || v === 'None') return false;
            if (Array.isArray(v) && v.length === 0) return false;
            return true;
        };

        const assessedSections = sections.filter(s => {
            const sectionData = (result as any)[s.section];
            if (!sectionData) return false;
            return Object.values(sectionData).some(v => isValueMeaningful(v));
        });

        return (
            <div className="p-8 max-w-6xl animate-fade-in pb-24 space-y-12">
                <header className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-indigo-100">
                                History Analysis Complete
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">
                                ID: {userId?.slice(-8).toUpperCase()} • {new Date().toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <History className="text-indigo-600" size={32} />
                            Past Clinical History
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Identity:</span>
                            <span className="text-xs font-bold text-indigo-600">
                                {patient ? `${patient.firstName} ${patient.lastName || ''}` : `Patient #${userId}`}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">

                        <Button 
                            variant="primary"
                            onClick={navigateBack}
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
                                        <History size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">AI Clinical History Extraction</h2>
                                        <p className="text-xl font-black text-slate-900 tracking-tight">Risk Profile & Historical Summary</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-tight border border-rose-100 italic">
                                        Treatment Resistance: {result.treatment_resistance_risk}
                                    </span>
                                </div>
                            </header>

                            <div className="grid lg:grid-cols-12 gap-12">
                                <div className="lg:col-span-7 space-y-10">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={14} />
                                            Clinical History Notes
                                        </h3>
                                        <p className="text-xl font-black text-slate-800 leading-relaxed tracking-tight">
                                            "{result.ai_notes}"
                                        </p>
                                    </div>

                                    <div className="space-y-4 pt-8 border-t border-slate-50">
                                        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                            <Shield size={14} />
                                            Genetic Risk Summary
                                        </h3>
                                        <p className="text-sm font-bold text-slate-600 leading-relaxed">
                                            {result.genetic_risk_summary}
                                        </p>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 space-y-8 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                    <div className="space-y-6">
                                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                            <AlertCircle size={14} className="text-rose-600" />
                                            Clinical Risk Flags
                                        </h3>
                                        <div className="space-y-3">
                                            {result.risk_flags?.map((item, idx) => (
                                                <div key={idx} className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm flex items-start gap-4 group">
                                                    <div className="w-1.5 h-6 bg-rose-500 rounded-full shrink-0" />
                                                    <p className="text-[11px] font-black text-slate-700 leading-tight uppercase tracking-tight">{(item as any)}</p>
                                                </div>
                                            ))}
                                            {(!result.risk_flags || result.risk_flags.length === 0) && (
                                                <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 uppercase tracking-widest text-center">No immediate risk markers detected.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="grid lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="card-premium p-8 bg-emerald-50/50 border-emerald-100">
                                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={14} />
                                    Captured History ({assessedSections.length})
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {assessedSections.map(s => (
                                        <span key={s.section} className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-sm">
                                            {s.title}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8 space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] font-bold">Historical Documentation</h2>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                {assessedSections.map(s => {
                                    const sectionData = (result as any)[s.section];
                                    if (!sectionData) return null;
                                    
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
        <div className="p-8 max-w-6xl space-y-10 animate-fade-in pb-24">
            <header className="flex items-center gap-6">
                <button
                    onClick={navigateBack}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <History className="text-indigo-600" size={32} />
                        Past Clinical History
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Identity:</span>
                        <span className="text-xs font-bold text-indigo-600">
                            {patient ? `${patient.firstName} ${patient.lastName || ''}` : `Patient #${userId}`}
                        </span>
                    </div>
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
                            className="card-premium p-12 bg-white border-slate-100 relative overflow-hidden ring-1 ring-slate-100"
                        >
                            <div className={`absolute top-0 right-0 p-8 opacity-[0.03] ${getTheme(currentSection.section).textSoft}`}>
                                {getSectionIcon(currentSection.section)}
                            </div>

                            <div className="relative space-y-12">
                                <header className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl ${getTheme(currentSection.section).bgSoft} flex items-center justify-center ${getTheme(currentSection.section).textSoft}`}>
                                            {getSectionIcon(currentSection.section)}
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-900 tracking-tight font-bold">{currentSection.title}</h2>
                                            <p className="text-slate-500 font-medium max-w-2xl leading-relaxed text-sm">{currentSection.description}</p>
                                        </div>
                                    </div>
                                </header>

                                <div className="space-y-12">
                                    {currentSection.questions.map(q => (
                                        <div key={q.key} className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-6 ${getTheme(currentSection.section).dot} rounded-full`} />
                                                <label className="text-xs font-black text-slate-800 uppercase tracking-[0.1em]">{q.label}</label>
                                            </div>
                                            {renderQuestion(currentSection.section, q)}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-4 pt-12 border-t border-slate-100">
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
                                            Finalize Clinical History
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
                                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">History Framework Progress</p>
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
                                                    layoutId="active-indicator-ph"
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

export default PastHistoryPage;
