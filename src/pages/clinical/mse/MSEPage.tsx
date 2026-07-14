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
    Sparkles,
    Zap,
    Target,
    User,
    Mic,
    MicOff,
    Bot,
    Eye,
    Shield,
    Database,
    Smile,
    Heart,
    Workflow,
    FileText,
    Layers,
    Cpu,
    ArrowRight
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { MSEService } from '../../../api/services/mse.service';
import { UserService } from '../../../api/services/user.service';
import { MSE_FALLBACK_QUESTIONNAIRE } from '../../../constants/mse.constants';
import type { MSESection, MSEQuestion, MSEResponse } from '../../../types/mse.types';

const FindingItem: React.FC<{ label: string; value: any }> = ({ label, value }) => {
    if (value === null || value === undefined || value === '') return null;

    if (value === false) return null;
    if (value === 'None') return null;
    if (Array.isArray(value) && value.length === 0) return null;

    let displayValue = '';
    if (typeof value === 'boolean') {
        displayValue = value ? 'Clinical Finding Present' : 'Absent';
    } else if (Array.isArray(value)) {
        displayValue = value.join(', ');
    } else if (typeof value === 'object') {
        const activeEntries = Object.entries(value)
            .filter(([_, v]) => v === true || (typeof v === 'string' && v.length > 0 && v !== 'None'));
        if (activeEntries.length === 0) return null;
        displayValue = activeEntries
            .map(([k, _]) => k.replace(/_/g, ' '))
            .join(', ');
    } else {
        displayValue = String(value);
    }

    if (!displayValue || displayValue === 'No specific markers') return null;

    return (
        <div className="flex flex-col gap-1 py-3 border-b border-border-card last:border-none group">
            <span className="text-[10px] font-bold text-muted opacity-80 tracking-tight">{label.replace(/_/g, ' ')}</span>
            <span className="text-[13px] font-bold text-main leading-tight group-hover:text-indigo-600 transition-colors tracking-tight">{displayValue}</span>
        </div>
    );
};

