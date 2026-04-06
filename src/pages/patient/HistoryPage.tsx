import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
    Activity,
    Calendar,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Search,
    Brain,
    Heart,
    Moon,
    Coffee,
    AlertTriangle,
    TrendingUp,
    Shield,
    CheckCircle2,
    BarChart3,
    X,
    CalendarDays,
    Settings2,
    Sparkles
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { AssessmentService } from '../../api/services/assessment.service';
import type { AssessmentResult, AssessmentMaster } from '../../types/assessment.types';

// ─── Severity styling ────────────────────────────────────────────────────────
const getSeverityStyle = (severity?: string, interpretation?: string) => {
    const key = String(severity || interpretation || '').toLowerCase();
    if (key.includes('severe') || key.includes('high') || key.includes('extreme'))
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', fill: 'bg-red-500', icon: AlertTriangle };
    if (key.includes('moderate') || key.includes('medium'))
        return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', fill: 'bg-orange-500', icon: TrendingUp };
    if (key.includes('mild') || key.includes('low'))
        return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', fill: 'bg-amber-500', icon: Shield };
    if (key.includes('minimal') || key.includes('none') || key.includes('normal'))
        return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', fill: 'bg-emerald-500', icon: CheckCircle2 };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', fill: 'bg-emerald-500', icon: CheckCircle2 };
};

