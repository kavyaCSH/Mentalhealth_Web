import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
    FileText,
    Mic,
    MicOff,
    Bot,
    Database,
    Smile,
    Heart,
    Workflow,
    AlertTriangle,
    Layers,
    Cpu,
    ArrowRight,
    Target
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { PastHistoryService } from '../../../api/services/pastHistory.service';
import { UserService } from '../../../api/services/user.service';
import type { PastHistorySection, PastHistoryResponse } from '../../../types/pastHistory.types';

const FindingItem = ({ label, value }: { label: string; value: any }) => {
    if (value === null || value === undefined || value === '') return null;

    if (value === false) return null;
    if (value === 'None') return null;
    if (Array.isArray(value)) {
        if (value.length === 0) return null;
        if (typeof value[0] === 'object') {
            return (
                <div className="flex flex-col py-5 border-b border-slate-50 last:border-none group">
                    <span className="text-[10px] font-bold text-slate-400 tracking-tight mb-4">{label.replace(/_/g, ' ')}</span>
                    <div className="space-y-4">
                        {value.map((item: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 p-5 rounded-2xl space-y-3 hover:bg-slate-100 transition-colors">
                                {Object.entries(item).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium tracking-tight">{k.replace(/_/g, ' ')}</span>
                                        <span className="font-bold text-slate-800">{String(v)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    }

    let displayValue = '';
    if (typeof value === 'boolean') {
        displayValue = value ? 'Confirmed' : 'Denied';
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
        <div className="flex justify-between items-start py-4 border-b border-slate-50 last:border-none group">
            <span className="text-[11px] font-bold text-slate-400 tracking-tight">{label.replace(/_/g, ' ')}</span>
            <span className="text-[13px] font-bold text-slate-700 text-right max-w-[60%] group-hover:text-indigo-600 transition-colors tracking-tight leading-tight">{displayValue}</span>
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
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const consultId = queryParams.get('consult_id');

    // AI Assistant State
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
        const fetchQuestionnaire = async () => {
            try {
                const res = await PastHistoryService.getQuestions();
                const data = res.data || res;
                if (Array.isArray(data) && data.length > 0) {
                    setSections(data);
                }
            } catch (err) {}
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

                let hexId = userId;
                if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                    hexId = currentUser?._id || currentUser?.id || hexId;
                } else if (userId && userId !== 'undefined') {
                    try {
                        const userProfile = await UserService.getUserById(userId);
                        if (userProfile) {
                            hexId = userProfile._id || userProfile.id || hexId;
                        }
                    } catch (e) {}
                }

                await fetchQuestionnaire();

                if (historyId) {
                    const res = await PastHistoryService.getPastHistoryById(historyId!);
                    const data = res.data || res;
                    setResult(data as PastHistoryResponse);
                }
            } catch (err: any) {
                setError('Could not load clinical history components.');
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

    const handleArrayAdd = (section: string, key: string, structure: any[]) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentArr = Array.isArray(currentSection[key]) ? [...currentSection[key]] : [];
            const newItem = structure.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});

            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [key]: [...currentArr, newItem]
                }
            };
        });
    };

    const handleArrayItemChange = (section: string, key: string, index: number, fieldKey: string, value: any) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentArr = Array.isArray(currentSection[key]) ? [...currentSection[key]] : [];
            const updatedItem = { ...currentArr[index], [fieldKey]: value };
            const newArr = [...currentArr];
            newArr[index] = updatedItem;

            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [key]: newArr
                }
            };
        });
    };

    const handleArrayRemove = (section: string, key: string, index: number) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentArr = Array.isArray(currentSection[key]) ? [...currentSection[key]] : [];
            const newArr = currentArr.filter((_, i) => i !== index);

            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [key]: newArr
                }
            };
        });
    };

    const handleBooleanGroupChange = (section: string, key: string, fieldKey: string, value: any) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentGroup = currentSection[key] || {};

            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [key]: {
                        ...currentGroup,
                        [fieldKey]: value
                    }
                }
            };
        });
    };

    const handleNarrativeExtract = async () => {
        if (!narrative.trim() || narrative.length < 20) {
            setError('Please provide a more detailed narrative for meaningful clinical extraction.');
            return;
        }

        setIsExtracting(true);
        setError(null);
        try {
            const activeId = userId || currentUser?._id || currentUser?.id;
            const res = await PastHistoryService.extractFromNarrative(narrative, activeId!);
            const data = (res as any).data || res;
            const newRes: Record<string, any> = { ...responses };

            if (data.psychiatric_history) {
                const diagnoses = Array.isArray(data.psychiatric_history.previous_diagnosis) ? data.psychiatric_history.previous_diagnosis : [];
                if (data.psychiatric_history.previous_episodes && String(data.psychiatric_history.previous_episodes).toLowerCase().includes('insomnia')) {
                    if (!diagnoses.includes('Insomnia')) diagnoses.push('Insomnia');
                }

                newRes['psychiatric_past'] = {
                    previous_diagnosis: diagnoses.join(', '),
                    hospitalizations: Array.isArray(data.psychiatric_history.hospitalizations) ? data.psychiatric_history.hospitalizations.map((h: any) => `${h.year || ''} ${h.reason || ''}`).join(' | ') : '',
                    suicide_attempts: Array.isArray(data.psychiatric_history.suicide_attempts) ? data.psychiatric_history.suicide_attempts.map((s: any) => `${s.year || ''} ${s.method || ''}`).join(' | ') : '',
                    psychotherapy_history: data.psychiatric_history.psychotherapy_history || ''
                };
            }

            if (data.medical_history) {
                newRes['medical_surgical'] = {
                    chronic_conditions: Array.isArray(data.medical_history.chronic_conditions) ? data.medical_history.chronic_conditions.join(', ') : '',
                    surgeries: Array.isArray(data.medical_history.surgeries) ? data.medical_history.surgeries.map((s: any) => `${s.year || ''} ${s.procedure || ''}`).join(', ') : '',
                    allergies: Array.isArray(data.medical_history.allergies) ? data.medical_history.allergies.join(', ') : '',
                    head_injury: data.medical_history.head_injury?.details || '',
                    seizures: data.medical_history.seizures?.frequency || ''
                };
            }

            if (data.family_history) {
                newRes['family_history'] = {
                    conditions: Array.isArray(data.family_history.conditions) ? data.family_history.conditions.map((c: any) => `${c.relative || ''}: ${c.condition || ''}`).join(', ') : '',
                    suicide_in_family: !!data.family_history.suicide_in_family,
                    substance_abuse_in_family: !!data.family_history.substance_abuse_in_family
                };
            }

            if (data.substance_use) {
                const sub = data.substance_use;
                newRes['substance_history'] = {
                    alcohol_status: sub.alcohol?.status || 'Never',
                    tobacco_status: sub.tobacco_nicotine?.status || 'Never',
                    illicit_drugs: Array.isArray(sub.illicit_drugs) ? sub.illicit_drugs.map((d: any) => `${d.drug || ''} (${d.status || ''})`).join(', ') : ''
                };
            }

            if (data.social_history) {
                newRes['social_history'] = {
                    living_situation: data.social_history.living_situation || '',
                    employment: data.social_history.employment || '',
                    legal_history: data.social_history.legal_history?.legal_details || ''
                };
            }

            if (data.trauma_history) {
                newRes['trauma_history'] = {
                    trauma_notes: data.trauma_history.trauma_notes || '',
                    significant_losses: data.trauma_history.significant_losses || ''
                };
            }

            if (data.developmental_history) {
                newRes['developmental_history'] = {
                    milestones: data.developmental_history.milestones || '',
                    childhood_behavior: data.developmental_history.childhood_behavior || ''
                };
            }

            newRes['final_synthesis'] = {
                narrative: narrative
            };

            setResponses(newRes);
            setUseAssistant(false);
            setCurrentStep(0);
        } catch (err) {
            setError('AI extraction failed. Please enter data manually.');
        } finally {
            setIsExtracting(false);
        }
    };

    const THEMES: Record<string, any> = {
        indigo: { active: 'bg-indigo-600 border-indigo-600 text-white', done: 'bg-indigo-50 border-indigo-100 text-indigo-700', iconActive: 'text-white', iconDone: 'text-indigo-600', dot: 'bg-indigo-600', bgSoft: 'bg-indigo-50', textSoft: 'text-indigo-600', borderSoft: 'border-indigo-100', borderFocus: 'focus:border-indigo-500', hoverBorder: 'hover:border-indigo-200', shadow: 'ring-indigo-400/20' },
        rose: { active: 'bg-rose-600 border-rose-600 text-white', done: 'bg-rose-50 border-rose-100 text-rose-700', iconActive: 'text-white', iconDone: 'text-rose-600', dot: 'bg-rose-600', bgSoft: 'bg-rose-50', textSoft: 'text-rose-600', borderSoft: 'border-rose-100', borderFocus: 'focus:border-rose-500', hoverBorder: 'hover:border-rose-200', shadow: 'ring-rose-400/20' },
        amber: { active: 'bg-amber-600 border-amber-600 text-white', done: 'bg-amber-50 border-amber-100 text-amber-700', iconActive: 'text-white', iconDone: 'text-amber-600', dot: 'bg-amber-600', bgSoft: 'bg-amber-50', textSoft: 'text-amber-600', borderSoft: 'border-amber-100', borderFocus: 'focus:border-amber-500', hoverBorder: 'hover:border-amber-200', shadow: 'ring-amber-400/20' },
        emerald: { active: 'bg-emerald-600 border-emerald-600 text-white', done: 'bg-emerald-50 border-emerald-100 text-emerald-700', iconActive: 'text-white', iconDone: 'text-emerald-600', dot: 'bg-emerald-600', bgSoft: 'bg-emerald-50', textSoft: 'text-emerald-600', borderSoft: 'border-emerald-100', borderFocus: 'focus:border-emerald-500', hoverBorder: 'hover:border-emerald-200', shadow: 'ring-emerald-400/20' }
    };

    const getTheme = (section: string) => {
        const colors: Record<string, string> = {
            psychiatric_past: 'indigo',
            medical_surgical: 'rose',
            substance_history: 'amber',
            family_history: 'emerald',
            developmental_history: 'indigo',
            social_history: 'emerald',
            trauma_history: 'rose'
        };
        return THEMES[colors[section.toLowerCase()] || 'indigo'];
    };

    const getSectionIcon = (section: string) => {
        switch (section.toLowerCase()) {
            case 'psychiatric_past': return <Brain size={18} />;
            case 'medical_surgical': return <Activity size={18} />;
            case 'substance_history': return <Zap size={18} />;
            case 'family_history': return <Users size={18} />;
            case 'developmental_history': return <Sparkles size={18} />;
            case 'social_history': return <FileText size={18} />;
            case 'trauma_history': return <Shield size={18} />;
            default: return <ClipboardList size={18} />;
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        setError(null);
        try {
            let hexId = userId || currentUser?._id || currentUser?.id;
            if (!hexId) throw new Error('Patient identity missing.');

            const payload: any = {
                patient: hexId,
                consult_id: consultId || undefined,
                narrative: responses.final_synthesis?.narrative || narrative,
                status: 'completed',
                psychiatric_history: {
                    previous_diagnosis: (() => {
                        const val = responses.psychiatric_past?.previous_diagnosis;
                        if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
                        if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
                        return [];
                    })(),
                    hospitalizations: Array.isArray(responses.psychiatric_past?.hospitalizations) ? responses.psychiatric_past.hospitalizations : [],
                    suicide_attempts: Array.isArray(responses.psychiatric_past?.suicide_attempts) ? responses.psychiatric_past.suicide_attempts : [],
                    medication_trials: Array.isArray(responses.psychiatric_past?.medication_trials) ? responses.psychiatric_past.medication_trials : [],
                    psychotherapy_history: responses.psychiatric_past?.psychotherapy_history || ''
                },
                medical_history: {
                    chronic_conditions: (() => {
                        const val = responses.medical_surgical?.chronic_conditions;
                        if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
                        if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
                        return [];
                    })(),
                    surgeries: Array.isArray(responses.medical_surgical?.surgeries) ? responses.medical_surgical.surgeries : [],
                    allergies: (() => {
                        const val = responses.medical_surgical?.allergies;
                        if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
                        if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
                        return [];
                    })(),
                    head_injury: {
                        detected: !!responses.medical_surgical?.head_injury?.detected,
                        loss_of_consciousness: !!responses.medical_surgical?.head_injury?.loss_of_consciousness,
                        details: responses.medical_surgical?.head_injury?.details || ''
                    },
                    seizures: {
                        detected: !!responses.medical_surgical?.seizures?.detected,
                        frequency: responses.medical_surgical?.seizures?.frequency || '',
                        last_seizure: responses.medical_surgical?.seizures?.last_seizure || ''
                    }
                },
                substance_use: {
                    alcohol: {
                        status: responses.substance_history?.alcohol?.status || 'Never',
                        quantity: responses.substance_history?.alcohol?.quantity || '0',
                        frequency: responses.substance_history?.alcohol?.frequency || 'N/A',
                        last_use: responses.substance_history?.alcohol?.last_use || 'N/A'
                    },
                    tobacco_nicotine: {
                        status: responses.substance_history?.tobacco_nicotine?.status || 'Never',
                        type: responses.substance_history?.tobacco_nicotine?.type || 'N/A',
                        quantity: responses.substance_history?.tobacco_nicotine?.quantity || '0'
                    },
                    illicit_drugs: Array.isArray(responses.substance_history?.illicit_drugs) ? responses.substance_history.illicit_drugs : [],
                    caffeine: responses.substance_history?.caffeine || '',
                    prescription_misuse: responses.substance_history?.prescription_misuse || 'None'
                },
                family_history: {
                    conditions: Array.isArray(responses.family_history?.conditions) ? responses.family_history.conditions : [],
                    suicide_in_family: !!responses.family_history?.suicide_in_family,
                    substance_abuse_in_family: !!responses.family_history?.substance_abuse_in_family
                },
                social_history: {
                    education: responses.social_history?.education || '',
                    employment: responses.social_history?.employment || '',
                    marital_status: responses.social_history?.marital_status || '',
                    living_situation: responses.social_history?.living_situation || '',
                    legal_history: {
                        legal_issues: !!responses.social_history?.legal_history?.legal_issues,
                        legal_details: responses.social_history?.legal_history?.legal_details || ''
                    },
                    spiritual_beliefs: responses.social_history?.spiritual_beliefs || '',
                    strengths_hobbies: responses.social_history?.strengths_hobbies || ''
                },
                trauma_history: {
                    physical_abuse: !!responses.trauma_history?.physical_abuse,
                    emotional_abuse: !!responses.trauma_history?.emotional_abuse,
                    sexual_abuse: !!responses.trauma_history?.sexual_abuse,
                    significant_losses: responses.trauma_history?.significant_losses || '',
                    military_service: !!responses.trauma_history?.military_service,
                    trauma_notes: responses.trauma_history?.trauma_notes || ''
                },
                developmental_history: {
                    pregnancy_complications: responses.developmental_history?.pregnancy_complications || 'None',
                    delivery_type: responses.developmental_history?.delivery_type || 'Normal',
                    milestones: responses.developmental_history?.milestones || 'On-time',
                    childhood_behavior: responses.developmental_history?.childhood_behavior || '',
                    school_performance: responses.developmental_history?.school_performance || ''
                }
            };

            const res = await PastHistoryService.createPastHistory(payload);
            setResult((res as any).data || res);
        } catch (err: any) {
            setError(err.message || 'Failed to save clinical history.');
        } finally { setIsSaving(false); }
    };

    const navigateBack = () => navigate(-1);

    const renderQuestion = (section: string, question: any) => {
        const value = responses[section]?.[question.key];
        const theme = getTheme(section);

        switch (question.type) {
            case 'select':
            case 'multiselect':
                return (
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {(() => {
                                const baseOpts = question.options || [];
                                const currentVals = Array.isArray(value) ? value : (value ? [value] : []);
                                const allDisplayOpts = Array.from(new Set([...baseOpts, ...currentVals]));

                                return allDisplayOpts.map((opt: string) => {
                                    const isSel = question.type === 'select' ? value === opt : currentVals.includes(opt);
                                    return (
                                        <button key={opt} onClick={() => question.type === 'select' ? handleValueChange(section, question.key, opt) : handleMultiselectToggle(section, question.key, opt)}
                                            className={`p-5 rounded-3xl border transition-all text-left ${isSel 
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                                                : `bg-slate-50 border-transparent text-slate-500 ${theme.hoverBorder}`}`}>
                                            <span className="text-[12px] font-bold tracking-tight leading-tight">{opt}</span>
                                        </button>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                );
            case 'boolean':
                return (
                    <div className="space-y-4 mt-4">
                        <div className="flex gap-4">
                            {[true, false].map(v => (
                                <button key={v ? 'y' : 'n'} onClick={() => handleValueChange(section, question.key, v)}
                                    className={`flex-1 p-5 rounded-3xl border transition-all font-bold tracking-tight text-[12px] ${value === v 
                                        ? (v ? `${theme.active} shadow-xl ${theme.shadow}` : 'bg-slate-800 border-slate-800 text-white shadow-xl shadow-slate-200') 
                                        : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>
                                    {v ? 'Confirmed' : 'Denied'}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'textarea':
                return (
                    <textarea
                        value={value || ''}
                        onChange={e => handleValueChange(section, question.key, e.target.value)}
                        placeholder="Provide detailed clinical history here..."
                        className={`w-full min-h-[140px] p-8 bg-slate-50 border border-transparent rounded-[2.5rem] text-sm font-bold text-slate-700 outline-none transition-all resize-none mt-4 focus:bg-white focus:border-indigo-600 shadow-inner`}
                    />
                );
            case 'boolean_group':
                return (
                    <div className={`space-y-8 mt-4 p-8 bg-white rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.02)] border border-slate-100`}>
                        {question.fields?.map((f: any) => (
                            <div key={f.key} className="space-y-4">
                                <label className="text-[11px] font-bold text-slate-400 tracking-tight">{f.label}</label>
                                {f.type === 'boolean' ? (
                                    <div className="flex gap-3">
                                        {[true, false].map(boolVal => {
                                            const isSel = responses[section]?.[question.key]?.[f.key] === boolVal;
                                            return (
                                                <button key={boolVal ? 'y' : 'n'}
                                                    onClick={() => handleBooleanGroupChange(section, question.key, f.key, boolVal)}
                                                    className={`px-8 py-3 rounded-2xl text-[11px] font-bold tracking-tight transition-all ${isSel ? (boolVal ? theme.active : 'bg-slate-800 text-white') : 'bg-slate-50 text-slate-400 border border-transparent hover:border-slate-200'}`}>
                                                    {boolVal ? 'Yes' : 'No'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-2xl overflow-hidden border border-transparent group-focus-within:bg-white group-focus-within:border-indigo-200 transition-all">
                                        {f.type === 'select' ? (
                                            <select
                                                value={responses[section]?.[question.key]?.[f.key] || ''}
                                                onChange={e => handleBooleanGroupChange(section, question.key, f.key, e.target.value)}
                                                className="w-full p-4 text-xs font-bold text-slate-700 outline-none bg-transparent"
                                            >
                                                <option value="">Choose option...</option>
                                                {f.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder={`Enter ${f.label.toLowerCase()}...`}
                                                value={responses[section]?.[question.key]?.[f.key] || ''}
                                                onChange={e => handleBooleanGroupChange(section, question.key, f.key, e.target.value)}
                                                className="w-full p-4 text-xs font-bold text-slate-700 outline-none bg-transparent placeholder:text-slate-300"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            case 'array':
                const items = responses[section]?.[question.key] || [];
                return (
                    <div className="space-y-6 mt-4">
                        <div className="space-y-4">
                            {items.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white rounded-[2rem] p-8 relative group/row shadow-[0_15px_40px_rgba(0,0,0,0.032)] border border-slate-50 hover:border-indigo-100 transition-all">
                                    <button
                                        onClick={() => handleArrayRemove(section, question.key, idx)}
                                        className="absolute -top-3 -right-3 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all shadow-xl hover:bg-rose-600 scale-90 group-hover/row:scale-100"
                                    >
                                        <AlertCircle size={16} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {question.item_structure?.map((field: any) => (
                                            <div key={field.key} className="space-y-3">
                                                <label className="text-[11px] font-bold text-slate-400 tracking-tight">{field.label}</label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        value={item[field.key] || ''}
                                                        onChange={e => handleArrayItemChange(section, question.key, idx, field.key, e.target.value)}
                                                        className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 focus:bg-white focus:ring-4 ring-indigo-50 border border-transparent focus:border-indigo-200 transition-all"
                                                    >
                                                        <option value="">Choose...</option>
                                                        {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={item[field.key] || ''}
                                                        onChange={e => handleArrayItemChange(section, question.key, idx, field.key, e.target.value)}
                                                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                                                        className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none hover:bg-slate-100 focus:bg-white focus:ring-4 ring-indigo-50 border border-transparent focus:border-indigo-200 transition-all"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => handleArrayAdd(section, question.key, question.item_structure || [])}
                            className={`w-full py-6 border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all font-bold text-[11px] tracking-tight flex items-center justify-center gap-3`}
                        >
                            <Sparkles size={16} /> Add clinical entry record
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl shadow-indigo-100" />
            <p className="text-[11px] font-bold text-slate-400 tracking-tight animate-pulse">Compiling clinical framework</p>
        </div>
    );

    if (result) {
        const assessedSections = sections.filter(s => {
            const data = (result as any)[s.section] || (result as any)[s.section.replace(/_past/g, '_history')];
            return data && Object.values(data).some(v => v !== null && v !== undefined && v !== '');
        });

        return (
            <div className="p-10 max-w-[1400px] mx-auto space-y-12 animate-fade-in pb-32">
                <header className="flex items-end justify-between border-b-2 border-slate-50 pb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-100/20">
                                <History size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold tracking-tight shadow-lg shadow-indigo-200">Historical Record</span>
                                    <span className="text-[11px] font-medium text-slate-400 tabular-nums tracking-tight leading-none">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">History Synthesis</h1>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => setResult(null)} className="h-14 px-8 rounded-2xl border border-slate-200 font-bold text-[11px] tracking-tight hover:bg-slate-50">
                            Re-analyze history
                        </Button>
                        <Button variant="primary" onClick={navigateBack} className="h-14 px-10 rounded-2xl bg-indigo-600 border-none font-bold text-[11px] tracking-tight shadow-2xl shadow-indigo-200">
                            Exit record
                        </Button>
                    </div>
                </header>

                <div className="grid lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-12">
                        <section className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(79,70,229,0.08)] relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:scale-110 transition-transform duration-[3s] text-indigo-600"><Cpu size={240} /></div>
                           <div className="relative space-y-8">
                               <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                       <div className="w-1 h-8 bg-indigo-600 rounded-full" />
                                       <h3 className="text-[12px] font-bold text-indigo-600 tracking-tight">Clinical history formulation</h3>
                                   </div>
                                    {result.treatment_resistance_risk && (
                                        <div className="flex items-center gap-4 bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100 shadow-sm">
                                            <span className="text-[10px] font-bold text-slate-400 tracking-tight">Treatment resistance:</span>
                                            <span className={`text-[11px] font-black tracking-tight ${result.treatment_resistance_risk === 'High' ? 'text-rose-600' : 'text-emerald-600'}`}>{result.treatment_resistance_risk}</span>
                                        </div>
                                    )}
                               </div>
                               <div className="pl-6 border-l-4 border-slate-50 py-1">
                                   <p className="text-2xl font-bold text-slate-800 leading-relaxed tracking-tight italic">
                                       "{result.ai_notes || 'Historical synthesis currently being processed.'}"
                                   </p>
                               </div>
                           </div>
                        </section>
                    </div>

                    <div className="lg:col-span-8">
                        <section className="bg-white p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(79,70,229,0.08)] h-full">
                            <div className="space-y-12">
                                <header className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100/40"><AlertTriangle size={22} /></div>
                                    <h3 className="text-[12px] font-bold text-slate-900 tracking-tight">Clinical risk audit</h3>
                                </header>
                                
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                                            <h4 className="text-[11px] font-bold text-slate-400 tracking-tight">Critical clinical flags</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {result.risk_flags?.length ? result.risk_flags.map((flag, i) => (
                                                <div key={i} className="px-5 py-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 font-bold text-[11px] tracking-tight flex items-center gap-3">
                                                    <AlertCircle size={14} />
                                                    {flag}
                                                </div>
                                            )) : <p className="text-sm font-bold text-slate-400 italic px-2">No historical alerts detected.</p>}
                                        </div>
                                    </div>

                                    {result.genetic_risk_summary && (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                                <h4 className="text-[11px] font-bold text-slate-400 tracking-tight">Genetic risk synthesis</h4>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed tracking-tight italic">"{result.genetic_risk_summary}"</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100/20">
                                    <div className="flex items-center gap-4 mb-4">
                                        <Shield size={20} className="text-indigo-400" />
                                        <h5 className="text-[11px] font-bold text-indigo-400 tracking-tight">Practitioner Guidance</h5>
                                    </div>
                                    <p className="text-xs font-bold text-slate-300 leading-relaxed opacity-80">This analysis serves as a clinical aid. Longitudinal history must be verified against primary sources and corroborated by clinical documentation audits.</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="space-y-8">
                            <header className="flex items-center gap-4 mb-2 p-1">
                                <Target size={20} className="text-indigo-600" />
                                <h3 className="text-[12px] font-bold text-slate-900 tracking-tight">Aesthetic indicators</h3>
                            </header>
                            
                            <div className="grid gap-4">
                                <div className="p-6 bg-white rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.032)] flex items-center gap-6 relative group border border-slate-50">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-indigo-600 rounded-r-full" />
                                    <div className="w-10 h-10 bg-slate-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm"><Users size={18} /></div>
                                    <p className="text-sm font-bold text-slate-700 leading-tight tracking-tight">Hereditary Audit Complete</p>
                                </div>
                                <div className="p-6 bg-white rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.032)] flex items-center gap-6 relative group border border-slate-50">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-rose-600 rounded-r-full" />
                                    <div className="w-10 h-10 bg-slate-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm"><Zap size={18} /></div>
                                    <p className="text-sm font-bold text-slate-700 leading-tight tracking-tight">Systemic Toxicity Evaluated</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-12 pt-20">
                        <header className="flex items-center gap-6 mb-12">
                            <h2 className="text-[11px] font-bold text-slate-900 tracking-tight whitespace-nowrap">Chronological history breakdowns</h2>
                            <div className="h-[2px] bg-slate-50 flex-1" />
                        </header>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {assessedSections.map(s => {
                                const sectionData = (result as any)[s.section] || (result as any)[s.section.replace(/_past/g, '_history')];
                                if (!sectionData) return null;
                                return (
                                    <div key={s.section} className="p-8 bg-white rounded-[3rem] shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.06)] transition-all group">
                                        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center transition-all group-hover:bg-indigo-600 group-hover:text-white`}>
                                                    {getSectionIcon(s.section)}
                                                </div>
                                                <h3 className="text-[11px] font-bold text-slate-900 tracking-tight">{s.title}</h3>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg" />
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
            <header className="flex items-center justify-between border-b border-slate-50 pb-12">
                <div className="flex items-center gap-8">
                    <button onClick={navigateBack} className="w-14 h-14 bg-white hover:bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-slate-900 transition-all hover:shadow-xl group">
                        <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold tracking-tight shadow-lg shadow-slate-200">Evaluation mode</span>
                            <span className="text-[10px] font-medium text-slate-300 tracking-tight tabular-nums leading-none">Longitudinal History Record</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">History assistant</h1>
                    </div>
                </div>
                
                <button onClick={() => setUseAssistant(!useAssistant)} className={`px-10 py-5 rounded-3xl font-bold tracking-tight text-[12px] flex items-center gap-4 transition-all shadow-[0_20px_50px_rgba(79,70,229,0.12)] ${useAssistant ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 hover:bg-slate-50'}`}>
                    <Bot size={20} />
                    {useAssistant ? 'Manual input interface' : 'History AI assistant'}
                </button>
            </header>

            <div className="grid lg:grid-cols-12 gap-16">
                <div className="lg:col-span-3">
                    <div className="sticky top-12 space-y-8">
                        <div className="bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl space-y-2 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 text-white"><Database size={120} /></div>
                            <header className="mb-8 px-2">
                                <h3 className="text-[11px] font-bold text-indigo-400 tracking-tight mb-2 leading-none">Clinical chronogram</h3>
                                <div className="h-[1px] bg-white/10 w-full" />
                            </header>
                            {sections.map((s, idx) => {
                                const isDone = responses[s.section] && Object.keys(responses[s.section]).length > 0;
                                const isActive = idx === currentStep;
                                return (
                                    <button key={s.section} onClick={() => setCurrentStep(idx)} className={`w-full group flex items-center gap-5 py-5 px-6 rounded-2xl transition-all ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? (getTheme(s.section).active + ' shadow-xl scale-110') : isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-700'}`}>
                                            {isDone && !isActive ? <CheckCircle2 size={16} /> : getSectionIcon(s.section)}
                                        </div>
                                        <span className={`text-[12px] font-bold tracking-tight transition-all ${isActive ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-600 group-hover:text-slate-500'}`}>{s.title}</span>
                                        {isActive && <div className={`ml-auto w-1 h-3 ${getTheme(s.section).dot} rounded-full`} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-9">
                    {useAssistant ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-12 rounded-[3.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.08)] space-y-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-indigo-600"><Sparkles size={240} /></div>
                            <header className="flex items-center justify-between border-b border-slate-50 pb-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center shadow-lg"><Sparkles size={32} /></div>
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">Narrative engine</h2>
                                        <p className="text-xs font-bold text-slate-400 tracking-tight mt-1">Live Clinical History Extraction</p>
                                    </div>
                                </div>
                                <button onClick={toggleRecording} className={`h-16 px-10 rounded-2xl flex items-center gap-4 font-bold tracking-tight text-[12px] transition-all shadow-xl shadow-slate-100 ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-50 text-slate-400 hover:bg-slate-200'}`}>
                                    {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
                                    {isRecording ? 'Recording...' : 'Voice scribe'}
                                </button>
                            </header>
                            <textarea value={narrative} onChange={(e) => setNarrative(e.target.value)} placeholder="Describe the patient's medical and psychiatric history in natural language. Diagnoses, hospitalizations, surgeries, and family risk markers will be autonomously extracted." className="w-full min-h-[500px] p-12 bg-slate-50 border-none rounded-[3rem] text-xl font-bold text-slate-800 outline-none resize-none leading-relaxed focus:bg-white shadow-inner transition-all" />
                            <div className="flex justify-end pt-4">
                                <Button variant="primary" className="h-16 px-20 rounded-2xl font-bold tracking-tight text-[12px] bg-slate-900 border-none shadow-2xl shadow-indigo-100" onClick={handleNarrativeExtract} isLoading={isExtracting} rightIcon={<ArrowRight size={20} />}>Analyze historical record</Button>
                            </div>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={currentSection.section} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white p-16 rounded-[4rem] shadow-[0_20px_60px_rgba(79,70,229,0.08)] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-slate-900 group-hover:scale-110 transition-transform duration-[4s]">{getSectionIcon(currentSection.section)}</div>
                                <header className="space-y-6 pb-12 border-b border-slate-50 mb-12">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 ${getTheme(currentSection.section).active} rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl`}>{getSectionIcon(currentSection.section)}</div>
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{currentSection.title}</h2>
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 tracking-tight max-w-2xl leading-relaxed">{currentSection.description}</p>
                                </header>
                                <div className="space-y-16">
                                    {currentSection.questions.map(q => (
                                        <div key={q.key} className="space-y-8">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-1.5 h-10 ${getTheme(currentSection.section).dot} rounded-full`} />
                                                <label className="text-[12px] font-bold text-slate-800 tracking-tight">{q.patient_label || q.professional_label || q.label}</label>
                                            </div>
                                            <div className="max-w-3xl">{renderQuestion(currentSection.section, q)}</div>
                                        </div>
                                    ))}
                                </div>
                                <footer className="pt-16 mt-20 border-t border-slate-50 flex items-center justify-between">
                                    <Button variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep(prev => prev - 1)} leftIcon={<ChevronLeft size={22} />} className="h-16 px-12 rounded-[1.5rem] font-bold text-[11px] tracking-tight border-slate-200">Go back</Button>
                                    {currentStep < sections.length - 1 ? (
                                        <Button variant="primary" onClick={() => setCurrentStep(prev => prev + 1)} rightIcon={<ChevronRight size={22} />} className={`h-16 px-20 rounded-[1.5rem] ${getTheme(currentSection.section).active} border-none font-bold text-[11px] tracking-tight shadow-2xl`}>Save historical domain</Button>
                                    ) : (
                                        <Button variant="primary" onClick={() => handleSubmit()} isLoading={isSaving} leftIcon={<Save size={22} />} className="h-16 px-24 rounded-[1.5rem] bg-slate-900 border-none font-bold text-[11px] tracking-tight shadow-2xl">Commit historical record</Button>
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

export default PastHistoryPage;
