import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Sparkles, Plus, History, X, ArrowLeft,
    Target, ShieldAlert, Activity, AlertTriangle, Lightbulb,
    TrendingUp, FileText, Clock, ListChecks, Info,
    Loader2, Calendar, ChevronRight
} from 'lucide-react';
import AIDiagnosisPanel from './AIDiagnosisPanel';
import { DiagnosisService } from '../../api/services/diagnosis.service';
import type { AIDiagnosisData, NewDiagnosisCondition, PrescriptionItem } from '../../types/diagnosis.types';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const riskConfig: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    low:      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
    moderate: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700'   },
    high:     { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-700' },
    critical: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     badge: 'bg-red-100 text-red-700'      },
};
const getRisk = (level?: string) => riskConfig[(level || '').toLowerCase()] || riskConfig.moderate;

const TagList = ({ items, variant }: { items: string[]; variant: 'green' | 'red' | 'slate' | 'amber' }) => {
    const cls: Record<string, string> = {
        green: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        red:   'bg-red-50 text-red-700 border border-red-100',
        slate: 'bg-page text-muted border border-border-card',
        amber: 'bg-amber-50 text-amber-700 border border-amber-100',
    };
    return (
        <div className="flex flex-wrap gap-1.5">
            {items.map((item, i) => (
                <span key={i} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${cls[variant]}`}>{item}</span>
            ))}
        </div>
    );
};

const ConditionCard = ({ dx, title, color }: { dx: NewDiagnosisCondition; title: string; color: string }) => (
    <div className="flex items-start gap-3 p-3 bg-page rounded-xl border border-border-card">
        <div className={`w-6 h-6 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')} ${color} flex items-center justify-center shrink-0 mt-0.5`}>
            <Target size={12} />
        </div>
        <div className="flex-1 min-w-0">
            <p className={`text-[9px] font-black uppercase tracking-widest ${color}`}>{title}</p>
            <p className="font-black text-main text-sm mt-0.5">{dx.condition}</p>
            {dx.dsm5_code && (
                <span className="px-2 py-0.5 bg-border-card text-muted rounded text-[9px] font-black uppercase tracking-widest mt-1 inline-block">
                    {dx.dsm5_code}
                </span>
            )}
        </div>
    </div>
);

const Section = ({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode }) => (
    <div className="border border-border-card rounded-xl overflow-hidden mb-3">
        <div className="w-full flex items-center px-4 py-3 bg-page/70 border-b border-border-card">
            <div className={`flex items-center gap-2 font-black text-xs ${color}`}>{icon} {title}</div>
        </div>
        <div className="px-4 pb-4 pt-3 space-y-2">{children}</div>
    </div>
);

// ─── Inline Diagnosis Result (no navigation) ──────────────────────────────────

interface InlineDiagnosisResultProps {
    result: AIDiagnosisData;
    onBack: () => void;
}

const InlineDiagnosisResult = ({ result, onBack }: InlineDiagnosisResultProps) => {
    const risk = getRisk(result.riskLevel);
    const date = result.generated_at ? new Date(result.generated_at) : new Date();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
        >
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-bold text-muted hover:text-indigo-600 mb-2 transition-colors"
            >
                <ArrowLeft size={13} /> Back to History
            </button>

            <div className="flex items-center gap-2 pb-2 border-b border-border-card">
                <Brain size={16} className="text-violet-600" />
                <h3 className="text-sm font-black text-main">Diagnosis Report</h3>
                <span className="ml-auto text-[9px] font-bold text-muted opacity-80 flex items-center gap-1">
                    <Clock size={9} />
                    {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            </div>

            {result.riskLevel && (
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${risk.bg} ${risk.border}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${risk.badge}`}>
                        <ShieldAlert size={16} className={risk.text} />
                    </div>
                    <div>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${risk.text} opacity-70`}>Risk Level</p>
                        <span className={`text-sm font-black ${risk.text} capitalize`}>{result.riskLevel}</span>
                    </div>
                </div>
            )}

            {result.diagnosis?.primary && (
                <Section icon={<Target size={12} />} title="Clinical Diagnosis" color="text-indigo-600">
                    <ConditionCard dx={result.diagnosis.primary} title="Primary Diagnosis" color="text-indigo-600" />
                    {result.diagnosis.secondary && (
                        <ConditionCard dx={result.diagnosis.secondary} title="Secondary Diagnosis" color="text-violet-600" />
                    )}
                    {result.diagnosis.severity && (
                        <span className="px-2 py-1 bg-rose-50 text-rose-700 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100 inline-block mt-1">
                            Severity: {result.diagnosis.severity}
                        </span>
                    )}
                </Section>
            )}

            {result.primaryDiagnosis && (
                <Section icon={<Target size={12} />} title="Primary Diagnosis" color="text-indigo-600">
                    <p className="font-black text-main text-sm">{result.primaryDiagnosis}</p>
                    {result.severity && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-lg text-[9px] font-black uppercase border border-rose-100 inline-block">
                            Severity: {result.severity}
                        </span>
                    )}
                </Section>
            )}

            {result.diagnosis?.stressors && result.diagnosis.stressors.length > 0 && (
                <Section icon={<AlertTriangle size={12} />} title="Stressors" color="text-amber-600">
                    <TagList items={result.diagnosis.stressors} variant="amber" />
                </Section>
            )}

            {result.symptomsIdentified && result.symptomsIdentified.length > 0 && (
                <Section icon={<Activity size={12} />} title="Identified Symptoms" color="text-emerald-600">
                    <TagList items={result.symptomsIdentified} variant="green" />
                </Section>
            )}

            {result.prescription && result.prescription.length > 0 && (
                <Section icon={<ListChecks size={12} />} title="Prescription Plan" color="text-emerald-600">
                    <div className="space-y-2">
                        {result.prescription.map((rx: PrescriptionItem, i: number) => (
                            <div key={i} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                <h4 className="font-black text-emerald-900 text-xs flex items-center gap-1.5">
                                    {rx.name}
                                    <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-800 rounded text-[9px] font-black">{rx.dose}</span>
                                </h4>
                                <p className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1"><Clock size={9} /> {rx.duration}</p>
                                {rx.instructions && <p className="text-[10px] text-emerald-800/80 mt-1 italic leading-relaxed">{rx.instructions}</p>}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {result.recommendations && result.recommendations.length > 0 && (
                <Section icon={<Lightbulb size={12} />} title="Recommendations" color="text-amber-600">
                    <ul className="space-y-1.5">
                        {result.recommendations.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs font-medium text-main">
                                <TrendingUp size={11} className="text-amber-500 shrink-0 mt-0.5" /> {r}
                            </li>
                        ))}
                    </ul>
                </Section>
            )}

            {result.narrative && (
                <Section icon={<FileText size={12} />} title="Submitted Narrative" color="text-muted opacity-80">
                    <p className="text-xs font-medium text-muted leading-relaxed italic border-l-2 border-border-card pl-3 py-0.5">
                        "{result.narrative}"
                    </p>
                </Section>
            )}

            <div className="flex items-start gap-2 p-3 bg-amber-50/80 rounded-xl border border-amber-100 mt-2">
                <Info size={11} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[9px] font-medium text-amber-700 leading-relaxed">
                    AI-generated — for clinical decision support only. Validate with licensed clinical judgment.
                </p>
            </div>
        </motion.div>
    );
};

// ─── Inline History list (no navigate — uses onSelect callback) ───────────────

interface AIDiagnosisHistoryInlineProps {
    patientId: number;
    onSelect: (result: AIDiagnosisData) => void;
}

const AIDiagnosisHistoryInline = ({ patientId, onSelect }: AIDiagnosisHistoryInlineProps) => {
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!patientId) return;
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const data = await DiagnosisService.getAIDiagnosisHistory(patientId);
                if (data?.code === 404 || data?.message === 'Patient not found') { setHistory([]); return; }
                const records = Array.isArray(data) ? data : (data?.data || []);
                setHistory(records);
            } catch (err: any) {
                const resData = err?.response?.data;
                if (err?.response?.status === 404 || resData?.code === 404) { setHistory([]); setError(null); }
                else setError(resData?.message || 'Failed to load diagnosis history.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [patientId]);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-10 space-y-3">
            <Loader2 className="animate-spin text-indigo-500" size={28} />
            <p className="text-xs font-bold text-muted">Loading history...</p>
        </div>
    );

    if (error) return (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
            <ShieldAlert className="text-red-500 shrink-0" size={18} />
            <p className="text-xs font-medium text-red-700">{error}</p>
        </div>
    );

    if (history.length === 0) return (
        <div className="text-center p-12 border-2 border-dashed border-border-card rounded-2xl bg-card/50">
            <FileText className="mx-auto text-muted opacity-40 mb-3" size={40} />
            <h3 className="text-sm font-black text-main mb-1">No past diagnoses</h3>
            <p className="text-xs font-medium text-muted">No AI diagnosis records yet.</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {history.map((record, idx) => {
                const diagnosisData: AIDiagnosisData = record.data || record;
                const primaryCondition = diagnosisData?.diagnosis?.primary?.condition || diagnosisData?.primaryDiagnosis;
                const severity = diagnosisData?.diagnosis?.severity || diagnosisData?.severity;
                const date = record.created_at || diagnosisData.generated_at;

                return (
                    <motion.div
                        key={record.id || idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => onSelect(diagnosisData)}
                        className="bg-card border border-border-card rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all group cursor-pointer flex items-center gap-4"
                    >
                        <div className="w-9 h-9 rounded-xl bg-page flex items-center justify-center text-muted group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                            <Calendar size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted opacity-80 mb-0.5">
                                {date ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown Date'}
                            </p>
                            {primaryCondition ? (
                                <h4 className="text-sm font-black text-main truncate">{primaryCondition}</h4>
                            ) : (
                                <p className="text-xs font-medium text-muted opacity-80 italic">No primary diagnosis recorded</p>
                            )}
                            {severity && (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[9px] font-black uppercase tracking-widest border border-rose-100 mt-1 inline-block">
                                    {severity}
                                </span>
                            )}
                        </div>
                        <ChevronRight size={16} className="text-muted opacity-40 group-hover:text-indigo-500 transition-colors shrink-0" />
                    </motion.div>
                );
            })}
        </div>
    );
};

// ─── History + Result switcher (no navigation) ────────────────────────────────

const InlineHistoryWithResult = ({ patientId }: { patientId: number }) => {
    const [selectedResult, setSelectedResult] = useState<AIDiagnosisData | null>(null);

    if (selectedResult) {
        return <InlineDiagnosisResult result={selectedResult} onBack={() => setSelectedResult(null)} />;
    }
    return <AIDiagnosisHistoryInline patientId={patientId} onSelect={setSelectedResult} />;
};

// ─── Clinician Sidebar Tool: AI Diagnosis (New Analysis + History) ────────────

interface ConsultAIDiagnosisProps {
    patientId: string | number;
}

export const ConsultAIDiagnosis = ({ patientId }: ConsultAIDiagnosisProps) => {
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    const numericId = Number(patientId);

    return (
        <div className="space-y-4">
            <div className="flex bg-page p-1 rounded-xl gap-1">
                <button
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === 'new' ? 'bg-card text-indigo-600 shadow-sm' : 'text-muted hover:text-main'
                    }`}
                >
                    <Plus size={11} /> New Analysis
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === 'history' ? 'bg-card text-indigo-600 shadow-sm' : 'text-muted hover:text-main'
                    }`}
                >
                    <History size={11} /> History
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'new' ? (
                    <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {numericId ? (
                            <AIDiagnosisPanel patientId={numericId} />
                        ) : (
                            <p className="text-xs text-muted italic p-4">Patient ID not resolved yet.</p>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {numericId ? (
                            <InlineHistoryWithResult patientId={numericId} />
                        ) : (
                            <p className="text-xs text-muted italic p-4">Patient ID not resolved yet.</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Patient-side floating panel (history only, no navigation) ────────────────

export const PatientTeleconsultDiagnosisPanel = ({ patientId }: { patientId: number }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating trigger */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 z-[200] flex items-center gap-2.5 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl shadow-2xl shadow-violet-600/40 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
            >
                <Sparkles size={16} />
                My Diagnosis History
            </motion.button>

            {/* Slide-up panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[210]"
                        />
                        <motion.div
                            initial={{ y: '100%', opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 28, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 z-[220] bg-card rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.15)] max-h-[80vh] flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-border-card shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-main">My Diagnosis History</h2>
                                        <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mt-0.5">Past AI clinical assessments</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-9 h-9 rounded-xl bg-page hover:bg-page flex items-center justify-center text-muted opacity-80 hover:text-muted transition-all border border-border-card"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <InlineHistoryWithResult patientId={patientId} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
