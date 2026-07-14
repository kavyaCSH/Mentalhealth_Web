import React, { useState, useEffect, useRef } from 'react';
import {
    FileText,
    Sparkles,
    Activity,
    Stethoscope,
    AlertCircle,
    ClipboardList,
    Mic,
    MicOff,
    ShieldAlert,
    Brain,
    Clock,
    Zap,
    Plus,
    ChevronRight,
    MessageSquare
} from 'lucide-react';
import { HPIService } from '../../api/services/hpi.service';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import { UserService } from '../../api/services/user.service';
import Button from '../ui/Button';
import { ConsultSymptoms } from './ConsultSymptoms';

import { ConsultROS } from './ConsultROS';

interface ConsultClinicalIntakeProps {
    patientId: string | number;
    consultId?: string | number;
    initialTab?: 'hpi' | 'ros' | 'cc' | 'symptoms';
    onSave?: (data: any) => void;
}

export const ConsultClinicalIntake: React.FC<ConsultClinicalIntakeProps> = ({
    patientId,
    consultId,
    onSave,
    initialTab = 'hpi'
}) => {
    type SectionType = 'hpi' | 'symptoms' | 'cc' | 'ros';
    const [activeSection, setActiveSection] = useState<SectionType>(initialTab as SectionType);
    const [saving, setSaving] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [resolvedId, setResolvedId] = useState<string | number>(patientId);
    const [patientHex, setPatientHex] = useState<string | undefined>(undefined);

    // Form State
    const [narrative, setNarrative] = useState('');
    const [structured, setStructured] = useState<any>(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);

    // CC History State
    const [ccComplaints, setCcComplaints] = useState<any[]>([]);
    const [ccLoading, setCcLoading] = useState(false);
    const [ccShowNew, setCcShowNew] = useState(false);

    const getIdentityContext = async (id: string | number) => {
        const sid = String(id);
        const ctx = {
            patient_id: !isNaN(Number(sid)) ? Number(sid) : sid, // Numeric where possible
            patient: undefined as string | undefined // Hex (resolved)
        };

        if (sid.length >= 20) {
            ctx.patient = sid;
        } else if (sid !== '') {
            try {
                const profile = await UserService.getUserById(sid);
                if (profile) {
                    ctx.patient = profile._id || profile.id;
                    // If we resolved from numeric to hex, ensure patient_id is the numeric one
                    if (ctx.patient && !isNaN(Number(sid))) {
                        ctx.patient_id = Number(sid);
                    }
                }
            } catch (e) {
                console.warn('[ConsultClinicalIntake] Identity resonance failed', e);
            }
        }
        return ctx;
    };

    // Perform Identity Resonance on Mount
    useEffect(() => {
        const resolve = async () => {
            const ctx = await getIdentityContext(patientId);
            if (ctx.patient) setPatientHex(ctx.patient);
            setResolvedId(ctx.patient_id);
        };
        resolve();
    }, [patientId]);

    // Fetch CC list when CC tab is active
    useEffect(() => {
        if (activeSection === 'cc') {
            fetchCCComplaints();
        }
    }, [activeSection, patientId]);

    const fetchCCComplaints = async () => {
        if (!patientId) return;
        setCcLoading(true);
        try {
            const pid = String(patientId);
            const res = await ChiefComplaintService.listComplaints({ patient_id: pid });
            const data = (res as any).data || res;
            setCcComplaints(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('[ConsultClinicalIntake] fetchCCComplaints failed:', e);
        } finally {
            setCcLoading(false);
        }
    };

    // Reset narrative when switching section
    useEffect(() => {
        setNarrative('');
        setStructured(null);
        if (isRecording && recognitionRef.current) {
            try { 
                recognitionRef.current.stop(); 
                setIsRecording(false);
            } catch (e) {}
        }
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
        const cleanNarrative = narrative.trim();
        if (!cleanNarrative || cleanNarrative.length < 20) {
            console.warn('[ConsultClinicalIntake] Narrative too short for AI analysis');
            return;
        }
        
        setExtracting(true);
        try {
            const context = await getIdentityContext(patientId);
            const pId = String(context.patient || context.patient_id);
            
            console.log(`[ConsultClinicalIntake] Extraction Triggered:`, {
                section: activeSection,
                patientId: pId,
                narrativeLength: cleanNarrative.length
            });

            let res;
            if (activeSection === 'hpi') {
                res = await HPIService.extractFromNarrative(cleanNarrative, pId);
            } else if (activeSection === 'cc') {
                res = await ChiefComplaintService.extractFromNarrative(cleanNarrative, pId);
            }

            if (res) {
                const extractionRes = res as any;
                // Extraction response mapping logic — unified for all clinical tools
                const rawData = extractionRes.data || extractionRes.structured || extractionRes.data?.structured || extractionRes;
                
                // Merge flattened fields for the generic grid view
                const displayData = {
                    ...rawData,
                    ...(rawData.structured || {})
                };
                setStructured(displayData);
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
            const context = await getIdentityContext(patientId);
            
            // Persistence ID Resolution: Favor numeric consult_id, fallback to prop/1
            const rawConsult = structured?.consult_id || consultId;
            const numConsult = isNaN(Number(rawConsult)) ? 1 : Number(rawConsult);

            console.log(`[ConsultClinicalIntake] Committing Clinical Data: ${activeSection}`, {
                patient: context.patient_id,
                consult: numConsult
            });

            // Step 1: Sanitization Protocol (Parity with Mobile Terminal)
            // Filters metadata and enforces valid clinical enums for backend persistence
            const cleanResult = { ...(structured || {}) };
            delete cleanResult.id;
            delete cleanResult._id;
            delete cleanResult.hpiId;
            delete cleanResult.chiefComplaintId;
            delete cleanResult.mseId;
            delete cleanResult.rosId;

            const { severity, onset_pattern, duration, ...otherStructured } = cleanResult.structured || cleanResult;
            const sanitizedStructured: any = { ...otherStructured };

            const validSeverities = ['None', 'Minimal', 'Mild', 'Moderate', 'High', 'Severe', 'Critical'];
            if (severity && validSeverities.includes(severity)) {
                sanitizedStructured.severity = severity;
            } else if (severity === 'Low') {
                sanitizedStructured.severity = 'Mild';
            }

            const validOnsets = ['Sudden', 'Gradual', 'Insidious', 'Subacute'];
            if (onset_pattern && validOnsets.includes(onset_pattern)) {
                sanitizedStructured.onset_pattern = onset_pattern;
            }

            if (duration && !duration.toLowerCase().includes('unknown')) {
                sanitizedStructured.duration = duration;
            }

            // Step 2: Construct Persistence Payload
            const savePayload = {
                ...cleanResult,
                structured: sanitizedStructured,
                patient_id: context.patient || context.patient_id, // Match AddHPI.tsx
                consult_id: numConsult,
                consultId: numConsult,
                narrative: narrative.trim()
            };

            let res;
            if (activeSection === 'hpi') {
                res = await HPIService.submitHPI(savePayload);
            } else if (activeSection === 'cc') {
                res = await ChiefComplaintService.createComplaint(savePayload);
            }

            if (res && (res.success || (res as any).code === 201 || (res as any).code === 200 || !!(res as any).data)) {
                if (onSave) onSave(res.data || res);
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
        { id: 'cc', label: 'CC', icon: <ClipboardList size={14} />, desc: 'Chief Complaint' },
        { id: 'ros', label: 'ROS', icon: <Activity size={14} />, desc: 'Systems Review' },
        { id: 'symptoms', label: 'Vitals', icon: <Stethoscope size={14} />, desc: 'Vitals Snapshot' },
    ] as const;

    const riskMarkers = structured?.risk_markers || structured?.structured?.risk_markers;

    return (
        <div className="flex flex-col h-full bg-card px-2">
            <div className="flex bg-page p-1.5 rounded-xl border border-border-card mb-6 group shadow-inner">
                {sections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setActiveSection(s.id)}
                        className={`flex-1 flex flex-col items-center py-2.5 rounded-lg transition-all ${activeSection === s.id ? 'bg-card text-indigo-600 shadow-md border border-border-card' : 'text-muted opacity-80 hover:text-muted'
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
                {activeSection === 'symptoms' ? (
                    <ConsultSymptoms
                        patientId={patientHex || resolvedId}
                        consultId={consultId}
                        onSave={onSave}
                    />
                ) : activeSection === 'ros' ? (
                    <ConsultROS
                        patientId={patientHex || resolvedId}
                        consultId={consultId}
                        onSave={onSave}
                        initialTab="new"
                    />
                ) : activeSection === 'cc' ? (
                    /* ── Chief Complaint: White Card History View ── */
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">

                        {/* Header row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-100">
                                    <ClipboardList size={15} />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-black text-main uppercase tracking-widest">Chief Complaints</h3>
                                    <p className="text-[8px] font-bold text-muted opacity-80 uppercase tracking-tighter">{ccComplaints.length} Record{ccComplaints.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setCcShowNew(v => !v); setNarrative(''); setStructured(null); }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                    ccShowNew
                                        ? 'bg-page border-border-card text-muted'
                                        : 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100 hover:bg-rose-700'
                                }`}
                            >
                                {ccShowNew ? <>
                                    <ChevronRight size={13} className="rotate-180" /> Back
                                </> : <>
                                    <Plus size={13} /> New CC
                                </>}
                            </button>
                        </div>

                        {/* New CC Form (slide in when ccShowNew) */}
                        {ccShowNew && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="bg-card border-2 border-rose-100 rounded-[2rem] p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                                                <Sparkles size={15} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-main uppercase tracking-widest">New Chief Complaint</p>
                                                <p className="text-[8px] font-bold text-muted opacity-80 uppercase">AI Extraction Active</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={toggleRecording}
                                            className={`p-2.5 rounded-xl transition-all flex items-center gap-1.5 border-2 ${
                                                isRecording
                                                    ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                                                    : 'bg-page text-muted opacity-80 border-border-card hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                            }`}
                                        >
                                            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                                            <span className="text-[8px] font-black uppercase tracking-widest">{isRecording ? 'Stop' : 'Voice'}</span>
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <textarea
                                            value={narrative}
                                            onChange={(e) => setNarrative(e.target.value)}
                                            placeholder="Describe the patient's chief complaint in detail — presenting symptoms, duration, severity..."
                                            className="w-full h-36 bg-card/50 border-2 border-border-card rounded-2xl p-5 text-xs font-bold text-main placeholder:text-muted opacity-40 focus:outline-none focus:border-rose-200 focus:bg-card transition-all resize-none shadow-inner leading-relaxed"
                                        />
                                        {isRecording && (
                                            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-rose-500 font-black text-[8px] uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                                                Listening...
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={extracting || !narrative.trim()}
                                            onClick={handleAIExtract}
                                            className="flex-1 rounded-xl font-black uppercase text-[9px] tracking-widest border border-border-card"
                                        >
                                            {extracting ? 'Extracting...' : '✦ AI Extract'}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            disabled={saving || !narrative.trim()}
                                            isLoading={saving}
                                            onClick={handleSave}
                                            className="flex-1 rounded-xl font-black uppercase text-[9px] tracking-widest bg-rose-600 border-rose-600 shadow-lg shadow-rose-100"
                                        >
                                            Save CC
                                        </Button>
                                    </div>
                                </div>

                                {/* AI extraction result preview for CC */}
                                {structured && (
                                    <div className="bg-page border border-border-card rounded-2xl p-5 space-y-3 animate-in fade-in duration-300">
                                        <div className="flex items-center gap-2">
                                            <Brain size={14} className="text-indigo-600" />
                                            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">AI Analysis</p>
                                            <span className={`ml-auto px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                                riskMarkers?.risk_level === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                                            }`}>{riskMarkers?.risk_level || 'Routine'}</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-muted italic leading-relaxed">
                                            "{structured.ai_summary || structured.narrative || narrative}"
                                        </p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { label: 'Duration', value: (structured.structured || structured).duration || 'Unknown' },
                                                { label: 'Severity', value: (structured.structured || structured).severity || 'Acute' },
                                                { label: 'Pattern', value: (structured.structured || structured).onset_pattern || 'Stable' },
                                            ].map((item, i) => (
                                                <div key={i} className="bg-card p-3 rounded-xl border border-border-card text-center">
                                                    <p className="text-[7px] font-black text-muted opacity-80 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-[10px] font-black text-main uppercase mt-0.5">{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CC Cards List */}
                        {ccLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                                <p className="ml-3 text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Loading...</p>
                            </div>
                        ) : ccComplaints.length === 0 && !ccShowNew ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-card border-2 border-dashed border-border-card rounded-[2rem]">
                                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center mb-3">
                                    <MessageSquare size={22} className="text-rose-300" />
                                </div>
                                <h4 className="text-[11px] font-black text-main uppercase tracking-widest mb-1">No Complaints Recorded</h4>
                                <p className="text-[9px] font-bold text-muted opacity-80 uppercase tracking-tight mb-5">No chief complaints on file for this patient</p>
                                <button
                                    onClick={() => setCcShowNew(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all"
                                >
                                    <Plus size={13} /> Add First Complaint
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {ccComplaints.map((cc: any, index: number) => (
                                    <div
                                        key={cc._id || cc.id || cc.chiefComplaintId || index}
                                        className="bg-card border-2 border-border-card rounded-[1.75rem] p-5 shadow-sm hover:border-rose-200 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className="w-9 h-9 shrink-0 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                                                    <MessageSquare size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black text-main uppercase tracking-widest mb-1">Chief Complaint</p>
                                                    <p className="text-[11px] font-bold text-muted leading-relaxed line-clamp-3 italic">
                                                        "{cc.narrative || 'No narrative recorded.'}"
                                                    </p>
                                                    {/* Structured tags */}
                                                    {(cc.structured?.symptoms?.length > 0 || cc.structured?.mood_markers?.length > 0) && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {[...(cc.structured?.symptoms || []), ...(cc.structured?.mood_markers || [])].slice(0, 4).map((tag: string, i: number) => (
                                                                <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-[8px] font-black uppercase tracking-tight">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                {cc.structured?.severity && (
                                                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest block mb-1 ${
                                                        cc.structured.severity === 'Severe' || cc.structured.severity === 'Critical'
                                                            ? 'bg-rose-100 text-rose-600'
                                                            : cc.structured.severity === 'Moderate'
                                                            ? 'bg-amber-100 text-amber-600'
                                                            : 'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                        {cc.structured.severity}
                                                    </span>
                                                )}
                                                <p className="text-[8px] font-bold text-muted opacity-40 uppercase">
                                                    {cc.createdAt ? new Date(cc.createdAt).toLocaleDateString() : 'Recent'}
                                                </p>
                                            </div>
                                        </div>
                                        {cc.structured?.duration && (
                                            <div className="mt-3 pt-3 border-t border-border-card flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-muted opacity-80">
                                                    <Clock size={10} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">{cc.structured.duration}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
                        {/* Entry Workspace */}
                        <div className="bg-card border-2 border-border-card rounded-[2rem] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-[11px] font-black text-main uppercase tracking-widest">Clinical Intake Narrative</h3>
                                        <p className="text-[9px] font-bold text-muted opacity-80 uppercase tracking-tight">Virtual Assistant Active</p>
                                    </div>
                                </div>

                                <button
                                    onClick={toggleRecording}
                                    className={`p-3 rounded-xl transition-all flex items-center gap-2 border-2 ${isRecording
                                        ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                                        : 'bg-page text-muted opacity-80 border-border-card hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
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
                                    className="w-full h-56 bg-card/50 border-2 border-border-card rounded-2xl p-6 text-xs font-bold text-main placeholder:text-muted opacity-40 focus:outline-none focus:border-indigo-200 focus:bg-card transition-all resize-none shadow-inner leading-relaxed"
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
                                { (riskMarkers?.self_harm_detected || riskMarkers?.psychosis_detected || riskMarkers?.violence_detected) && (
                                    <div className="p-5 bg-rose-600 text-white rounded-2xl shadow-xl shadow-rose-100 flex items-center gap-5 animate-pulse">
                                        <div className="w-12 h-12 bg-card/20 rounded-xl flex items-center justify-center">
                                            <ShieldAlert size={28} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.1em]">Critical Clinical Risk Detected</h4>
                                            <p className="text-[10px] font-bold text-rose-50 leading-tight mt-0.5">
                                                {riskMarkers?.self_harm_detected && "• Self-harm/Suicidality "}
                                                {riskMarkers?.psychosis_detected && "• Psychosis/Hallucinations "}
                                                {riskMarkers?.violence_detected && "• Violence/Aggression "}
                                                identified in narrative. Review safety protocols immediately.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Analysis Grid */}
                                <div className="bg-page border-2 border-border-card rounded-[2.5rem] p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
                                                <Brain size={20} />
                                            </div>
                                            <h4 className="text-sm font-black text-main tracking-tight">Clinical Diagnostic Analytics</h4>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${riskMarkers?.risk_level === 'High' ? 'bg-rose-100 text-rose-600 shadow-sm shadow-rose-50' : 'bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-50'}`}>
                                            {riskMarkers?.risk_level || 'Routine'} Priority
                                        </div>
                                    </div>

                                    {/* Narrative Abstract */}
                                    <div className="p-6 bg-card border border-border-card rounded-2xl shadow-sm italic text-xs font-bold text-muted leading-relaxed">
                                        "{structured.ai_summary || structured.narrative || narrative}"
                                    </div>

                                    {/* Clinical Insight Grid (Mobile Parity UI) */}
                                    {activeSection === 'hpi' && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { icon: <Clock size={16} />, label: 'Onset', value: (structured.structured || structured).onset || 'Gradual' },
                                                { icon: <Activity size={16} />, label: 'Course', value: (structured.structured || structured).course || 'Chronic' },
                                                { icon: <Sparkles size={16} />, label: 'Sleep', value: (structured.structured || structured).sleep || 'Disturbed' },
                                                { icon: <ShieldAlert size={16} />, label: 'Safety', value: (structured.structured || structured).suicidal_ideation || (structured.structured || structured).safety || 'Not Detected' },
                                            ].map((insight, i) => (
                                                <div key={i} className="bg-card p-4 rounded-xl border border-border-card flex flex-col items-center text-center gap-1.5 shadow-sm">
                                                    <div className="text-indigo-600 opacity-80">{insight.icon}</div>
                                                    <p className="text-[8px] font-black text-muted opacity-80 uppercase tracking-widest">{insight.label}</p>
                                                    <p className="text-[10px] font-black text-main uppercase tabular-nums">{insight.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}




                                    {/* Potential Diagnoses & DSM Tags */}
                                    {(structured.structured || structured).potential_diagnoses && (
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">Clinical Impressions</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(structured.structured || structured).potential_diagnoses.map((dx: string) => (
                                                    <span key={dx} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                                                        {dx}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(structured.structured || structured).dsm5_mapping && (
                                        <div className="space-y-3">
                                            <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">DSM-5 Mapping</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(structured.structured || structured).dsm5_mapping.map((dx: string) => (
                                                    <span key={dx} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                                                        {dx}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fallback for other domains (Flat Data Review) */}

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

                        <div className="p-6 bg-page rounded-2xl border border-border-card">
                            <div className="flex items-center gap-3 mb-2">
                                <AlertCircle size={14} className="text-muted opacity-80" />
                                <h5 className="text-[10px] font-black text-main uppercase tracking-widest">Clinical Protocol</h5>
                            </div>
                            <p className="text-[9px] font-bold text-muted leading-relaxed uppercase tracking-tight">
                                All clinical data captured during this teleconsult is encrypted and stored in compliance with HIPAA longevity standards.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
