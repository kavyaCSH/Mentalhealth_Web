import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, History as HistoryIcon, Activity, Brain, ClipboardCheck } from 'lucide-react';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import { HPIService } from '../../api/services/hpi.service';
import { MSEService } from '../../api/services/mse.service';
import { PastHistoryService } from '../../api/services/pastHistory.service';
import { ROSService } from '../../api/services/ros.service';
import { TreatmentService } from '../../api/services/treatment.service';
import { UserService } from '../../api/services/user.service';
import type { TreatmentProgress } from '../../types/treatment.types';

const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${label} took more than ${ms}ms`)), ms)
        )
    ]);
};

const PatientHealthRecords = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    const [latestComplaint, setLatestComplaint] = useState<unknown>(null);
    const [latestHPI, setLatestHPI] = useState<unknown>(null);
    const [latestMSE, setLatestMSE] = useState<unknown>(null);
    const [latestHistory, setLatestHistory] = useState<unknown>(null);
    const [latestROS, setLatestROS] = useState<unknown>(null);
    const [treatmentProgress, setTreatmentProgress] = useState<TreatmentProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvedIds, setResolvedIds] = useState({ hex: user?._id || user?.id || '', numeric: user?.userId || '' });

    const hasFullUser = !!(user?._id || user?.id);
    const fetchLock = useRef(false);

    // Final fallback: never block for more than 10 seconds total
    const emergencyTimeout = useMemo(() => setTimeout(() => {
        setIsLoading((prev) => {
            if (prev) console.warn('[PatientHealthRecords] Final hydration emergency escape triggered');
            return false;
        });
    }, 10000), []);


    const fetchRecords = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('[PatientHealthRecords] Hydration cycle triggered...');

            // 1. Resolve Definitive IDs
            let resolvedHexId = user?._id || user?.id || '';
            let resolvedNumericId = user?.userId || '';

            const isMongoId = (id: unknown) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

            // Optimization: If we already have a Mongo ID, skip profile resolution
            if (!isMongoId(resolvedHexId) && resolvedHexId) {
                console.log('[PatientHealthRecords] Initial ID is not hex, resolving profile from backend...');
                try {
                    const profileRes = await withTimeout(UserService.getUserById(resolvedHexId), 3000, 'Profile');
                    const profile = profileRes as { _id?: string; id?: string; userId?: string | number };
                    if (profile) {
                        resolvedHexId = profile._id || profile.id || resolvedHexId;
                        resolvedNumericId = profile.userId || resolvedNumericId;
                        setResolvedIds({ hex: resolvedHexId, numeric: String(resolvedNumericId) });
                        console.log('[PatientHealthRecords] Extended profile IDs resolved.');
                    }
                } catch {
                    console.warn('[PatientHealthRecords] Profile resolution failed, ID not hex.');
                }
            }

            // Immediately exit global loading state once we have IDs to show cards
            setIsLoading(false);

            // 2. Background fetching clinical models...
            console.log('[PatientHealthRecords] Initiating clinical stream for patient:', resolvedHexId);

            const handleResult = (res: PromiseSettledResult<unknown>, setter: (val: unknown) => void, label: string) => {
                if (res.status === 'fulfilled') {
                    const data = res.value as { data?: unknown[] };
                    const list = data?.data || (Array.isArray(data) ? data : []);
                    if (list.length > 0) {
                        console.log(`[PatientHealthRecords] ${label} data popped in.`);
                        setter(list[0]);
                    }
                } else {
                    console.warn(`[PatientHealthRecords] ${label} clinical fetch failed:`, res.reason);
                }
            };

            const fetchTreatment = async () => {
                try {
                    const resolvedId = resolvedNumericId || resolvedHexId;
                    const rawData = await TreatmentService.getPatientProgress(resolvedId);
                    const data = rawData as { data?: { status?: string; id?: string; _id?: string; title?: string; stage?: string; notes?: string; description?: string; createdAt?: string }[]; diagnosis?: string };
                    if (data && data.data && Array.isArray(data.data)) {
                        const stageArray = data.data as { status?: string; id?: string; _id?: string; title?: string; stage?: string; notes?: string; description?: string; createdAt?: string }[];
                        const mappedData = {
                            stages: stageArray.map((s) => ({
                                id: (s.id || s._id) as string,
                                title: (s.title || s.stage || 'Clinical Milestone') as string,
                                status: (s.status || 'pending') as "pending" | "in_progress" | "completed" | "on_hold",
                                notes: s.notes,
                                description: s.description,
                                createdAt: s.createdAt
                            })),
                            overall_progress: Math.round((stageArray.filter((s) => s.status === 'completed').length / (stageArray.length || 1)) * 100),
                            diagnosis: data.diagnosis || 'Therapeutic Framework',
                            patientId: String(resolvedNumericId || resolvedHexId)
                        };
                        if (mappedData.stages) {
                            setTreatmentProgress(mappedData as TreatmentProgress);
                        }
                    }
                } catch {
                    console.warn('[PatientHealthRecords] Treatment protocol not found/failed');
                }
            };

            // Parallelized non-blocking cards
            Promise.allSettled([
                withTimeout(ChiefComplaintService.listComplaints({
                    patient: resolvedHexId,
                    patientId: resolvedHexId,
                    patient_id: resolvedHexId,
                    limit: 1
                }), 5000, 'Complaints'),
                withTimeout(HPIService.getHPIList({
                    patient_id: resolvedHexId
                }), 5000, 'HPI'),
                withTimeout(MSEService.listMSEByPatient(resolvedHexId), 5000, 'MSE'),
                withTimeout(PastHistoryService.getPastHistoryByPatient(resolvedHexId), 5000, 'History'),
                withTimeout(ROSService.getROSByPatient(resolvedHexId), 5000, 'ROS')
            ]).then(([complaintsRes, hpiRes, mseRes, historyRes, rosRes]) => {
                handleResult(complaintsRes, setLatestComplaint, 'Complaint');
                handleResult(hpiRes, setLatestHPI, 'HPI');
                handleResult(mseRes, setLatestMSE, 'MSE');
                handleResult(historyRes, setLatestHistory, 'History');
                handleResult(rosRes, setLatestROS, 'ROS');
            });

            fetchTreatment();

        } catch (error: unknown) {
            console.error('[PatientHealthRecords] Critical hydration loop failure:', error);
            setError('We encountered a problem loading your history profile.');
            setIsLoading(false);
        } finally {
            clearTimeout(emergencyTimeout);
        }
    }, [user?._id, user?.id, user?.userId, emergencyTimeout]);

    useEffect(() => {
        // Trigger fetch if we have any valid ID and haven't fetched yet
        if (hasFullUser && !fetchLock.current) {
            fetchLock.current = true;
            fetchRecords();
        }

        // Escape loading if no user object exists at all (e.g. not logged in)
        if (!user && isLoading) {
            setIsLoading(false);
        }

        // Secondary escape: if user object is present but after 2 seconds we still don't have basic IDs
        const escapeTimeout = setTimeout(() => {
            if (isLoading && !fetchLock.current) {
                console.warn('[PatientHealthRecords] Potential initialization hang, forcing exit');
                setIsLoading(false);
            }
        }, 5000);

        return () => clearTimeout(escapeTimeout);
    }, [hasFullUser, user, isLoading, fetchRecords]);

    const resolvedUserId = resolvedIds.hex || user?._id || user?.id || '';
    const resolvedNumericId = resolvedIds.numeric || user?.userId || '';

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Accessing Health Vault...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                    <Activity size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">Sync Interrupted</h2>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">{error}</p>
                <button
                    onClick={() => { setError(null); fetchRecords(); }}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl animate-fade-in pb-16">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Activity className="text-indigo-600" size={32} />
                    Health overview
                </h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-11">Comprehensive Clinical Profile Journey</p>
            </header>



            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {/* Chief Complaint Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/chief-complaint`)}
                    className="card-premium p-5 border-slate-100 hover:border-rose-200 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Stethoscope size={20} />
                            </div>
                            <h2 className="text-sm font-black text-slate-900 tracking-tight">Chief Complaint History</h2>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Symptom</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                            {latestComplaint ? `"${(latestComplaint as { narrative?: string }).narrative}"` : '"No chief complaint recorded yet."'}
                        </p>
                    </div>
                </motion.div>

                {/* HPI history Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/hpi`)}
                    className="card-premium p-5 border-slate-100 hover:border-indigo-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                                <HistoryIcon size={20} />
                            </div>
                            <h2 className="text-sm font-black text-slate-900 tracking-tight">HPI history</h2>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Clinical Narrative</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                            {latestHPI ? `"${(latestHPI as { narrative?: string; content?: string }).narrative || (latestHPI as { narrative?: string; content?: string }).content}"` : '"No HPI history recorded yet."'}
                        </p>
                    </div>
                </motion.div>
                {/* MSE history Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/mse`)}
                    className="card-premium p-5 border-slate-100 hover:border-violet-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Brain size={20} />
                            </div>
                            <h2 className="text-sm font-black text-slate-900 tracking-tight">Mental Status</h2>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Examination Activity</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                            {latestMSE ? `Last assessed on ${new Date((latestMSE as any).createdAt).toLocaleDateString()}` : '"No mental status exam conducted."'}
                        </p>
                    </div>
                </motion.div>

                {/* ROS history Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/ros`)}
                    className="card-premium p-5 border-slate-100 hover:border-sky-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Stethoscope size={20} />
                            </div>
                            <h2 className="text-sm font-black text-slate-900 tracking-tight">Review of Systems</h2>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Systems Scan</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                            {latestROS ? `Last reviewed on ${new Date((latestROS as any).createdAt).toLocaleDateString()}` : '"No systematic review conducted."'}
                        </p>
                    </div>
                </motion.div>
                {/* Symptom History Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/symptoms?tab=history`)}
                    className="card-premium p-5 border-slate-100 hover:border-amber-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Activity size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Symptom history</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Longitudinal Trends</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                            Review your psychological and physical trends over time.
                        </p>
                    </div>
                </motion.div>

                {/* Past History Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/past-history`)}
                    className="card-premium p-5 border-slate-100 hover:border-indigo-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                            <HistoryIcon size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Past History</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Historical Intake</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                            {latestHistory ? `Last intake documented on ${new Date((latestHistory as any).createdAt).toLocaleDateString()}` : '"No comprehensive history intake performed."'}
                        </p>
                    </div>
                </motion.div>

                {/* Treatment Journey Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    onClick={() => navigate(`/patients/${resolvedNumericId || resolvedUserId}/treatment`)}
                    className="card-premium p-5 border-slate-100 hover:border-emerald-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                            <ClipboardCheck size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Treatment Plan</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Protocol Status</p>
                        {treatmentProgress ? (
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-slate-700 truncate">{treatmentProgress.diagnosis}</p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">Progress</span>
                                        <span className="text-emerald-600">{treatmentProgress.overall_progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${treatmentProgress.overall_progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-slate-500 italic uppercase">No active treatment protocol...</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PatientHealthRecords;
