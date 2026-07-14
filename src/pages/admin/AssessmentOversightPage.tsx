import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText,
    Search,
    ArrowLeft,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Eye,
    X,
    Filter,
    Activity,
    Brain,
    Shield,
    User,
    Clock,
    BarChart3,
    ChevronDown,
    Loader2,
    AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AssessmentService } from '../../api/services/assessment.service';
import type { AssessmentResult } from '../../types/assessment.types';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

const CATEGORIES = ['all', 'depression', 'anxiety', 'ptsd', 'adhd', 'ocd', 'bipolar', 'personality', 'substance_use', 'eating_disorder', 'psychosis'];

const categoryColor = (cat?: string): string => {
    const map: Record<string, string> = {
        depression: 'bg-violet-50 text-violet-600 border-violet-100',
        anxiety: 'bg-amber-50 text-amber-600 border-amber-100',
        ptsd: 'bg-rose-50 text-rose-600 border-rose-100',
        adhd: 'bg-cyan-50 text-cyan-600 border-cyan-100',
        ocd: 'bg-teal-50 text-teal-600 border-teal-100',
        bipolar: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
        personality: 'bg-orange-50 text-orange-600 border-orange-100',
        substance_use: 'bg-red-50 text-red-600 border-red-100',
        eating_disorder: 'bg-lime-50 text-lime-600 border-lime-100',
        psychosis: 'bg-pink-50 text-pink-600 border-pink-100',
    };
    return map[cat?.toLowerCase() || ''] || 'bg-indigo-50 text-indigo-600 border-indigo-100';
};

