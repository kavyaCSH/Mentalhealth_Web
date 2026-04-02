import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
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
    Shield,
    History as HistoryIcon,
    HeartPulse
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
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const specialistId = currentUser?._id || currentUser?.id;
    const [activeTab, setActiveTab] = useState<'new' | 'history'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    const [result, setResult] = useState<any | null>(null); // Final save result
    const [extractionResult, setExtractionResult] = useState<any | null>(null); // Extraction buffer
    
    // Specialist Override State
    const [isEditing, setIsEditing] = useState(false);
    const [overrideNotes, setOverrideNotes] = useState('');
    const [editedRecord, setEditedRecord] = useState<any | null>(null);

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
                    return JSON.stringify(item);
                }
                return String(item);
            }).filter(Boolean).join(', ');
        }
        if (typeof value === 'object') {
            return Object.entries(value)
                .filter(([k, v]) => v != null && v !== false && v !== '' && v !== 'None' && v !== 'Unknown' && k !== 'detected')
                .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
                .join(' | ');
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

                setExtractionResult(data);
                
                // Map findings into polymorphic state for the preview grid
                setPsychiatric({
                    previous_episodes: formatInsightValue(data.psychiatric_history?.previous_diagnosis || data.psychiatric_history?.previous_episodes),
                    hospitalizations: formatInsightValue(data.psychiatric_history?.hospitalizations),
                    treatments: formatInsightValue(data.psychiatric_history?.psychotherapy_history || data.psychiatric_history?.previous_treatments)
                });
                setMedical({
                    chronic_conditions: formatInsightValue(data.medical_history?.chronic_conditions),
                    surgeries: formatInsightValue(data.medical_history?.surgeries),
                    allergies: formatInsightValue(data.medical_history?.allergies)
                });
                setFamily({
                    paternal: formatInsightValue(data.family_history?.paternal || data.family_history?.conditions?.filter((c: any) => c.relative === 'Father' || c.relative === 'Paternal')),
                    maternal: formatInsightValue(data.family_history?.maternal || data.family_history?.conditions?.filter((c: any) => c.relative === 'Mother' || c.relative === 'Maternal')),
                    siblings: formatInsightValue(data.family_history?.siblings)
                });
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
            const payload: any = {
                patient: String(patientId),
                consult_id: consultId ? String(consultId) : undefined,
                status: 'completed',
                narrative: narrative || extractionResult?.ai_notes || '',
                ai_notes: extractionResult?.ai_notes || narrative,
                risk_flags: extractionResult?.risk_flags || [],
                color_code: extractionResult?.color_code || '#6366f1',
                treatment_resistance_risk: extractionResult?.treatment_resistance_risk,
                genetic_risk_summary: extractionResult?.genetic_risk_summary,
                psychiatric_history: {
                    previous_diagnosis: psychiatric.previous_episodes ? [psychiatric.previous_episodes] : [],
                    hospitalizations: psychiatric.hospitalizations ? [{ reason: psychiatric.hospitalizations, year: 'N/A', location: 'N/A', duration: 'N/A' }] : [],
                    psychotherapy_history: psychiatric.treatments || ''
                },
                medical_history: {
                    chronic_conditions: medical.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean),
                    surgeries: medical.surgeries ? [{ procedure: medical.surgeries, year: 'N/A' }] : [],
                    allergies: medical.allergies.split(',').map(s => s.trim()).filter(Boolean),
                    head_injury: { detected: false, loss_of_consciousness: false, details: '' },
                    seizures: { detected: false, frequency: 'N/A', last_seizure: 'N/A' }
                },
                family_history: {
                    conditions: family.paternal || family.maternal || family.siblings ? [{ relative: 'Family', condition: `${family.paternal || ''} ${family.maternal || ''} ${family.siblings || ''}`.trim(), outcome: 'N/A' }] : [],
                    suicide_in_family: false,
                    substance_abuse_in_family: false
                },
                substance_use: {
                    alcohol: { status: 'Unknown', quantity: 'N/A', frequency: 'N/A', last_use: 'N/A' },
                    tobacco_nicotine: { status: 'Unknown', type: 'N/A', quantity: 'N/A' },
                    illicit_drugs: substanceUse ? [{ drug: substanceUse, status: 'Unknown', frequency: 'N/A', last_use: 'N/A' }] : []
                },
                social_history: {
                    living_situation: socialHistory || 'Unknown',
                    employment: 'Unknown',
                    education: 'Unknown',
                    marital_status: 'Unknown',
                    legal_history: { legal_issues: false, legal_details: '' },
                    spiritual_beliefs: 'None',
                    strengths_hobbies: ''
                },
                trauma_history: {
                    physical_abuse: false,
                    emotional_abuse: false,
                    sexual_abuse: false,
                    significant_losses: traumaHistory || '',
                    military_service: false,
                    trauma_notes: ''
                },
                developmental_history: {
                    milestones: developmentalHistory || 'On-time',
                    pregnancy_complications: '',
                    delivery_type: 'Normal',
                    childhood_behavior: '',
                    school_performance: ''
                }
            };

            const res = await PastHistoryService.createPastHistory(payload);
            const success = (res as any).success || (res as any).status === 'success' || !!(res as any).data;
            if (success) {
                const data = (res as any).data || res;
                setResult(data);
                setExtractionResult(null); // Clear extraction buffer
                if (onSave) onSave(data);
                resetForm();
                fetchHistory();
            }
        } catch (error) {
            console.error('[ConsultPastHistory] Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleOverrideSave = async () => {
        if (!selectedRecord || !overrideNotes.trim()) {
            alert('Audit notes are required for medical overrides.');
            return;
        }
        try {
            setSaving(true);
            const id = selectedRecord._id || selectedRecord.id;
            const payload = {
                ...editedRecord,
                override_notes: overrideNotes,
                doctor_override: String(specialistId || patientId) // Use current specialist if available
            };
            const res = await PastHistoryService.updatePastHistory(id, payload);
            if ((res as any).data || res) {
                setOverrideNotes('');
                setIsEditing(false);
                setEditedRecord(null);
                setSelectedRecord((res as any).data || res);
                fetchHistory();
            }
        } catch (error) {
            console.error('[ConsultPastHistory] Override save failed:', error);
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

    const FindingItem = ({ label, value }: { label: string; value: any }) => {
        if (!value || value === 'None' || value === 'Unknown' || (Array.isArray(value) && value.length === 0)) return null;
        let display = '';
        if (Array.isArray(value)) {
            display = value.map(v => typeof v === 'object' ? (v.name || v.condition || v.procedure || JSON.stringify(v)) : String(v)).join(', ');
        } else if (typeof value === 'object') {
            display = Object.entries(value).filter(([k,v]) => v && k !== 'detected').map(([k,v]) => `${k.replace(/_/g,' ')}: ${v}`).join(' | ');
        } else {
            display = String(value);
        }
        if (!display || display === 'false') return null;
        return (
            <div className="flex justify-between items-start py-2 border-b border-slate-50 last:border-none">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label.replace(/_/g, ' ')}</span>
                <span className="text-[10px] font-bold text-slate-700 text-right max-w-[60%] uppercase tracking-tight">{display}</span>
            </div>
        );
    };

    const renderOverrideForm = () => {
        if (!editedRecord) return null;
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-4 px-2">
                <div className="flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg">
                            <Zap size={20} />
                        </div>
                        <div>
                             <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Medical Override Mode</h4>
                             <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">AUTHENTICATED SPECIALIST CONTEXT</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" size="sm" onClick={() => {setIsEditing(false); setEditedRecord(null);}} className="rounded-xl font-black uppercase text-[9px]">Cancel</Button>
                        <Button variant="primary" size="sm" onClick={handleOverrideSave} isLoading={saving} className="rounded-xl font-black uppercase text-[9px] bg-amber-600 border-none shadow-lg shadow-amber-100 px-8">Commit Override</Button>
                    </div>
                </div>

                <div className="bg-amber-50/50 border-2 border-amber-100/50 p-8 rounded-[2.5rem] space-y-6">
                    <div className="space-y-2">
                         <label className="text-[10px] font-black text-amber-900 uppercase tracking-widest block">Audit Trail Notes (Required)</label>
                         <textarea 
                            value={overrideNotes}
                            onChange={(e) => setOverrideNotes(e.target.value)}
                            placeholder="Reason for manual correction (e.g., patient clarified history after clinical interview)..."
                            className="w-full h-24 p-5 bg-white border border-amber-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-inner italic"
                         />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                     <div className="p-8 bg-white border-2 border-slate-100 rounded-[3rem] shadow-sm space-y-8 hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm"><Brain size={24} /></div>
                            <h5 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Psychiatric Update</h5>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Historical Episodes / Diagnoses</label>
                                <textarea 
                                    value={editedRecord.psychiatric_history?.previous_diagnosis?.[0] || ''}
                                    onChange={(e) => setEditedRecord({...editedRecord, psychiatric_history: {...editedRecord.psychiatric_history, previous_diagnosis: [e.target.value]}})}
                                    className="w-full min-h-[100px] p-5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold outline-none focus:bg-white focus:border-indigo-600 transition-all"
                                />
                            </div>
                        </div>
                     </div>

                     <div className="p-8 bg-white border-2 border-slate-100 rounded-[3rem] shadow-sm space-y-8 hover:border-rose-100 transition-all">
                        <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm"><HeartPulse size={24} /></div>
                            <h5 className="text-[11px] font-black text-rose-900 uppercase tracking-widest">Surgical & Medical</h5>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Chronic Conditions (Comma Separated)</label>
                                <input 
                                    type="text"
                                    value={Array.isArray(editedRecord.medical_history?.chronic_conditions) ? editedRecord.medical_history.chronic_conditions.join(', ') : ''}
                                    onChange={(e) => setEditedRecord({...editedRecord, medical_history: {...editedRecord.medical_history, chronic_conditions: e.target.value.split(',').map((s: string) => s.trim())}})}
                                    className="w-full h-14 p-5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold outline-none focus:bg-white focus:border-rose-600 transition-all"
                                />
                            </div>
                        </div>
                     </div>
                </div>

                <div className="p-10 bg-slate-900 rounded-[4rem] text-white space-y-8 relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600 blur-[100px] opacity-20" />
                     <h5 className="text-xl font-black flex items-center gap-4 uppercase italic tracking-tighter">AI Analysis Refinement</h5>
                     <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                             <label className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] block">Synthesized AI Notes (Public to Patient)</label>
                             <textarea 
                                value={editedRecord.ai_notes || ''}
                                onChange={(e) => setEditedRecord({...editedRecord, ai_notes: e.target.value})}
                                className="w-full min-h-[120px] p-6 bg-white/5 border border-white/10 rounded-[2rem] text-xs font-bold text-slate-200 outline-none focus:border-indigo-500 transition-all resize-none italic"
                             />
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] block">Risk Flags (Detected)</label>
                                <textarea 
                                    value={Array.isArray(editedRecord.risk_flags) ? editedRecord.risk_flags.join('\n') : ''}
                                    onChange={(e) => setEditedRecord({...editedRecord, risk_flags: e.target.value.split('\n').filter(Boolean)})}
                                    placeholder="Enter one flag per line..."
                                    className="w-full min-h-[120px] p-6 bg-white/5 border border-white/10 rounded-[2rem] text-xs font-bold text-slate-200 outline-none focus:border-rose-500 transition-all resize-none"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                 <label className="text-[9px] font-black text-slate-400 uppercase">Urgency Accent:</label>
                                 <input 
                                    type="color" 
                                    value={editedRecord.color_code || '#6366f1'}
                                    onChange={(e) => setEditedRecord({...editedRecord, color_code: e.target.value})}
                                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none overflow-hidden"
                                 />
                            </div>
                        </div>
                     </div>
                </div>
                
                <Button variant="primary" size="lg" onClick={handleOverrideSave} isLoading={saving} className="w-full h-16 rounded-[2rem] font-black uppercase tracking-widest text-[11px] bg-amber-600 border-none shadow-2xl shadow-amber-200 mb-20">Verify & Commit Clinical Overwrite</Button>
            </div>
        );
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
                            key={record._id || record.id || `hist-${index}`}
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
                                \"{String(record.ai_notes || record.narrative || 'Detailed psychiatric and medical history captured.')}\"
                            </p>

                            <div className="flex items-center gap-4 text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <Brain size={12} />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Psych Roots</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Stethoscope size={12} />
                                    <span className="text-[9px] font-black uppercase tracking-tighter">Medical Background</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderNewTab = () => {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-700 pb-20 pt-2">
                {!extractionResult ? (
                    <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white flex items-center justify-center shadow-2xl shadow-indigo-100">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.15em]">AI History Assistant</h3>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Extraction Mode</p>
                                </div>
                            </div>
                        </div>

                        <textarea
                            value={narrative}
                            onChange={(e) => setNarrative(e.target.value)}
                            placeholder="Describe patient's medical and psychiatric history narrative here..."
                            className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-300 focus:bg-white transition-all resize-none leading-relaxed"
                        />

                        <div className="flex justify-end mt-4">
                            <Button variant="primary" size="md" disabled={extracting || !narrative.trim()} onClick={handleAIExtract} className="rounded-xl px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100">
                                {extracting ? 'Synthesizing...' : 'Perform Clinical Extraction'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                         <div className="flex justify-between items-center px-4">
                            <Button variant="ghost" size="sm" onClick={() => setExtractionResult(null)} className="rounded-xl font-black uppercase text-[9px] w-fit">← Change Narrative</Button>
                            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-[0.3em] animate-pulse">Verification Active</span>
                         </div>
                        
                        {/* Master Synthesis Dashboard */}
                        {extractionResult?.ai_notes && (
                            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Sparkles size={60} className="text-indigo-600" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={16} className="text-indigo-600" />
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Master Clinical Synthesis</h4>
                                </div>
                                <p className="text-sm font-bold text-indigo-950 leading-relaxed italic border-l-4 border-indigo-200 pl-6">
                                    \"{extractionResult.ai_notes}\"
                                </p>
                            </div>
                        )}

                        {/* Risk Flags */}
                        {extractionResult?.risk_flags && extractionResult.risk_flags.length > 0 && (
                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
                                <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <Shield size={14} /> Identified Risk Marker Nodes
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {extractionResult.risk_flags.map((f: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 bg-white/10 border border-white/5 text-[9px] font-black rounded-lg uppercase tracking-tight">{f}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Domain Preview Grid */}
                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { title: 'Psychiatric', icon: <Brain />, color: 'purple', data: psychiatric, fields: ['previous_episodes', 'hospitalizations', 'treatments'] },
                                { title: 'Medical', icon: <HeartPulse />, color: 'rose', data: medical, fields: ['chronic_conditions', 'surgeries', 'allergies'] },
                                { title: 'Family Status', icon: <Users />, color: 'emerald', data: family, fields: ['paternal', 'maternal', 'siblings'] },
                                { title: 'Substance Use', icon: <Zap />, color: 'amber', value: substanceUse, onChange: setSubstanceUse },
                                { title: 'Social Context', icon: <Archive />, color: 'indigo', value: socialHistory, onChange: setSocialHistory },
                                { title: 'Trauma Archive', icon: <Shield />, color: 'slate', value: traumaHistory, onChange: setTraumaHistory },
                                { title: 'Developmental', icon: <Sparkles />, color: 'violet', value: developmentalHistory, onChange: setDevelopmentalHistory }
                            ].map((domain, i) => {
                                const hasData = domain.data ? Object.values(domain.data).some(v => !!v) : !!domain.value;
                                if (!hasData) return null;

                                return (
                                    <div key={i} className={`p-8 bg-white border border-${domain.color}-100 rounded-[2.5rem] shadow-sm hover:border-${domain.color}-200 transition-all`}>
                                        <div className="flex items-center gap-4 mb-6 border-b border-slate-50 pb-4">
                                            <div className={`p-2 bg-${domain.color}-50 text-${domain.color}-600 rounded-xl`}>{domain.icon}</div>
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{domain.title}</h4>
                                        </div>
                                        
                                        {domain.data ? (
                                            <div className="space-y-4">
                                                {domain.fields.map((f: any) => (
                                                    <div key={f} className="space-y-1.5">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase ml-1">{f.replace(/_/g, ' ')}</label>
                                                        <input 
                                                            type="text" 
                                                            value={(domain.data as any)[f]} 
                                                            onChange={(e) => {
                                                                const setter = domain.title === 'Psychiatric' ? setPsychiatric : 
                                                                             domain.title === 'Medical' ? setMedical : setFamily;
                                                                setter((p: any) => ({ ...p, [f]: e.target.value }));
                                                            }}
                                                            className={`w-full bg-slate-50 border-2 border-transparent rounded-xl p-4 text-[11px] font-bold focus:outline-none focus:border-${domain.color}-200 focus:bg-white transition-all`} 
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <textarea 
                                                value={domain.value} 
                                                onChange={(e) => domain.onChange!(e.target.value)}
                                                className={`w-full h-24 bg-slate-50 border-2 border-transparent rounded-[2rem] p-6 text-[11px] font-bold focus:outline-none focus:border-${domain.color}-200 focus:bg-white transition-all resize-none`}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <Button
                            variant="primary"
                            className="w-full h-16 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] shadow-2xl shadow-indigo-100 bg-indigo-600"
                            isLoading={saving}
                            onClick={handleSave}
                        >
                            Persist Clinical Record
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    const renderDetailView = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pt-2 pb-20">
            <button onClick={() => setSelectedRecord(null)} className="flex items-center gap-2 group mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ChevronRight size={16} className="rotate-180" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Return to Clinical Archive</span>
            </button>

            <div className="bg-white border-2 border-slate-200 rounded-[2.5rem] p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center shadow-xl"><FileText size={24} /></div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Record Synthesis</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleDateString() : 'Draft'}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                         <Button variant="ghost" size="sm" onClick={() => { setEditedRecord({...selectedRecord}); setIsEditing(true); }} className="rounded-xl font-black uppercase text-[9px] border-2 border-amber-50 text-amber-600 hover:bg-amber-50">Override Data</Button>
                         <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(null)} className="rounded-xl font-black uppercase text-[9px]">Close</Button>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] relative italic">
                    <div className="absolute -top-3 left-8 px-3 py-1 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">AI Synthesis</span>
                    </div>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed capitalize">
                        \"{String(selectedRecord.ai_notes || selectedRecord.narrative || 'Detailed records captured.')}\"
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-purple-600"><Brain size={16} /><h5 className="text-[9px] font-black uppercase tracking-widest">Psychiatry</h5></div>
                        <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">{formatInsightValue(selectedRecord.psychiatric_history?.previous_diagnosis)}</p>
                    </div>
                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-rose-600"><HeartPulse size={16} /><h5 className="text-[9px] font-black uppercase tracking-widest">Medical</h5></div>
                        <p className="text-[10px] font-bold text-slate-700 leading-relaxed uppercase">{formatInsightValue(selectedRecord.medical_history?.chronic_conditions)}</p>
                    </div>
                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-emerald-600"><Users size={16} /><h5 className="text-[9px] font-black uppercase tracking-widest">Clinical Flags</h5></div>
                        <div className="flex flex-wrap gap-1">
                            {selectedRecord.risk_flags && Array.isArray(selectedRecord.risk_flags) && selectedRecord.risk_flags.length > 0 ? (
                                selectedRecord.risk_flags.map((f: string, i: number) => (
                                    <span key={`det-flag-${i}`} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[7px] font-black rounded uppercase">{f}</span>
                                ))
                            ) : (
                                <span className="text-[8px] font-bold text-slate-300 uppercase">No flags detected</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderResultView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-2 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><HistoryIcon size={20} /></div>
                    <div><h3 className="text-xs font-black text-slate-900 uppercase">Analysis Result</h3></div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {setResult(null); setActiveTab('history');}} className="rounded-xl font-black uppercase text-[9px]">Close</Button>
            </div>

            <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: result.color_code || '#6366f1' }} />
                <div className="space-y-8 uppercase tracking-tighter font-black">
                    <div className="flex items-center gap-4 uppercase tracking-widest mb-2"><Sparkles size={18} className="text-indigo-600" /> Synthesis Captured Sucessfully</div>
                    <div className="p-6 bg-slate-50 rounded-3xl text-xs text-slate-600 italic">\"{result.ai_notes || 'Captured.'}\"</div>
                    <div className="grid md:grid-cols-2 gap-8">
                         <div><h5 className="text-[9px] text-slate-400 mb-4 tracking-widest uppercase">Primary Identifiers</h5><FindingItem label="Psychiatric" value={result.psychiatric_history?.previous_diagnosis} /><FindingItem label="Medical" value={result.medical_history?.chronic_conditions} /></div>
                         <div><h5 className="text-[9px] text-rose-600 mb-4 tracking-widest uppercase">Risk Marker Nodes</h5><div className="flex flex-wrap gap-2">{result.risk_flags?.map((f: string, i: number) => (<span key={`res-flag-${i}`} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[8px] rounded-lg border border-rose-100">{f}</span>))}</div></div>
                    </div>
                </div>
            </div>
            <Button variant="primary" className="w-full h-14 rounded-2xl font-black uppercase text-[10px]" onClick={() => {setResult(null); setActiveTab('history');}}>Return to clinical archive</Button>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white px-2">
            {!selectedRecord && !isEditing && (
                <div className="flex items-center justify-between mb-8">
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border-2 border-slate-200">
                        <button onClick={() => setActiveTab('history')} className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Archive</button>
                        <button onClick={() => setActiveTab('new')} className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>New Intake</button>
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {result ? renderResultView() : (isEditing ? renderOverrideForm() : (selectedRecord ? renderDetailView() : (activeTab === 'history' ? renderHistoryTab() : renderNewTab())))}
            </div>
        </div>
    );
};
