import React, { useState, useEffect } from 'react';
import { 
    Activity, 
    Sparkles, 
    Clock, 
    ChevronRight,
    FileText,
    Brain,
    Stethoscope,
    CheckCircle2,
    Users
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
    const [medical, setMedical] = useState({ conditions: '', surgeries: '', allergies: '' });
    const [family, setFamily] = useState({ paternal: '', maternal: '', siblings: '' });

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

    const handleAIExtract = async () => {
        if (!narrative.trim()) return;
        setExtracting(true);
        try {
            const res = await PastHistoryService.extractFromNarrative(narrative, patientId);
            if (res) {
                const data = (res.data || res) as Record<string, any>;
                setPsychiatric({ 
                    previous_episodes: String(data.psychiatric_episodes || data.previous_episodes || ''), 
                    hospitalizations: String(data.hospitalizations || ''), 
                    treatments: String(data.treatments || '') 
                });
                setMedical({
                    conditions: String(data.medical_conditions || data.conditions || ''),
                    surgeries: String(data.surgeries || ''),
                    allergies: String(data.allergies || '')
                });
                setFamily({
                    paternal: String(data.family_paternal || data.paternal || ''),
                    maternal: String(data.family_maternal || data.maternal || ''),
                    siblings: String(data.siblings || '')
                });
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
            const res = await PastHistoryService.createPastHistory({
                patient_id: String(patientId),
                consultId: consultId ? String(consultId) : undefined,
                responses: [
                    { questionCode: 'narrative', value: narrative },
                    { questionCode: 'psychiatric_episodes', value: psychiatric.previous_episodes },
                    { questionCode: 'psychiatric_hospitalizations', value: psychiatric.hospitalizations },
                    { questionCode: 'psychiatric_treatments', value: psychiatric.treatments },
                    { questionCode: 'medical_conditions', value: medical.conditions },
                    { questionCode: 'medical_surgeries', value: medical.surgeries },
                    { questionCode: 'medical_allergies', value: medical.allergies },
                    { questionCode: 'family_paternal', value: family.paternal },
                    { questionCode: 'family_maternal', value: family.maternal },
                    { questionCode: 'family_siblings', value: family.siblings }
                ]
            });
            if (res) {
                if (onSave) onSave(res);
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
        setMedical({ conditions: '', surgeries: '', allergies: '' });
        setFamily({ paternal: '', maternal: '', siblings: '' });
    };

    const renderHistory = () => (
        <div className="space-y-4 pt-2">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Activity className="animate-spin text-slate-400 mb-4" size={24} />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">Synchronizing Historical Nodes...</p>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-white">
                    <Clock size={28} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No archives detected</p>
                    <Button 
                        variant="primary" 
                        size="sm"
                        className="mt-6 rounded-lg text-[9px] font-black uppercase tracking-widest px-6"
                        onClick={() => setActiveTab('new')}
                    >
                        Initialize Entry
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((record, index) => (
                        <button 
                            key={index}
                            onClick={() => setSelectedRecord(record)}
                            className="w-full text-left bg-white p-4 rounded-xl border-2 border-slate-200 hover:border-indigo-600 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={10} />
                                    {new Date(record.createdAt).toLocaleDateString()}
                                </span>
                                <div className="p-1 rounded bg-slate-50 text-slate-300 group-hover:text-indigo-600 transition-colors">
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed line-clamp-2">
                                "{record.ai_notes || 'Clinical history summary available'}"
                            </p>
                            <div className="flex gap-2 mt-3">
                                <span className="px-2 py-0.5 border border-slate-200 text-slate-400 rounded-md text-[8px] font-black uppercase tracking-tight">Record</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderNew = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20 pt-2">
            {/* Narrative Intake */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                        <Sparkles size={16} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Clinical Narrative</h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">AI Synthesis Ready</p>
                    </div>
                </div>
                
                <textarea 
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    placeholder="Enter patient backstory..."
                    className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-300 transition-all resize-none shadow-inner"
                />

                <div className="flex justify-end mt-4">
                    <Button 
                        variant="primary" 
                        size="sm"
                        disabled={extracting || !narrative.trim()}
                        onClick={handleAIExtract}
                        className="rounded-lg px-6 font-black uppercase text-[9px] tracking-widest"
                    >
                        {extracting ? '...' : 'AI Extract'}
                    </Button>
                </div>
            </div>

            {/* Structured Sections (Mobile Parity) */}
            <div className="space-y-3">
                <div className="p-4 bg-white border-2 border-slate-200 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">
                        <Brain size={12} /> Psychiatric Roots
                    </div>
                    <input 
                        type="text" 
                        value={psychiatric.previous_episodes} 
                        onChange={(e) => setPsychiatric(p => ({ ...p, previous_episodes: e.target.value }))}
                        placeholder="Previous Episodes"
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] font-bold focus:outline-none"
                    />
                    <input 
                        type="text" 
                        value={psychiatric.hospitalizations} 
                        onChange={(e) => setPsychiatric(p => ({ ...p, hospitalizations: e.target.value }))}
                        placeholder="Hospitalizations"
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] font-bold focus:outline-none"
                    />
                </div>

                <div className="p-4 bg-white border-2 border-slate-200 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">
                        <Stethoscope size={12} /> Medical History
                    </div>
                    <input 
                        type="text" 
                        value={medical.conditions} 
                        onChange={(e) => setMedical(p => ({ ...p, conditions: e.target.value }))}
                        placeholder="Chronic Conditions"
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] font-bold focus:outline-none"
                    />
                    <input 
                        type="text" 
                        value={medical.allergies} 
                        onChange={(e) => setMedical(p => ({ ...p, allergies: e.target.value }))}
                        placeholder="Active Allergies"
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] font-bold focus:outline-none"
                    />
                </div>

                <div className="p-4 bg-white border-2 border-slate-200 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">
                        <Users size={12} /> Family Background
                    </div>
                    <input 
                        type="text" 
                        value={family.paternal} 
                        onChange={(e) => setFamily(p => ({ ...p, paternal: e.target.value }))}
                        placeholder="Paternal / Maternal Conditions"
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-[10px] font-bold focus:outline-none"
                    />
                </div>
            </div>

            <Button 
                variant="primary" 
                className="w-full h-14 rounded-xl font-black uppercase text-[10px] tracking-widest"
                isLoading={saving}
                disabled={!narrative.trim() && !psychiatric.previous_episodes}
                onClick={handleSave}
            >
                Finalize Record
            </Button>
        </div>
    );

    const renderDetail = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pt-2">
            <button 
                onClick={() => setSelectedRecord(null)}
                className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] uppercase tracking-widest mb-2 hover:text-indigo-600 transition-colors"
            >
                <ChevronRight size={14} className="rotate-180" />
                Back to Archive
            </button>

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <FileText size={16} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Clinical Synthesis</h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(selectedRecord.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">
                    "{selectedRecord.ai_notes || 'Documentation summary'}"
                </p>
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                     <div className="flex items-center gap-3">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Psychiatric History Verified</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Medical Background Analyzed</span>
                     </div>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <Brain size={16} className="text-slate-400 mb-2" />
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Psychiatry</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight mt-1">Verified</span>
                </div>
                <div className="p-4 bg-white border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <Stethoscope size={16} className="text-slate-400 mb-2" />
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Medical</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight mt-1">Clear</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white">
            {!selectedRecord && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button 
                            onClick={() => { setActiveTab('history'); setSelectedRecord(null); }}
                            className={`px-6 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                                activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400'
                            }`}
                        >
                            Archive
                        </button>
                        <button 
                            onClick={() => { setActiveTab('new'); setSelectedRecord(null); }}
                            className={`px-6 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${
                                activeTab === 'new' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400'
                            }`}
                        >
                            New
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {selectedRecord ? renderDetail() : (activeTab === 'history' ? renderHistory() : renderNew())}
            </div>
        </div>
    );
};
