import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
    Activity,
    Sparkles,
    ChevronRight,
    FileText,
    Brain,
    Stethoscope,
    // CheckCircle2,
    Users,
    Zap,
    Plus, 
    Archive,
    Shield,
    History as HistoryIcon,
    HeartPulse,
    Mic,
    MicOff
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

    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (activeTab === 'history' && patientId) {
            fetchHistory();
        }
    }, [activeTab, patientId]);

    // Voice Recognition Implementation (Mobile Parity)
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onstart = () => setIsRecording(true);
            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setNarrative(prev => prev + ' ' + event.results[i][0].transcript);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                console.log('[ConsultPastHistory] Voice Interim:', interimTranscript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('[ConsultPastHistory] Speech recognition error', event.error);
                setIsRecording(false);
            };
            
            recognitionRef.current.onend = () => setIsRecording(false);
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
        };
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            console.error('[ConsultPastHistory] Speech recognition not supported');
            return;
        }
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch (err) {
                console.error('[ConsultPastHistory] Failed to start recording', err);
                setIsRecording(false);
            }
        }
    };

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
                if (item && typeof item === 'object') {
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
            // Resolve consult_id: must be a valid number for backend
            const resolvedConsultId = consultId && !isNaN(Number(consultId)) ? Number(consultId) : undefined;

            const payload: any = {
                patient: patientId,
                patient_id: patientId,
                consult_id: resolvedConsultId,
                status: 'completed',
                narrative: narrative || extractionResult?.ai_notes || '',
                ai_notes: extractionResult?.ai_notes || narrative,
                risk_flags: extractionResult?.risk_flags || [],
                color_code: extractionResult?.color_code || '#6366f1',
                treatment_resistance_risk: extractionResult?.treatment_resistance_risk,
                genetic_risk_summary: extractionResult?.genetic_risk_summary,

                // ── Use raw extraction data directly (same as PastHistoryPage.constructPayload) ──
                psychiatric_history: extractionResult?.psychiatric_history
                    ? {
                        previous_diagnosis: (() => {
                            const v = extractionResult.psychiatric_history.previous_diagnosis;
                            if (Array.isArray(v)) return v;
                            if (typeof v === 'string' && v) return [v];
                            return psychiatric.previous_episodes ? [psychiatric.previous_episodes] : [];
                        })(),
                        hospitalizations: Array.isArray(extractionResult.psychiatric_history.hospitalizations)
                            ? extractionResult.psychiatric_history.hospitalizations
                            : (psychiatric.hospitalizations ? [{ reason: psychiatric.hospitalizations, year: 'N/A', location: 'N/A', duration: 'N/A' }] : []),
                        suicide_attempts: Array.isArray(extractionResult.psychiatric_history.suicide_attempts)
                            ? extractionResult.psychiatric_history.suicide_attempts : [],
                        medication_trials: Array.isArray(extractionResult.psychiatric_history.medication_trials)
                            ? extractionResult.psychiatric_history.medication_trials : [],
                        psychotherapy_history: extractionResult.psychiatric_history.psychotherapy_history || psychiatric.treatments || ''
                    }
                    : {
                        previous_diagnosis: psychiatric.previous_episodes ? [psychiatric.previous_episodes] : [],
                        hospitalizations: psychiatric.hospitalizations ? [{ reason: psychiatric.hospitalizations, year: 'N/A', location: 'N/A', duration: 'N/A' }] : [],
                        psychotherapy_history: psychiatric.treatments || ''
                    },

                medical_history: extractionResult?.medical_history
                    ? {
                        chronic_conditions: (() => {
                            const v = extractionResult.medical_history.chronic_conditions;
                            if (Array.isArray(v)) return v;
                            if (typeof v === 'string' && v) return v.split(',').map((s: string) => s.trim()).filter(Boolean);
                            return medical.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean);
                        })(),
                        surgeries: Array.isArray(extractionResult.medical_history.surgeries)
                            ? extractionResult.medical_history.surgeries
                            : (medical.surgeries ? [{ procedure: medical.surgeries, year: 'N/A' }] : []),
                        allergies: (() => {
                            const v = extractionResult.medical_history.allergies;
                            if (Array.isArray(v)) return v;
                            if (typeof v === 'string' && v) return v.split(',').map((s: string) => s.trim()).filter(Boolean);
                            return medical.allergies.split(',').map(s => s.trim()).filter(Boolean);
                        })(),
                        head_injury: extractionResult.medical_history.head_injury || { detected: false, loss_of_consciousness: false, details: '' },
                        seizures: extractionResult.medical_history.seizures || { detected: false, frequency: 'N/A', last_seizure: 'N/A' }
                    }
                    : {
                        chronic_conditions: medical.chronic_conditions.split(',').map(s => s.trim()).filter(Boolean),
                        surgeries: medical.surgeries ? [{ procedure: medical.surgeries, year: 'N/A' }] : [],
                        allergies: medical.allergies.split(',').map(s => s.trim()).filter(Boolean),
                        head_injury: { detected: false, loss_of_consciousness: false, details: '' },
                        seizures: { detected: false, frequency: 'N/A', last_seizure: 'N/A' }
                    },

                family_history: extractionResult?.family_history
                    ? {
                        conditions: Array.isArray(extractionResult.family_history.conditions)
                            ? extractionResult.family_history.conditions
                            : (family.paternal || family.maternal || family.siblings
                                ? [{ relative: 'Family', condition: `${family.paternal || ''} ${family.maternal || ''} ${family.siblings || ''}`.trim(), outcome: 'N/A' }]
                                : []),
                        suicide_in_family: !!extractionResult.family_history.suicide_in_family,
                        substance_abuse_in_family: !!extractionResult.family_history.substance_abuse_in_family
                    }
                    : {
                        conditions: family.paternal || family.maternal || family.siblings
                            ? [{ relative: 'Family', condition: `${family.paternal || ''} ${family.maternal || ''} ${family.siblings || ''}`.trim(), outcome: 'N/A' }]
                            : [],
                        suicide_in_family: false,
                        substance_abuse_in_family: false
                    },

                // ── Substance use: use raw extraction data to preserve full structure & valid enums ──
                substance_use: extractionResult?.substance_use && typeof extractionResult.substance_use === 'object'
                    ? {
                        alcohol: {
                            status: extractionResult.substance_use.alcohol?.status || 'Never',
                            quantity: extractionResult.substance_use.alcohol?.quantity || 'N/A',
                            frequency: extractionResult.substance_use.alcohol?.frequency || 'N/A',
                            last_use: extractionResult.substance_use.alcohol?.last_use || 'N/A'
                        },
                        tobacco_nicotine: {
                            status: extractionResult.substance_use.tobacco_nicotine?.status || 'Never',
                            type: extractionResult.substance_use.tobacco_nicotine?.type || 'N/A',
                            quantity: extractionResult.substance_use.tobacco_nicotine?.quantity || 'N/A'
                        },
                        // Valid backend enums: 'current' | 'past' | 'occasional' | 'never'
                        illicit_drugs: Array.isArray(extractionResult.substance_use.illicit_drugs)
                            ? extractionResult.substance_use.illicit_drugs
                                .filter((d: any) => d.drug && !String(d.drug).toLowerCase().includes('none'))
                                .map((d: any) => ({
                                    drug: d.drug || '',
                                    status: (d.status === 'Never' || d.status === 'Never Used' || d.status === 'Active' || !d.status) ? 'current' : d.status,
                                    frequency: d.frequency || 'N/A',
                                    last_use: d.last_use || 'N/A'
                                }))
                            : [],
                        caffeine: extractionResult.substance_use.caffeine || '',
                        prescription_misuse: extractionResult.substance_use.prescription_misuse || 'None'
                    }
                    : {
                        alcohol: { status: 'Never', quantity: 'N/A', frequency: 'N/A', last_use: 'N/A' },
                        tobacco_nicotine: { status: 'Never', type: 'N/A', quantity: 'N/A' },
                        illicit_drugs: (substanceUse && !substanceUse.toLowerCase().includes('none') && !substanceUse.toLowerCase().includes('never'))
                            ? [{ drug: substanceUse, status: 'current', frequency: 'N/A', last_use: 'N/A' }]
                            : []
                    },

                social_history: extractionResult?.social_history && typeof extractionResult.social_history === 'object'
                    ? {
                        living_situation: extractionResult.social_history.living_situation || 'Stable',
                        employment: extractionResult.social_history.employment || 'Unknown',
                        education: extractionResult.social_history.education || 'Unknown',
                        marital_status: extractionResult.social_history.marital_status || 'Unknown',
                        legal_history: extractionResult.social_history.legal_history || { legal_issues: false, legal_details: '' },
                        spiritual_beliefs: extractionResult.social_history.spiritual_beliefs || 'None',
                        strengths_hobbies: extractionResult.social_history.strengths_hobbies || ''
                    }
                    : {
                        living_situation: socialHistory || 'Stable',
                        employment: 'Unknown',
                        education: 'Unknown',
                        marital_status: 'Unknown',
                        legal_history: { legal_issues: false, legal_details: '' },
                        spiritual_beliefs: 'None',
                        strengths_hobbies: ''
                    },

                trauma_history: extractionResult?.trauma_history && typeof extractionResult.trauma_history === 'object'
                    ? {
                        physical_abuse: !!extractionResult.trauma_history.physical_abuse,
                        emotional_abuse: !!extractionResult.trauma_history.emotional_abuse,
                        sexual_abuse: !!extractionResult.trauma_history.sexual_abuse,
                        significant_losses: extractionResult.trauma_history.significant_losses || traumaHistory || '',
                        military_service: !!extractionResult.trauma_history.military_service,
                        trauma_notes: extractionResult.trauma_history.trauma_notes || ''
                    }
                    : {
                        physical_abuse: false,
                        emotional_abuse: false,
                        sexual_abuse: false,
                        significant_losses: traumaHistory || '',
                        military_service: false,
                        trauma_notes: ''
                    },

                developmental_history: extractionResult?.developmental_history && typeof extractionResult.developmental_history === 'object'
                    ? {
                        pregnancy_complications: extractionResult.developmental_history.pregnancy_complications || 'None',
                        delivery_type: extractionResult.developmental_history.delivery_type || 'Normal',
                        milestones: String(extractionResult.developmental_history.milestones || '').toLowerCase().includes('on-time')
                            ? 'On-time'
                            : (extractionResult.developmental_history.milestones || 'On-time'),
                        childhood_behavior: extractionResult.developmental_history.childhood_behavior || '',
                        school_performance: extractionResult.developmental_history.school_performance || ''
                    }
                    : {
                        pregnancy_complications: 'None',
                        delivery_type: 'Normal',
                        milestones: developmentalHistory.toLowerCase().includes('on-time')
                            ? 'On-time'
                            : (developmentalHistory || 'On-time'),
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
            <div className="flex justify-between items-start py-2 border-b border-border-card last:border-none">
                <span className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">{label.replace(/_/g, ' ')}</span>
                <span className="text-[10px] font-bold text-main text-right max-w-[60%] uppercase tracking-tight">{display}</span>
            </div>
        );
    };

    const renderOverrideForm = () => {
        if (!editedRecord) return null;
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 pt-4 px-2">
                <div className="flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-md z-10 py-4 border-b border-border-card">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg">
                            <Zap size={20} />
                        </div>
                        <div>
                             <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Medical Override Mode</h4>
                             <p className="text-xs font-bold text-muted opacity-80 uppercase tracking-tighter">AUTHENTICATED SPECIALIST CONTEXT</p>
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
                            className="w-full h-24 p-5 bg-card border border-amber-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-inner italic"
                         />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                     <div className="p-8 bg-card border-2 border-border-card rounded-[3rem] shadow-sm space-y-8 hover:border-indigo-100 transition-all">
                        <div className="flex items-center gap-4 border-b border-border-card pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm"><Brain size={24} /></div>
                            <h5 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">Psychiatric Update</h5>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">Historical Episodes / Diagnoses</label>
                                <textarea 
                                    value={editedRecord.psychiatric_history?.previous_diagnosis?.[0] || ''}
                                    onChange={(e) => setEditedRecord({...editedRecord, psychiatric_history: {...editedRecord.psychiatric_history, previous_diagnosis: [e.target.value]}})}
                                    className="w-full min-h-[100px] p-5 bg-page border border-border-card rounded-2xl text-[11px] font-bold outline-none focus:bg-card focus:border-indigo-600 transition-all"
                                />
                            </div>
                        </div>
                     </div>

                     <div className="p-8 bg-card border-2 border-border-card rounded-[3rem] shadow-sm space-y-8 hover:border-rose-100 transition-all">
                        <div className="flex items-center gap-4 border-b border-border-card pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm"><HeartPulse size={24} /></div>
                            <h5 className="text-[11px] font-black text-rose-900 uppercase tracking-widest">Surgical & Medical</h5>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">Chronic Conditions (Comma Separated)</label>
                                <input 
                                    type="text"
                                    value={Array.isArray(editedRecord.medical_history?.chronic_conditions) ? editedRecord.medical_history.chronic_conditions.join(', ') : ''}
                                    onChange={(e) => setEditedRecord({...editedRecord, medical_history: {...editedRecord.medical_history, chronic_conditions: e.target.value.split(',').map((s: string) => s.trim())}})}
                                    className="w-full h-14 p-5 bg-page border border-border-card rounded-2xl text-[11px] font-bold outline-none focus:bg-card focus:border-rose-600 transition-all"
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
                                className="w-full min-h-[120px] p-6 bg-card/5 border border-white/10 rounded-[2rem] text-xs font-bold text-muted opacity-40 outline-none focus:border-indigo-500 transition-all resize-none italic"
                             />
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] block">Risk Flags (Detected)</label>
                                <textarea 
                                    value={Array.isArray(editedRecord.risk_flags) ? editedRecord.risk_flags.join('\n') : ''}
                                    onChange={(e) => setEditedRecord({...editedRecord, risk_flags: e.target.value.split('\n').filter(Boolean)})}
                                    placeholder="Enter one flag per line..."
                                    className="w-full min-h-[120px] p-6 bg-card/5 border border-white/10 rounded-[2rem] text-xs font-bold text-muted opacity-40 outline-none focus:border-rose-500 transition-all resize-none"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                 <label className="text-[9px] font-black text-muted opacity-80 uppercase">Urgency Accent:</label>
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
                <div className="flex flex-col items-center justify-center py-20 bg-card border-2 border-border-card rounded-[2.5rem]">
                    <div className="relative">
                        <Activity className="animate-spin text-indigo-600" size={32} />
                        <div className="absolute inset-0 animate-ping opacity-20 bg-indigo-400 rounded-full" />
                    </div>
                    <p className="mt-6 text-[11px] font-black text-muted opacity-80 uppercase tracking-[0.2em]">Synchronizing Archive...</p>
                </div>
            ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-card border-2 border-dashed border-border-card rounded-[2.5rem]">
                    <div className="p-4 bg-page rounded-2xl mb-4">
                        <HistoryIcon size={32} className="text-muted opacity-40" />
                    </div>
                    <h3 className="text-xs font-black text-main uppercase tracking-widest mb-1">No Historical Nodes</h3>
                    <p className="text-[10px] font-bold text-muted opacity-80 uppercase tracking-tight mb-8">Clinical record is currently empty</p>
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
                            className="w-full text-left bg-card p-6 rounded-[2rem] border-2 border-border-card hover:border-indigo-600 transition-all hover:shadow-xl hover:shadow-slate-100 group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Zap size={16} className="text-indigo-600" />
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-page rounded-xl flex items-center justify-center text-muted opacity-80 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <Archive size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black text-main uppercase tracking-widest">Clinical Snapshot</h4>
                                        <p className="text-[9px] font-bold text-muted opacity-80 uppercase">{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'Draft'}</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg">
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                                </div>
                            </div>

                            <p className="text-xs font-bold text-muted leading-relaxed italic mb-4 line-clamp-2">
                                \"{String(record.ai_notes || record.narrative || 'Detailed psychiatric and medical history captured.')}\"
                            </p>

                            <div className="flex items-center gap-4 text-muted opacity-80">
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
                    <div className="bg-card border-2 border-border-card rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-900 text-white flex items-center justify-center shadow-2xl shadow-indigo-100">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-main uppercase tracking-[0.15em]">AI History Assistant</h3>
                                    <p className="text-[9px] font-bold text-muted opacity-80 uppercase tracking-widest">Active Extraction Mode</p>
                                </div>
                            </div>

                            <button
                                onClick={toggleRecording}
                                className={`p-3 rounded-xl transition-all flex items-center gap-2 border-2 ${isRecording
                                    ? 'bg-rose-500 text-white border-rose-500 animate-pulse shadow-lg shadow-rose-100'
                                    : 'bg-page text-muted opacity-80 border-border-card hover:bg-slate-900 hover:text-white'
                                    }`}
                            >
                                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                                <span className="text-[9px] font-black uppercase tracking-widest">
                                    {isRecording ? 'Stop' : 'Voice'}
                                </span>
                            </button>
                        </div>

                        <div className="relative">
                            <textarea
                                value={narrative}
                                onChange={(e) => setNarrative(e.target.value)}
                                placeholder="Describe patient's medical and psychiatric history narrative here..."
                                className="w-full h-40 bg-page border-2 border-border-card rounded-3xl p-6 text-xs font-bold text-main placeholder:text-muted opacity-40 focus:outline-none focus:border-indigo-300 focus:bg-card transition-all resize-none leading-relaxed"
                            />
                            {isRecording && (
                                <div className="absolute top-4 right-4 flex items-center gap-2 text-rose-500 font-black text-[8px] uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                                    Listening...
                                </div>
                            )}
                        </div>

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
                                        <span key={i} className="px-3 py-1.5 bg-card/10 border border-white/5 text-[9px] font-black rounded-lg uppercase tracking-tight">{f}</span>
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
                                    <div key={i} className={`p-8 bg-card border border-${domain.color}-100 rounded-[2.5rem] shadow-sm hover:border-${domain.color}-200 transition-all`}>
                                        <div className="flex items-center gap-4 mb-6 border-b border-border-card pb-4">
                                            <div className={`p-2 bg-${domain.color}-50 text-${domain.color}-600 rounded-xl`}>{domain.icon}</div>
                                            <h4 className="text-[10px] font-black text-main uppercase tracking-widest">{domain.title}</h4>
                                        </div>
                                        
                                        {domain.data ? (
                                            <div className="space-y-4">
                                                {domain.fields.map((f: any) => (
                                                    <div key={f} className="space-y-1.5">
                                                        <label className="text-[8px] font-black text-muted opacity-80 uppercase ml-1">{f.replace(/_/g, ' ')}</label>
                                                        <input 
                                                            type="text" 
                                                            value={(domain.data as any)[f]} 
                                                            onChange={(e) => {
                                                                const setter = domain.title === 'Psychiatric' ? setPsychiatric : 
                                                                             domain.title === 'Medical' ? setMedical : setFamily;
                                                                setter((p: any) => ({ ...p, [f]: e.target.value }));
                                                            }}
                                                            className={`w-full bg-page border-2 border-transparent rounded-xl p-4 text-[11px] font-bold focus:outline-none focus:border-${domain.color}-200 focus:bg-card transition-all`} 
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <textarea 
                                                value={domain.value} 
                                                onChange={(e) => domain.onChange!(e.target.value)}
                                                className={`w-full h-24 bg-page border-2 border-transparent rounded-[2rem] p-6 text-[11px] font-bold focus:outline-none focus:border-${domain.color}-200 focus:bg-card transition-all resize-none`}
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

    const formatDate = (dateStr: any) => {
        try {
            if (!dateStr) return 'Draft';
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? 'Recent' : d.toLocaleDateString();
        } catch (e) {
            return 'Recent';
        }
    };

    const renderDetailView = () => {
        if (!selectedRecord) return null;
        return (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pt-2 pb-20">
                <button onClick={() => setSelectedRecord(null)} className="flex items-center gap-2 group mb-4">
                    <div className="w-8 h-8 rounded-full bg-page flex items-center justify-center text-muted opacity-80 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ChevronRight size={16} className="rotate-180" />
                    </div>
                    <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Return to Clinical Archive</span>
                </button>

                <div className="bg-card border-2 border-border-card rounded-[2.5rem] p-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-border-card pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center shadow-xl"><FileText size={24} /></div>
                            <div>
                                <h3 className="text-sm font-black text-main uppercase tracking-widest leading-none mb-1">Record Synthesis</h3>
                                <p className="text-[10px] font-bold text-muted opacity-80 uppercase">{formatDate(selectedRecord?.createdAt)}</p>
                            </div>
                        </div>
                    <div className="flex gap-3">
                         <Button variant="ghost" size="sm" onClick={() => { setEditedRecord({...selectedRecord}); setIsEditing(true); }} className="rounded-xl font-black uppercase text-[9px] border-2 border-amber-50 text-amber-600 hover:bg-amber-50">Override Data</Button>
                         <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(null)} className="rounded-xl font-black uppercase text-[9px]">Close</Button>
                    </div>
                </div>

                <div className="p-8 bg-page border-2 border-border-card rounded-[2rem] relative italic">
                    <div className="absolute -top-3 left-8 px-3 py-1 bg-card border border-border-card rounded-lg">
                        <span className="text-[8px] font-black text-muted opacity-80 uppercase tracking-widest">AI Synthesis</span>
                    </div>
                    <p className="text-xs font-bold text-muted leading-relaxed capitalize">
                        \"{String(selectedRecord.ai_notes || selectedRecord.narrative || 'Detailed records captured.')}\"
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-6 bg-card border border-border-card rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-purple-600"><Brain size={16} /><h5 className="text-[9px] font-black uppercase tracking-widest">Psychiatry</h5></div>
                        <p className="text-[10px] font-bold text-main leading-relaxed uppercase">{formatInsightValue(selectedRecord.psychiatric_history?.previous_diagnosis)}</p>
                    </div>
                    <div className="p-6 bg-card border border-border-card rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-rose-600"><HeartPulse size={16} /><h5 className="text-[9px] font-black uppercase tracking-widest">Medical</h5></div>
                        <p className="text-[10px] font-bold text-main leading-relaxed uppercase">{formatInsightValue(selectedRecord.medical_history?.chronic_conditions)}</p>
                    </div>
                    <div className="p-6 bg-card border border-border-card rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-emerald-600"><Users size={16} /><h5 className="text-[9px] font-black uppercase tracking-widest">Clinical Flags</h5></div>
                        <div className="flex flex-wrap gap-1">
                            {selectedRecord.risk_flags && Array.isArray(selectedRecord.risk_flags) && selectedRecord.risk_flags.length > 0 ? (
                                selectedRecord.risk_flags.map((f: string, i: number) => (
                                    <span key={`det-flag-${i}`} className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[7px] font-black rounded uppercase">{f}</span>
                                ))
                            ) : (
                                <span className="text-[8px] font-bold text-muted opacity-40 uppercase">No flags detected</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        );
    };

    const renderResultView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-2 pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><HistoryIcon size={20} /></div>
                    <div><h3 className="text-xs font-black text-main uppercase">Analysis Result</h3></div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {setResult(null); setActiveTab('history');}} className="rounded-xl font-black uppercase text-[9px]">Close</Button>
            </div>

            <div className="bg-card border-2 border-border-card rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: result.color_code || '#6366f1' }} />
                <div className="space-y-8 uppercase tracking-tighter font-black">
                    <div className="flex items-center gap-4 uppercase tracking-widest mb-2"><Sparkles size={18} className="text-indigo-600" /> Synthesis Captured Sucessfully</div>
                    <div className="p-6 bg-page rounded-3xl text-xs text-muted italic">\"{result.ai_notes || 'Captured.'}\"</div>
                    <div className="grid md:grid-cols-2 gap-8">
                         <div><h5 className="text-[9px] text-muted opacity-80 mb-4 tracking-widest uppercase">Primary Identifiers</h5><FindingItem label="Psychiatric" value={result.psychiatric_history?.previous_diagnosis} /><FindingItem label="Medical" value={result.medical_history?.chronic_conditions} /></div>
                         <div><h5 className="text-[9px] text-rose-600 mb-4 tracking-widest uppercase">Risk Marker Nodes</h5><div className="flex flex-wrap gap-2">{result.risk_flags?.map((f: string, i: number) => (<span key={`res-flag-${i}`} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[8px] rounded-lg border border-rose-100">{f}</span>))}</div></div>
                    </div>
                </div>
            </div>
            <Button variant="primary" className="w-full h-14 rounded-2xl font-black uppercase text-[10px]" onClick={() => {setResult(null); setActiveTab('history');}}>Return to clinical archive</Button>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-card px-2">
            {!selectedRecord && !isEditing && (
                <div className="flex items-center justify-between mb-8">
                    <div className="flex bg-page p-1.5 rounded-xl border-2 border-border-card">
                        <button onClick={() => setActiveTab('history')} className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-card text-indigo-600 shadow-sm' : 'text-muted opacity-80 hover:text-muted'}`}>Archive</button>
                        <button onClick={() => setActiveTab('new')} className={`px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-card text-indigo-600 shadow-sm' : 'text-muted opacity-80 hover:text-muted'}`}>New Intake</button>
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {result ? renderResultView() : (isEditing ? renderOverrideForm() : (selectedRecord ? renderDetailView() : (activeTab === 'history' ? renderHistoryTab() : renderNewTab())))}
            </div>
        </div>
    );
};