const HistoryPage = () => {
    const navigate = useNavigate();
    const { patientId } = useParams<{ patientId: string }>();
    const [history, setHistory] = useState<AssessmentResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [masters, setMasters] = useState<AssessmentMaster[]>([]);

    // Filters
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');

    useEffect(() => {
        const loadMasters = async () => {
            try {
                const list = await AssessmentService.getMastersList({ is_active: 1 });
                setMasters(list);

                // Deep link from Assessment Center
                if (categoryParam && list.some(m => m.slug === categoryParam)) {
                    setActiveCategory(categoryParam);
                }
            } catch (err) {
                console.error('Failed to load assessment masters', err);
            }
        };
        loadMasters();
    }, [categoryParam]);

    const fetchHistory = useCallback(async (pageNum: number, reset: boolean = false) => {
        if (reset) setIsLoading(true);

        try {
            let items: AssessmentResult[] = [];

            if (patientId) {
                // Fetch for specific patient
                const allAssessments = await AssessmentService.getPatientHistory(patientId);
                // Filter by category if one is selected
                items = activeCategory === 'all'
                    ? allAssessments
                    : allAssessments.filter(a => a && (a.category === activeCategory || a.slug === activeCategory));
            } else {
                // Fetch own history
                const result = await AssessmentService.getOwnHistory(pageNum, 10, activeCategory);
                items = result.assessments;
            }

            if (reset) {
                setHistory(items);
            } else {
                setHistory(prev => [...prev, ...items]);
            }

            // Simple pagination logic for patient history (if it's not paginated by API)
            setHasMore(!patientId && items.length >= 10);
            setPage(pageNum);
            setFetchError(null);
        } catch (err: unknown) {
            const terror = err as { message?: string };
            if (reset) {
                setHistory([]);
                setFetchError(terror.message || 'Failed to synchronize with clinical vault.');
            }
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [activeCategory, patientId]);

    useEffect(() => {
        fetchHistory(1, true);
    }, [activeCategory, statusFilter, startDate, endDate, searchQuery, patientId, fetchHistory]);

    const loadMore = () => {
        if (!isLoading && hasMore) {
            fetchHistory(page + 1);
        }
    };

    const getIcon = (type?: string) => {
        const props = { size: 20 };
        const slug = type?.toLowerCase() || '';
        if (slug.includes('anxiety')) return <Activity {...props} />;
        if (slug.includes('depression')) return <Heart {...props} />;
        if (slug.includes('sleep')) return <Moon {...props} />;
        if (slug.includes('lifestyle')) return <Coffee {...props} />;
        if (slug.includes('mania')) return <Activity {...props} />;
        return <Brain {...props} />;
    };

    const filteredHistory = history.filter(item => {
        if (!item) return false;
        const matchesSearch = (item.category || item.slug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.interpretation || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === 'all' || item.status?.toLowerCase() === statusFilter.toLowerCase();

        // Date range filtering on the client side if not handled by API
        let matchesDate = true;
        if (startDate || endDate) {
            const itemDate = new Date(item.date || item.createdAt || '').getTime();
            if (startDate) matchesDate = matchesDate && itemDate >= new Date(startDate).getTime();
            if (endDate) matchesDate = matchesDate && itemDate <= new Date(endDate).getTime();
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const resetFilters = () => {
        setActiveCategory('all');
        setStatusFilter('all');
        setStartDate('');
        setEndDate('');
        setSearchQuery('');
    };

    return (
        <div className="p-8 max-w-6xl  space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (patientId) {
                                    navigate(`/patients/${patientId}?view=focused`);
                                } else {
                                    navigate(-1);
                                }
                            }}
                            className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-2"
                        >
                            <ChevronLeft size={14} /> Back to Patient Record
                        </button>
                    </div>
                    <div className="flex items-center gap-3 text-indigo-600 mb-2">
                        <CalendarDays size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">{patientId ? 'Patient Results Vault' : 'Clinical Data Repository'}</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        {activeCategory === 'all' ? 'Assessment' : masters.find(m => m.slug === activeCategory)?.name || 'Assessment'} {patientId ? 'Records' : 'History'}
                    </h1>
                    <div className="flex items-center gap-4 mt-1">
                        <p className="text-slate-500 font-medium">
                            {patientId ? 'Review longitudinal clinical results for this patient.' : 'Manage and export your longitudinal clinical results.'}
                        </p>
                        {history.length > 0 && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                {history.length} Attempt{history.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="primary"
                        leftIcon={<Brain size={18} />}
                        className="rounded-2xl border-none text-white bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-200 font-extrabold uppercase text-[10px] tracking-widest"
                        onClick={() => navigate('/assessments')}
                    >
                        Start New Assessment
                    </Button>
                    <Button
                        variant="outline"
                        leftIcon={<Sparkles size={18} />}
                        className="rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 font-extrabold uppercase text-[10px] tracking-widest"
                        onClick={() => navigate('/history/assistant')}
                    >
                        History Assistant
                    </Button>
                </div>
            </header>

            {/* Advanced Controls Bar */}
            <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Identify specific records or interpretations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-base pl-12 shadow-sm border-slate-100 hover:border-slate-200"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-6 py-4 rounded-2xl flex items-center gap-2 font-bold text-sm transition-all border
                                ${showFilters
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}
                            `}
                        >
                            <Settings2 size={18} />
                            Filter Controls
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-8 glass-card space-y-8 mt-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Brain size={12} /> Mental Health Category
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setActiveCategory('all')}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                                                    ${activeCategory === 'all'
                                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                                        : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}
                                                `}
                                            >
                                                All
                                            </button>
                                            {masters.map(m => (
                                                <button
                                                    key={m.id}
                                                    onClick={() => setActiveCategory(m.slug || m.id || '')}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all
                                                        ${activeCategory === (m.slug || m.id || '')
                                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                                            : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'}
                                                    `}
                                                >
                                                    {m.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 size={12} /> Assessment Status
                                        </label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="all">Any Status</option>
                                            <option value="completed">Completed Only</option>
                                            <option value="draft">Review Pending</option>
                                        </select>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <Calendar size={12} /> Temporal Range
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none"
                                            />
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="bg-slate-50 border-none rounded-2xl py-3 px-4 text-xs font-bold text-slate-700 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex gap-2">
                                        {(activeCategory !== 'all' || statusFilter !== 'all' || startDate || endDate || searchQuery) && (
                                            <button
                                                onClick={resetFilters}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100"
                                            >
                                                <X size={14} /> Reset Filters
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                        Showing {filteredHistory.length} Identities
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* List */}
            <div className="space-y-4">
                {isLoading && page === 1 ? (
                    <div className="py-20 text-center">
                        <Activity className="animate-spin mx-auto text-indigo-400 mb-4" size={32} />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Synchronizing Clinical Data...</p>
                    </div>
                ) : filteredHistory.length > 0 ? (
                    <>
                        <AnimatePresence mode="popLayout">
                            {filteredHistory.map((item, index) => {
                                const style = getSeverityStyle(item.severity, item.interpretation);
                                const SeverityIcon = style.icon;
                                const displaySlug = item.slug || item.type || item.category || 'general';
                                const displayLabel = item.category || (displaySlug.charAt(0).toUpperCase() + displaySlug.slice(1) + ' Assessment');

                                // Attempt numbering (reverse order based on local list)
                                const attemptNumber = filteredHistory.length - index;

                                return (
                                    <motion.div
                                        key={item._id || item.id || index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => {
                                            const itemId = item._id || item.id;
                                            if (itemId) {
                                                const path = patientId
                                                    ? `/patients/${patientId}/history/${itemId}`
                                                    : `/history/${itemId}`;
                                                navigate(path);
                                            }
                                        }}
                                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 transition-all group cursor-pointer overflow-hidden relative"
                                    >
                                        {/* Row 1: Attempt & Date & Status */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                    Attempt #{attemptNumber}
                                                </div>
                                                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <Calendar size={12} />
                                                    {new Date(item.date || item.createdAt || '').toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    {item.time && ` · ${item.time}`}
                                                </span>
                                            </div>
                                            <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${item.status === 'draft' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                {item.status || 'Completed'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center ${style.bg} ${style.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                                    {getIcon(item.slug || item.type)}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                                                        {displayLabel}
                                                    </h3>
                                                    <div className={`mt-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex items-center gap-2 ${style.bg} ${style.color} ${style.border}`}>
                                                        <SeverityIcon size={12} />
                                                        {item.interpretation || item.severity || 'Analysing Result'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Score Grid aligned with mobile app */}
                                            <div className="flex items-center gap-8 bg-slate-50/50 p-4 rounded-3xl border border-slate-50">
                                                <div className="text-center px-4 border-r border-slate-100">
                                                    <p className="text-2xl font-black text-slate-900 leading-none">
                                                        {typeof (item.totalScore ?? item.score) === 'number' ? Math.round(Number(item.totalScore ?? item.score) * 100) / 100 : '--'}
                                                        <span className="text-xs text-slate-400 ml-1 font-medium">
                                                            {item.maxPossibleScore ? `/ ${item.maxPossibleScore}` : ''}
                                                        </span>
                                                    </p>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                                                        Raw Score
                                                    </p>
                                                </div>

                                                {item.percentage !== undefined && (
                                                    <div className="text-center px-4 border-r border-slate-100">
                                                        <p className="text-2xl font-black text-slate-900 leading-none">
                                                            {typeof item.percentage === 'number' ? Math.round(item.percentage * 100) / 100 : item.percentage}%
                                                        </p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                                                            Percentage
                                                        </p>
                                                    </div>
                                                )}

                                                {item.tScore !== undefined && item.tScore !== null && (
                                                    <div className="text-center px-4">
                                                        <p className="text-2xl font-black text-indigo-600 leading-none">
                                                            {typeof item.tScore === 'number' ? Math.round(item.tScore * 100) / 100 : item.tScore}
                                                        </p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                                                            T-Score
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar & Note */}
                                        <div className="mt-6 flex flex-col gap-4">
                                            {item.percentage !== undefined && (
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(item.percentage, 100)}%` }}
                                                        className={`h-full ${style.fill}`}
                                                    />
                                                </div>
                                            )}

                                            {item.notes && (
                                                <div className="flex items-start gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                    <Activity size={12} className="text-slate-400 mt-0.5 shrink-0" />
                                                    <p className="text-[11px] font-bold text-slate-500 line-clamp-1 italic">
                                                        Clinical Note: {item.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {hasMore && (
                            <div className="pt-10 text-center border-t border-slate-50 mt-10">
                                <Button
                                    variant="ghost"
                                    onClick={loadMore}
                                    isLoading={isLoading && page > 1}
                                    rightIcon={<ChevronDown size={18} />}
                                    className="px-10 py-4 rounded-2xl text-slate-400 hover:text-indigo-600"
                                >
                                    Deep Load Clinical Vault
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-32 glass-card">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            {fetchError ? <AlertTriangle size={40} className="text-red-400" /> : <BarChart3 size={40} className="text-slate-200" />}
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3">
                            {fetchError ? 'Sync Failure' : 'Void of Clinical Data'}
                        </h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">
                            {fetchError || 'No records were found matching these specific filters.'}
                        </p>
                        <Button
                            className="mt-10 px-12 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                            onClick={fetchError ? () => fetchHistory(1, true) : resetFilters}
                            leftIcon={fetchError ? <Activity size={18} /> : <X size={18} />}
                        >
                            {fetchError ? 'Retry Synchronization' : 'Reset Navigation State'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
