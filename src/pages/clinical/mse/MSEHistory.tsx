import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import {
    ChevronLeft,
    ChevronRight,
    Brain,
    AlertCircle,
    Plus,
    Activity,
    Sparkles,
    User,
    Mic,
    Eye,
    Heart,
    Workflow,
    FileText,
    Zap,
    Shield,
    Database,
    Smile
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { MSEService } from '../../../api/services/mse.service';
import { UserService } from '../../../api/services/user.service';
import type { MSEResponse } from '../../../types/mse.types';

const SECTION_META: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    appearance: { label: 'Appearance', icon: <User size={12} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    behavior: { label: 'Behavior', icon: <Activity size={12} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    speech: { label: 'Speech', icon: <Mic size={12} />, color: 'text-violet-600', bg: 'bg-violet-50' },
    mood: { label: 'Mood', icon: <Smile size={12} />, color: 'text-rose-600', bg: 'bg-rose-50' },
    affect: { label: 'Affect', icon: <Heart size={12} />, color: 'text-pink-600', bg: 'bg-pink-50' },
    thought_form: { label: 'Thought Form', icon: <Workflow size={12} />, color: 'text-amber-600', bg: 'bg-amber-50' },
    thought_content: { label: 'Thought Content', icon: <FileText size={12} />, color: 'text-orange-600', bg: 'bg-orange-50' },
    perception: { label: 'Perception', icon: <Eye size={12} />, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    insight: { label: 'Insight', icon: <Zap size={12} />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    judgment: { label: 'Judgment', icon: <Shield size={12} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    cognition: { label: 'Cognition', icon: <Database size={12} />, color: 'text-sky-600', bg: 'bg-sky-50' },
};

const SECTION_KEYS = Object.keys(SECTION_META);

const hasData = (val: any): boolean => {
    if (val === null || val === undefined || val === '' || val === false || val === 'None') return false;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.values(val).some(v => v === true || (typeof v === 'string' && v.length > 0 && v !== 'None'));
    return true;
};

const getSectionCoverage = (record: any): string[] =>
    SECTION_KEYS.filter(k => record[k] && Object.values(record[k]).some(hasData));

const MSEHistory = () => {
    const { patientId: userId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient =
        currentUser?.role === 'patient' ||
        (currentUser as any)?.role === 'PATIENT' ||
        (currentUser as any)?.group === 'PATIENT';

    const [patient, setPatient] = useState<any>(null);
    const [history, setHistory] = useState<MSEResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filters, setFilters] = useState<{
        startDate: string;
        endDate: string;
        color_code: string;
        insight_level: string;
        memory: string;
    }>({
        startDate: '',
        endDate: '',
        color_code: '',
        insight_level: '',
        memory: ''
    });

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => { if (userId) fetchData(); }, [userId, filters]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!userId || userId === 'undefined') { setIsLoading(false); return; }

            let hexId = userId;

            if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                hexId = currentUser?._id || currentUser?.id || hexId;
                setPatient(currentUser);
            } else {
                try {
                    const profile = await UserService.getUserById(userId);
                    if (profile) { hexId = profile._id || profile.id || hexId; setPatient(profile); }
                } catch { /* use param id */ }
            }

            const res = await MSEService.listMSE({
                patient_id: hexId,
                ...filters
            });
            const data = (res as any).data || res || [];
            const arr: MSEResponse[] = Array.isArray(data) ? data : [data];
            arr.sort((a, b) => new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime());
            setHistory(arr);
        } catch (err: any) {
            console.error('[MSEHistory] Fetch failed:', err);
            if (isPatient && err.response?.status === 403) { setHistory([]); return; }
            setError('Could not load MSE records. Please check API connectivity.');
        } finally {
            setIsLoading(false);
        }
    };

    const navigateBack = () => {
        if (isPatient) navigate('/records');
        else navigate(`/patients/${userId}/health`);
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Activity className="animate-spin text-indigo-600" size={40} />
                <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Loading MSE Records...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl space-y-10 animate-fade-in pb-24">
            {/* Header */}
            <header className="flex items-center gap-6">
                <button
                    onClick={navigateBack}
                    className="p-3 bg-card hover:bg-page border border-border-card rounded-2xl text-muted transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-main tracking-tight flex items-center gap-3">
                        <Brain className="text-indigo-600" size={32} />
                        Mental Status History
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Patient:</span>
                        <span className="text-xs font-bold text-indigo-600">
                            {patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || `#${userId}` : `#${userId}`}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">
                            {history.length} Record{history.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>

                {!isPatient && (
                    <Link
                        to={`/patients/${userId}/mse/new`}
                        className="bg-indigo-600 text-white rounded-2xl px-8 py-3 shadow-lg shadow-indigo-100 font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-indigo-700 transition-all"
                    >
                        <Plus size={18} />
                        New MSE
                    </Link>
                )}
            </header>

            {/* Filter Toggle */}
            <div className="flex justify-end gap-3">
                 <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isFilterOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-card text-muted border border-border-card'}`}
                >
                    {isFilterOpen ? 'Hide Filters' : 'Show Review Filters'}
                </button>
                {Object.values(filters).some(v => v !== '') && (
                    <button
                        onClick={() => setFilters({ startDate: '', endDate: '', color_code: '', insight_level: '', memory: '' })}
                        className="px-6 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <AnimatePresence>
                {isFilterOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-8 bg-page rounded-[2.5rem] border border-border-card grid md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Severity / Urgency</label>
                                <select 
                                    value={filters.color_code}
                                    onChange={(e) => setFilters(f => ({ ...f, color_code: e.target.value }))}
                                    className="w-full p-3 bg-card border border-border-card rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                >
                                    <option value="">All Triage Color</option>
                                    <option value="#E53935">Red — Immediate Risk</option>
                                    <option value="#FB8C00">Orange — Clinical Concern</option>
                                    <option value="#FDD835">Yellow — Noted Findings</option>
                                    <option value="#43A047">Green — Unremarkable</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Insight Level</label>
                                <select 
                                    value={filters.insight_level}
                                    onChange={(e) => setFilters(f => ({ ...f, insight_level: e.target.value }))}
                                    className="w-full p-3 bg-card border border-border-card rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                >
                                    <option value="">All Insight Levels</option>
                                    <option value="Good">Good — Full Insight</option>
                                    <option value="Partial">Partial — Minimizing</option>
                                    <option value="Poor">Poor — Denial</option>
                                    <option value="Absent">Absent — No awareness</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Memory Evaluation</label>
                                <select 
                                    value={filters.memory}
                                    onChange={(e) => setFilters(f => ({ ...f, memory: e.target.value }))}
                                    className="w-full p-3 bg-card border border-border-card rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                >
                                    <option value="">Any Memory State</option>
                                    <option value="Intact">Intact</option>
                                    <option value="Mildly impaired">Mildly impaired</option>
                                    <option value="Severely impaired">Severely impaired</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Date Window (Start)</label>
                                <input 
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                    className="w-full p-2.5 bg-card border border-border-card rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {history.length > 0 ? (
                    history.map((item: any, idx) => {
                        const id = item.mseId || item._id || item.id;
                        const coverage = getSectionCoverage(item);
                        const formulation = item.ai_analysis?.clinical_formulation;
                        const impressions: string[] = item.ai_analysis?.diagnostic_impressions || [];
                        const tones: string[] = item.ai_analysis?.emotional_tone_mapping || [];
                        const colorCode = item.color_code || '#6366f1';

                        return (
                            <motion.div
                                key={id || idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => navigate(`/patients/${userId}/mse/${id}`)}
                                className="bg-card border border-border-card rounded-[2.5rem] hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-50 cursor-pointer transition-all group flex flex-col gap-0 overflow-hidden"
                            >
                                {/* Color bar */}
                                <div className="h-1.5 w-full" style={{ backgroundColor: colorCode }} />

                                <div className="p-8 flex flex-col gap-5 flex-1">
                                    {/* Top row: ID + date */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <Brain size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">MSE ID</p>
                                                <p className="text-xs font-black text-main">#{id?.toString().slice(-6).toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <span className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">
                                            {item.createdAt
                                                ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : 'Recent'}
                                        </span>
                                    </div>

                                    {/* AI Formulation */}
                                    <div className="flex-1">
                                        {formulation ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles size={12} className="text-indigo-500" />
                                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">AI Formulation</span>
                                                </div>
                                                <p className="text-sm font-bold text-main leading-relaxed line-clamp-3">
                                                    "{formulation}"
                                                </p>
                                            </div>
                                        ) : impressions.length > 0 ? (
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">Diagnostic Impressions</span>
                                                <div className="space-y-1.5">
                                                    {impressions.slice(0, 2).map((imp, i) => (
                                                        <div key={i} className="flex items-start gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                                            <p className="text-[11px] font-bold text-muted line-clamp-1">{imp}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted opacity-80 italic font-medium">No AI analysis available for this record.</p>
                                        )}
                                    </div>

                                    {/* Emotional tones */}
                                    {tones.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {tones.slice(0, 3).map((tone, i) => (
                                                <span key={i} className="px-2 py-1 bg-page text-muted border border-border-card rounded-lg text-[8px] font-black uppercase tracking-tight italic">
                                                    {tone}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Section coverage badges */}
                                    <div className="space-y-2">
                                        <span className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">
                                            Coverage — {coverage.length}/{SECTION_KEYS.length} Domains
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {coverage.map(key => {
                                                const meta = SECTION_META[key];
                                                return (
                                                    <span key={key} className={`flex items-center gap-1 px-2 py-1 ${meta.bg} ${meta.color} rounded-lg text-[8px] font-black uppercase tracking-tight`}>
                                                        {meta.icon}
                                                        {meta.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="pt-4 border-t border-border-card flex items-center justify-between">
                                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">View Full Analysis</span>
                                        <ChevronRight size={14} className="text-muted opacity-40 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-full bg-card border-2 border-dashed border-border-card rounded-[2.5rem] p-20 text-center">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8 text-indigo-300">
                            <Brain size={48} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-black text-main mb-3">No MSE Records</h3>
                        <p className="text-muted opacity-80 font-medium max-w-xs mx-auto leading-relaxed mb-8">
                            No Mental Status Examinations have been recorded for this patient yet.
                        </p>
                        {!isPatient && (
                            <Link
                                to={`/patients/${userId}/mse/new`}
                                className="bg-indigo-600 text-white rounded-2xl px-10 py-4 shadow-lg shadow-indigo-100 font-black uppercase tracking-widest text-xs mx-auto flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all w-fit"
                            >
                                <Plus size={18} />
                                Start First MSE
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MSEHistory;
