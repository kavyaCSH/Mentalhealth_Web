import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, History as HistoryIcon, Activity, Brain, ClipboardCheck, ClipboardList } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
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

const withTimeout = (promise: Promise<any>, ms: number, label: string) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${label} took more than ${ms}ms`)), ms)
        )
    ]);
};

const PatientHealthRecords = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    const [latestComplaint, setLatestComplaint] = useState<any>(null);
    const [latestHPI, setLatestHPI] = useState<any>(null);
    const [latestMSE, setLatestMSE] = useState<any>(null);
    const [latestHistory, setLatestHistory] = useState<any>(null);
    const [latestROS, setLatestROS] = useState<any>(null);
    const [treatmentProgress, setTreatmentProgress] = useState<TreatmentProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvedIds, setResolvedIds] = useState({ hex: user?._id || user?.id || '', numeric: user?.userId || '' });

    const fetchLock = useRef(false);
    const hasFullUser = !!(user?._id || user?.id || user?.userId);

    useEffect(() => {
        // Trigger fetch if we have any valid ID and haven't fetched yet
        if (hasFullUser && !fetchLock.current) {
            fetchLock.current = true;
            fetchRecords();
        } 
        
        // Escape loading if no user object exists at all (e.g. not logged in)
        if (!user && !isLoading) {
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
    }, [hasFullUser, !!user]);

    const fetchRecords = async () => {
        setIsLoading(true);
        setError(null);
        
        // Final fallback: never block for more than 10 seconds total
        const emergencyTimeout = setTimeout(() => {
            setIsLoading((prev) => {
                if (prev) console.warn('[PatientHealthRecords] Final hydration emergency escape triggered');
                return false;
            });
        }, 10000);

        try {
            console.log('[PatientHealthRecords] Hydration cycle triggered...');
            
            // 1. Resolve Definitive IDs
            let resolvedHexId = user?._id || user?.id || '';
            let resolvedNumericId = user?.userId || '';
            
            const isMongoId = (id: any) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
            
            // Optimization: If we already have a Mongo ID, skip profile resolution
            if (!isMongoId(resolvedHexId) && resolvedHexId) {
                console.log('[PatientHealthRecords] Initial ID is not hex, resolving profile from backend...');
                try {
                    const profile = await withTimeout(UserService.getUserById(resolvedHexId), 3000, 'Profile');
                    if (profile) {
                        resolvedHexId = profile._id || profile.id || resolvedHexId;
                        resolvedNumericId = profile.userId || resolvedNumericId;
                        setResolvedIds({ hex: resolvedHexId, numeric: String(resolvedNumericId) });
                        console.log('[PatientHealthRecords] Extended profile IDs resolved.');
                    }
                } catch (err) {
                    console.warn('[PatientHealthRecords] Profile resolution timed out/failed, using current state');
                }
            }

            // Immediately exit global loading state once we have IDs to show cards
            setIsLoading(false);

            // 2. Background fetching clinical models...
            console.log('[PatientHealthRecords] Initiating clinical stream for patient:', resolvedHexId);

            const handleResult = (res: PromiseSettledResult<any>, setter: (val: any) => void, label: string) => {
                if (res.status === 'fulfilled') {
                    const data = res.value;
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
                    const res = await withTimeout(TreatmentService.getPatientProgress(resolvedNumericId || resolvedHexId), 5000, 'Treatment');
                    let data = res;
                    if (data && data.data && Array.isArray(data.data)) {
                        const stageArray = data.data;
                        data = {
                            stages: stageArray,
                            overall_progress: Math.round((stageArray.filter((s: any) => s.status === 'completed').length / (stageArray.length || 1)) * 100),
                            diagnosis: data.diagnosis || 'Therapeutic Framework',
                        };
                    }
                    if (data && !Array.isArray(data) && data.stages) {
                        setTreatmentProgress(data);
                    }
                } catch (e) {
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

        } catch (error) {
            console.error('[PatientHealthRecords] Critical hydration loop failure:', error);
            setError('We encountered a problem loading your history profile.');
            setIsLoading(false);
        } finally {
            clearTimeout(emergencyTimeout);
        }
    };

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
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Stethoscope size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Chief Complaint</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Primary Symptom</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                            {latestComplaint ? `"${latestComplaint.narrative}"` : '"No chief complaint recorded yet."'}
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
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                            <HistoryIcon size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">HPI history</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Clinical Narrative</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                            {latestHPI ? `"${latestHPI.narrative || latestHPI.content}"` : '"No HPI history recorded yet."'}
                        </p>
                    </div>
                </motion.div>

                {/* Mental Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/mse`)}
                    className="card-premium p-5 border-slate-100 hover:border-violet-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Brain size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Mental Status</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Examination Status</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                            {latestMSE ? `Last evaluated on ${new Date(latestMSE.createdAt).toLocaleDateString()}` : 'No mental status exam conducted.'}
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
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                            {latestHistory 
                                ? `Last intake documented on ${new Date(latestHistory.createdAt).toLocaleDateString()}` 
                                : 'No previous records found.'}
                        </p>
                    </div>
                </motion.div>

                {/* Review of Systems Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/ros`)}
                    className="card-premium p-5 border-slate-100 hover:border-indigo-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Stethoscope size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Review of Systems</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Systems Review</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                            {latestROS 
                                ? `Last review completed on ${new Date(latestROS.createdAt).toLocaleDateString()}` 
                                : 'No systematic review recorded.'}
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