const severityBadge = (pct?: number): { label: string; cls: string } => {
    if (pct == null) return { label: 'N/A', cls: 'bg-page text-muted opacity-80 border-border-card' };
    if (pct <= 25) return { label: 'Minimal', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
    if (pct <= 50) return { label: 'Mild', cls: 'bg-yellow-50 text-yellow-600 border-yellow-200' };
    if (pct <= 75) return { label: 'Moderate', cls: 'bg-orange-50 text-orange-600 border-orange-200' };
    return { label: 'Severe', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
};

const AssessmentOversightPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const role = user?.role;
    const isSuperAdmin = role === 'super_admin';

    const [records, setRecords] = useState<AssessmentResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedRecord, setSelectedRecord] = useState<AssessmentResult | null>(null);
    const [detailData, setDetailData] = useState<AssessmentResult | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await AssessmentService.getAllAdmin();
            setRecords(data);
        } catch (err) {
            console.error('Failed to load admin assessment registry:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (record: AssessmentResult) => {
        setSelectedRecord(record);
        setDetailData(null);
        setLoadingDetail(true);
        try {
            const detail = await AssessmentService.getDetail(String(record._id || record.id));
            setDetailData(detail);
        } catch (err) {
            console.error('Failed to load assessment detail:', err);
            setDetailData(record);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        setMessage(null);
        try {
            await AssessmentService.remove(id);
            setRecords(prev => prev.filter(r => (r._id || r.id) !== id));
            setSelectedRecord(null);
            setDetailData(null);
            setConfirmDelete(null);
            setMessage({ type: 'success', text: 'Assessment record permanently purged from the Medical Records Vault.' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to remove assessment. Insufficient clearance or server error.' });
        } finally {
            setDeletingId(null);
        }
    };

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchCategory = categoryFilter === 'all' || (r.category || r.slug || '').toLowerCase() === categoryFilter;
            const q = searchQuery.toLowerCase();
            const matchSearch = !q ||
                (r.category || '').toLowerCase().includes(q) ||
                (r.slug || '').toLowerCase().includes(q) ||
                (r.notes || '').toLowerCase().includes(q) ||
                (r.interpretation || '').toLowerCase().includes(q) ||
                String(r.totalScore).includes(q);
            return matchCategory && matchSearch;
        });
    }, [records, categoryFilter, searchQuery]);

    const stats = useMemo(() => {
        const total = records.length;
        const completed = records.filter(r => r.status === 'completed').length;
        const avgPct = total > 0 ? Math.round(records.reduce((sum, r) => sum + (r.percentage || 0), 0) / total) : 0;
        const categories = new Set(records.map(r => r.category || r.slug)).size;
        return { total, completed, avgPct, categories };
    }, [records]);

    if (loading && records.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={40} className="text-indigo-600 animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted opacity-80">Loading Medical Records Vault...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-muted opacity-80 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Clinical Command
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <FileText size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-main tracking-tight text-main">Assessment Oversight</h1>
                            <p className="text-muted font-medium">Centralized EHR audit & clinical evaluation governance.</p>
                        </div>
                    </div>
                </div>
                <Button
                    variant="primary"
                    leftIcon={<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />}
                    onClick={fetchRecords}
                    isLoading={loading}
                    className="shadow-xl shadow-indigo-100 h-14 rounded-2xl px-8 uppercase tracking-widest font-black text-xs"
                >
                    Sync Vault
                </Button>
            </header>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                {[
                    { label: 'Total Records', value: stats.total, icon: FileText, color: 'bg-indigo-50 text-indigo-600' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'Avg Score %', value: `${stats.avgPct}%`, icon: BarChart3, color: 'bg-amber-50 text-amber-600' },
                    { label: 'Categories', value: stats.categories, icon: Brain, color: 'bg-violet-50 text-violet-600' },
                ].map((stat) => (
                    <div key={stat.label} className="card-premium p-6 flex items-center gap-5 border-border-card/50">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color} shadow-sm`}>
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-muted opacity-40 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-main tracking-tight">{stat.value}</p>
                        </div>
                    </div>
                ))}
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

            {/* Filter Bar */}
            <div className="card-premium p-6 flex flex-col md:flex-row gap-6 items-center justify-between border-border-card/50">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 w-full">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                categoryFilter === cat
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                                    : 'bg-page text-muted border border-border-card hover:border-indigo-200'
                            }`}
                        >
                            {cat.replace('_', ' ')}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80 shrink-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-40" size={18} />
                    <input
                        type="text"
                        placeholder="Search records, categories, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-page border border-border-card rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Records Table */}
            <div className="card-premium overflow-hidden border-border-card/50">
                <table className="w-full text-left">
                    <thead className="bg-page border-b border-border-card">
                        <tr className="text-[11px] font-black text-muted uppercase tracking-widest">
                            <th className="px-8 py-5">Patient / Category</th>
                            <th className="px-8 py-5">Score</th>
                            <th className="px-8 py-5">Severity</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5">Filed</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.length > 0 ? (
                            filteredRecords.map((record) => {
                                const id = String(record._id || record.id);
                                const sev = severityBadge(record.percentage);
                                return (
                                    <tr
                                        key={id}
                                        className="border-b border-border-card hover:bg-indigo-50/30 transition-all cursor-pointer"
                                        onClick={() => handleViewDetail(record)}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border w-fit ${categoryColor(record.category || record.slug)}`}>
                                                    {record.category || record.slug || 'N/A'}
                                                </span>
                                                <span className="text-[11px] font-bold text-muted truncate max-w-[200px]">
                                                    {record.notes ? record.notes.slice(0, 50) + (record.notes.length > 50 ? '...' : '') : 'No notes attached'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-xl font-black text-main">{record.totalScore ?? '—'}</span>
                                                <span className="text-[10px] font-black text-muted opacity-40">/ {record.maxPossibleScore || record.maxScore || '?'}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-indigo-500 mt-0.5">{record.percentage != null ? `${record.percentage}%` : ''}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${sev.cls}`}>
                                                {sev.label}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                record.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                                            }`}>
                                                {record.status || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[11px] font-black text-muted uppercase tracking-widest">
                                                {record.createdAt ? new Date(record.createdAt).toLocaleDateString() : record.date || '—'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleViewDetail(record); }}
                                                    className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-all"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {isSuperAdmin && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(id); }}
                                                        className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <Brain size={50} className="mx-auto text-muted opacity-40 mb-4" />
                                    <p className="text-lg font-black text-muted opacity-80 uppercase tracking-widest">No Records Found</p>
                                    <p className="text-xs font-bold text-muted opacity-40 mt-1">Adjust filters or sync the vault to refresh.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detail Drawer */}
            <AnimatePresence>
                {selectedRecord && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setSelectedRecord(null); setDetailData(null); }}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                            className="relative w-full max-w-lg h-screen bg-card shadow-2xl overflow-y-auto"
                        >
                            <div className="p-10 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Clinical Record Detail</p>
                                        <h2 className="text-2xl font-black text-main tracking-tight mt-1 capitalize">
                                            {detailData?.category || detailData?.slug || selectedRecord.category || '—'}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedRecord(null); setDetailData(null); }}
                                        className="w-10 h-10 rounded-xl bg-page flex items-center justify-center text-muted opacity-80 hover:bg-rose-50 hover:text-rose-500 transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {loadingDetail ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 size={32} className="text-indigo-600 animate-spin" />
                                    </div>
                                ) : detailData ? (
                                    <>
                                        {/* Score Visualization */}
                                        <div className="p-8 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-[30px] border border-indigo-100/50 text-center space-y-4">
                                            <div className="relative w-24 h-24 mx-auto">
                                                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                                                    <path className="text-indigo-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                                    <path className="text-indigo-600" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${detailData.percentage || 0}, 100`} />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-lg font-black text-indigo-700">{detailData.percentage ?? 0}%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-3xl font-black text-main">{detailData.totalScore ?? '—'} <span className="text-sm text-muted opacity-80">/ {detailData.maxPossibleScore || detailData.maxScore || '?'}</span></p>
                                                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-block mt-2 ${severityBadge(detailData.percentage).cls}`}>
                                                    {severityBadge(detailData.percentage).label} • {detailData.interpretation || 'Pending analysis'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-page rounded-3xl border border-border-card">
                                                <User size={16} className="text-indigo-400 mb-2" />
                                                <p className="text-[9px] font-black text-muted opacity-40 uppercase tracking-widest mb-1">Patient ID</p>
                                                <p className="text-xs font-black text-main truncate">{detailData.patientId || '—'}</p>
                                            </div>
                                            <div className="p-5 bg-page rounded-3xl border border-border-card">
                                                <Clock size={16} className="text-indigo-400 mb-2" />
                                                <p className="text-[9px] font-black text-muted opacity-40 uppercase tracking-widest mb-1">Date Filed</p>
                                                <p className="text-xs font-black text-main">{detailData.date || '—'}</p>
                                            </div>
                                            <div className="p-5 bg-page rounded-3xl border border-border-card">
                                                <Activity size={16} className="text-indigo-400 mb-2" />
                                                <p className="text-[9px] font-black text-muted opacity-40 uppercase tracking-widest mb-1">Status</p>
                                                <p className="text-xs font-black text-main capitalize">{detailData.status || '—'}</p>
                                            </div>
                                            <div className="p-5 bg-page rounded-3xl border border-border-card">
                                                <Brain size={16} className="text-indigo-400 mb-2" />
                                                <p className="text-[9px] font-black text-muted opacity-40 uppercase tracking-widest mb-1">T-Score</p>
                                                <p className="text-xs font-black text-main">{detailData.tScore ?? 'N/A'}</p>
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        {detailData.notes && (
                                            <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-2">
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Clinical Notes</p>
                                                <p className="text-sm font-medium text-main leading-relaxed italic">"{detailData.notes}"</p>
                                            </div>
                                        )}

                                        {/* Responses */}
                                        {detailData.responses && detailData.responses.length > 0 && (
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Response Inventory ({detailData.responses.length} items)</p>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                                    {detailData.responses.map((resp, idx) => (
                                                        <div key={idx} className="p-4 bg-page rounded-2xl border border-border-card flex items-start gap-4">
                                                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-[10px] font-black shrink-0">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-bold text-main leading-relaxed">
                                                                    {resp.questionText || resp.question || `Question ${resp.questionId}`}
                                                                </p>
                                                                <p className="text-[11px] font-bold text-indigo-600 mt-1">
                                                                    → {resp.answerText || resp.selectedOption || resp.optionId}
                                                                    {resp.score != null && <span className="text-muted opacity-80 ml-2">(Score: {resp.score})</span>}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Super Admin: Delete Action */}
                                        {isSuperAdmin && (
                                            <div className="pt-6 border-t border-border-card">
                                                <button
                                                    onClick={() => setConfirmDelete(String(detailData._id || detailData.id))}
                                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed border-rose-200 text-rose-600 hover:bg-rose-50 transition-all text-xs font-black uppercase tracking-widest"
                                                >
                                                    <Trash2 size={18} />
                                                    Purge from Medical Vault
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : null}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {confirmDelete && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setConfirmDelete(null)}
                            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-card rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-8 text-center"
                        >
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle size={32} className="text-rose-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-main tracking-tight">Confirm Permanent Purge</h3>
                                <p className="text-sm font-medium text-muted leading-relaxed">
                                    This action is <strong className="text-rose-600">irreversible</strong>. The assessment record will be permanently removed from the Medical Records Vault.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setConfirmDelete(null)}
                                    className="flex-1 rounded-2xl h-14 uppercase tracking-widest font-black text-[10px]"
                                >
                                    Abort
                                </Button>
                                <button
                                    onClick={() => handleDelete(confirmDelete)}
                                    disabled={deletingId === confirmDelete}
                                    className="flex-[2] rounded-2xl h-14 uppercase tracking-widest font-black text-[10px] bg-rose-600 text-white hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {deletingId === confirmDelete ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    Execute Purge
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AssessmentOversightPage;
