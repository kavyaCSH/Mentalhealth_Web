import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, History as HistoryIcon, Activity, Brain, ClipboardCheck } from 'lucide-react';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import { HPIService } from '../../api/services/hpi.service';
import { MSEService } from '../../api/services/mse.service';
import { ROSService } from '../../api/services/ros.service';
import { TreatmentService } from '../../api/services/treatment.service';
import { SymptomService } from '../../api/services/symptom.service';
import { UserService } from '../../api/services/user.service';
import { AssessmentService } from '../../api/services/assessment.service';
import { Shield } from 'lucide-react';
import type { TreatmentProgress } from '../../types/treatment.types';
import type { ChiefComplaintResponse } from '../../api/services/chiefComplaint.service';
import type { HPIResponse } from '../../api/services/hpi.service';
import type { MSEResponse } from '../../types/mse.types';
import type { ROSResponse } from '../../types/ros.types';
import type { SymptomRecord } from '../../api/services/symptom.service';

const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${label} took more than ${ms}ms`)), ms)
        )
    ]);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date.toLocaleDateString();
};

const PatientHealthRecords = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    const [latestComplaint, setLatestComplaint] = useState<ChiefComplaintResponse | null>(null);
    const [latestHPI, setLatestHPI] = useState<HPIResponse | null>(null);
    const [latestMSE, setLatestMSE] = useState<MSEResponse | null>(null);
    const [latestROS, setLatestROS] = useState<ROSResponse | null>(null);
    const [latestSymptom, setLatestSymptom] = useState<SymptomRecord | null>(null);
    const [latestProfAssessment, setLatestProfAssessment] = useState<any | null>(null);
    const [treatmentProgress, setTreatmentProgress] = useState<TreatmentProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvedIds, setResolvedIds] = useState({ hex: user?._id || user?.id || '', numeric: user?.userId || '' });

    const hasFullUser = !!(user?._id || user?.id);
    const fetchLock = useRef(false);
    const emergencyTimerRef = useRef<NodeJS.Timeout | null>(null);


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

            const handleResult = <T,>(res: PromiseSettledResult<unknown>, setter: (val: T) => void, label: string) => {
                if (res.status === 'fulfilled') {
                    const data = res.value as { data?: T[] };
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
                    patientId: resolvedHexId,
                    patient_id: resolvedHexId,
                    limit: 1
                }), 5000, 'Complaints'),
                withTimeout(HPIService.getHPIList({
                    patient_id: resolvedHexId
                }), 5000, 'HPI'),
                withTimeout(MSEService.listMSEByPatient(resolvedHexId), 5000, 'MSE'),
                withTimeout(ROSService.getROSByPatient(resolvedHexId), 5000, 'ROS'),
                withTimeout(SymptomService.getPatientSymptomHistory(resolvedHexId, 1, 1), 5000, 'Symptoms'),
                withTimeout(AssessmentService.getPatientProfessionalHistory(resolvedNumericId || resolvedHexId), 5000, 'ProfessionalHistory'),
            ]).then(([complaintsRes, hpiRes, mseRes, rosRes, symptomsRes, profRes]) => {
                handleResult(complaintsRes, setLatestComplaint, 'Complaint');
                handleResult(hpiRes, setLatestHPI, 'HPI');
                handleResult(mseRes, setLatestMSE, 'MSE');
                handleResult(rosRes, setLatestROS, 'ROS');

                // Specialized symptom handler
                if (symptomsRes.status === 'fulfilled') {
                    const sData = symptomsRes.value as { data?: { symptoms?: SymptomRecord[] } };
                    const sList = sData?.data?.symptoms || [];
                    if (sList.length > 0) {
                        console.log('[PatientHealthRecords] Symptom history popped in.');
                        setLatestSymptom(sList[0]);
                    }
                }

                // Professional History handler
                if (profRes.status === 'fulfilled') {
                    const pList = profRes.value as any[] || [];
                    if (Array.isArray(pList) && pList.length > 0) {
                        console.log('[PatientHealthRecords] Professional history popped in.');
                        setLatestProfAssessment(pList[0]);
                    }
                }
            });

            fetchTreatment();

        } catch (error: unknown) {
            console.error('[PatientHealthRecords] Critical hydration loop failure:', error);
            setError('We encountered a problem loading your history profile.');
            setIsLoading(false);
        } finally {
            if (emergencyTimerRef.current) clearTimeout(emergencyTimerRef.current);
        }
    }, [user?._id, user?.id, user?.userId]);

    useEffect(() => {
        // Trigger fetch if we have any valid ID and haven't fetched yet
        if (hasFullUser && !fetchLock.current) {
            fetchLock.current = true;

            // Set emergency escape timer
            emergencyTimerRef.current = setTimeout(() => {
                setIsLoading((prev) => {
                    if (prev) console.warn('[PatientHealthRecords] Final hydration emergency escape triggered');
                    return false;
                });
            }, 10000);

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

        return () => {
            clearTimeout(escapeTimeout);
            if (emergencyTimerRef.current) clearTimeout(emergencyTimerRef.current);
        };
    }, [hasFullUser, user, isLoading, fetchRecords]);

    const resolvedUserId = resolvedIds.hex || user?._id || user?.id || '';
    const resolvedNumericId = resolvedIds.numeric || user?.userId || '';

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-muted uppercase tracking-widest">Accessing Health Vault...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                    <Activity size={32} />
                </div>
                <h2 className="text-xl font-black text-main mb-2">Sync Interrupted</h2>
                <p className="text-muted font-medium mb-8 leading-relaxed">{error}</p>
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
                <h1 className="text-4xl font-black text-main tracking-tight flex items-center gap-3">
                    <Activity className="text-indigo-600" size={32} />
                    Health overview
                </h1>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-2 ml-11">Comprehensive Clinical Profile Journey</p>
            </header>



            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {/* Chief Complaint Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/chief-complaint`)}
                    className="card-premium p-5 border-border-card hover:border-rose-200 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Stethoscope size={20} />
                            </div>
                            <h2 className="text-sm font-black text-main tracking-tight">Chief Complaint History</h2>
                        </div>
                        <span className="text-[10px] font-black text-muted opacity-70 uppercase tracking-widest">Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Primary Symptom</p>
                        <p className="text-sm font-semibold text-main opacity-80 leading-relaxed italic">
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
                    className="card-premium p-5 border-border-card hover:border-indigo-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                                <HistoryIcon size={20} />
                            </div>
                            <h2 className="text-sm font-black text-main tracking-tight">HPI history</h2>
                        </div>
                        <span className="text-[10px] font-black text-muted opacity-70 uppercase tracking-widest">Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Clinical Narrative</p>
                        <p className="text-sm font-semibold text-main opacity-80 leading-relaxed italic">
                            {latestHPI ? `"${latestHPI.narrative}"` : '"No HPI history recorded yet."'}
                        </p>
                    </div>
                </motion.div>
                {/* MSE history Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/mse`)}
                    className="card-premium p-5 border-border-card hover:border-violet-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Brain size={20} />
                            </div>
                            <h2 className="text-sm font-black text-main tracking-tight">Mental Status</h2>
                        </div>
                        <span className="text-[10px] font-black text-muted opacity-70 uppercase tracking-widest">Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Examination Activity</p>
                        <p className="text-sm font-semibold text-main opacity-80 leading-relaxed italic">
                            {latestMSE
                                ? `Last assessed on ${formatDate(latestMSE.createdAt) || 'recent date'}`
                                : '"No mental status exam conducted."'}
                        </p>
                    </div>
                </motion.div>

                {/* ROS history Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/ros`)}
                    className="card-premium p-5 border-border-card hover:border-sky-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Stethoscope size={20} />
                            </div>
                            <h2 className="text-sm font-black text-main tracking-tight">Review of Systems</h2>
                        </div>
                        <span className="text-[10px] font-black text-muted opacity-70 uppercase tracking-widest">Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Systems Scan</p>
                        <p className="text-sm font-semibold text-main opacity-80 leading-relaxed italic">
                            {latestROS
                                ? `Last reviewed on ${formatDate(latestROS.createdAt) || 'recent date'}`
                                : '"No systematic review conducted."'}
                        </p>
                    </div>
                </motion.div>
                {/* Symptom History Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => navigate(`/patients/${resolvedUserId}/symptoms?tab=history`)}
                    className="card-premium p-5 border-border-card hover:border-amber-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Activity size={20} />
                            </div>
                            <h2 className="text-sm font-black text-main tracking-tight">Symptom history</h2>
                        </div>
                        <span className="text-[10px] font-black text-muted opacity-70 uppercase tracking-widest">Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Longitudinal Trends</p>
                        <p className="text-sm font-semibold text-main opacity-80 leading-relaxed italic">
                            {latestSymptom
                                ? `Last logged on ${formatDate(latestSymptom.createdAt) || 'recent date'}`
                                : 'Review your psychological and physical trends over time.'}
                        </p>
                    </div>
                </motion.div>

                {/* Professional Assessment History Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    onClick={() => navigate(`/history/professional`)}
                    className="card-premium p-5 border-border-card hover:border-indigo-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Shield size={20} />
                            </div>
                            <h2 className="text-sm font-black text-main tracking-tight">Professional Reports</h2>
                        </div>
                        <span className="text-[10px] font-black text-muted opacity-70 uppercase tracking-widest">Clinical Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Verified Evaluations</p>
                        <p className="text-sm font-semibold text-main opacity-80 leading-relaxed italic">
                            {latestProfAssessment
                                ? `Last verified report on ${formatDate(latestProfAssessment.date || latestProfAssessment.createdAt) || 'recent date'}`
                                : '"Awaiting clinical evaluation synthesis."'}
                        </p>
                    </div>
                </motion.div>



                {/* Treatment Journey Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    onClick={() => navigate(`/treatment`)}
                    className="card-premium p-5 border-border-card hover:border-emerald-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                <ClipboardCheck size={20} />
                            </div>
                            <h2 className="text-sm font-black text-main tracking-tight">Treatment Plan</h2>
                        </div>
                        <span className="text-[10px] font-black text-muted opacity-70 uppercase tracking-widest">Archive</span>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Protocol Status</p>
                        {treatmentProgress ? (
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-main opacity-80 truncate">{treatmentProgress.diagnosis}</p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-muted">Progress</span>
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
                            <p className="text-sm font-semibold text-muted italic uppercase">No active treatment protocol...</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PatientHealthRecords;
