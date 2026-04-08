import React, { useState } from 'react';
import {
    Brain,
    Search,
    ArrowLeft,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    AlertTriangle,
    Activity,
    User,
    Clock,
    FileText,
    Pill,
    Sparkles,
    Shield,
    Eye,
    Loader2,
    Zap,
    ChevronRight,
    X,
    Stethoscope,
    HeartPulse,
    ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClinicalIntelligenceService } from '../../api/services/clinical-intelligence.service';
import { TreatmentService } from '../../api/services/treatment.service';
import type { ClinicalSummary, ClinicalInference } from '../../types/clinical-intelligence.types';
import type { TreatmentPlan } from '../../types/treatment.types';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

const RISK_COLORS: Record<string, { label: string; bg: string; text: string; border: string; glow: string }> = {
    '#4CAF50': { label: 'Low Risk', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', glow: 'shadow-emerald-100' },
    '#FDD835': { label: 'Moderate Risk', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', glow: 'shadow-yellow-100' },
    '#FB8C00': { label: 'High Risk', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', glow: 'shadow-orange-100' },
    '#E53935': { label: 'Critical Risk', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', glow: 'shadow-rose-100' },
};

const MODULE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
    chief_complaints: { label: 'Chief Complaints', icon: FileText },
    hpi: { label: 'History of Present Illness', icon: ClipboardList },
    ros: { label: 'Review of Systems', icon: Activity },
    past_history: { label: 'Past History', icon: Clock },
    mse: { label: 'Mental Status Exam', icon: Brain },
    symptoms: { label: 'Symptom Inventory', icon: HeartPulse },
};

const ClinicalIntelligencePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const role = user?.role;
    const canInfer = role === 'super_admin' || role === 'psychiatrist';

    // Lookup state
    const [patientId, setPatientId] = useState('');
    const [consultId, setConsultId] = useState('');

    // Data state
    const [summary, setSummary] = useState<ClinicalSummary | null>(null);
    const [inference, setInference] = useState<ClinicalInference | null>(null);
    const [planHistory, setPlanHistory] = useState<TreatmentPlan[]>([]);

    // UI state
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [loadingInference, setLoadingInference] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [activeTab, setActiveTab] = useState<'summary' | 'inference' | 'plans'>('summary');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleLookup = async () => {
        if (!patientId.trim()) return;
        setMessage(null);
        setSummary(null);
        setInference(null);
        setPlanHistory([]);
        setActiveTab('summary');

        setLoadingSummary(true);
        setLoadingPlans(true);
        try {
            const [summaryData, plans] = await Promise.all([
                ClinicalIntelligenceService.getClinicalSummary(patientId, consultId || undefined),
                TreatmentService.getPlanHistory(patientId),
            ]);
            setSummary(summaryData);
            setPlanHistory(plans);
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to retrieve clinical dossier. Verify Patient ID and clearance.' });
        } finally {
            setLoadingSummary(false);
            setLoadingPlans(false);
        }
    };

    const handleGenerateInference = async () => {
        if (!patientId.trim()) return;
        setLoadingInference(true);
        setMessage(null);
        setInference(null);
        setActiveTab('inference');
        try {
            const data = await ClinicalIntelligenceService.generateInference(patientId, consultId || undefined);
            setInference(data);
            setMessage({ type: 'success', text: 'AI Clinical Inference generated and audit-logged successfully.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'AI inference generation failed. Ensure sufficient clinical data exists.' });
        } finally {
            setLoadingInference(false);
        }
    };

    const risk = summary ? RISK_COLORS[summary.summary.overall_color_code] || RISK_COLORS['#4CAF50'] : null;

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Clinical Command
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <Brain size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight text-main">Clinical Intelligence</h1>
                            <p className="text-muted font-medium">AI-powered diagnostics, treatment oversight & risk stratification.</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Patient Lookup */}
            <div className="card-premium p-8 border-slate-100/50 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Search size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">Patient Intelligence Lookup</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter a Patient ID to load their clinical dossier.</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient ID</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g., 17"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                        />
                    </div>
                    <div className="w-full md:w-48 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consult ID <span className="text-slate-300">(Opt.)</span></label>
                        <input
                            type="text"
                            placeholder="e.g., 1001"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                            value={consultId}
                            onChange={(e) => setConsultId(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 items-end">
                        <Button
                            variant="primary"
                            leftIcon={<Search size={18} />}
                            onClick={handleLookup}
                            isLoading={loadingSummary}
                            className="h-[56px] rounded-2xl px-8 uppercase tracking-widest font-black text-xs shadow-xl shadow-indigo-100"
                        >
                            Lookup
                        </Button>
                        {canInfer && (
                            <Button
                                variant="outline"
                                leftIcon={<Sparkles size={18} />}
                                onClick={handleGenerateInference}
                                isLoading={loadingInference}
                                disabled={!patientId.trim()}
                                className="h-[56px] rounded-2xl px-8 uppercase tracking-widest font-black text-xs border-violet-200 text-violet-600 hover:bg-violet-50"
                            >
                                AI Inference
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-3xl border flex items-center gap-4 ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}
                >
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <p className="font-bold text-sm">{message.text}</p>
                </motion.div>
            )}

            {/* Results Area */}
            {(summary || inference || planHistory.length > 0) && (
                <div className="space-y-8">
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {(['summary', 'inference', 'plans'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    activeTab === tab
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                        : 'bg-slate-50 text-slate-500 border border-slate-100 hover:border-indigo-200'
                                }`}
                            >
                                {tab === 'summary' ? '📋 Clinical Summary' : tab === 'inference' ? '🧠 AI Inference' : `💊 Plans (${planHistory.length})`}
                            </button>
                        ))}
                    </div>

                    {/* Tab: Clinical Summary */}
                    {activeTab === 'summary' && summary && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            {/* Patient Header + Risk */}
                            <div className="card-premium p-8 border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                        <User size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{summary.patient.name}</h2>
                                        <p className="text-sm font-bold text-slate-500">
                                            {summary.patient.age} yrs • {summary.patient.gender} • ID: {patientId}
                                        </p>
                                    </div>
                                </div>
                                {risk && (
                                    <div className={`px-6 py-3 rounded-2xl border-2 font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-lg ${risk.bg} ${risk.text} ${risk.border} ${risk.glow}`}>
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: summary.summary.overall_color_code }} />
                                        {risk.label}
                                    </div>
                                )}
                            </div>

                            {/* Module Status Grid */}
                            <div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
                                    Clinical Modules — {summary.summary.total_modules_completed}/6 Completed
                                </h3>
                                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                                    {Object.entries(summary.summary.modules_status).map(([key, status]) => {
                                        const mod = MODULE_LABELS[key] || { label: key, icon: FileText };
                                        const ModIcon = mod.icon;
                                        return (
                                            <div
                                                key={key}
                                                className={`card-premium p-5 text-center space-y-3 border-slate-100/50 ${
                                                    status === 'completed' ? 'ring-2 ring-emerald-200 ring-offset-2' : ''
                                                }`}
                                            >
                                                <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center ${
                                                    status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                    status === 'in_progress' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-slate-50 text-slate-300'
                                                }`}>
                                                    <ModIcon size={20} />
                                                </div>
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">{mod.label}</p>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border inline-block ${
                                                    status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    status === 'in_progress' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                    'bg-slate-50 text-slate-400 border-slate-200'
                                                }`}>
                                                    {status}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'summary' && loadingSummary && (
                        <div className="flex items-center justify-center py-20">
                            <RefreshCw size={40} className="text-indigo-600 animate-spin" />
                        </div>
                    )}

                    {/* Tab: AI Inference */}
                    {activeTab === 'inference' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            {loadingInference ? (
                                <div className="card-premium p-20 text-center border-violet-100/50 space-y-6">
                                    <div className="w-20 h-20 mx-auto bg-violet-50 rounded-full flex items-center justify-center">
                                        <Sparkles size={40} className="text-violet-600 animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-slate-900 uppercase tracking-widest">Generating AI Inference</p>
                                        <p className="text-xs font-bold text-slate-400 mt-1">Analyzing clinical modules, cross-referencing DSM-5 criteria...</p>
                                    </div>
                                </div>
                            ) : inference ? (
                                <>
                                    {/* Risk Stratification */}
                                    <div className={`card-premium p-8 space-y-4 ${
                                        inference.risk_stratification.level === 'critical' ? 'bg-rose-50 border-rose-200' :
                                        inference.risk_stratification.level === 'high' ? 'bg-orange-50 border-orange-200' :
                                        inference.risk_stratification.level === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
                                        'bg-emerald-50 border-emerald-200'
                                    }`}>
                                        <div className="flex items-center gap-4">
                                            <Shield size={28} className={
                                                inference.risk_stratification.level === 'critical' ? 'text-rose-600' :
                                                inference.risk_stratification.level === 'high' ? 'text-orange-600' :
                                                inference.risk_stratification.level === 'moderate' ? 'text-yellow-600' :
                                                'text-emerald-600'
                                            } />
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Risk Stratification</h3>
                                                <p className="text-sm font-bold text-slate-600 capitalize">
                                                    Level: <span className="font-black uppercase">{inference.risk_stratification.level}</span> • Score: {inference.risk_stratification.score}/100
                                                </p>
                                            </div>
                                        </div>
                                        {inference.risk_stratification.description && (
                                            <p className="text-sm font-medium text-slate-600 leading-relaxed">{inference.risk_stratification.description}</p>
                                        )}
                                    </div>

                                    {/* Red Flags */}
                                    {inference.red_flags.length > 0 && (
                                        <div className="card-premium p-8 bg-rose-50 border-rose-200 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <AlertTriangle size={24} className="text-rose-600" />
                                                <h3 className="text-lg font-black text-rose-800 uppercase tracking-widest">Red Flag Alerts</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {inference.red_flags.map((flag, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-4 bg-white/80 rounded-2xl border border-rose-100">
                                                        <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                                                        <p className="text-sm font-bold text-rose-800">{flag}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Differential Diagnosis */}
                                    <div className="card-premium p-8 border-slate-100/50 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Stethoscope size={24} className="text-indigo-600" />
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Differential Diagnosis</h3>
                                        </div>
                                        <div className="space-y-4">
                                            {inference.differential_diagnosis.map((dx, i) => (
                                                <div key={i} className="flex items-center gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-700 text-sm font-black shrink-0">
                                                        #{i + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-base font-black text-slate-900">{dx.condition}</p>
                                                        {dx.reasoning && <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{dx.reasoning}</p>}
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="relative w-14 h-14">
                                                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                                                                <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                                                <path className="text-indigo-600" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${dx.confidence}, 100`} />
                                                            </svg>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-[10px] font-black text-indigo-700">{dx.confidence}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* DSM-5 Criteria */}
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="card-premium p-8 border-emerald-100/50 space-y-4">
                                            <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                                <CheckCircle2 size={16} /> Criteria Matched
                                            </h3>
                                            <div className="space-y-2">
                                                {inference.criteria_matched.map((c, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50/50 rounded-xl">
                                                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                                        <p className="text-xs font-bold text-slate-700">{c}</p>
                                                    </div>
                                                ))}
                                                {inference.criteria_matched.length === 0 && <p className="text-xs font-bold text-slate-400">No criteria matched.</p>}
                                            </div>
                                        </div>
                                        <div className="card-premium p-8 border-amber-100/50 space-y-4">
                                            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                                <AlertCircle size={16} /> Criteria Missing
                                            </h3>
                                            <div className="space-y-2">
                                                {inference.criteria_missing.map((c, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl">
                                                        <X size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                        <p className="text-xs font-bold text-slate-700">{c}</p>
                                                    </div>
                                                ))}
                                                {inference.criteria_missing.length === 0 && <p className="text-xs font-bold text-slate-400">No missing criteria.</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rule-Outs */}
                                    {inference.rule_outs.length > 0 && (
                                        <div className="card-premium p-8 border-slate-100/50 space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rule-Outs</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {inference.rule_outs.map((r, i) => (
                                                    <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-600 line-through decoration-rose-300 decoration-2">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="card-premium p-20 text-center border-dashed border-2 border-violet-100 space-y-4">
                                    <Sparkles size={50} className="mx-auto text-violet-200" />
                                    <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">No Inference Generated</h3>
                                    <p className="text-xs font-bold text-slate-300">Use the "AI Inference" button to trigger AI-powered clinical diagnostics.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Tab: Treatment Plans */}
                    {activeTab === 'plans' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            {loadingPlans ? (
                                <div className="flex items-center justify-center py-20">
                                    <RefreshCw size={40} className="text-indigo-600 animate-spin" />
                                </div>
                            ) : planHistory.length > 0 ? (
                                planHistory.map((plan, i) => (
                                    <div key={plan._id || i} className="card-premium p-8 border-slate-100/50 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                                    <Stethoscope size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                                        Clinical Plan #{planHistory.length - i}
                                                    </h3>
                                                    {plan.clinician && (
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            By Dr. {plan.clinician.firstName} {plan.clinician.lastName} • {plan.clinician.role}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : '—'}
                                            </span>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-2">
                                                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><FileText size={12} /> Treatment Plan</p>
                                                <p className="text-sm font-medium text-slate-700 leading-relaxed">{plan.plan}</p>
                                            </div>
                                            <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100/50 space-y-2">
                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><Pill size={12} /> Medications</p>
                                                <p className="text-sm font-medium text-slate-700 leading-relaxed">{plan.medications || 'None prescribed'}</p>
                                            </div>
                                            <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100/50 space-y-2">
                                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><ChevronRight size={12} /> Next Steps</p>
                                                <p className="text-sm font-medium text-slate-700 leading-relaxed">{plan.next_steps || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="card-premium p-20 text-center border-dashed border-2 border-slate-100 space-y-4">
                                    <Pill size={50} className="mx-auto text-slate-200" />
                                    <h3 className="text-lg font-black text-slate-400 uppercase tracking-widest">No Plans Filed</h3>
                                    <p className="text-xs font-bold text-slate-300">No clinical treatment plans have been recorded for this patient.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!summary && !inference && planHistory.length === 0 && !loadingSummary && (
                <div className="card-premium p-20 text-center border-dashed border-2 border-slate-100 space-y-6">
                    <div className="w-24 h-24 mx-auto bg-violet-50 rounded-full flex items-center justify-center">
                        <Brain size={48} className="text-violet-300" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Clinical Intelligence Console</h3>
                        <p className="text-sm font-bold text-slate-300 max-w-md mx-auto">
                            Enter a Patient ID above to load their clinical summary, treatment plan history, and on-demand AI inference diagnostics.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicalIntelligencePage;
