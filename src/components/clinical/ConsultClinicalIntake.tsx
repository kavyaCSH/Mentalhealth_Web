import React, { useState, useEffect } from 'react';
import {
    FileText,
    Save,
    Sparkles,
    Clock,
    ChevronRight,
    Activity,
    Stethoscope,
    AlertCircle,
    ClipboardList,
    CheckCircle2
} from 'lucide-react';
import { HPIService } from '../../api/services/hpi.service';
import { ROSService } from '../../api/services/ros.service';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import Button from '../ui/Button';

interface ConsultClinicalIntakeProps {
    patientId: string | number;
    consultId?: string | number;
    initialTab?: 'hpi' | 'ros' | 'cc';
    onSave?: (data: any) => void;
}

export const ConsultClinicalIntake: React.FC<ConsultClinicalIntakeProps> = ({
    patientId,
    consultId,
    onSave,
    initialTab = 'hpi'
}) => {
    const [activeSection, setActiveSection] = useState<'hpi' | 'ros' | 'cc'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);

    // Form State
    const [narrative, setNarrative] = useState('');
    const [structured, setStructured] = useState<any>(null);

    // Reset narrative when switching section
    useEffect(() => {
        setNarrative('');
        setStructured(null);
    }, [activeSection]);

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
            } else if (activeSection === 'ros') {
                res = await ROSService.extractFromNarrative(narrative, patientId);
            } else {
                res = await ChiefComplaintService.extractFromNarrative(narrative, patientId);
            }

            if (res) {
                const data = res.structured || res.data?.structured || res.data || res;
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
            } else if (activeSection === 'ros') {
                const rosPayload = {
                    patient_id: String(patientId),
                    consult_id: consultId ? String(consultId) : null,
                    extra_notes: narrative,
                    ...(typeof structured === 'object' ? structured : {})
                };
                res = await ROSService.createROS(rosPayload);
            } else {
                const payload = {
                    patient_id: String(patientId),
                    consult_id: consultId ? String(consultId) : undefined,
                    narrative: narrative,
                    structured: structured
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
        { id: 'ros', label: 'ROS', icon: <Stethoscope size={14} />, desc: 'Systems Review' },
        { id: 'cc', label: 'CC', icon: <ClipboardList size={14} />, desc: 'Chief Complaint' },
    ] as const;

    return (
        <div className="flex flex-col h-full bg-white px-2">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 mb-6">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex-1 flex flex-col items-center py-2 rounded-md transition-all group ${activeSection === s.id ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {s.icon}
                            <span className="text-[10px] font-black uppercase tracking-widest">{s.id.toUpperCase()}</span>
                        </div>
                        <span className="text-[7px] font-bold uppercase tracking-tighter mt-0.5 opacity-60 group-hover:opacity-100">{s.desc}</span>
                    </button>
                ))}
            </div>

            <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Intake Narrative</h3>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">AI clinical Synthesis</p>
                        </div>
                    </div>

                    <textarea
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        placeholder={`Describe the patient's ${activeSection.toUpperCase()} in detail...`}
                        className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-300 transition-all resize-none shadow-inner"
                    />

                    <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Listening for Clinical Markers</span>
                        </div>
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

                {structured && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-5 bg-emerald-50/50 text-emerald-800 border-2 border-emerald-100 rounded-2xl">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-emerald-100 rounded-lg text-emerald-600">
                                    <CheckCircle2 size={14} />
                                </div>
                                <h4 className="text-[9px] font-black uppercase tracking-widest">Synthesized clinical model ready</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {Object.entries(structured).map(([key, value]) => {
                                    if (!value) return null;
                                    
                                    // Handle Nested Objects (like ROS sections)
                                    if (typeof value === 'object' && !Array.isArray(value)) {
                                        const subValues = Object.values(value).filter(v => !!v);
                                        if (subValues.length === 0) return null;
                                        return (
                                            <div key={key} className="col-span-2 bg-white/60 p-3 rounded-xl border border-emerald-100 flex flex-col justify-center">
                                                <p className="text-[7px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1.5">{key.replace(/_/g, ' ')}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {Object.entries(value).map(([k, v]) => (
                                                        v && <span key={k} className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter">
                                                            {k.replace(/_/g, ' ')}: {String(v)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    return (
                                        <div key={key} className="bg-white/60 p-2.5 rounded-xl border border-emerald-100 flex flex-col justify-center">
                                            <p className="text-[7px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">{key.replace(/_/g, ' ')}</p>
                                            <p className="text-[10px] font-black text-slate-700 truncate leading-tight uppercase tracking-tight">
                                                {Array.isArray(value) ? value.join(', ') : String(value)}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <Button
                    variant="primary"
                    className="w-full h-14 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    isLoading={saving}
                    disabled={!narrative.trim()}
                    onClick={handleSave}
                >
                    {saving ? 'Synchronizing Archive...' : `Commit ${activeSection.toUpperCase()} Section`}
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
        </div>
    );
};
