import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    ChevronLeft, 
    CheckCircle2, 
    Plus, 
    LayoutDashboard,
    ClipboardCheck,
    X,
    Save,
    Calendar,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { TreatmentService } from '../../../api/services/treatment.service';
import { UserService } from '../../../api/services/user.service';
import { AssessmentService } from '../../../api/services/assessment.service';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import type { TreatmentProgress, TreatmentStage } from '../../../types/treatment.types';
import Button from '../../../components/ui/Button';

const StatusBadge = ({ status }: { status: TreatmentStage['status'] }) => {
    const styles: Record<TreatmentStage['status'], string> = {
        pending: 'bg-page text-muted border-border-card',
        in_progress: 'bg-amber-50 text-amber-600 border-amber-200',
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        on_hold: 'bg-rose-50 text-rose-600 border-rose-200',
        skipped: 'bg-page text-muted opacity-80 border-border-card'
    };

    const icons: Record<TreatmentStage['status'], React.ReactNode> = {
        pending: <RefreshCw size={12} />,
        in_progress: <Activity size={12} />,
        completed: <CheckCircle2 size={12} />,
        on_hold: <AlertCircle size={12} />,
        skipped: <RefreshCw size={12} className="opacity-50" />
    };

    const s = status || 'pending';
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${styles[s]}`}>
            {s.replace(/_/g, ' ')}
        </span>
    );
};

const TreatmentPlanPage = () => {
    const { patientId: userIdFromRoute } = useParams<{ patientId: string }>();
    const { search } = useLocation();
    const queryHexId = new URLSearchParams(search).get('hexId');

    console.log("userIdFromRoute",userIdFromRoute);
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = currentUser?.role === 'patient' || (currentUser as any)?.role === 'PATIENT';
    const isPractitioner = ['psychiatrist', 'psychologist', 'nurse', 'social_worker', 'counselor'].includes(String(currentUser?.role).toLowerCase());

    const [progress, setProgress] = useState<TreatmentProgress>({ stages: [], overall_progress: 0, patientId: userIdFromRoute || '', diagnosis: '' });
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'history'>('history');
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [identities, setIdentities] = useState<{ userId: string; patientId: string } | null>(null);

    // Update Modal State (Compact Form UI)
    const [updatingStage, setUpdatingStage] = useState<TreatmentStage | null>(null);
    const [updateForm, setUpdateForm] = useState({ title: '', status: 'pending' as any, notes: '', completedAt: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchLock = useRef(false);

    const fetchData = useCallback(async () => {
        if (!userIdFromRoute || fetchLock.current) return;
        fetchLock.current = true;
        setIsLoading(true);
        try {
            // High-Fidelity Identity Sync Protocol (Clinical Parity)
            const resolveFullIdentity = async (idArg: string) => {
                let resolvedUserId = idArg;
                let resolvedPatientId = queryHexId || idArg;

                try {
                    const profile = await UserService.getUserById(idArg);
                    resolvedUserId = String(profile.userId || profile.id || idArg);
                    resolvedPatientId = String(profile._id || profile.id || resolvedPatientId);
                } catch (err: any) {
                    if (err.response?.status === 404) {
                        const { users } = await UserService.listUsers({ role: 'patient', search: idArg });
                        const match: any = users.find((u: any) => 
                            String(u._id) === idArg || String(u.id) === idArg || String(u.userId) === idArg
                        );
                        if (match) {
                            resolvedUserId = String(match.userId || match.id || idArg);
                            resolvedPatientId = String(match._id || match.id || idArg);
                        } else {
                            const pData = await AssessmentService.getProfessionalQuestions(idArg).catch(() => null);
                            if (pData?.data?.patient?.userId) {
                                resolvedUserId = String(pData.data.patient.userId);
                                resolvedPatientId = idArg;
                            }
                        }
                    }
                }
                return { userId: resolvedUserId, patientId: resolvedPatientId };
            };

            const resolvedIdentities = await resolveFullIdentity(userIdFromRoute);
            setIdentities(resolvedIdentities);
            console.log(`[Clinical Treatment] Syncing for identities: User(${resolvedIdentities.userId}), Patient(${resolvedIdentities.patientId})`);

            // Trial and Error Fetching (Clinical Parity: Handles 404 "Patient not found" vs "User not found")
            const syncProgress = async () => {
                // Try numeric User ID first as primary identity
                const tryOrder = [resolvedIdentities.userId, resolvedIdentities.patientId];
                console.log("tryOrder",resolvedIdentities);
                let lastError = null;

                for (const id of tryOrder) {
                    try {
                        console.log(`[Clinical Treatment] Attempting progress sync with ID: ${id}`);
                        const res = await TreatmentService.getPatientProgress(id);
                        if (res && res.stages && res.stages.length > 0) return res;
                        // If empty but no 404, we might want to try the other ID anyway if they are different
                        if (id === tryOrder[0] && resolvedIdentities.patientId !== resolvedIdentities.userId) continue;
                        return res;
                    } catch (err: any) {
                        lastError = err;
                        if (err.response?.status === 404) continue;
                        throw err;
                    }
                }
                throw lastError;
            };

            const syncHistory = async () => {
                const tryOrder = [resolvedIdentities.userId, resolvedIdentities.patientId];
                let lastError = null;

                for (const id of tryOrder) {
                    try {
                        console.log(`[Clinical Treatment] Attempting history sync with ID: ${id}`);
                        const res = await TreatmentService.getTreatmentHistory(id);
                        const historyList = Array.isArray(res) ? res : (res.data || res.history || []);
                        if (historyList.length > 0) return historyList;
                        if (id === tryOrder[0] && resolvedIdentities.userId !== resolvedIdentities.patientId) continue;
                        return historyList;
                    } catch (err: any) {
                        lastError = err;
                        if (err.response?.status === 404) continue;
                        throw err;
                    }
                }
                return [];
            };

            const [pRes, hRes] = await Promise.allSettled([syncProgress(), syncHistory()]);

            if (pRes.status === 'fulfilled') {
                setProgress(pRes.value);
            } else {
                console.warn('[Clinical Treatment] Progress final failure:', pRes.reason);
                setProgress({ stages: [], overall_progress: 0, patientId: resolvedIdentities.userId, diagnosis: 'No active roadmap found' });
            }

            if (hRes.status === 'fulfilled') {
                setHistory(hRes.value);
            }
        } catch (err) {
            console.error('[Treatment] Critical failure:', err);
        } finally {
            setIsLoading(false);
            fetchLock.current = false;
        }
    }, [userIdFromRoute]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInitializeJourney = async () => {
        if (!userIdFromRoute) return;
        setIsActionLoading(true);
        try {
            await TreatmentService.initializeJourney(userIdFromRoute);
            fetchData();
        } catch {
            console.error('[Journey] Initialization failed');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleOpenUpdate = (stg: TreatmentStage) => {
        setUpdatingStage(stg);
        setUpdateForm({
            title: stg.title,
            status: stg.status,
            notes: stg.description || '',
            completedAt: stg.createdAt ? new Date(stg.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
    };

    const handleUpdateStatus = async () => {
        if (!updatingStage) return;
        setIsUpdating(true);
        try {
            const payload: any = {
                status: updateForm.status,
                notes: updateForm.notes,
                stage: updateForm.title
            };

            if (updateForm.status === 'completed') {
                payload.completedAt = new Date(updateForm.completedAt).toISOString();
            }

            await TreatmentService.updateStageStatus(updatingStage.id, payload);
            setUpdatingStage(null);
            fetchData();
        } catch {
            console.error('[Stage] Update failed');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Activity className="animate-spin text-indigo-600" size={32} />
                <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest opacity-50">Syncing Data...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in pb-24">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button onClick={() => navigate(isPatient ? '/records' : `/patients/${identities?.userId || userIdFromRoute}/health`)} className="flex items-center gap-2 text-[10px] font-black text-muted opacity-80 hover:text-indigo-600 transition-all uppercase tracking-[0.2em] group">
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back
                    </button>
                    <div>
                        <div className="flex items-center gap-3 text-indigo-600 mb-2">
                            <Activity size={28} strokeWidth={2.5} />
                            <h1 className="text-4xl font-black text-main tracking-tighter leading-none">Treatment Flow</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-[0.3em] opacity-60 ml-1">Clinical Recovery Suite</p>
                            <div className="h-2 w-px bg-slate-300 mx-1 opacity-40" />
                            <p className="text-[9px] font-bold text-muted opacity-80 uppercase tracking-widest opacity-80">ID: {identities?.patientId || progress.patientId}</p>
                            {identities?.userId && identities.userId !== (identities.patientId || progress.patientId) && (
                                <span className="text-[8px] font-medium text-muted opacity-40 tracking-tighter">({identities.userId})</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4">
                    {isPractitioner && (
                        <button onClick={() => navigate(`/patients/${userIdFromRoute}/treatment/new`)} className="bg-slate-900 hover:bg-indigo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 transition-all">
                            <Plus size={16} /> Record Session
                        </button>
                    )}
                    <div className="flex bg-page p-1 rounded-2xl border border-border-card">
                        <button onClick={() => setActiveTab('history')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'history' ? 'bg-card text-indigo-600 shadow-lg ring-1 ring-slate-200/50' : 'text-muted opacity-80'}`}>History</button>
                    </div>
                </div>
            </header>

            <AnimatePresence mode="wait">
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {history.length === 0 ? (
                            <div className="col-span-full p-20 text-center bg-card/50 rounded-[2rem] border-2 border-dashed border-border-card flex flex-col items-center">
                                <ClipboardCheck size={48} className="text-muted opacity-40 mb-6" />
                                <h3 className="text-xl font-black text-muted uppercase">Records Vault Empty</h3>
                            </div>
                        ) : (
                            history.filter(Boolean).map((rec, i) => (
                                <div key={rec.id || i} className="p-6 bg-card border border-border-card rounded-[2rem] shadow-sm flex flex-col hover:border-indigo-100 transition-all">
                                     <div className="flex items-center justify-between mb-5 pb-5 border-b border-border-card">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-900 text-white rounded-[1rem] flex items-center justify-center"><Activity size={18} /></div>
                                            <div className="flex flex-col">
                                                <span className="text-[12px] font-black text-main tracking-tighter italic">{new Date(rec.createdAt || rec.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 tracking-widest uppercase italic">Verified</span>
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        {rec.plan && (
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-1.5 ml-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /><span className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest leading-none">Impression</span></div>
                                                <p className="text-[13px] font-bold text-muted leading-relaxed italic">{rec.plan}</p>
                                            </div>
                                        )}
                                        {rec.medications && (
                                            <div className="space-y-1.5 pt-4 border-t border-border-card">
                                                <div className="flex items-center gap-1.5 ml-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /><span className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest leading-none">Meds</span></div>
                                                <p className="text-[11px] font-black text-rose-500 uppercase tracking-tight">{rec.medications}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </motion.div>
            </AnimatePresence>

            {/* REDESIGNED UPDATE FORM CARD UI */}
            <AnimatePresence>
                {updatingStage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-sm shadow-2xl">
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-card w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-border-card relative max-h-[85vh] flex flex-col">
                            {/* Compact Form Header */}
                            <div className="px-6 py-5 flex items-center justify-between bg-page border-b border-border-card shrink-0">
                                <div className="space-y-0.5">
                                    <h2 className="text-xl font-black text-main tracking-tighter uppercase italic leading-none">Update Protocol</h2>
                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest opacity-80">Synchronizing stage</p>
                                </div>
                                <button onClick={() => setUpdatingStage(null)} className="p-2.5 bg-card text-muted opacity-80 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl shadow-sm transition-all border border-border-card"><X size={18} /></button>
                            </div>

                            <div className="px-6 py-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                                {/* Compact Caption Card */}
                                <div className="space-y-2 p-4 bg-card/50 rounded-[1.25rem] border border-border-card">
                                    <label className="text-[8px] font-black text-muted opacity-80 uppercase tracking-widest flex items-center gap-2"><LayoutDashboard size={10} /> Stage Caption</label>
                                    <input type="text" value={updateForm.title} onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })} className="w-full bg-card border border-border-card rounded-xl py-3 px-5 text-[13px] font-black uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" placeholder="Header" />
                                </div>

                                {/* Compact Status Grid */}
                                <div className="space-y-2.5">
                                    <label className="text-[8px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Progress Mastery</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['pending', 'in_progress', 'completed', 'on_hold'] as const).map((s) => (
                                            <button key={s} onClick={() => setUpdateForm({ ...updateForm, status: s })} className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${updateForm.status === s ? (s === 'completed' ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-indigo-600 border-indigo-600 text-white shadow-md') : 'bg-card border-border-card text-muted opacity-80 hover:border-indigo-100'}`}>
                                                {s.replace(/_/g, ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Clinical Notes Card */}
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Clinical findings</label>
                                    <textarea value={updateForm.notes} onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })} className="w-full bg-page border border-border-card rounded-[1.25rem] p-4 text-[13px] font-bold text-muted leading-relaxed focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all min-h-[90px] resize-none shadow-inner" placeholder="Log progression..." />
                                </div>

                                {updateForm.status === 'completed' && (
                                    <div className="space-y-2.5 animate-fade-in p-4 bg-emerald-500/5 rounded-[1.25rem] border border-emerald-500/10">
                                        <label className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><Calendar size={10} /> Completion Date</label>
                                        <input type="date" value={updateForm.completedAt} onChange={(e) => setUpdateForm({ ...updateForm, completedAt: e.target.value })} className="w-full bg-card border border-border-card rounded-xl py-3 px-5 text-[12px] font-black uppercase tracking-widest focus:outline-none shadow-sm" />
                                    </div>
                                )}
                            </div>

                            <div className="px-6 py-5 bg-card/50 border-t border-border-card shrink-0">
                                <Button onClick={handleUpdateStatus} isLoading={isUpdating} className="w-full rounded-[1.25rem] py-4 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/10 hover:scale-[1.01] transition-transform text-[11px] uppercase font-black tracking-widest">
                                    <Save size={18} /> Commit Status
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TreatmentPlanPage;
