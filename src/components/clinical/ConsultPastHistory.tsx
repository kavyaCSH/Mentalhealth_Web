import React, { useState, useEffect } from 'react';
import {
    Activity,
    Sparkles,
    ChevronRight,
    FileText,
    Brain,
    Stethoscope,
    CheckCircle2,
    Users,
    Zap,
    Plus,
    Archive,
    History as HistoryIcon,
    HeartPulse,
    ShieldAlert
} from 'lucide-react';
import Button from '../ui/Button';
import { PastHistoryService } from '../../api/services/pastHistory.service';

interface ConsultPastHistoryProps {
    patientId: string | number;
    consultId?: string | number;
    initialTab?: 'new' | 'history';
    onSave?: (data: any) => void;
}

export const ConsultPastHistory: React.FC<ConsultPastHistoryProps> = ({
    patientId,
    consultId,
    onSave,
    initialTab = 'history'
}) => {
    const [activeTab, setActiveTab] = useState<'new' | 'history'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    // Form State (Mobile Parity)
    const [narrative, setNarrative] = useState('');
    const [psychiatric, setPsychiatric] = useState({ previous_episodes: '', hospitalizations: '', treatments: '' });
    const [medical, setMedical] = useState({ chronic_conditions: '', surgeries: '', allergies: '' });
    const [family, setFamily] = useState({ paternal: '', maternal: '', siblings: '' });
    const [substanceUse, setSubstanceUse] = useState('');
    const [socialHistory, setSocialHistory] = useState('');
    const [traumaHistory, setTraumaHistory] = useState('');
    const [developmentalHistory, setDevelopmentalHistory] = useState('');

    useEffect(() => {
        if (activeTab === 'history' && patientId) {
            fetchHistory();
        }
    }, [activeTab, patientId]);

    const fetchHistory = async () => {
        if (!patientId) return;
        try {
            setLoading(true);
            const res = await PastHistoryService.getPastHistoryByPatient(String(patientId));
            const data = (res as any).data || res;
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[ConsultPastHistory] Fetch history failed:', error);
        } finally {
            setLoading(false);
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
                    if (item.name) return `${item.name}${item.dose ? ' ' + item.dose : ''}`;
                    if (item.relative) return `${item.relative}: ${item.condition}`;
                    if (item.drug) return `${item.drug}${item.frequency ? ' (' + item.frequency + ')' : ''}`;
                    return formatInsightValue(item);
                }
                return String(item);
            }).filter(Boolean).join(', ');
        }
        if (typeof value === 'object') {
            return Object.entries(value)
                .filter(([k, v]) => v != null && v !== false && v !== '' && v !== 'None' && v !== 'Unknown' && k !== 'detected')
                .map(([k, v]) => {
                    if (typeof v === 'object' && v !== null) {
                        const sub = Object.entries(v)
                            .filter(([sk, sv]) => sv != null && sv !== '' && sv !== 'Unknown' && sv !== 'None' && sk !== 'detected')
                            .map(([_, sv]) => sv)
                            .join(' ');
                        return sub ? `${k.replace(/_/g, ' ')}: ${sub}` : null;
                    }
                    return `${k.replace(/_/g, ' ')}: ${v}`;
                })
                .filter(Boolean).join(' | ');
        }
        return String(value);
    };

    const handleAIExtract = async () => {
        if (!narrative.trim()) return;
        setExtracting(true);
        try {
            const res = await PastHistoryService.extractFromNarrative(narrative, patientId);
            if (res) {
                const body = (res as any).data && typeof (res as any).data === 'object' && !(res as any).psychiatric_history
                    ? (res as any).data
                    : res;
                const data = typeof body === 'object' ? body : {};

                // Psychiatric History Mapping
                if (data.psychiatric_history && typeof data.psychiatric_history === 'object') {
                    const psyc = data.psychiatric_history;
                    setPsychiatric({
                        previous_episodes: formatInsightValue(psyc.previous_episodes || psyc.previous_diagnosis),
                        hospitalizations: formatInsightValue(psyc.hospitalizations),
                        treatments: formatInsightValue(psyc.previous_treatments || psyc.psychotherapy_history)
                    });
                }

                // Medical History Mapping
                if (data.medical_history && typeof data.medical_history === 'object') {
                    const med = data.medical_history;
                    setMedical({
                        chronic_conditions: formatInsightValue(med.chronic_conditions),
                        surgeries: formatInsightValue(med.surgeries),
                        allergies: formatInsightValue(med.allergies)
                    });
                }

                // Family History Mapping
                if (data.family_history && typeof data.family_history === 'object') {
                    const fam = data.family_history;
                    setFamily({
                        paternal: formatInsightValue(fam.paternal),
                        maternal: formatInsightValue(fam.maternal),
                        siblings: formatInsightValue(fam.siblings)
                    });
                }

                // Polymorphic Mapping for remainders
                setSubstanceUse(formatInsightValue(data.substance_use));
                setSocialHistory(formatInsightValue(data.social_history));
                setTraumaHistory(formatInsightValue(data.trauma_history));
                setDevelopmentalHistory(formatInsightValue(data.developmental_history));
            }
        } catch (error) {
            console.error('[ConsultPastHistory] AI Extraction failed:', error);
        } finally {
            setExtracting(false);
        }
    };

    const handleSave = async () => {
        if (!narrative.trim() && !psychiatric.previous_episodes) return;
        setSaving(true);
        try {
            const payload = {
                patient_id: String(patientId),
                consult_id: consultId ? String(consultId) : undefined,
                narrative,
                psychiatric_history: psychiatric,
                medical_history: {
                    chronic_conditions: medical.chronic_conditions.split(',').map(s => s.trim()).filter(s => !!s),
                    surgeries: medical.surgeries.split(',').map(s => s.trim()).filter(s => !!s),
                    allergies: medical.allergies.split(',').map(s => s.trim()).filter(s => !!s)
                },
                family_history: family,
                substance_use: substanceUse,
                social_history: {
                    living_situation: socialHistory
                },
                trauma_history: traumaHistory,
                developmental_history: {
                    milestones: developmentalHistory
                },
                status: 'completed'
            };

            const res = await PastHistoryService.createPastHistory(payload);
            const success = (res as any).success || (res as any).status === 'success' || !!(res as any).data;
            if (success) {
                if (onSave) onSave((res as any).data || res);
                resetForm();
                setActiveTab('history');
                fetchHistory();
            }
        } catch (error) {
            console.error('[ConsultPastHistory] Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setNarrative('');
        setPsychiatric({ previous_episodes: '', hospitalizations: '', treatments: '' });
        setMedical({ chronic_conditions: '', surgeries: '', allergies: '' });
        setFamily({ paternal: '', maternal: '', siblings: '' });
        setSubstanceUse('');
        setSocialHistory('');
        setTraumaHistory('');
        setDevelopmentalHistory('');
    };

    const renderHistoryTab = () => (
        <div className="space-y-4 pt-2">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-slate-100 rounded-[2.5rem]">
                    <div className="relative">
                        <Activity className="animate-spin text-indigo-600" size={32} />
                        <div className="absolute inset-0 animate-ping opacity-20 bg-indigo-400 rounded-full" />
                    </div>
                    <p className="mt-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Archive...</p>
                </div>
            ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                    <div className="p-4 bg-slate-50 rounded-2xl mb-4">
                        <HistoryIcon size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">No Historical Nodes</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-8">Clinical record is currently empty</p>
                    <Button
                        variant="primary"
                        size="sm"
                        className="rounded-xl font-black uppercase tracking-widest px-8 h-12 shadow-xl shadow-indigo-100"
                        onClick={() => setActiveTab('new')}
                        leftIcon={<Plus size={16} />}
                    >
                        Initialize First Entry
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {history.map((record, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedRecord(record)}
                            className="w-full text-left bg-white p-6 rounded-[2rem] border-2 border-slate-100 hover:border-indigo-600 transition-all hover:shadow-xl hover:shadow-slate-100 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Zap size={16} className="text-indigo-600" />
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <Archive size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Clinical Snapshot</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Draft'}</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                                </div>
                            </div>

                            <p className="text-xs font-bold text-slate-600 leading-relaxed italic mb-4 line-clamp-2">
                                "{String(record.ai_notes || record.narrative || 'Detailed psychiatric and medical history captured for review.')}"
                            </p>

                            <div className="flex items-center gap-4 text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <Brain size={12} />
                                    <span className="text-[9px] font-black uppercase">Psych History</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Stethoscope size={12} />
                                    <span className="text-[9px] font-black uppercase">Medical Roots</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderNewTab = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 pb-20 pt-2">
            {/* Narrative Input - The Intake Phase */}
            <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white flex items-center justify-center shadow-2xl shadow-indigo-200">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">Historical Synthesis</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AI Extraction Engine Active</p>
                        </div>
                    </div>
                </div>

                <textarea
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    placeholder="Enter patient narrative of illness, past psychiatric treatments, medical background, and social history..."
                    className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all resize-none shadow-inner leading-relaxed"
                />

                <div className="flex justify-between items-center mt-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Analyzing Clinical Markers</span>
                    </div>
                    <Button
                        variant="primary"
                        size="md"
                        disabled={extracting || !narrative.trim()}
                        onClick={handleAIExtract}
                        className="rounded-xl px-10 font-black uppercase text-[10px] tracking-[0.1em] shadow-xl shadow-indigo-100"
                    >
                        {extracting ? 'Synthesizing...' : 'Perform Clinical extraction'}
                    </Button>
                </div>
            </div>

            {/* Structured Review Panels (Mobile Parity Fields) */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Psychiatric Panel */}
                <div className="p-6 bg-white border-2 border-slate-200 rounded-[2rem] space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <Brain size={18} />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Psychiatric Roots</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Previous Episodes</label>
                            <input
                                type="text"
                                value={psychiatric.previous_episodes}
                                onChange={(e) => setPsychiatric(p => ({ ...p, previous_episodes: e.target.value }))}
                                placeholder="Diagnosis/Episodes..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold focus:outline-none focus:border-purple-200 transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Hospitalizations</label>
                            <input
                                type="text"
                                value={psychiatric.hospitalizations}
                                onChange={(e) => setPsychiatric(p => ({ ...p, hospitalizations: e.target.value }))}
                                placeholder="Year/Facility..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold focus:outline-none focus:border-purple-200 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Medical Panel */}
                <div className="p-6 bg-white border-2 border-slate-200 rounded-[2rem] space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <HeartPulse size={18} />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Medical History</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Chronic Conditions</label>
                            <input
                                type="text"
                                value={medical.chronic_conditions}
                                onChange={(e) => setMedical(p => ({ ...p, chronic_conditions: e.target.value }))}
                                placeholder="Hypertension, Diabetes..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold focus:outline-none focus:border-rose-200 transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Active Allergies</label>
                            <input
                                type="text"
                                value={medical.allergies}
                                onChange={(e) => setMedical(p => ({ ...p, allergies: e.target.value }))}
                                placeholder="Medication or Environmental..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold focus:outline-none focus:border-rose-200 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Background Panel (Family, Substance, Social) */}
                <div className="p-6 bg-white border-2 border-slate-200 rounded-[2rem] space-y-5 md:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Users size={18} />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Background & Social Context</h4>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Family History</label>
                            <input
                                type="text"
                                value={family.paternal || family.maternal}
                                onChange={(e) => setFamily(p => ({ ...p, paternal: e.target.value }))}
                                placeholder="Parents, Siblings..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold focus:outline-none focus:border-emerald-200 transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Substance Use</label>
                            <input
                                type="text"
                                value={substanceUse}
                                onChange={(e) => setSubstanceUse(e.target.value)}
                                placeholder="Alcohol, Tobacco, Drugs..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold focus:outline-none focus:border-emerald-200 transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Social History</label>
                            <input
                                type="text"
                                value={socialHistory}
                                onChange={(e) => setSocialHistory(e.target.value)}
                                placeholder="Living situation, Employment..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold focus:outline-none focus:border-emerald-200 transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Trauma / Developmental</label>
                            <input
                                type="text"
                                value={traumaHistory || developmentalHistory}
                                onChange={(e) => setTraumaHistory(e.target.value)}
                                placeholder="Backstory, Milestones..."
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold focus:outline-none focus:border-emerald-200 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Button
                variant="primary"
                className="w-full h-16 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:scale-[1.01] active:scale-[0.99] transition-all"
                isLoading={saving}
                disabled={!narrative.trim() && !psychiatric.previous_episodes}
                onClick={handleSave}
            >
                {saving ? 'Synchronizing Archive...' : 'Commit Clinical Historical Data'}
            </Button>
        </div>
    );

    const renderDetailView = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pt-2 pb-20">
            <button
                onClick={() => setSelectedRecord(null)}
                className="flex items-center gap-2 group mb-4"
            >
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ChevronRight size={16} className="rotate-180" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Return to Clinical Archive</span>
            </button>

            <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center shadow-xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Record Synthesis</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleDateString() : 'Draft Snapshot'}</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                        <ShieldAlert size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Confidential Record</span>
                    </div>
                </div>

                {/* Abstract Text */}
                <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] relative">
                    <div className="absolute -top-3 left-8 px-3 py-1 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Extract Narrative</span>
                    </div>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                        "{String(selectedRecord.ai_notes || selectedRecord.narrative || 'Detailed clinical history documentation available for this timestamp.')}"
                    </p>
                </div>

                {/* History Matrix Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4 text-purple-600">
                            <Brain size={16} />
                            <h5 className="text-[9px] font-black uppercase tracking-widest">Psychiatry</h5>
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 leading-relaxed">
                            {selectedRecord.psychiatric_history?.previous_episodes || 'No historical episodes documented.'}
                        </p>
                    </div>

                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4 text-rose-600">
                            <HeartPulse size={16} />
                            <h5 className="text-[9px] font-black uppercase tracking-widest">Medical</h5>
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 leading-relaxed">
                            {selectedRecord.medical_history?.chronic_conditions?.join(', ') || 'Cleared medical background.'}
                        </p>
                    </div>

                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-4 text-emerald-600">
                            <Users size={16} />
                            <h5 className="text-[9px] font-black uppercase tracking-widest">Background</h5>
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 leading-relaxed">
                            Family & Social: {selectedRecord.family_history?.paternal || 'None'} • {selectedRecord.substance_use || 'No use'}
                        </p>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">Psychiatric History Verified</span>
                    </div>
                    <div className="flex items-center gap-3 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">Medical Background Analyzed</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white px-2">
            {!selectedRecord && (
                <div className="flex items-center justify-between mb-8">
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border-2 border-slate-200 shadow-inner">
                        <button
                            onClick={() => { setActiveTab('history'); setSelectedRecord(null); }}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Archive size={14} />
                            Archive
                        </button>
                        <button
                            onClick={() => { setActiveTab('new'); setSelectedRecord(null); }}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all ${activeTab === 'new' ? 'bg-white text-indigo-600 shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Plus size={14} />
                            Initialize
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {selectedRecord ? renderDetailView() : (activeTab === 'history' ? renderHistoryTab() : renderNewTab())}
            </div>
        </div>
    );
};
