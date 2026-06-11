import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    Save,
    ChevronRight,
    Activity,
    Brain,
    Shield,
    Users,
    Plus,
    History,
    Calendar,
    ArrowLeft,
    HeartPulse,
    RotateCcw,
    Mic,
    MicOff,
    Loader2,
    ShieldAlert,
    X
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PastHistoryService } from '../../api/services/pastHistory.service';
import type { PastHistoryResponse, PastHistorySection } from '../../types/pastHistory.types';
import Button from '../../components/ui/Button';

type ViewState = 'list' | 'assistant' | 'detail' | 'manual';

const HistoryAssistantPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { patientId: urlPatientId } = useParams<{ patientId: string }>();
    const patientId = urlPatientId || user?.id || user?._id || '';
    const isProfessional = user?.role && user.role !== 'patient';

    // Navigation State — read URL query params for initial view
    const [searchParams] = useSearchParams();
    const [viewState, setViewState] = useState<ViewState>(() => {
        const view = searchParams.get('view');
        const mode = searchParams.get('mode');
        if (view === 'assistant') return 'assistant';
        if (view === 'manual' || mode === 'manual') return 'manual';
        return 'list';
    });
    const [selectedRecord, setSelectedRecord] = useState<PastHistoryResponse | null>(null);

    // List State
    const [historyList, setHistoryList] = useState<PastHistoryResponse[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Assistant State
    const [narrative, setNarrative] = useState('');
    const [extracting, setExtracting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [extractedData, setExtractedData] = useState<Partial<PastHistoryResponse> | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);

    // Manual Entry State
    const [questions, setQuestions] = useState<PastHistorySection[]>([]);
    const [manualResponses, setManualResponses] = useState<Record<string, any>>({});
    const [fetchingQuestions, setFetchingQuestions] = useState(false);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';

            rec.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    }
                }

                if (finalTranscript) {
                    setNarrative(prev => {
                        const cleanNew = finalTranscript.trim();
                        if (!prev) return cleanNew;
                        return prev.trim() + ' ' + cleanNew;
                    });
                }
            };

            rec.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
            };

            rec.onend = () => {
                setIsRecording(false);
            };

            setRecognition(rec);
        }
    }, []);

    const toggleRecording = () => {
        if (!recognition) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }

        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
            setIsRecording(true);
        }
    };

    useEffect(() => {
        if (patientId) {
            fetchHistory();
        }
    }, [patientId]);

    // Deep Link Check
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const recordId = params.get('id') || params.get('recordId');
        if (recordId && historyList.length > 0) {
            const match = historyList.find(h => (h._id || h.id) === recordId);
            if (match) {
                setSelectedRecord(match);
                setViewState('detail');
            }
        }
    }, [historyList]);

    const handleAddManual = async () => {
        try {
            setViewState('manual');
            setFetchingQuestions(true);
            const res = await PastHistoryService.getQuestions();
            const data = (res as any).data || res;
            if (Array.isArray(data)) {
                setQuestions(data);
                const initial: Record<string, any> = {};
                data.forEach((sec: any) => sec.questions.forEach((q: any) => {
                    if (q.type === 'boolean') initial[q.key] = false;
                    else if (q.type === 'multiselect') initial[q.key] = [];
                    else if (q.type === 'array') initial[q.key] = [];
                    else if (q.type === 'boolean_group') {
                        initial[q.key] = {};
                        q.fields?.forEach((f: any) => {
                            if (f.type === 'boolean') initial[q.key][f.key] = false;
                            else if (f.type === 'multiselect') initial[q.key][f.key] = [];
                            else initial[q.key][f.key] = '';
                        });
                    }
                    else initial[q.key] = '';
                }));
                setManualResponses(initial);
            }
        } catch (error) {
            console.error('Manual fetch failed:', error);
            setViewState('list');
        } finally {
            setFetchingQuestions(false);
        }
    };

    const handleManualSave = async () => {
        try {
            setSaving(true);
            
            // Construct structured payload based on section mapping
            const payload: any = {
                patient_id: patientId,
                status: 'completed',
                psychiatric_history: {},
                medical_history: {},
                family_history: {},
                substance_use: {},
                developmental_history: {},
                social_history: {},
                trauma_history: {}
            };

            const sectionMap: Record<string, string> = {
                'psychiatric_past': 'psychiatric_history',
                'medical_surgical': 'medical_history',
                'family_history': 'family_history',
                'substance_history': 'substance_use',
                'developmental_history': 'developmental_history',
                'social_history': 'social_history',
                'trauma_history': 'trauma_history'
            };

            questions.forEach((sec: any) => {
                const payloadKey = sectionMap[sec.section] || sec.section;
                if (!payload[payloadKey]) payload[payloadKey] = {};
                
                sec.questions.forEach((q: any) => {
                    if (manualResponses[q.key] !== undefined) {
                        payload[payloadKey][q.key] = manualResponses[q.key];
                    }
                });
            });

            console.log('Analyzing Manual Structured Data:', payload);

            // Using analyze endpoint for manual structured data to get findings first
            const res = await PastHistoryService.analyzeManual(payload);
            const data = (res as any).data || res;
            
            if (data) {
                // Merge structured data with AI results for extraction preview
                const mergeResult = {
                    ...payload,
                    ...data
                };
                setExtractedData(mergeResult);
                setViewState('assistant'); // Transition to the result view screen
            }
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoadingHistory(true);
            const res = await PastHistoryService.getPatientHistory(patientId);
            const data = (res as any).data || res;
            if (Array.isArray(data)) {
                setHistoryList(data);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleExtract = async () => {
        if (!narrative.trim()) return;
        try {
            setExtracting(true);
            const res = await PastHistoryService.extractFromNarrative(narrative, patientId);
            const data = (res as any).data || res;
            if (data) {
                setExtractedData(data);
            }
        } catch (error) {
            console.error('Extraction failed:', error);
        } finally {
            setExtracting(false);
        }
    };

    const handleSave = async () => {
        if (!extractedData) return;
        try {
            setSaving(true);
            const payload: any = {
                ...extractedData,
                patient_id: patientId,
                narrative: narrative || (extractedData as any).ai_notes || '',
                status: 'completed'
            };
            const res = await PastHistoryService.createPastHistory(payload);
            const success = res.success || (res as any).code === 201 || (res as any).code === 200 || !!(res as any).data;
            if (success) {
                setViewState('list');
                setExtractedData(null);
                setNarrative('');
                setManualResponses({});
                fetchHistory();
            }
        } catch (error) {
            console.error('Persistence failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const formatInsightValue = (value: any): string => {
        if (!value) return '';
        if (typeof value === 'string') return value;

        if (Array.isArray(value)) {
            return value.map(item => {
                if (!item) return null;
                if (typeof item === 'string') return item;
                if (typeof item === 'object') {
                    if (item.procedure) return `${item.procedure}${item.year ? ' (' + item.year + ')' : ''}`;
                    if (item.name) return `${item.name}${item.dose ? ' ' + item.dose : ''}${item.duration ? ' (' + item.duration + ')' : ''}`;
                    if (item.relative) return `${item.relative}: ${item.condition}${item.age ? ' (Age: ' + item.age + ')' : ''}`;
                    if (item.drug) return `${item.drug}${item.frequency ? ' (' + item.frequency + ')' : ''}`;
                    if (item.diagnosis) return `${item.diagnosis}${item.year ? ' (' + item.year + ')' : ''}`;
                    
                    // Fallback to extraction of first string value if it looks like a simple key-value object
                    const values = Object.values(item).filter(v => typeof v === 'string' && v.length > 0 && v !== 'None' && v !== 'Unknown');
                    return values.length > 0 ? values[0] : null;
                }
                return String(item);
            }).filter(Boolean).join(', ');
        }

        if (typeof value === 'object') {
            const entries = Object.entries(value)
                .map(([k, v]) => {
                    if (k === 'detected' || v == null) return null;
                    if (v === false) return `No ${k.replace(/_/g, ' ')}`;
                    if (v === true) return k.replace(/_/g, ' ');
                    
                    if (Array.isArray(v)) {
                        const subArr = formatInsightValue(v);
                        return subArr ? `${k.replace(/_/g, ' ')}: ${subArr}` : null;
                    }
                    if (typeof v === 'object') {
                        const subObj = formatInsightValue(v);
                        return subObj ? `${k.replace(/_/g, ' ')}: ${subObj}` : null;
                    }
                    if (v === 'None' || v === 'Unknown' || v === 'Not specified') return null;
                    return `${k.replace(/_/g, ' ')}: ${v}`;
                })
                .filter(Boolean);
            return entries.length > 0 ? entries.join(' | ') : 'No history reported';
        }
        return String(value);
    };

    const renderHeader = (title: string, subtitle: string, showBack = false) => (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-border-card pb-10">
            <div className="space-y-4">
                <nav className="flex items-center gap-3">
                    {showBack && (
                        <button onClick={() => { setViewState('list'); setExtractedData(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-muted" />
                        </button>
                    )}
                    <span className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em] px-3 py-1 bg-indigo-50 rounded-full">Historical Archive</span>
                    <ChevronRight size={14} className="text-muted opacity-80" />
                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{viewState === 'list' ? 'Clinical Center' : 'Extraction Hub'}</span>
                </nav>
                <h1 className="text-5xl font-black text-main tracking-tighter leading-[0.9] mb-2">{title}</h1>
                <p className="text-muted font-bold uppercase text-[11px] tracking-widest">{subtitle}</p>
            </div>

            {((isProfessional && (viewState === 'list' || viewState === 'assistant')) || 
              (!isProfessional && viewState === 'assistant')) && (
                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={handleAddManual}
                        className="h-16 px-10 bg-card text-main opacity-90 border border-border-card rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-sm flex items-center gap-4 hover:bg-page transition-all active:scale-95"
                    >
                        <Plus size={20} /> Add Manual
                    </button>
                    <button onClick={() => setViewState('assistant')} className={`h-16 px-10 rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-4 transition-all active:scale-95 ${viewState === 'assistant' ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'bg-card text-main border border-border-card hover:bg-page hover:scale-105'}`}>
                        <Mic size={20} /> {viewState === 'assistant' ? 'AI Recording Active' : 'Record New History'}
                    </button>
                </div>
            )}
        </header>
    );

    const renderHistoryList = () => (
        <div className="space-y-12">
            {renderHeader("Historical Archive", "Review and manage your master clinical documentation.")}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loadingHistory ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 bg-page animate-pulse rounded-[2.5rem]" />)
                ) : historyList.length === 0 ? (
                    <div className="col-span-full py-32 flex flex-col items-center gap-6 bg-page/50 rounded-[3rem] border-2 border-dashed border-border-card">
                        <History size={60} className="text-slate-200" />
                        <p className="text-muted opacity-80 font-black uppercase tracking-[0.2em]">No clinical records discovered yet.</p>
                        <Button variant="primary" size="lg" className="rounded-full px-12" onClick={() => setViewState('assistant')}>Record health narrative</Button>
                    </div>
                ) : (
                    historyList.map((record) => (
                        <motion.div
                            key={record._id || record.id}
                            whileHover={{ y: -8 }}
                            onClick={() => { setSelectedRecord(record); setViewState('detail'); }}
                            className="p-8 bg-card border border-border-card rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-50 hover:border-indigo-100 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-page flex items-center justify-center text-muted opacity-80 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Calendar size={18} />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted opacity-80 tracking-widest">{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Snapshot'}</span>
                                </div>
                                <div className="px-3 py-1 bg-slate-100 text-muted text-[8px] font-black tracking-widest rounded-full">Archive Record</div>
                            </div>

                            <h3 className="text-xl font-bold text-main mb-6 line-clamp-3 leading-tight tracking-tight group-hover:text-black">
                                {record.ai_notes || "Clinical Synthesis Snapshot"}
                            </h3>



                            <div className="flex flex-wrap gap-2 mt-auto pt-6 border-t border-slate-50">
                                {record.psychiatric_history && <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[8px] font-bold tracking-widest rounded-lg transition-colors group-hover:bg-indigo-100">Psychiatry</span>}
                                {record.medical_history && <span className="px-3 py-1.5 bg-rose-50 text-rose-700 text-[8px] font-bold tracking-widest rounded-lg transition-colors group-hover:bg-rose-100">Medical</span>}
                                {record.family_history && <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[8px] font-bold tracking-widest rounded-lg transition-colors group-hover:bg-emerald-100">Family</span>}
                                {record.trauma_history && <span className="px-3 py-1.5 bg-page text-main opacity-90 text-[8px] font-bold tracking-widest rounded-lg transition-colors group-hover:bg-slate-100">Trauma</span>}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );

    const renderAssistant = () => (
        <div className="space-y-12">


            {renderHeader(isProfessional ? "Clinical Extraction" : "History Assistant", "AI-Powered clinical entity extraction from your narrative.", true)}

            <AnimatePresence mode="wait">
                {!extractedData ? (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="grid lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="card-premium p-12 bg-card min-h-[500px] flex flex-col rounded-[3rem] shadow-xl border border-border-card relative">
                                <div className="absolute top-8 right-8 flex gap-4">
                                    {narrative && !isRecording && (
                                        <button
                                            onClick={() => setNarrative('')}
                                            className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all shadow-lg active:scale-90 group"
                                            title="Clear Narrative"
                                        >
                                            <RotateCcw size={20} className="group-hover:rotate-[-90deg] transition-transform duration-500" />
                                        </button>
                                    )}
                                    <button
                                        onClick={toggleRecording}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg border border-transparent ${isRecording
                                                ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
                                                : 'bg-card border-border-card text-indigo-500 hover:bg-page'
                                            }`}
                                    >
                                        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                                    </button>
                                </div>
                                <textarea
                                    className="flex-1 w-full p-8 text-xl font-medium text-main opacity-90 bg-page/50 rounded-[2.5rem] focus:outline-none focus:border-indigo-200 resize-none leading-relaxed"
                                    placeholder="Share your medical history narrative here..."
                                    value={narrative}
                                    onChange={(e) => setNarrative(e.target.value)}
                                />
                                <div className="mt-8 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isRecording && (
                                            <span className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest px-4 py-2 bg-red-50 rounded-full">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                                Recording Audio...
                                            </span>
                                        )}
                                    </div>
                                    <Button variant="primary" size="lg" className="rounded-full px-12 h-16" onClick={() => handleExtract()} isLoading={extracting} disabled={!narrative.trim() || isRecording} leftIcon={<Sparkles size={18} />}>
                                        {extracting ? 'Processing Narrative' : 'Extract Clinical Entities'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-4 space-y-10">
                            <div className="p-10 bg-indigo-600 rounded-[3rem] text-white space-y-8">
                                <h4 className="text-2xl font-black flex items-center gap-4"><Shield size={28} /> AI Protocol</h4>
                                <ul className="space-y-6">
                                    <li className="border-l-2 border-white/20 pl-6"><p className="text-[10px] font-black uppercase text-indigo-200">Entity Mapping</p><p className="text-sm mt-2 text-indigo-50">Detected medical conditions are automatically mapped to ICD formats.</p></li>
                                    <li className="border-l-2 border-white/20 pl-6"><p className="text-[10px] font-black uppercase text-indigo-200">Vault Privacy</p><p className="text-sm mt-2 text-indigo-50">Data is encrypted and stored in HIPAA-compliant volumes.</p></li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-12 relative pt-4">
                        {/* Clinical Risk Accent */}
                        <div className="absolute top-0 left-0 w-full h-1.5 rounded-full overflow-hidden flex">
                             <div className="h-full w-full" style={{ backgroundColor: extractedData?.color_code || '#6366f1' }} />
                        </div>

                        {/* Top Synthesis Dashboard */}
                        <div className="grid lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8">
                                <div className="p-10 bg-indigo-50 border border-indigo-100 rounded-[3rem] shadow-sm relative overflow-hidden group h-full">
                                     <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600/20" />
                                     <div className="flex items-center gap-3 mb-6">
                                         <Sparkles className="text-indigo-600" size={20} />
                                         <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Master Clinical Synthesis</h4>
                                     </div>
                                     <p className="text-xl font-bold text-indigo-950 leading-relaxed italic">
                                         "{extractedData?.ai_notes || 'Clinical analysis performed successfully.'}"
                                     </p>
                                </div>
                            </div>
                            <div className="lg:col-span-4">
                                <div className="p-10 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden h-full">
                                     <div className="absolute top-0 right-0 w-24 h-24 bg-rose-600 blur-[80px] opacity-20" />
                                     <h4 className="text-xl font-black mb-6 flex items-center gap-4 uppercase tracking-tighter"><ShieldAlert size={24} className="text-rose-500" /> Clinical Flags</h4>
                                     
                                     <div className="flex flex-wrap gap-2 mb-6">
                                         {extractedData?.risk_flags?.length ? extractedData.risk_flags.map((f: string, i: number) => (
                                             <span key={i} className="px-3 py-1.5 bg-rose-600/20 border border-rose-500/30 text-rose-200 text-[8px] font-black rounded-xl uppercase tracking-tight">{f}</span>
                                         )) : <span className="text-[9px] font-bold text-muted">Normal profile</span>}
                                     </div>

                                     <div className="grid grid-cols-2 gap-4">
                                         {extractedData?.treatment_resistance_risk && (
                                            <div className="p-4 bg-card/5 rounded-2xl border border-white/5">
                                                <p className="text-[7px] font-black text-indigo-400 uppercase mb-1">TRD</p>
                                                <p className="text-[9px] font-black uppercase">{extractedData.treatment_resistance_risk}</p>
                                            </div>
                                         )}
                                          {extractedData?.genetic_risk_summary && (
                                            <div className="p-4 bg-card/5 rounded-2xl border border-white/5">
                                                <p className="text-[7px] font-black text-emerald-400 uppercase mb-1">Genetic</p>
                                                <p className="text-[9px] font-black uppercase line-clamp-1">{extractedData.genetic_risk_summary}</p>
                                            </div>
                                         )}
                                     </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { label: 'Psychiatric', value: extractedData.psychiatric_history, icon: <Brain size={20} />, color: 'text-muted', bg: 'bg-page' },
                                { label: 'Medical', value: extractedData.medical_history, icon: <HeartPulse size={20} />, color: 'text-muted', bg: 'bg-page' },
                                { label: 'Substance Use', value: extractedData.substance_use, icon: <RotateCcw size={20} />, color: 'text-muted', bg: 'bg-page' },
                                { label: 'Family Status', value: extractedData.family_history, icon: <Users size={20} />, color: 'text-muted', bg: 'bg-page' },
                                { label: 'Developmental', value: extractedData.developmental_history, icon: <Activity size={20} />, color: 'text-muted', bg: 'bg-page' },
                                { label: 'Social Context', value: extractedData.social_history, icon: <Users size={20} />, color: 'text-muted', bg: 'bg-page' },
                                { label: 'Trauma Archive', value: extractedData.trauma_history, icon: <Shield size={20} />, color: 'text-muted', bg: 'bg-page' }
                            ].map((item, idx) => {
                                const formattedValue = formatInsightValue(item.value);
                                if (!formattedValue || formattedValue === 'Not specified') return null;
                                return (
                                    <div key={idx} className="p-8 bg-card border border-border-card rounded-[2.5rem] shadow-sm">
                                        <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6`}>{item.icon}</div>
                                        <p className="text-[10px] font-bold text-muted opacity-80 tracking-widest mb-3">{item.label}</p>
                                        <p className="text-sm font-bold text-main leading-relaxed">{formattedValue}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-16 bg-slate-900 rounded-[4rem] text-white flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black">Sync To Health Vault?</h3>
                                <p className="text-white/50 font-bold max-w-2xl">Confirming will structure this history into your master clinical record for your providers.</p>
                            </div>
                            <div className="flex gap-6 w-full lg:w-auto">
                                <Button 
                                    variant="white" 
                                    size="lg" 
                                    className="flex-1 lg:flex-none rounded-full px-12" 
                                    onClick={() => {
                                        setExtractedData(null);
                                        // If we have manual responses, go back to manual view
                                        if (Object.keys(manualResponses).length > 0) {
                                            setViewState('manual');
                                        }
                                    }}
                                >
                                    Edit Details
                                </Button>
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    className="flex-1 lg:flex-none rounded-full px-16 bg-emerald-500 border-none" 
                                    onClick={handleSave} 
                                    isLoading={saving} 
                                    leftIcon={<Save size={20} />}
                                >
                                    Persist Record
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const renderDetail = () => {
        if (!selectedRecord) return null;
        const record = selectedRecord as any;
        return (
            <div className="space-y-12">
                {renderHeader("Record Detailed Analysis", "Complete clinical synthesis record.", true)}

                <div className="card-premium p-12 bg-card rounded-[4rem] border border-border-card shadow-2xl relative overflow-hidden">
                    {/* Status accent bar */}
                    <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: record.color_code || '#6366f1' }} />
                    
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 shrink-0">
                                <Shield size={40} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Authenticated Synthesis</p>
                                <h3 className="text-3xl font-black text-main tracking-tight uppercase leading-none">Clinical Master Record</h3>
                                <p className="text-xs font-bold text-muted opacity-80 mt-2 uppercase tracking-widest">{record.createdAt ? new Date(record.createdAt).toLocaleString() : 'Historical Archive'}</p>
                            </div>
                        </div>
                        
                        {(record.genetic_risk_summary || record.treatment_resistance_risk) && (
                            <div className="flex flex-wrap gap-4">
                                {record.treatment_resistance_risk && record.treatment_resistance_risk !== 'None' && (
                                    <div className="px-6 py-3 bg-rose-50 border border-rose-100 rounded-2xl">
                                        <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-1">Treatment Resistance</p>
                                        <p className="text-xs font-black text-rose-700 uppercase">{record.treatment_resistance_risk}</p>
                                    </div>
                                )}
                                {record.genetic_risk_summary && (
                                     <div className="px-6 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                                        <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Genetic Predisposition</p>
                                        <p className="text-xs font-black text-amber-700 uppercase">{record.genetic_risk_summary}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-12 gap-12">
                        <div className={record.risk_flags?.length > 0 ? "lg:col-span-8 space-y-12" : "lg:col-span-12 space-y-12"}>
                            <section>
                                <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <Sparkles size={16} className="text-indigo-400" /> AI Clinical Conclusion
                                </p>
                                <div className="p-10 bg-indigo-50/50 rounded-[4rem] border border-indigo-100/50 shadow-inner">
                                    <p className="text-xl font-bold text-indigo-950 leading-relaxed italic">
                                        "{record.ai_notes || record.narrative || 'Detailed narrative history available for clinical review.'}"
                                    </p>
                                </div>
                            </section>

                            <section>
                                <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                                    <Shield size={16} className="text-emerald-400" /> Clinical Domain Synthesis
                                </p>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {Object.entries({
                                        'Psychiatric': <Brain size={24} className="text-indigo-600" />,
                                        'Medical': <HeartPulse size={24} className="text-rose-600" />,
                                        'Family': <Users size={24} className="text-emerald-600" />,
                                        'Substance': <RotateCcw size={24} className="text-orange-600" />,
                                        'Social': <Users size={24} className="text-sky-600" />,
                                        'Developmental': <Activity size={24} className="text-amber-600" />,
                                        'Trauma': <Shield size={24} className="text-muted" />
                                    }).map(([domain, icon]) => {
                                        const domainLower = domain.toLowerCase();
                                        const dataKey = domainLower === 'substance' ? 'substance_use' :
                                                    domainLower === 'trauma' ? 'trauma_history' :
                                                    domainLower === 'developmental' ? 'developmental_history' :
                                                    `${domainLower}_history`;
                                                    
                                        const domainData = record[dataKey];
                                        const formattedValue = formatInsightValue(domainData);
                                        if (!domainData || !formattedValue || formattedValue === 'Not specified') return null;
                                        
                                        return (
                                            <div key={domain} className="p-10 bg-card border border-border-card rounded-[3rem] shadow-sm hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/20 transition-all flex flex-col group">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-page flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                        {icon}
                                                    </div>
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-muted opacity-80 group-hover:text-indigo-600">{domain} Path</h5>
                                                </div>
                                                <p className="text-xs font-black text-main opacity-90 leading-relaxed uppercase">{formattedValue}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                        {record.risk_flags?.length > 0 && (
                            <div className="lg:col-span-4 space-y-8">
                                <div className="p-10 bg-rose-600 rounded-[4rem] text-white shadow-2xl shadow-rose-200 sticky top-8">
                                     <h4 className="text-2xl font-black mb-8 flex items-center gap-4"><ShieldAlert size={32} /> Risk Flags</h4>
                                     <ul className="space-y-6">
                                         {record.risk_flags.map((flag: string, i: number) => (
                                             <li key={i} className="flex items-center gap-4 p-4 bg-card/10 rounded-[1.5rem] border border-white/5">
                                                 <div className="w-2 h-2 rounded-full bg-card animate-pulse" />
                                                 <span className="text-[11px] font-black uppercase tracking-widest leading-none">{flag}</span>
                                             </li>
                                         ))}
                                     </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderManualForm = () => {
        const renderQuestion = (q: any) => {
            const value = manualResponses[q.key];

            return (
                <div key={q.key} className="p-10 bg-card border border-border-card rounded-[3rem] shadow-sm space-y-6">
                    <p className="text-lg font-black text-main opacity-90 block tracking-tight uppercase">
                        {q.patient_label || q.professional_label || q.label}
                    </p>

                    {q.type === 'boolean' && (
                        <div className="flex gap-4">
                            {[true, false].map((val) => (
                                <button
                                    key={val ? 'Yes' : 'No'}
                                    onClick={() => setManualResponses(prev => ({ ...prev, [q.key]: val }))}
                                    className={`px-8 py-3 rounded-full font-bold uppercase text-[10px] tracking-widest border transition-all ${
                                        manualResponses[q.key] === val
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                                        : 'bg-page text-muted border-border-card'
                                    }`}
                                >
                                    {val ? 'Yes' : 'No'}
                                </button>
                            ))}
                        </div>
                    )}

                    {(q.type === 'text' || q.type === 'number') && (
                        <input
                            type={q.type}
                            value={value || ''}
                            onChange={(e) => setManualResponses(prev => ({ ...prev, [q.key]: e.target.value }))}
                            className="w-full h-16 px-8 bg-page border border-border-card rounded-2xl focus:bg-card focus:border-indigo-600 transition-all font-bold outline-none"
                            placeholder={q.placeholder || "Provide details..."}
                        />
                    )}

                    {q.type === 'textarea' && (
                        <textarea
                            value={value || ''}
                            onChange={(e) => setManualResponses(prev => ({ ...prev, [q.key]: e.target.value }))}
                            className="w-full h-32 p-8 bg-page border border-border-card rounded-3xl focus:bg-card focus:border-indigo-600 transition-all font-bold outline-none resize-none"
                            placeholder={q.placeholder || "Provide details..."}
                        />
                    )}

                    {q.type === 'select' && (
                        <div className="relative">
                            <select
                                value={value || ''}
                                onChange={(e) => setManualResponses(prev => ({ ...prev, [q.key]: e.target.value }))}
                                className="w-full h-16 px-8 bg-page border border-border-card rounded-2xl focus:bg-card focus:border-indigo-600 transition-all font-bold appearance-none cursor-pointer outline-none"
                            >
                                <option value="">Select Option</option>
                                {q.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 rotate-90 text-muted opacity-80 pointer-events-none" size={16} />
                        </div>
                    )}

                    {q.type === 'multiselect' && (
                        <div className="flex flex-wrap gap-3">
                            {q.options?.map((opt: string) => (
                                <button
                                    key={opt}
                                    onClick={() => {
                                        const current = Array.isArray(value) ? value : [];
                                        const next = current.includes(opt) 
                                            ? current.filter((v: any) => v !== opt) 
                                            : [...current, opt];
                                        setManualResponses(prev => ({ ...prev, [q.key]: next }));
                                    }}
                                    className={`px-6 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest border transition-all ${
                                        Array.isArray(value) && value.includes(opt)
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-card text-main border-border-card hover:border-indigo-200'
                                    }`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}

                    {q.type === 'boolean_group' && (
                        <div className="space-y-8 pt-6 border-t border-slate-50">
                            {q.fields?.map((f: any, fIdx: number) => {
                                const primaryFieldKey = q.fields[0].key;
                                const primaryValue = manualResponses[q.key]?.[primaryFieldKey];
                                const isVisible = fIdx === 0 || (primaryValue === true || (typeof primaryValue === 'string' && primaryValue !== 'Never' && primaryValue !== ''));

                                if (!isVisible) return null;

                                return (
                                   <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={f.key} className="space-y-4">
                                       <p className="text-[10px] font-black text-main uppercase tracking-widest">{f.label}</p>
                                       {f.type === 'boolean' && (
                                           <div className="flex gap-4">
                                               {[true, false].map((val) => (
                                                   <button
                                                       key={val ? 'Yes' : 'No'}
                                                       onClick={() => setManualResponses(prev => ({ 
                                                           ...prev, 
                                                           [q.key]: { ...(prev[q.key] || {}), [f.key]: val } 
                                                       }))}
                                                       className={`px-8 py-3 rounded-full font-bold uppercase text-[10px] tracking-widest border transition-all ${
                                                           manualResponses[q.key]?.[f.key] === val
                                                           ? 'bg-indigo-600 text-white shadow-md'
                                                           : 'bg-page text-muted opacity-80'
                                                       }`}
                                                   >
                                                       {val ? 'Yes' : 'No'}
                                                   </button>
                                               ))}
                                           </div>
                                       )}
                                       {(f.type === 'text' || f.type === 'textarea') && (
                                           <input
                                               type="text"
                                               value={manualResponses[q.key]?.[f.key] || ''}
                                               onChange={(e) => setManualResponses(prev => ({ 
                                                   ...prev, 
                                                   [q.key]: { ...(prev[q.key] || {}), [f.key]: e.target.value } 
                                               }))}
                                               className="w-full h-14 px-6 bg-page border border-border-card rounded-xl focus:bg-card font-bold transition-all outline-none"
                                               placeholder="Enter details..."
                                           />
                                       )}
                                       {f.type === 'select' && (
                                            <div className="relative">
                                                <select
                                                    value={manualResponses[q.key]?.[f.key] || ''}
                                                    onChange={(e) => setManualResponses(prev => ({ 
                                                        ...prev, 
                                                        [q.key]: { ...(prev[q.key] || {}), [f.key]: e.target.value } 
                                                    }))}
                                                    className="w-full h-14 px-6 bg-page border border-border-card rounded-xl focus:bg-card font-bold outline-none appearance-none"
                                                >
                                                    <option value="">Select Option</option>
                                                    {f.options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                                </select>
                                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted opacity-80 pointer-events-none" size={14} />
                                            </div>
                                       )}
                                   </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {q.type === 'array' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {(Array.isArray(value) ? value : []).map((item: any, idx: number) => (
                                    <div key={idx} className="p-6 bg-page rounded-3xl space-y-4 relative group">
                                        <button 
                                            onClick={() => {
                                                const next = value.filter((_: any, i: number) => i !== idx);
                                                setManualResponses(prev => ({ ...prev, [q.key]: next }));
                                            }}
                                            className="absolute -top-2 -right-2 w-8 h-8 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            {q.item_structure?.map((field: any) => (
                                                <div key={field.key}>
                                                    <p className="text-[10px] font-black text-main uppercase tracking-widest mb-1">{field.label}</p>
                                                    <input
                                                        type="text"
                                                        value={item[field.key] || ''}
                                                        onChange={(e) => {
                                                            const next = [...value];
                                                            next[idx] = { ...next[idx], [field.key]: e.target.value };
                                                            setManualResponses(prev => ({ ...prev, [q.key]: next }));
                                                        }}
                                                        className="w-full h-10 px-4 bg-card border border-border-card rounded-lg focus:border-indigo-600 transition-all text-xs font-bold"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => {
                                    const baseItem: any = {};
                                    q.item_structure?.forEach((f: any) => baseItem[f.key] = '');
                                    setManualResponses(prev => ({ ...prev, [q.key]: [...(Array.isArray(value) ? value : []), baseItem] }));
                                }}
                                className="flex items-center gap-2 text-indigo-600 font-bold hover:gap-4 transition-all uppercase text-[11px] tracking-widest pl-2"
                            >
                                <Plus size={16} /> Add {q.label.split(' ')[0]} Entry
                            </button>
                        </div>
                    )}
                </div>
            );
        };

        return (
            <div className="space-y-12">
                {renderHeader("Structured Questionnaire", "Provide detailed health observations via clinical form.", true)}
                
                {fetchingQuestions ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                        <p className="text-muted opacity-80 font-bold uppercase tracking-widest text-xs">Accessing Question Library...</p>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-16">
                        {questions.map((section: any, sIdx: number) => (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} key={sIdx} className="space-y-8">
                                <div className="flex items-center gap-4 border-l-4 border-indigo-600 pl-6 py-2">
                                    <h3 className="text-2xl font-black text-main uppercase tracking-tight">{section.title}</h3>
                                </div>
                                <div className="grid gap-6">
                                    {section.questions.map((q: any) => renderQuestion(q))}
                                </div>
                            </motion.div>
                        ))}
                        
                        <div className="pt-12 border-t border-border-card flex justify-end gap-6">
                            <Button variant="white" size="lg" className="rounded-full px-12 h-16" onClick={() => setViewState('list')}>Cancel</Button>
                            <Button variant="primary" size="lg" className="rounded-full px-16 h-16 bg-emerald-600 border-none shadow-xl shadow-emerald-100" onClick={handleManualSave} isLoading={saving}>Finalize Manual Entry</Button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-12 pb-32 animate-fade-in">
            {viewState === 'list' && renderHistoryList()}
            {viewState === 'assistant' && renderAssistant()}
            {viewState === 'detail' && renderDetail()}
            {viewState === 'manual' && renderManualForm()}
        </div>
    );
};

export default HistoryAssistantPage;
