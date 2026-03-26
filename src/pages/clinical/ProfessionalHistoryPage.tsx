import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Activity,
    Calendar,
    ChevronDown,
    ChevronRight,
    Search,
    Download,
    Brain,
    ClipboardList,
    TrendingUp,
    Shield,
    CheckCircle2,
    BarChart3,
    Settings2,
    ChevronLeft,
    AlertCircle
} from 'lucide-react';
import { AssessmentService } from '../../api/services/assessment.service';
import type { AssessmentResult } from '../../types/assessment.types';
import Button from '../../components/ui/Button';

// ─── Severity styling ────────────────────────────────────────────────────────
const getSeverityStyle = (severity?: string, interpretation?: string) => {
    const key = (severity || interpretation || '').toLowerCase();
    if (key.includes('severe') || key.includes('high') || key.includes('extreme'))
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', fill: 'bg-red-500', icon: AlertCircle };
    if (key.includes('moderate') || key.includes('medium'))
        return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', fill: 'bg-orange-500', icon: TrendingUp };
    if (key.includes('mild') || key.includes('low'))
        return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', fill: 'bg-amber-500', icon: Shield };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', fill: 'bg-emerald-500', icon: CheckCircle2 };
};

const ProfessionalHistoryPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patientId');
    const topicParam = searchParams.get('topic');

    const [history, setHistory] = useState<AssessmentResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState(topicParam || 'all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            let res;
            if (patientId) {
                res = await AssessmentService.getPatientProfessionalHistory(patientId);
                setHistory(res.data || []);
            } else {
                // Global view: fetch all clinical assessments
                const response = await AssessmentService.getAllAdmin();
                setHistory(Array.isArray(response) ? response : (response as any).data || []);
            }
        } catch (err: any) {
            console.error('Failed to load professional history:', err);
        } finally {
            setIsLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const filteredHistory = history.filter(item => {
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        const matchesSearch = 
            (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const uniqueCategories = Array.from(new Set(history.map(h => h.category).filter(Boolean)));

    return (
        <div className="p-8 max-w-6xl  space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    {patientId ? (
                        <button
                            onClick={() => navigate(`/patients/${patientId}?view=focused`)}
                            className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-2"
                        >
                            <ChevronLeft size={14} /> Back to Patient Record
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-2"
                        >
                            <ChevronLeft size={14} /> Back to Dashboard
                        </button>
                    )}
                    <div className="flex items-center gap-3 text-indigo-600 mb-2">
                        <ClipboardList size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">{patientId ? 'Patient Assessment History' : 'Global Clinical History'}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Records</h1>
                    <p className="text-slate-500 font-medium max-w-xl mt-1">
                        {patientId 
                            ? 'Longitudinal tracking of clinical assessments performed for this patient.' 
                            : 'A comprehensive history of clinical assessments performed across your practice.'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={loadHistory}
                        disabled={isLoading}
                        className="rounded-2xl text-slate-400 hover:text-indigo-600"
                    >
                        <Activity className={isLoading ? 'animate-spin' : ''} size={18} />
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50"
                        onClick={() => {}} // TODO: Export
                    >
                        <Download size={18} />
                    </Button>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search assessments, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-base pl-12 shadow-sm border-slate-100 hover:border-slate-200 w-full"
                    />
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-6 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all border
                        ${showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}
                    `}
                >
                    <Settings2 size={16} /> Filters
                </button>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm overflow-hidden"
                    >
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Category</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setCategoryFilter('all')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                                        ${categoryFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-100'}
                                    `}
                                >
                                    All Categories
                                </button>
                                {uniqueCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat!)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                                            ${categoryFilter === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-100'}
                                        `}
                                    >
                                        {cat?.replace(/_/g, ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading ? (
                <div className="py-20 text-center">
                    <Activity className="animate-spin mx-auto text-indigo-500 mb-4" size={40} />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading clinical history...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-24 text-center border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <ClipboardList size={40} className="text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">No Records Found</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto">There are no professional assessments matching your criteria.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredHistory.map((assessment, i) => {
                        const style = getSeverityStyle(assessment.severity, assessment.interpretation);
                        const isExpanded = expandedId === assessment._id;
                        
                        return (
                            <motion.div
                                key={assessment._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-indigo-50/50 transition-all border-l-4"
                                style={{ borderLeftColor: style.bg.replace('bg-', '') === 'red-50' ? '#ef4444' : style.bg.replace('bg-', '') === 'orange-50' ? '#f97316' : '#6366f1' }}
                            >
                                <div className="p-5">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}>
                                                <Brain size={22} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-md">
                                                        {assessment.category?.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                        <Calendar size={10} />
                                                        {new Date(assessment.createdAt || '').toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-black text-slate-900 capitalize leading-tight">
                                                    {assessment.category?.replace(/_/g, ' ')} Assessment
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                                            <div className="text-center px-4 border-r border-slate-100">
                                                <p className="text-2xl font-black text-slate-900 leading-none">
                                                    {assessment.totalScore}
                                                    <span className="text-[10px] text-slate-400 ml-0.5 font-medium">/ {assessment.maxPossibleScore || 21}</span>
                                                </p>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Score</p>
                                            </div>
                                            <div className="text-center px-4">
                                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${style.bg} ${style.color} ${style.border}`}>
                                                    {assessment.interpretation || assessment.severity || 'Completed'}
                                                </div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Result</p>
                                            </div>
                                            <button 
                                                onClick={() => setExpandedId(isExpanded ? null : assessment._id || null)}
                                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                            >
                                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    {assessment.notes && (
                                        <div className="mt-5 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                <ClipboardList size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Note</p>
                                                <p className="text-xs font-bold text-amber-900 leading-relaxed italic">
                                                    "{assessment.notes}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="mt-6 pt-6 border-t border-slate-100"
                                            >
                                                <div className="flex items-center gap-2 mb-6">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                        <BarChart3 size={16} />
                                                    </div>
                                                    <h4 className="text-md font-black text-slate-900 tracking-tight">Responses</h4>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {assessment.responses?.map((resp, ri) => {
                                                        const isId = (val: string) => /^[0-9a-fA-F]{24}$/.test(val || '');
                                                        const displayAnswer = resp.answerText || (!isId(resp.selectedOption || resp.optionId) ? (resp.selectedOption || resp.optionId) : 'Value Recorded');
                                                        
                                                        return (
                                                            <div key={ri} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between gap-4 group hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all">
                                                                <div className="flex items-start gap-4">
                                                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0 shadow-sm group-hover:text-indigo-500 transition-colors">
                                                                        {String(ri + 1).padStart(2, '0')}
                                                                    </div>
                                                                    <div className="space-y-2.5 flex-1">
                                                                        <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-900 transition-colors">
                                                                            {resp.questionText || `Item Inquiry ${resp.questionId}`}
                                                                        </p>
                                                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-100 rounded-md shadow-sm">
                                                                            <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-indigo-400 transition-colors" />
                                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                                                                                {displayAnswer}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-end pt-2 border-t border-slate-50">
                                                                    <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${resp.score ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                        {resp.score ? `+${resp.score}` : '0'} pts
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProfessionalHistoryPage;