const MSEPage = () => {
    const { patientId: userId, mseId } = useParams<{ patientId: string; mseId?: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);

    const [sections, setSections] = useState<MSESection[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<MSEResponse | null>(null);
    const [patient, setPatient] = useState<any>(null);

    const [useAssistant, setUseAssistant] = useState(false);
    const [narrative, setNarrative] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = React.useRef<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setNarrative(prev => prev + ' ' + event.results[i][0].transcript);
                    }
                }
            };
            recognitionRef.current.onend = () => setIsRecording(false);
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) return alert('Voice recognition not supported in this browser.');
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    useEffect(() => {
        const fetchQuestionnaire = async (age?: number, gender?: string) => {
            try {
                setIsLoading(true);
                const res = await MSEService.getQuestions({
                    age,
                    gender,
                    view: currentUser?.role === 'patient' || (currentUser as any)?.group === 'PATIENT' ? 'patient' : 'professional'
                });
                const data = res.data || res;
                if (Array.isArray(data) && data.length > 0) {
                    setSections(data);
                } else {
                    setSections(MSE_FALLBACK_QUESTIONNAIRE);
                }
            } catch (err) {
                setSections(MSE_FALLBACK_QUESTIONNAIRE);
            }
        };

        const fetchData = async () => {
            setIsLoading(true);
            setResult(null);
            setError(null);
            try {
                if (!userId || userId === 'undefined') {
                    setIsLoading(false);
                    return;
                }
                let resolvedAge: number | undefined;
                let resolvedGender: string | undefined;
                try {
                    const userProfile = await UserService.getUserById(userId);
                    if (userProfile) {
                        setPatient(userProfile);
                        resolvedAge = (userProfile as any).age;
                        resolvedGender = (userProfile as any).gender;
                    }
                } catch (e) {}

                await fetchQuestionnaire(resolvedAge, resolvedGender);

                if (mseId && mseId !== 'new') {
                    const res = await MSEService.getMSEById(mseId);
                    const data = res.data || res;
                    setResult(data as MSEResponse);
                }
            } catch (err: any) {
                setError('Could not load clinical evaluation components.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId, mseId]);

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
            bgSoft: 'bg-indigo-50',
            textSoft: 'text-indigo-600',
            dot: 'bg-indigo-500',
            borderFocus: 'focus:border-indigo-500',
            hoverBorder: 'hover:border-indigo-200'
        }
    };

    const getTheme = (_: string) => THEMES.indigo;

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
            default: return <Layers size={18} />;
        }
    };

    const handleNarrativeExtract = async () => {
        if (!narrative.trim() || narrative.length < 20) {
            setError('Please provide a more detailed narrative for meaningful extraction.');
            return;
        }
        setIsExtracting(true);
        setError(null);
        try {
            const activeId = userId || currentUser?._id || currentUser?._id || currentUser?.id;
            const res = await MSEService.extractFromNarrative(narrative, activeId!);
            const data = (res as any).data || res;
            const newResponses: Record<string, any> = {};
            sections.forEach(s => {
                const sectionData = (data as any)[s.section];
                if (sectionData) newResponses[s.section] = sectionData;
            });
            setResponses(newResponses);
            setUseAssistant(false);
            setCurrentStep(0);
        } catch (err) {
            setError('AI extraction failed. Please use manual entry.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSubmit = async () => {
        if (!userId) return;
        setIsSaving(true);
        setError(null);
        try {
            let hexId = userId;
            const isPatient = currentUser?.role === 'patient' || (currentUser as any)?.role === 'PATIENT';
            if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                hexId = currentUser?._id || currentUser?.id || hexId;
            } else {
                try {
                    const userProfile = await UserService.getUserById(userId);
                    if (userProfile) hexId = userProfile._id || userProfile.id || hexId;
                } catch (e) {}
            }
            const sectionKeys = [ 'appearance', 'behavior', 'speech', 'mood', 'affect', 'thought_form', 'thought_content', 'perception', 'insight', 'judgment', 'cognition' ];
            const payload: Record<string, any> = { patient_id: hexId };
            sectionKeys.forEach(key => { payload[key] = responses[key] || {}; });
            const res = await MSEService.createMSE(payload as any);
            setResult((res as any).data || res);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to save MSE.');
        } finally {
            setIsSaving(false);
        }
    };

    const navigateBack = () => {
        if (currentUser?.role === 'patient' || (currentUser as any)?.group === 'PATIENT') {
            navigate('/records');
        } else {
            // Using navigate(-1) to return exactly to the list/dashboard the clinician came from
            navigate(-1);
        }
    };

    const isAiAnalysisMeaningful = (text: any): boolean => {
        if (!text || typeof text !== 'string') return false;
        const lackOfAssessmentMarkers = ['not assessed', 'cannot be determined', 'no information', 'insufficient data'];
        return !lackOfAssessmentMarkers.some(marker => text.toLowerCase().includes(marker));
    };

    const isValueMeaningful = (v: any): boolean => {
        if (v === null || v === undefined || v === '' || v === false || v === 'None') return false;
        if (Array.isArray(v) && v.length === 0) return false;
        if (typeof v === 'object' && !Array.isArray(v)) {
            return Object.values(v).some(val => val === true || (typeof val === 'string' && val.length > 0 && val !== 'None'));
        }
        return true;
    };

    const renderQuestion = (section: string, question: MSEQuestion) => {
        const value = responses[section]?.[question.key];
        const theme = getTheme(section);

        switch (question.type) {
            case 'select':
                return (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {question.options?.map(option => (
                            <button
                                key={option}
                                onClick={() => handleValueChange(section, question.key, option)}
                                className={`p-5 rounded-3xl border text-left transition-all ${value === option
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200'
                                    : `bg-page border-transparent text-muted ${theme.hoverBorder}`
                                    }`}
                            >
                                <span className="text-[12px] font-bold tracking-tight leading-tight">{option}</span>
                            </button>
                        ))}
                    </div>
                );
            case 'multiselect':
                return (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {question.options?.map(option => {
                            const isSelected = Array.isArray(value) && value.includes(option);
                            return (
                                <button
                                    key={option}
                                    onClick={() => handleMultiselectToggle(section, question.key, option)}
                                    className={`p-5 rounded-3xl border text-left transition-all ${isSelected
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200'
                                        : `bg-page border-transparent text-muted ${theme.hoverBorder}`
                                        }`}
                                >
                                    <span className="text-[12px] font-bold tracking-tight leading-tight">{option}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            case 'boolean':
                return (
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4">
                            {[true, false].map(v => (
                                <button
                                    key={v ? 'y' : 'n'}
                                    onClick={() => handleValueChange(section, question.key, v)}
                                    className={`flex-1 p-5 rounded-3xl border transition-all font-bold tracking-tight text-[12px] ${value === v
                                        ? (v ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-800 border-slate-800 text-white shadow-xl shadow-slate-200')
                                        : 'bg-page border-transparent text-muted opacity-80 hover:bg-page'
                                        }`}
                                >
                                    {v ? 'Normal or Negative' : 'Non-atypical or Positive'}
                                </button>
                            ))}
                        </div>
                        {value === true && question.follow_up && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="pl-6 border-l-4 border-indigo-50 space-y-8 mt-4">
                                {question.follow_up.map(fu => (
                                    <div key={fu.key} className="space-y-4">
                                        <label className="text-[11px] font-bold text-muted opacity-80 tracking-tight leading-none">{fu.label}</label>
                                        {renderQuestion(section, fu)}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                );
            case 'text':
                return (
                    <textarea
                        value={value || ''}
                        onChange={(e) => handleValueChange(section, question.key, e.target.value)}
                        placeholder="Provide detailed clinical observations here..."
                        className="w-full min-h-[140px] p-8 bg-page border border-transparent rounded-[2.5rem] text-sm font-bold text-main outline-none transition-all resize-none shadow-inner focus:bg-card focus:border-indigo-600"
                    />
                );
            case 'number':
                return (
                    <div className="flex items-center gap-6">
                        <input
                            type="number"
                            value={value || ''}
                            min={question.min}
                            max={question.max}
                            onChange={(e) => handleValueChange(section, question.key, e.target.value)}
                            className="w-32 p-6 bg-page border border-transparent rounded-3xl text-lg font-black text-main outline-none transition-all text-center placeholder:text-muted opacity-40 focus:bg-card focus:border-indigo-600"
                        />
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-muted opacity-80 tracking-tight leading-tight">Scale limit</span>
                            <span className="text-sm font-black text-main">{question.max} Points Total</span>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-indigo-100" />
                <p className="text-[11px] font-bold text-muted opacity-80 tracking-tight animate-pulse">Synchronizing Workspace</p>
            </div>
        );
    }

    if (result) {
        const assessedSections = sections.filter(s => {
            const data = (result as any)[s.section];
            return data && Object.values(data).some(v => isValueMeaningful(v));
        });

        return (
            <div className="p-10 max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-32">
                <header className="flex items-end justify-between border-b-2 border-border-card pb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-100/20">
                                <Brain size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold tracking-tight shadow-lg shadow-indigo-200">Clinical Evaluation</span>
                                    <span className="text-[11px] font-medium text-muted opacity-80 tabular-nums tracking-tight leading-none">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <h1 className="text-4xl font-black text-main tracking-tighter leading-none">Evaluation Analysis</h1>
                            </div>
                        </div>
                    </div>
                    <Button variant="outline" onClick={navigateBack} className="h-14 px-10 rounded-2xl border border-border-card font-bold text-[11px] tracking-tight hover:bg-page">
                        Exit Record
                    </Button>
                </header>

                <div className="grid lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-12">
                        <section className="bg-card p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(79,70,229,0.08)] relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:scale-110 transition-transform duration-[3s] text-indigo-600"><Cpu size={240} /></div>
                           <div className="relative space-y-8">
                               <div className="flex items-center gap-4">
                                   <div className="w-1 h-8 bg-indigo-600 rounded-full" />
                                   <h3 className="text-[12px] font-bold text-indigo-600 tracking-tight transition-all">Integrated clinical formulation</h3>
                               </div>
                               <div className="pl-6 border-l-4 border-border-card py-1">
                                   <p className="text-2xl font-bold text-main leading-relaxed tracking-tight italic">
                                       "{result.ai_analysis?.clinical_formulation || 'Diagnostic reasoning pending formal auditor verification.'}"
                                   </p>
                               </div>
                           </div>
                        </section>
                    </div>

                    <div className="lg:col-span-8">
                        <section className="bg-card p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(79,70,229,0.08)] h-full">
                            <div className="space-y-12">
                                <header className="flex items-center gap-4">
                                    <h3 className="text-[12px] font-bold text-main tracking-tight flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Activity size={22} /></div>
                                        Clinical observations
                                    </h3>
                                </header>
                                
                                <div className="grid md:grid-cols-2 gap-10">
                                    {isAiAnalysisMeaningful(result.ai_analysis?.affect_recognition) && (
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                                <h4 className="text-[11px] font-bold text-muted opacity-80 tracking-tight">Affective baseline</h4>
                                            </div>
                                            <p className="text-sm font-bold text-main leading-relaxed tracking-tight italic">"{result.ai_analysis?.affect_recognition}"</p>
                                        </div>
                                    )}
                                    {isAiAnalysisMeaningful(result.ai_analysis?.speech_tempo_analysis) && (
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                                <h4 className="text-[11px] font-bold text-muted opacity-80 tracking-tight">Speech prosody dynamics</h4>
                                            </div>
                                            <p className="text-sm font-bold text-main leading-relaxed tracking-tight italic">"{result.ai_analysis?.speech_tempo_analysis}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6 pt-10 border-t border-border-card">
                                    <h5 className="text-[11px] font-bold text-muted opacity-80 tracking-tight">Psychomotor audit trace</h5>
                                    <div className="flex flex-wrap gap-3">
                                        {result.ai_analysis?.psychomotor_markers?.map((marker, idx) => (
                                            <div key={idx} className="px-5 py-3 bg-page text-indigo-800 rounded-2xl text-[11px] font-bold tracking-tight flex items-center gap-3 transition-colors hover:bg-page">
                                                <Activity size={14} className="text-indigo-400" />
                                                {marker}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="space-y-8">
                            <h3 className="text-[12px] font-bold text-main tracking-tight flex items-center gap-4 mb-2 p-1">
                                <Target size={20} className="text-indigo-600" />
                                Clinical impressions
                            </h3>
                            <div className="grid gap-4">
                                {result.ai_analysis?.diagnostic_impressions?.map((item, idx) => (
                                    <div key={idx} className="p-6 bg-card rounded-[2rem] shadow-[0_15px_40px_rgba(79,70,229,0.06)] flex items-center gap-6 transition-all hover:translate-x-2 relative group">
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-indigo-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-lg shadow-slate-100">{idx + 1}</div>
                                        <p className="text-[13px] font-bold text-main leading-tight tracking-tight">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-12 pt-20">
                        <header className="flex items-center gap-6 mb-12">
                            <h2 className="text-[11px] font-bold text-main tracking-tight whitespace-nowrap">Clinical domain findings</h2>
                            <div className="h-[2px] bg-page flex-1" />
                        </header>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {assessedSections.map(s => {
                                const sectionData = (result as any)[s.section];
                                if (!sectionData) return null;
                                return (
                                    <div key={s.section} className="p-8 bg-card rounded-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.06)] transition-all group">
                                        <header className="flex items-center justify-between mb-8 pb-4 border-b border-border-card">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-page flex items-center justify-center text-muted opacity-80 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    {getSectionIcon(s.section)}
                                                </div>
                                                <h3 className="text-[11px] font-bold text-main tracking-tight">{s.title}</h3>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-100" />
                                        </header>
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
        );
    }

    const currentSection = sections[currentStep];

    return (
        <div className="p-10 max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-32">
            <header className="flex items-center justify-between border-b border-border-card pb-12">
                <div className="flex items-center gap-8">
                    <button onClick={navigateBack} className="w-14 h-14 bg-card hover:bg-page border border-border-card rounded-[1.5rem] flex items-center justify-center text-main transition-all hover:shadow-xl active:scale-95 group">
                        <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold tracking-tight shadow-lg shadow-slate-200">Evaluation Mode</span>
                            <span className="text-[10px] font-medium text-muted opacity-40 tracking-tight tabular-nums leading-none">Diagnostic Record Protocol</span>
                        </div>
                        <h1 className="text-4xl font-black text-main tracking-tighter leading-none">Clinical Intake</h1>
                    </div>
                </div>
                
                <button onClick={() => setUseAssistant(!useAssistant)} className={`px-10 py-5 rounded-3xl font-bold tracking-tight text-[12px] flex items-center gap-4 transition-all shadow-[0_20px_50px_rgba(79,70,229,0.12)] ${useAssistant ? 'bg-indigo-600 text-white' : 'bg-card text-indigo-600 hover:bg-page'}`}>
                    <Bot size={20} />
                    {useAssistant ? 'Manual entry' : 'Clinical AI'}
                </button>
            </header>

            <div className="grid lg:grid-cols-12 gap-16">
                <div className="lg:col-span-3">
                    <div className="sticky top-12 space-y-8">
                        <div className="bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl space-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 text-white"><Database size={120} /></div>
                            <header className="mb-8 px-2">
                                <h3 className="text-[11px] font-bold text-indigo-400 tracking-tight mb-2 leading-none">Evaluation protocol</h3>
                                <div className="h-[1px] bg-card/10 w-full" />
                            </header>
                            {sections.map((s, idx) => {
                                const isDone = responses[s.section] && Object.keys(responses[s.section]).length > 0;
                                const isActive = idx === currentStep;
                                return (
                                    <button key={s.section} onClick={() => setCurrentStep(idx)} className={`w-full group flex items-center gap-5 py-4.5 px-6 rounded-2xl transition-all ${isActive ? 'bg-card/10' : 'hover:bg-card/5'}`}>
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900 scale-110' : isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-card/5 text-main'}`}>
                                            {isDone && !isActive ? <CheckCircle2 size={16} /> : getSectionIcon(s.section)}
                                        </div>
                                        <span className={`text-[12px] font-bold tracking-tight transition-all ${isActive ? 'text-white' : isDone ? 'text-muted opacity-40' : 'text-muted group-hover:text-muted'}`}>{s.title}</span>
                                        {isActive && <div className="ml-auto w-1 h-3 bg-indigo-600 rounded-full" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-9">
                    {useAssistant ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card p-12 rounded-[3.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.08)] space-y-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-indigo-600"><Sparkles size={240} /></div>
                            <header className="flex items-center justify-between border-b border-border-card pb-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-100/30"><Sparkles size={32} /></div>
                                    <div>
                                        <h2 className="text-3xl font-black text-main tracking-tight leading-tight">Narrative workspace</h2>
                                        <p className="text-xs font-bold text-muted opacity-80 tracking-tight mt-1">Live Clinical Observations Engine</p>
                                    </div>
                                </div>
                                <button onClick={toggleRecording} className={`h-16 px-10 rounded-2xl flex items-center gap-4 font-bold tracking-tight text-[12px] transition-all ${isRecording ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 animate-pulse' : 'bg-page text-muted opacity-80 hover:bg-page'}`}>
                                    {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
                                    {isRecording ? 'Recording...' : 'Start dictation'}
                                </button>
                            </header>
                            <textarea value={narrative} onChange={(e) => setNarrative(e.target.value)} placeholder="Observe and describe the patient's state... Orientation, attention, cognitive markers, and affective baseline will be autonomously extracted." className="w-full min-h-[500px] p-12 bg-page border-none rounded-[3rem] text-xl font-bold text-main outline-none resize-none leading-relaxed focus:bg-card shadow-inner transition-all" />
                            <div className="flex justify-end pt-4">
                                <Button variant="primary" className="h-16 px-20 rounded-2xl font-bold tracking-tight text-[12px] bg-slate-900 border-none shadow-2xl shadow-indigo-100" onClick={handleNarrativeExtract} isLoading={isExtracting} rightIcon={<ArrowRight size={20} />}>Process observation</Button>
                            </div>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={currentSection.section} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-card p-16 rounded-[4rem] shadow-[0_20px_60px_rgba(79,70,229,0.08)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-main group-hover:scale-110 transition-transform duration-[4s]">{getSectionIcon(currentSection.section)}</div>
                                <header className="space-y-6 pb-12 border-b border-border-card mb-12">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100">{getSectionIcon(currentSection.section)}</div>
                                        <h2 className="text-4xl font-black text-main tracking-tighter leading-none">{currentSection.title}</h2>
                                    </div>
                                    <p className="text-sm font-bold text-muted opacity-80 tracking-tight max-w-2xl leading-relaxed">{currentSection.description}</p>
                                </header>
                                <div className="space-y-16">
                                    {currentSection.questions.map(q => (
                                        <div key={q.key} className="space-y-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-1.5 h-10 bg-indigo-600 rounded-full" />
                                                <label className="text-[12px] font-bold text-main tracking-tight">{q.label}</label>
                                            </div>
                                            <div className="max-w-3xl">{renderQuestion(currentSection.section, q)}</div>
                                        </div>
                                    ))}
                                </div>
                                <footer className="pt-16 mt-20 border-t border-border-card flex items-center justify-between">
                                    <Button variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep(prev => prev - 1)} leftIcon={<ChevronLeft size={22} />} className="h-16 px-12 rounded-[1.5rem] font-bold text-[11px] tracking-tight border-border-card">Go back</Button>
                                    {currentStep < sections.length - 1 ? (
                                        <Button variant="primary" onClick={() => setCurrentStep(prev => prev + 1)} rightIcon={<ChevronRight size={22} />} className="h-16 px-20 rounded-[1.5rem] bg-indigo-600 border-none font-bold text-[11px] tracking-tight shadow-2xl shadow-indigo-100/50">Save domain</Button>
                                    ) : (
                                        <Button variant="primary" onClick={() => handleSubmit()} isLoading={isSaving} leftIcon={<Save size={22} />} className="h-16 px-24 rounded-[1.5rem] bg-slate-900 border-none font-bold text-[11px] tracking-tight shadow-2xl shadow-indigo-100/50">Commit record</Button>
                                    )}
                                </footer>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {error && <div className="fixed bottom-12 right-12 bg-rose-600 text-white p-7 rounded-[2rem] flex items-center gap-6 text-[11px] font-bold tracking-tight shadow-2xl z-[300] ring-4 ring-rose-200/20"><AlertCircle size={28} />{error}</div>}
        </div>
    );
};

export default MSEPage;
