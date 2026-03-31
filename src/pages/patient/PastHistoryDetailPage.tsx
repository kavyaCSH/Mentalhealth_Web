import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Calendar,
    Brain,
    Activity,
    Users,
    Shield,
    AlertCircle,
    MessageSquare,
    ClipboardList,
    RotateCcw
} from 'lucide-react';
import { PastHistoryService } from '../../api/services/pastHistory.service';
import type { PastHistoryResponse } from '../../types/pastHistory.types';

const PastHistoryDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [history, setHistory] = useState<PastHistoryResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistoryDetail = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const res = await PastHistoryService.getPastHistoryById(id);
                const data = (res as any).data || res;
                if (data) {
                    setHistory(data);
                } else {
                    setError('History record not found.');
                }
            } catch (err) {
                console.error('Failed to fetch history detail:', err);
                setError('Failed to connect to clinical vault.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistoryDetail();
    }, [id]);

    const formatValue = (value: any): string => {
        if (!value) return 'No records detected';
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) {
            if (value.length === 0) return 'None recorded';
            return value.map(item => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object') {
                    if (item.name) return `${item.name}${item.dose ? ' ' + item.dose : ''}${item.duration ? ' (' + item.duration + ')' : ''}`;
                    if (item.relative) return `${item.relative}: ${item.condition}${item.outcome ? ' (' + item.outcome + ')' : ''}`;
                    if (item.drug) return `${item.drug}${item.frequency ? ' (' + item.frequency + ')' : ''}`;
                    return Object.values(item).filter(Boolean).join(' ');
                }
                return String(item);
            }).filter(Boolean).join(', ');
        }
        if (typeof value === 'object') {
            const entries = Object.entries(value)
                .filter(([_, v]) => v != null && v !== false && v !== '')
                .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
            return entries.length > 0 ? entries.join(' | ') : 'No specific markers';
        }
        return String(value);
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 gap-6 animate-fade-in">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-100 rounded-full" />
                    <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0" />
                </div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Deciphering Neural Record...</p>
            </div>
        );
    }

    if (error || !history) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">Sync Interrupted</h2>
                <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mb-10">{error || 'Unable to retrieve clinical data.'}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
                >
                    Return to Records
                </button>
            </div>
        );
    }

    const categories = [
        { label: 'Psychiatric Map', value: history.psychiatric_history?.previous_diagnosis || history.psychiatric_history?.previous_episodes, icon: <Brain size={24} />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
        { label: 'Clinical Interventions', value: history.psychiatric_history?.medication_trials || history.psychiatric_history?.previous_treatments, icon: <Activity size={24} />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
        { label: 'Biometric Status', value: history.medical_history?.chronic_conditions, icon: <ClipboardList size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Genetic Markers', value: history.family_history?.conditions, icon: <Users size={24} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'Substance Profile', value: history.substance_use || history.social_history?.substance_use, icon: <RotateCcw size={24} />, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
        { label: 'Environmental Context', value: history.social_history?.living_situation || history.social_history?.employment, icon: <MessageSquare size={24} />, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100' },
        { label: 'Trauma & Resilience', value: history.trauma_history?.significant_losses || history.trauma_history?.physical_abuse, icon: <Shield size={24} />, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' }
    ];

    return (
        <div className="max-w-7xl mx-auto p-8 md:p-12 space-y-12 animate-fade-in pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
                <div className="space-y-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back to Archive
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="text-indigo-600" size={24} />
                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] px-3 py-1 bg-indigo-50 rounded-full border border-indigo-100">Verified Clinical Data</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-4">Health Snapshot</h1>
                        <div className="flex items-center gap-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                            <Calendar size={14} className="text-slate-300" />
                            Synchronized on {new Date(history.createdAt || '').toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(history.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex flex-col items-end gap-2">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Record Instance ID</p>
                    <code className="px-4 py-2 bg-slate-50 text-[10px] font-black text-slate-500 rounded-xl border border-slate-100">{String(id || '').toUpperCase()}</code>
                </div>
            </header>

            {/* Narrative Summary */}
            {history.narrative && (
                <section className="space-y-6">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3 ml-2">
                        <MessageSquare size={14} /> Intake Narrative
                    </h3>
                    <div className="card-premium p-10 bg-slate-50/50 border-slate-100 shadow-inner group">
                        <p className="text-xl font-medium text-slate-600 leading-relaxed italic relative">
                            <span className="text-5xl font-black text-indigo-100 absolute -top-4 -left-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">"</span>
                            {String(history.narrative)}
                        </p>
                    </div>
                </section>
            )}

            {/* Grid Detail Categories */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {categories.map((cat, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className={`card-premium p-8 bg-white border ${cat.border} shadow-xl shadow-slate-100/50 flex flex-col h-full`}
                    >
                        <div className={`w-14 h-14 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-6 shadow-sm`}>
                            {cat.icon}
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{cat.label}</h4>
                        <p className="text-sm font-black text-slate-800 leading-relaxed uppercase tracking-tight flex-1">
                            {formatValue(cat.value)}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Footer Verification Component */}
            <div className="card-premium p-16 bg-slate-900 border-none relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent skew-x-12 translate-x-20" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
                    <div className="space-y-4">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tight">Practitioner Review</h3>
                        <p className="text-white/60 font-bold text-lg leading-relaxed max-w-xl">
                            This historical intake is now part of your permanent clinical history. Your care team can use this data for longitudinal diagnostic mapping.
                        </p>
                    </div>
                    <div className="px-10 py-6 border-2 border-white/10 rounded-[3rem] text-center shrink-0">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2 font-mono">ENCRYPTED SOURCE</p>
                        <Shield className="text-emerald-500 mx-auto" size={40} />
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-4">Security Protocol Active</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PastHistoryDetailPage; 
