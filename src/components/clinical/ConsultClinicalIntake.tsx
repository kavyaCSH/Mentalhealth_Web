import React, { useState, useEffect, useRef } from 'react';
import {
    FileText,
    Sparkles,
    Activity,
    Stethoscope,
    AlertCircle,
    ClipboardList,
    CheckCircle2,
    Mic,
    MicOff,
    ShieldAlert,
    Brain,
    Clock,
    Zap,
    History as HistoryIcon
} from 'lucide-react';
import { HPIService } from '../../api/services/hpi.service';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import Button from '../ui/Button';
import { ConsultPastHistory } from './ConsultPastHistory';
import { ConsultSymptoms } from './ConsultSymptoms';

interface ConsultClinicalIntakeProps {
    patientId: string | number;
    consultId?: string | number;
    initialTab?: 'hpi' | 'ros' | 'cc' | 'ph';
    onSave?: (data: any) => void;
}

export const ConsultClinicalIntake: React.FC<ConsultClinicalIntakeProps> = ({
    patientId,
    consultId,
    onSave,
    initialTab = 'hpi'
}) => {
    const [activeSection, setActiveSection] = useState<'hpi' | 'symptoms' | 'cc' | 'ph'>(initialTab === 'ros' ? 'symptoms' : initialTab);
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);

    // Form State
    const [narrative, setNarrative] = useState('');
    const [structured, setStructured] = useState<any>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Reset narrative when switching section
    useEffect(() => {
        setNarrative('');
        setStructured(null);
    }, [activeSection]);

    // Voice Recognition Implementation (Mobile Parity)
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

            recognitionRef.current.onerror = () => setIsRecording(false);
            recognitionRef.current.onend = () => setIsRecording(false);
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) return;
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error('Failed to start recording', err);
            }
        }
    };

    const handleAIExtract = async () => {
        if (!narrative.trim()) return;
        setExtracting(true);
        try {
            let res;
            if (activeSection === 'hpi') {
                res = await HPIService.extractHPI({
                    patient_id: patientId,
                    narrative: narrative
                });
            } else if (activeSection === 'cc') {
                res = await ChiefComplaintService.extractFromNarrative(narrative, patientId);
            }

            if (res) {
                const data = res.data || res.structured || res.data?.structured || res;
                setStructured(data);
            }
        } catch (error) {
            console.error(`[ConsultClinicalIntake] ${activeSection} extraction failed:`, error);
        } finally {
            setExtracting(false);
        }
    };

    const handleSave = async () => {
        if (!narrative.trim()) return;
        setSaving(true);
        try {
            let res;
            if (activeSection === 'hpi') {
                const hpiPayload = {
                    patient_id: String(patientId),
                    consult_id: consultId ? String(consultId) : undefined,
                    narrative: narrative,
                    structured: structured
                };
                res = await HPIService.submitHPI(hpiPayload);
            } else if (activeSection === 'cc') {
                const payload = {
                    ...structured,
                    patient_id: String(patientId),
                    consult_id: consultId ? String(consultId) : undefined,
                    narrative: narrative,
                    structured: structured?.structured || structured
                };
                res = await ChiefComplaintService.createComplaint(payload);
            }

            if (res) {
                if (onSave) onSave(res);
                setNarrative('');
                setStructured(null);
            }
        } catch (error: any) {
            console.error(`[ConsultClinicalIntake] ${activeSection} save failed:`, error);
        } finally {
            setSaving(false);
        }
    };

    const sections = [
        { id: 'hpi', label: 'HPI', icon: <FileText size={14} />, desc: 'Present Illness' },
        { id: 'symptoms', label: 'Symptoms', icon: <Stethoscope size={14} />, desc: 'Systemic Review' },
        { id: 'cc', label: 'CC', icon: <ClipboardList size={14} />, desc: 'Chief Complaint' },
        { id: 'ph', label: 'PH', icon: <HistoryIcon size={14} />, desc: 'Past History' },
    ] as const;

    const riskMarkers = structured?.risk_markers || structured?.structured?.risk_markers;

    return (
        <div className="flex flex-col h-full bg-white px-2">
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 mb-6 group shadow-inner">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex-1 flex flex-col items-center py-2.5 rounded-lg transition-all ${activeSection === s.id ? 'bg-white text-indigo-600 shadow-md border border-slate-200' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {s.icon}
                            <span className="text-[10px] font-black uppercase tracking-widest">{s.id.toUpperCase()}</span>
                        </div>
                        <span className="text-[7px] font-bold uppercase tracking-tighter mt-0.5 opacity-60">{s.desc}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto">
                {activeSection === 'ph' ? (
                    <ConsultPastHistory
                        patientId={patientId}
                        consultId={consultId}
                        onSave={onSave}
                    />
                ) : activeSection === 'symptoms' ? (
                    <ConsultSymptoms
                        patientId={patientId}
                        consultId={consultId}
                        onSave={onSave}
                    />
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                        {/* Entry Workspace */}
                        <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Clinical Intake Narrative</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Virtual Assistant Active</p>
                                    </div>
                                </div>

                                <button
                                    onClick={toggleRecording}
                                    className={`p-3 rounded-xl transition-all flex items-center gap-2 border-2 ${isRecording
                                        ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                                        : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                        }`}
                                >
                                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                                    <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">
                                        {isRecording ? 'Stop' : 'Voice'}
                                    </span>
                                </button>
                            </div>

                            <div className="relative">
                                <textarea
                                    value={narrative}
                                    onChange={(e) => setNarrative(e.target.value)}
                                    placeholder={`Describe the patient's ${activeSection.toUpperCase()} in clinical detail...`}
                                    className="w-full h-56 bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-6 text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-200 focus:bg-white transition-all resize-none shadow-inner leading-relaxed"
                                />
                                {isRecording && (
                                    <div className="absolute top-4 right-4 flex items-center gap-2 text-rose-500 font-black text-[9px] uppercase tracking-widest">
                                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                                        Listening...
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end mt-4">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    disabled={extracting || !narrative.trim()}
                                    onClick={handleAIExtract}
                                    className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100"
                                >
                                    {extracting ? 'Processing AI...' : 'Perform Clinical extraction'}
                                </Button>
                            </div>
                        </div>

                        {/* AI Review Workspace (Mobile Parity UI) */}
                        {structured && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Critical Risk Alert (Mobile Parity) */}
                                {riskMarkers?.self_harm_detected && (
                                    <div className="p-5 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-100 flex items-center gap-5">
                                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                            <ShieldAlert size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.1em]">Critical Clinical Risk</h4>
                                            <p className="text-[10px] font-bold text-rose-50 leading-tight mt-0.5">
                                                Self-harm/psychotic content detected. Review and activate safety protocol.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Analysis Grid */}
                                <div className="bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
                                                <Brain size={20} />
                                            </div>
                                            <h4 className="text-sm font-black text-slate-900 tracking-tight">Clinical Intelligence Result</h4>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${riskMarkers?.risk_level === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {riskMarkers?.risk_level || 'Normal'} Priority
                                        </div>
                                    </div>

                                    {/* Narrative Abstract */}
                                    <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm italic text-xs font-bold text-slate-600 leading-relaxed">
                                        "{structured.ai_summary || structured.narrative || narrative}"
                                    </div>

                                    {/* Clinical Insight Grid (Mobile Parity) */}
                                    {activeSection === 'cc' && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { icon: <Clock size={16} />, label: 'Duration', value: structured.structured?.duration || 'Unknown' },
                                                { icon: <Zap size={16} />, label: 'Severity', value: structured.structured?.severity || 'Acute' },
                                                { icon: <Activity size={16} />, label: 'Mood', value: structured.structured?.mse_observations?.mood || 'Stable' },
                                                { icon: <CheckCircle2 size={16} />, label: 'Affect', value: structured.structured?.mse_observations?.affect || 'Congruent' },
                                            ].map((insight, i) => (
                                                <div key={i} className="bg-white p-4 rounded-xl border border-slate-50 flex flex-col items-center text-center gap-1.5">
                                                    <div className="text-indigo-600 opacity-80">{insight.icon}</div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{insight.label}</p>
                                                    <p className="text-[10px] font-black text-slate-800 uppercase tabular-nums">{insight.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Potential Diagnoses Tags */}
                                    {structured.structured?.potential_diagnoses && (
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Potential Impressions</p>
                                            <div className="flex flex-wrap gap-2">
                                                {structured.structured.potential_diagnoses.map((dx: string) => (
                                                    <span key={dx} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                                                        {dx}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fallback for other sections (Generic Grid) */}
                                    {activeSection !== 'cc' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            {Object.entries(structured).map(([key, value]) => {
                                                if (['ai_summary', 'structured', 'risk_markers', 'narrative', 'patient_id'].includes(key) || !value) return null;
                                                return (
                                                    <div key={key} className="bg-white/60 p-3 rounded-xl border border-indigo-50">
                                                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">{key.replace(/_/g, ' ')}</p>
                                                        <p className="text-[11px] font-black text-slate-700 uppercase leading-snug">
                                                            {Array.isArray(value) ? value.join(', ') : String(value)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <Button
                            variant="primary"
                            className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-indigo-100 hover:scale-[1.01] active:scale-[0.99] transition-all"
                            isLoading={saving}
                            disabled={!narrative.trim()}
                            onClick={handleSave}
                        >
                            {saving ? 'Synchronizing Clinical Archive...' : `Commit ${activeSection.toUpperCase()} Entry`}
                        </Button>

                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertCircle size={14} className="text-slate-400" />
                                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Clinical Protocol</h5>
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                                All clinical data captured during this teleconsult is encrypted and stored in compliance with HIPAA longevity standards.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
