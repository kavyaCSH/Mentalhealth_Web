import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Brain, ShieldAlert, Target, Activity, AlertTriangle, Lightbulb, TrendingUp, Info, FileText, Clock, ArrowLeft, ListChecks
} from 'lucide-react';
import type { AIDiagnosisData, NewDiagnosisCondition, PrescriptionItem } from '../../types/diagnosis.types';

// ─── Shared UI Helpers ────────────────────────────────────────────────────────

const riskConfig: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    low:      { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
    moderate: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   badge: 'bg-amber-100 text-amber-700'   },
    high:     { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  badge: 'bg-orange-100 text-orange-700' },
    critical: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     badge: 'bg-red-100 text-red-700'     },
};
const getRisk = (level?: string) => riskConfig[(level || '').toLowerCase()] || riskConfig.moderate;

const ConfidenceMeter = ({ value }: { value: number }) => {
    const pct = value > 1 ? value : Math.round(value * 100);
    const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-orange-500';
    return (
        <div className="flex items-center gap-2 min-w-[90px]">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${color}`}
                />
            </div>
            <span className="text-[10px] font-black text-slate-500 tabular-nums">{pct}%</span>
        </div>
    );
};

const TagList = ({ items, variant }: { items: string[]; variant: 'green' | 'red' | 'slate' | 'amber' }) => {
    const cls: Record<string, string> = {
        green: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        red:   'bg-red-50 text-red-700 border border-red-100',
        slate: 'bg-slate-100 text-slate-600 border border-slate-200',
        amber: 'bg-amber-50 text-amber-700 border border-amber-100',
    };
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item, i) => (
                <span key={i} className={`px-3 py-1 rounded-xl text-[11px] font-bold ${cls[variant]}`}>
                    {item}
                </span>
            ))}
        </div>
    );
};

const ConditionCard = ({ dx, title, color }: { dx: NewDiagnosisCondition; title: string; color: string }) => (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className={`w-7 h-7 rounded-xl ${color.replace('text-', 'bg-').replace('600', '100')} ${color} flex items-center justify-center shrink-0 mt-0.5`}>
            <Target size={14} />
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{title}</p>
                    <p className="font-black text-slate-900 text-sm mt-0.5">{dx.condition}</p>
                </div>
                {dx.dsm5_code && (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest shrink-0">
                        {dx.dsm5_code}
                    </span>
                )}
            </div>
            {dx.specifiers && dx.specifiers.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {dx.specifiers.map((spec, i) => (
                        <span key={i} className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-black uppercase tracking-widest">
                            {spec}
                        </span>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const Section = ({ icon, title, color, children }: { icon: React.ReactNode; title: string; color: string; children: React.ReactNode; }) => {
    return (
        <div className="border border-slate-100 rounded-2xl overflow-hidden mb-4">
            <div className="w-full flex items-center justify-between px-5 py-4 bg-slate-50/70 border-b border-slate-100">
                <div className={`flex items-center gap-2.5 font-black text-sm ${color}`}>
                    {icon} {title}
                </div>
            </div>
            <div className="px-5 pb-5 pt-4 space-y-2">{children}</div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const AIDiagnosisResultPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { patientId } = useParams();

    // The result should be passed in via router state
    const result = location.state?.result as AIDiagnosisData | null;

    if (!result) {
        return (
            <div className="p-8 max-w-5xl mx-auto animate-fade-in text-center">
                <h2 className="text-2xl font-black text-slate-800 mb-4">No Diagnosis Data</h2>
                <button
                    onClick={() => navigate(`/patients/${patientId}/ai-diagnosis`)}
                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl"
                >
                    Back to AI Diagnosis
                </button>
            </div>
        );
    }

    const date = result.generated_at ? new Date(result.generated_at) : new Date();
    const risk = getRisk(result.riskLevel);

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in pb-16">
            <button
                onClick={() => navigate(`/patients/${patientId}/ai-diagnosis`)}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 mb-8 transition-colors"
            >
                <ArrowLeft size={16} /> Back to AI Diagnosis Generator
            </button>
            
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Brain className="text-violet-600" size={32} />
                        Diagnosis Report
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 ml-11">
                        <Clock size={11} />
                        Generated {date.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </header>

            <div className="card-premium p-6">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    
                    {/* RISK BADGE */}
                    {result.riskLevel && (
                        <div className={`flex items-center gap-4 p-5 rounded-2xl border ${risk.bg} ${risk.border} mb-6`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${risk.badge}`}>
                                <ShieldAlert size={22} className={risk.text} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${risk.text} opacity-70`}>Risk Stratification</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className={`text-lg font-black ${risk.text} capitalize`}>{result.riskLevel}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NESTED SCHEMA DIAGNOSIS */}
                    {result.diagnosis?.primary && (
                        <Section icon={<Target size={15} />} title="Clinical Diagnosis" color="text-indigo-600">
                            <div className="space-y-3">
                                <ConditionCard dx={result.diagnosis.primary} title="Primary Diagnosis" color="text-indigo-600" />
                                {result.diagnosis.secondary && (
                                    <ConditionCard dx={result.diagnosis.secondary} title="Secondary Diagnosis" color="text-violet-600" />
                                )}
                            </div>
                            {result.diagnosis.severity && (
                                <div className="mt-4 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100 inline-block">
                                    Severity: {result.diagnosis.severity}
                                </div>
                            )}
                        </Section>
                    )}

                    {/* FLAT SCHEMA PRIMARY DIAGNOSIS */}
                    {result.primaryDiagnosis && (
                        <Section icon={<Target size={15} />} title="Primary Diagnosis" color="text-indigo-600">
                            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <Brain size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg">{result.primaryDiagnosis}</h3>
                                        </div>
                                        {result.severity && (
                                            <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100 shrink-0">
                                                Severity: {result.severity}
                                            </span>
                                        )}
                                    </div>
                                    {result.confidence !== undefined && (
                                        <div className="mt-3">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">AI Confidence Match</p>
                                            <ConfidenceMeter value={result.confidence} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Section>
                    )}

                    {/* NESTED STRESSORS */}
                    {result.diagnosis?.stressors && result.diagnosis.stressors.length > 0 && (
                        <Section icon={<AlertTriangle size={15} />} title="Identified Stressors" color="text-amber-600">
                            <TagList items={result.diagnosis.stressors} variant="amber" />
                        </Section>
                    )}

                    {/* FLAT SYMPTOMS */}
                    {result.symptomsIdentified && result.symptomsIdentified.length > 0 && (
                        <Section icon={<Activity size={15} />} title="Identified Symptoms" color="text-emerald-600">
                            <TagList items={result.symptomsIdentified} variant="green" />
                        </Section>
                    )}

                    {/* NESTED PRESCRIPTION */}
                    {result.prescription && result.prescription.length > 0 && (
                        <Section icon={<ListChecks size={15} />} title="Recommended Prescription Plan" color="text-emerald-600">
                            <div className="space-y-3">
                                {result.prescription.map((rx: PrescriptionItem, i: number) => (
                                    <div key={i} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                                            <ListChecks size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-emerald-900 text-sm flex items-center gap-2">
                                                {rx.name}
                                                <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded text-[9px] font-black uppercase tracking-widest">
                                                    {rx.dose}
                                                </span>
                                            </h4>
                                            <div className="mt-1 flex items-center gap-2 text-xs font-bold text-emerald-700">
                                                <Clock size={12} /> {rx.duration}
                                            </div>
                                            <p className="text-xs text-emerald-800/80 font-medium mt-2 leading-relaxed italic">
                                                {rx.instructions}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    )}

                    {/* FLAT RECOMMENDATIONS */}
                    {result.recommendations && result.recommendations.length > 0 && (
                        <Section icon={<Lightbulb size={15} />} title="Clinical Recommendations" color="text-amber-600">
                            <ul className="space-y-2">
                                {result.recommendations.map((r, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-slate-700 p-2 rounded-lg hover:bg-slate-50">
                                        <TrendingUp size={14} className="text-amber-500 shrink-0 mt-0.5" /> {r}
                                    </li>
                                ))}
                            </ul>
                        </Section>
                    )}

                    {/* NARRATIVE */}
                    {result.narrative && (
                        <Section icon={<FileText size={15} />} title="Submitted Narrative" color="text-slate-400">
                            <p className="text-sm font-medium text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-4 py-1">
                                "{result.narrative}"
                            </p>
                        </Section>
                    )}

                    {/* DISCLAIMER */}
                    <div className="flex items-start gap-2 p-3 bg-amber-50/80 rounded-xl border border-amber-100 mt-6">
                        <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-medium text-amber-700 leading-relaxed">
                            AI-generated assessment — for clinical decision support only. Validate all findings with licensed clinical judgment before treatment decisions.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AIDiagnosisResultPage;
