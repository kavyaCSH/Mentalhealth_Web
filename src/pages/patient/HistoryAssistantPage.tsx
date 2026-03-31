import { useState, useEffect } from 'react';
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
    Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PastHistoryService } from '../../api/services/pastHistory.service';
import type { PastHistoryResponse } from '../../types/pastHistory.types';
import Button from '../../components/ui/Button';

type ViewState = 'list' | 'assistant' | 'detail';

const HistoryAssistantPage = () => {
    const { user } = useAuth();
    const patientId = user?.id || user?._id || '';

    // Navigation State
    const [viewState, setViewState] = useState<ViewState>('list');
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

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';

            rec.onresult = (event: any) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                setNarrative(prev => prev.endsWith(' ') || prev === '' ? prev + transcript : prev + ' ' + transcript);
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
        if (!extractedData && !narrative.trim()) return;
        try {
            setSaving(true);
            const payload: any = {
                ...extractedData,
                patient_id: patientId,
                narrative: narrative,
                status: 'completed'
            };
            const res = await PastHistoryService.createPastHistory(payload);
            const success = res.success || (res as any).code === 201 || (res as any).code === 200 || !!(res as any).data;
            if (success) {
                setViewState('list');
                setExtractedData(null);
                setNarrative('');
                fetchHistory();
            }
        } catch (error) {
            console.error('Save failed:', error);
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
                    if (item.name) return `${item.name}${item.dose ? ' ' + item.dose : ''}${item.duration ? ' (' + item.duration + ')' : ''}`;
                    if (item.relative) return `${item.relative}: ${item.condition}`;
                    if (item.drug) return `${item.drug}${item.frequency ? ' (' + item.frequency + ')' : ''}`;
                    return formatInsightValue(item);
                }
                return String(item);
            }).filter(Boolean).join(', ');
        }

        if (typeof value === 'object') {
            const entries = Object.entries(value)
                .filter(([_, v]) => v != null && v !== false && v !== '' && v !== 'None' && v !== 'Unknown')
                .map(([k, v]) => {
                    if (k === 'detected') return null;
                    if (Array.isArray(v)) {
                        const subArr = formatInsightValue(v);
                        return subArr ? `${k.replace(/_/g, ' ')}: ${subArr}` : null;
                    }
                    if (typeof v === 'object' && v !== null) {
                        const subObj = Object.entries(v)
                            .filter(([sk, sv]) => sv != null && sv !== '' && sv !== 'Unknown' && sv !== 'None' && sk !== 'detected')
                            .map(([_, sv]) => sv)
                            .join(' ');
                        return subObj ? `${k.replace(/_/g, ' ')}: ${subObj}` : null;
                    }
                    return `${k.replace(/_/g, ' ')}: ${v}`;
                })
                .filter(Boolean);
            return entries.join(' | ');
        }
        return String(value);
    };

    const renderHeader = (title: string, subtitle: string, showBack = false) => (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-10">
            <div className="space-y-4">
                <nav className="flex items-center gap-3">
                    {showBack && (
                        <button onClick={() => { setViewState('list'); setExtractedData(null); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </button>
                    )}
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-3 py-1 bg-indigo-50 rounded-full">Historical Archive</span>
                    <ChevronRight size={14} className="text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{viewState === 'list' ? 'Clinical Center' : 'Extraction Hub'}</span>
                </nav>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-2">{title}</h1>
                <p className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">{subtitle}</p>
            </div>

            {viewState === 'list' && (
                <button onClick={() => setViewState('assistant')} className="h-16 px-10 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-4 hover:scale-105 transition-transform active:scale-95">
                    <Plus size={20} /> Record New History
                </button>
            )}
        </header>
    );

    const renderHistoryList = () => (
        <div className="space-y-12">
            {renderHeader("Historical Archive", "Review and manage your master clinical documentation.")}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loadingHistory ? (
                    Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[2.5rem]" />)
                ) : historyList.length === 0 ? (
                    <div className="col-span-full py-32 flex flex-col items-center gap-6 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <History size={60} className="text-slate-200" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em]">No clinical records discovered yet.</p>
                        <Button variant="primary" size="lg" className="rounded-full px-12" onClick={() => setViewState('assistant')}>Record health narrative</Button>
                    </div>
                ) : (
                    historyList.map((record) => (
                        <motion.div
                            key={record._id || record.id}
                            whileHover={{ y: -8 }}
                            onClick={() => { setSelectedRecord(record); setViewState('detail'); }}
                            className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-50 hover:border-indigo-100 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Calendar size={18} />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Snapshot'}</span>
                                </div>
                                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-full">Archive Record</div>
                            </div>

                            <h3 className="text-lg font-black text-slate-800 mb-4 line-clamp-2 leading-tight uppercase tracking-tight">
                                {record.ai_notes || record.narrative || "Clinical Synthesis Snapshot"}
                            </h3>

                            <div className="flex flex-wrap gap-2 mt-auto pt-6 border-t border-slate-50">
                                {record.psychiatric_history && <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-lg">Psychiatry</span>}
                                {record.medical_history && <span className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-lg">Medical</span>}
                                {record.family_history && <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-lg">Family</span>}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );

    const renderAssistant = () => (
        <div className="space-y-12">
            {renderHeader("History Assistant", "AI-Powered clinical entity extraction from your narrative.", true)}

            <AnimatePresence mode="wait">
                {!extractedData ? (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} className="grid lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="card-premium p-12 bg-white min-h-[500px] flex flex-col rounded-[3rem] shadow-xl border border-slate-100 relative">
                                <div className="absolute top-8 right-8 flex gap-3">
                                    <button
                                        onClick={toggleRecording}
                                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isRecording
                                                ? 'bg-red-500 text-white animate-pulse'
                                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                            }`}
                                    >
                                        {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                                    </button>
                                </div>
                                <textarea
                                    className="flex-1 w-full p-8 text-xl font-medium text-slate-700 bg-slate-50/50 rounded-[2.5rem] focus:outline-none focus:border-indigo-200 resize-none leading-relaxed"
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
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { label: 'Psychiatric', value: extractedData.psychiatric_history?.previous_diagnosis || extractedData.psychiatric_history?.previous_episodes, icon: <Brain size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'Condition/Meds', value: extractedData.psychiatric_history?.previous_treatments || extractedData.medical_history?.chronic_conditions, icon: <Activity size={20} />, color: 'text-rose-600', bg: 'bg-rose-50' },
                                { label: 'Family Status', value: extractedData.family_history?.conditions || extractedData.family_history, icon: <Users size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                                { label: 'Substance Use', value: extractedData.substance_use, icon: <RotateCcw size={20} />, color: 'text-orange-600', bg: 'bg-orange-50' }
                            ].map((item, idx) => item.value ? (
                                <div key={idx} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
                                    <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6`}>{item.icon}</div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{item.label}</p>
                                    <p className="text-sm font-black text-slate-800 leading-relaxed uppercase">{formatInsightValue(item.value)}</p>
                                </div>
                            ) : null)}
                        </div>
                        <div className="p-16 bg-slate-900 rounded-[4rem] text-white flex flex-col lg:flex-row items-center justify-between gap-12 text-center lg:text-left">
                            <div className="space-y-4">
                                <h3 className="text-4xl font-black">Sync To Health Vault?</h3>
                                <p className="text-white/50 font-bold max-w-2xl">Confirming will structure this history into your master clinical record for your providers.</p>
                            </div>
                            <div className="flex gap-6 w-full lg:w-auto">
                                <Button variant="white" size="lg" className="flex-1 lg:flex-none rounded-full px-12" onClick={() => setExtractedData(null)}>Edit details</Button>
                                <Button variant="primary" size="lg" className="flex-1 lg:flex-none rounded-full px-16 bg-emerald-500 border-none" onClick={handleSave} isLoading={saving} leftIcon={<Save size={20} />}>Save Record</Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const renderDetail = () => {
        if (!selectedRecord) return null;
        return (
            <div className="space-y-12">
                {renderHeader("Record Detailed Analysis", "Complete clinical synthesis record.", true)}

                <div className="card-premium p-12 bg-white rounded-[4rem] border border-slate-100 shadow-2xl relative">
                    <div className="flex items-center gap-4 mb-12">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200">
                            <Shield size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Clinical Record Synthesis</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleString() : 'Historical Archive'}</p>
                        </div>
                    </div>

                    <div className="p-10 bg-slate-50 rounded-[3rem] italic text-slate-600 font-bold mb-12 border-l-8 border-indigo-600 leading-relaxed">
                        "{selectedRecord.ai_notes || selectedRecord.narrative || 'Detailed narrative history available for clinical review.'}"
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Object.entries({
                            'Psychiatric': <Brain size={24} className="text-indigo-600" />,
                            'Medical': <HeartPulse size={24} className="text-rose-600" />,
                            'Family': <Users size={24} className="text-emerald-600" />,
                            'Substance': <RotateCcw size={24} className="text-orange-600" />,
                            'Social': <Users size={24} className="text-sky-600" />
                        }).map(([domain, icon]) => {
                            const dataKey = `${domain.toLowerCase()}_history`;
                            const domainData = (selectedRecord as any)[dataKey === 'substance_history' ? 'substance_use' : dataKey];
                            if (!domainData) return null;
                            return (
                                <div key={domain} className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:border-indigo-100 transition-all">
                                    <div className="flex items-center gap-4 mb-6">
                                        {icon}
                                        <h5 className="text-[10px] font-black uppercase tracking-widest">{domain} Path</h5>
                                    </div>
                                    <p className="text-xs font-black text-slate-700 leading-relaxed uppercase">{formatInsightValue(domainData)}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-12 pb-32 animate-fade-in">
            {viewState === 'list' && renderHistoryList()}
            {viewState === 'assistant' && renderAssistant()}
            {viewState === 'detail' && renderDetail()}
        </div>
    );
};

export default HistoryAssistantPage;
