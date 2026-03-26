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
    Stethoscope,
    Bot,
    Mic,
    MicOff
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import Button from '../../../components/ui/Button';
import { ROSService } from '../../../api/services/ros.service';
import { UserService } from '../../../api/services/user.service';
import type { ROSSection, ROSResponse } from '../../../types/ros.types';


const AddROS = () => {
    const { patientId: userId } = useParams<{ patientId: string }>();
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
    const [result, setResult] = useState<ROSResponse | null>(null);

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
        if (!recognitionRef.current) return alert('Voice recognition not supported.');
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

    const handleNarrativeExtract = async () => {
        if (!narrative.trim() || narrative.length < 20) {
            setError('Please provide a more detailed narrative for AI extraction (min 20 chars).');
            return;
        }

        setIsExtracting(true);
        setError(null);
        try {
            const activeId = userId || currentUser?._id || currentUser?.id;
            const res = await ROSService.extractFromNarrative(narrative, activeId!);
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
            console.error('AI Extraction failed:', err);
            setError('Clinical AI engine failed to process the narrative.');
        } finally {
            setIsExtracting(false);
        }
    };

    const THEMES: Record<string, any> = {
        indigo: { active: 'bg-indigo-600 border-indigo-600 text-white', done: 'bg-indigo-50 border-indigo-100 text-indigo-700', iconActive: 'text-white', iconDone: 'text-indigo-600', dot: 'bg-indigo-500', bgSoft: 'bg-indigo-50', textSoft: 'text-indigo-600', borderSoft: 'border-indigo-100', borderFocus: 'focus:border-indigo-500', hoverBorder: 'hover:border-indigo-200', shadow: 'ring-indigo-400/20' },
        rose: { active: 'bg-rose-600 border-rose-600 text-white', done: 'bg-rose-50 border-rose-100 text-rose-700', iconActive: 'text-white', iconDone: 'text-rose-600', dot: 'bg-rose-500', bgSoft: 'bg-rose-50', textSoft: 'text-rose-600', borderSoft: 'border-rose-100', borderFocus: 'focus:border-rose-500', hoverBorder: 'hover:border-rose-200', shadow: 'ring-rose-400/20' }
    };

    const getTheme = (section: string) => {
        return section?.toLowerCase() === 'medical' ? THEMES.rose : THEMES.indigo;
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
            let hexId = userId;
            if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                hexId = currentUser?._id || currentUser?.id || hexId;
            } else {
                try {
                    const userProfile = await UserService.getUserById(userId!);
                    if (userProfile) hexId = userProfile._id || userProfile.id || hexId;
                } catch (e) { console.warn('[AddROS] Profile fetch failed:', e); }
            }

            const submissionData: any = { patient_id: hexId, consult_id: null };
            sections.forEach(s => {
                const sectionData = responses[s.section];
                if (sectionData && Object.keys(sectionData).length > 0) submissionData[s.section] = sectionData;
            });

            if (Object.keys(submissionData).length <= 2) throw new Error('Please enter clinical data.');

            const res = await ROSService.createROS(submissionData);
            setResult((res as any).data || res);
        } catch (err: any) {
            setError(err.message || 'Failed to save review.');
        } finally { setIsSaving(false); }
    };

    const renderQuestion = (section: string, question: any) => {
        const value = responses[section]?.[question.key];
        const theme = getTheme(section);

        switch (question.type) {
            case 'select':
            case 'multiselect':
                return (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {question.options?.map((opt: string) => {
                            const isSel = question.type === 'select' ? value === opt : (Array.isArray(value) && value.includes(opt));
                            return (
                                <button key={opt} onClick={() => question.type === 'select' ? handleValueChange(section, question.key, opt) : handleMultiselectToggle(section, question.key, opt)}
                                    className={`p-4 rounded-2xl border-2 text-left transition-all ${isSel ? theme.active : `bg-slate-50 border-transparent text-slate-600 ${theme.hoverBorder}`}`}>
                                    <span className="text-xs font-black uppercase tracking-tight">{opt}</span>
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
                                <button key={v ? 'y' : 'n'} onClick={() => handleValueChange(section, question.key, v)}
                                    className={`flex-1 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[10px] ${value === v ? (v ? theme.active : 'bg-slate-800 border-slate-800 text-white') : 'bg-slate-50 border-transparent text-slate-400'}`}>
                                    {v ? 'Yes / Present' : 'No / Denied'}
                                </button>
                            ))}
                        </div>
                        {value === true && question.follow_up && (
                            <div className={`pl-6 border-l-4 ${theme.borderSoft} space-y-6 mt-4`}>
                                {question.follow_up.map((fu: any) => (
                                    <div key={fu.key} className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{fu.label}</p>
                                        {renderQuestion(section, fu)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'text':
                return <textarea value={value || ''} onChange={e => handleValueChange(section, question.key, e.target.value)} className={`w-full min-h-[100px] p-6 bg-slate-50 border-2 border-transparent rounded-3xl text-sm font-bold focus:bg-white outline-none transition-all resize-none mt-4`} />;
            default: return null;
        }
    };

    if (isLoading) return <div className="flex flex-col items-center justify-center min-h-[60vh]"><Activity className="animate-spin text-indigo-600 mb-4" size={40} /><p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Hydrating Review...</p></div>;

    if (result) return (
        <div className="p-8 max-w-6xl animate-fade-in pb-24 space-y-12">
            <header className="flex items-center justify-between">
                <div><h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Stethoscope className="text-indigo-600" size={32} />Review of Systems</h1></div>
                <Button variant="primary" onClick={() => navigate(`/patients/${userId}/ros`)} className="rounded-2xl px-8 font-black uppercase text-xs">Return to Profile</Button>
            </header>
            <section className="card-premium p-12 bg-white border-slate-100 shadow-2xl">
                <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b pb-8">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><Activity size={28} /></div>
                        <div><h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">AI Systemic Correlation</h2><p className="text-xl font-black text-slate-900">Review Complete</p></div>
                    </div>
                    <div className="space-y-4"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Notes</h3><p className="text-xl font-black text-slate-800 leading-relaxed italic">"{result.ai_notes}"</p></div>
                </div>
            </section>
        </div>
    );

    const currentSection = sections[currentStep];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-fade-in pb-24">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate(`/patients/${userId}/ros`)} className="p-3 bg-white border rounded-2xl text-slate-500"><ChevronLeft size={20} /></button>
                    <div><h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Stethoscope className="text-indigo-600" size={32} />Review of Systems</h1></div>
                </div>
                <button onClick={() => setUseAssistant(!useAssistant)} className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 border-2 transition-all ${useAssistant ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-indigo-100 text-indigo-600'}`}><Bot size={16} />{useAssistant ? 'FORM VIEW' : 'AI ASSISTANT'}</button>
            </header>

            {useAssistant ? (
                <div className="card-premium p-12 bg-white space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4"><div className="p-4 bg-indigo-50 text-indigo-600 rounded-full"><Sparkles size={24} /></div><div><h2 className="text-2xl font-black text-slate-900 tracking-tight">Systemic Narrative Intake</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Describe current symptoms or systemic issues</p></div></div>
                        <button onClick={toggleRecording} className={`p-4 rounded-2xl flex items-center gap-3 border-2 ${isRecording ? 'bg-rose-500 text-white border-rose-500 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{isRecording ? <MicOff size={20} /> : <Mic size={20} />}<span className="text-[10px] font-black uppercase tracking-widest">{isRecording ? 'Listening...' : 'Record Voice'}</span></button>
                    </div>
                    <textarea value={narrative} onChange={e => setNarrative(e.target.value)} placeholder="Tell us about any symptoms in your body systems (heart, lung, skin, stomach, etc.)..." className="w-full min-h-[350px] p-8 bg-slate-50 border-2 border-transparent rounded-[2.5rem] text-lg font-bold text-slate-700 outline-none transition-all resize-none shadow-inner" />
                    <div className="flex justify-end"><Button variant="primary" className="px-16 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100" onClick={handleNarrativeExtract} isLoading={isExtracting} rightIcon={<ChevronRight size={18} />}>Extract ROS with AI</Button></div>
                </div>
            ) : (
                <>
                    <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar px-2">
                        {sections.map((s, idx) => <button key={s.section} onClick={() => setCurrentStep(idx)} className={`px-8 py-6 rounded-[2rem] border-2 transition-all min-w-[200px] ${idx === currentStep ? getTheme(s.section).active : 'bg-white border-slate-100 text-slate-400'}`}>{getSectionIcon(s.section)}<span className="text-[10px] font-black uppercase tracking-widest mt-2 block">{s.title}</span></button>)}
                    </div>
                    <div className="grid lg:grid-cols-4 gap-12">
                        <div className="lg:col-span-3">
                            <AnimatePresence mode="wait"><motion.div key={currentSection.section} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="card-premium p-12 bg-white border-slate-100 ring-1 ring-slate-100 shadow-xl">
                                <header className="mb-8"><h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentSection.title}</h2><p className="text-slate-500 text-sm">{currentSection.description}</p></header>
                                <div className="space-y-12">{currentSection.questions.map(q => <div key={q.key} className="space-y-4"><label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><div className={`w-1.5 h-6 ${getTheme(currentSection.section).dot} rounded-full`} />{q.label}</label>{renderQuestion(currentSection.section, q)}</div>)}</div>
                                <div className="flex items-center gap-4 pt-12 border-t mt-12">
                                    <Button variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep(prev => prev - 1)} leftIcon={<ChevronLeft size={18} />}>Back</Button>
                                    {currentStep < sections.length - 1 ? <Button variant="primary" className={`ml-auto rounded-2xl ${getTheme(currentSection.section).active}`} onClick={() => setCurrentStep(prev => prev + 1)} rightIcon={<ChevronRight size={18} />}>Next Section</Button> : <Button variant="primary" className="ml-auto rounded-2xl bg-black border-black text-white px-10" onClick={handleSubmit} isLoading={isSaving} leftIcon={<Save size={18} />}>Finalize Review</Button>}
                                </div>
                            </motion.div></AnimatePresence>
                        </div>
                        <div className="lg:col-span-1 border-l pl-8 space-y-4"><h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review Systems</h3>{sections.map((s, i) => <div key={s.section} className={`p-4 rounded-xl text-xs font-bold cursor-pointer ${i === currentStep ? 'bg-indigo-600 text-white' : 'text-slate-500'}`} onClick={() => setCurrentStep(i)}>{s.title}</div>)}</div>
                    </div>
                </>
            )}
            {error && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 p-4 bg-rose-500 text-white rounded-2xl flex items-center gap-3 text-xs font-bold shadow-2xl z-50 animate-shake"><AlertCircle size={18} />{error}</div>}
        </div>
    );
};

export default AddROS;
