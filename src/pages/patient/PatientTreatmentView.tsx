import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    ChevronLeft, 
    CheckCircle2, 
    Clock, 
    Play, 
    Pause,
    FileText,
    Download,
    MessageSquare,
    AlertCircle,
    RefreshCw,
    ClipboardCheck,
    BarChart3,
    LayoutDashboard,
    BadgeCheck,
    UserCircle
} from 'lucide-react';
import { TreatmentService } from '../../api/services/treatment.service';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { TreatmentProgress, TreatmentStage } from '../../types/treatment.types';

const StatusBadge = ({ status }: { status: TreatmentStage['status'] }) => {
    const s = status || 'pending';
    const styles = {
        pending: 'bg-page text-muted border-border-card',
        in_progress: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-sm',
        completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm',
        on_hold: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        skipped: 'bg-page text-muted border-border-card opacity-60'
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${styles[s]}`}>
            {s.replace(/_/g, ' ')}
        </span>
    );
};

const HistoryTabContent = ({ history }: { history: any[] }) => {
    if (!history || history.length === 0) {
        return (
            <div className="p-16 text-center bg-card border-2 border-dashed border-border-card rounded-[3rem] flex flex-col items-center">
                <ClipboardCheck size={48} className="text-muted mb-6 opacity-20" strokeWidth={1} />
                <h3 className="text-2xl font-black text-main tracking-tighter uppercase mb-2">No Records Found</h3>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest italic opacity-60">Your specialized clinical history will appear here.</p>
            </div>
        );
    }

    return (
        <div className="grid md:grid-cols-2 gap-8">
            {history.filter(Boolean).map((rec, i) => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.1 }} 
                    key={rec.id || i} 
                    className="p-10 bg-card border border-border-card rounded-[3rem] shadow-xl shadow-indigo-500/5 flex flex-col group hover:bg-page transition-all border-b-8 border-b-border-card"
                >
                    <div className="flex items-center justify-between mb-8 pb-8 border-b border-border-card">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-main text-card rounded-[1.25rem] flex items-center justify-center shadow-lg">
                                <Activity size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 italic leading-none">Session Finalized</span>
                                <span className="text-lg font-black text-main tracking-tighter italic opacity-80">{new Date(rec.createdAt || rec.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20 italic">Verified</div>
                    </div>
                    <div className="space-y-10 flex-1">
                        {rec.plan && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5 ml-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm" />
                                    <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">Impression</span>
                                </div>
                                <p className="text-[14px] font-bold text-main leading-relaxed italic">"{rec.plan}"</p>
                            </div>
                        )}
                        {rec.medications && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5 ml-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-sm" />
                                    <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">Regimen</span>
                                </div>
                                <div className="px-6 py-3 bg-rose-500/5 border-l-[5px] border-rose-500 text-[12px] font-black text-rose-500/80 uppercase tracking-tight italic rounded-r-2xl leading-loose">
                                    {rec.medications}
                                </div>
                            </div>
                        )}
                        {rec.next_steps && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5 ml-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
                                    <span className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">Next Steps</span>
                                </div>
                                <p className="text-[11px] font-bold text-muted mb-2 italic pl-4 opacity-80">"{rec.next_steps}"</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-10 pt-8 border-t border-border-card flex items-center justify-between opacity-40">
                         <div className="flex items-center gap-2 text-[8px] font-black text-muted uppercase tracking-widest">
                            <UserCircle size={12} /> specialist record
                         </div>
                         <p className="text-[9px] font-black text-main tracking-tighter italic">MindBalance Clinical v1.4</p>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

const PatientTreatmentView = () => {
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const userId = currentUser?.id || (currentUser as any)?.userId;

    const [progress, setProgress] = useState<TreatmentProgress | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'journey' | 'history'>('journey');
    const [isLoading, setIsLoading] = useState(true);

    const fetchLock = useRef(false);

    const fetchData = useCallback(async () => {
        if (!userId || fetchLock.current) return;
        fetchLock.current = true;
        setIsLoading(true);
        try {
            const [pRes, hRes] = await Promise.allSettled([
                TreatmentService.getPatientProgress(userId),
                TreatmentService.getTreatmentHistory(userId)
            ]);

            if (pRes.status === 'fulfilled') setProgress(pRes.value);
            if (hRes.status === 'fulfilled') {
                const raw = hRes.value.data || hRes.value.history || hRes.value;
                setHistory(Array.isArray(raw) ? raw : []);
            }
        } catch (err) {
            console.error('[PatientView] Sync failed');
        } finally {
            setIsLoading(false);
            fetchLock.current = false;
        }
    }, [userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Activity className="animate-spin text-indigo-500 mb-2" size={40} />
                <p className="text-[10px] font-black text-muted uppercase tracking-[0.4em] italic animate-pulse">Syncing Journey state...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-24">
            <header className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-10">
                <div className="space-y-6">
                    <button onClick={() => navigate('/health')} className="flex items-center gap-2 text-[10px] font-black text-muted hover:text-indigo-500 transition-all uppercase tracking-[0.2em] group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Dashboard
                    </button>
                    <div>
                        <div className="flex items-center gap-4 text-indigo-500 mb-3">
                            <Activity size={32} strokeWidth={2.5} />
                            <h1 className="text-5xl font-black text-main tracking-tighter leading-none">Your Recovery</h1>
                        </div>
                        <p className="text-[11px] font-black text-muted uppercase tracking-[0.4em] opacity-60 ml-1 italic">Interactive Treatment Roadmap</p>
                    </div>
                </div>

                <div className="flex bg-page p-1.5 rounded-[1.75rem] border border-border-card">
                    <button onClick={() => setActiveTab('journey')} className={`px-12 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'journey' ? 'bg-card text-indigo-500 shadow-xl border border-border-card' : 'text-muted hover:text-main'}`}>Journey</button>
                    <button onClick={() => setActiveTab('history')} className={`px-12 py-3.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'history' ? 'bg-card text-indigo-500 shadow-xl border border-border-card' : 'text-muted hover:text-main'}`}>History</button>
                </div>
            </header>

            <AnimatePresence mode="wait">
                {activeTab === 'journey' ? (
                    <motion.div key="journey" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-4 space-y-8">
                            <div className="p-12 bg-card border border-border-card rounded-[3rem] shadow-2xl shadow-indigo-500/5 flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                <div className="text-7xl font-black text-main mb-4 tracking-tighter leading-none">{progress?.overall_progress || 0}%</div>
                                <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em] italic mb-10">Consolidated Mastery</span>
                                <div className="w-full h-2 bg-page rounded-full overflow-hidden border border-border-card">
                                    <div className="h-full bg-indigo-500 transition-all duration-700 ease-out shadow-lg shadow-indigo-500/10" style={{ width: `${progress?.overall_progress || 0}%` }} />
                                </div>
                            </div>

                            <div className="p-10 bg-page text-main rounded-[3rem] shadow-2xl relative overflow-hidden border border-border-card">
                                <div className="flex items-center gap-3 mb-8 opacity-40">
                                    <BadgeCheck size={18} />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Active roadmap</h3>
                                </div>
                                <h2 className="text-3xl font-black tracking-tighter leading-tight mb-10">{progress?.diagnosis || 'Therapeutic Milestone Tracking'}</h2>
                                <div className="flex items-center gap-2.5 pt-8 border-t border-border-card">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/40" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 italic">Live Sync Active</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8 space-y-4">
                            <div className="px-6 mb-4 flex items-center justify-between">
                                <h2 className="text-[11px] font-black text-muted uppercase tracking-[0.3em]">Your Roadmap</h2>
                                <span className="text-[8px] font-bold text-muted/50 uppercase tracking-widest italic">{progress?.stages?.length || 0} Registered Stages</span>
                            </div>
                            <div className="grid gap-4">
                                {progress?.stages?.map((stg, i) => (
                                    <div key={stg.id || i} className="p-7 bg-card border border-border-card rounded-[2.5rem] flex items-center gap-8 shadow-sm relative group hover:bg-page transition-all">
                                        <div className={`absolute left-0 top-7 bottom-7 w-1.5 rounded-r-full transition-all ${stg.status === 'completed' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : stg.status === 'in_progress' ? 'bg-indigo-500 shadow-lg shadow-indigo-500/20' : 'bg-border-card'}`} />
                                        <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0 border-2 font-black transition-all ${stg.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : stg.status === 'in_progress' ? 'bg-indigo-500 border-indigo-500 text-card shadow-xl shadow-indigo-500/10' : 'bg-page border-border-card text-muted'}`}>
                                            {stg.status === 'completed' ? <CheckCircle2 size={24} /> : `0${i + 1}`}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1 gap-4">
                                                <h3 className="text-xl font-black text-main tracking-tighter truncate mr-4 italic leading-none">{stg.title}</h3>
                                                <StatusBadge status={stg.status} />
                                            </div>
                                            <p className="text-xs font-semibold text-muted italic opacity-80">{stg.description || 'Clinical milestone pending evaluation.'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <HistoryTabContent history={history} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PatientTreatmentView;
