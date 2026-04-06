import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { Stethoscope, History as HistoryIcon, Activity, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import { HPIService } from '../../api/services/hpi.service';
import { MSEService } from '../../api/services/mse.service';
import { PastHistoryService } from '../../api/services/pastHistory.service';
import { ROSService } from '../../api/services/ros.service';
import { TreatmentService } from '../../api/services/treatment.service';
import { AssessmentService } from '../../api/services/assessment.service';
import { UserService } from '../../api/services/user.service';
import type { TreatmentProgress } from '../../types/treatment.types';
import { ClipboardCheck, ClipboardList } from 'lucide-react';

const Health = () => {
    const navigate = useNavigate();
    const { patientId: userId } = useParams<{ patientId: string }>();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = currentUser?.role === 'patient' || (currentUser as any)?.role === 'PATIENT';

    const [latestComplaint, setLatestComplaint] = useState<any>(null);
    const [latestHPI, setLatestHPI] = useState<any>(null);
    const [latestMSE, setLatestMSE] = useState<any>(null);
    const [latestHistory, setLatestHistory] = useState<any>(null);
    const [latestROS, setLatestROS] = useState<any>(null);
    const [treatmentProgress, setTreatmentProgress] = useState<TreatmentProgress | null>(null);
    const [resolvedPatientId, setResolvedPatientId] = useState<string | number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchLatestRecords();
        }
    }, [userId]);

    const fetchLatestRecords = async () => {
        setIsLoading(true);
        try {
            console.log(`[Health] Resolving health overview for: ${userId}`);

            // 1. Fetch user profile to resolve both hex and numeric IDs
            let hexId = userId || '';
            let numericId: string | number | undefined = undefined;

            // Optimization: If viewing own profile as patient, we already have the IDs
            if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                hexId = currentUser?._id || currentUser?.id || hexId;
                numericId = currentUser?.userId;
                console.log(`[Health] Using current patient session IDs: ${hexId}`);
            } else {
                try {
                    const userProfile = await UserService.getUserById(userId || '');
                    if (userProfile) {
                        hexId = userProfile._id || userProfile.id || hexId;
                        numericId = userProfile.userId;
                        setResolvedPatientId(numericId || hexId);
                        console.log(`[Health] Resolved IDs - Hex: ${hexId}, Numeric: ${numericId}`);
                    }
                } catch (profileError) {
                    console.warn('[Health] Profile fetch failed, using fallback identifiers:', profileError);
                }
            }

            // 2. Core clinical calls use the hex ID - Wrapped in individual try-catches to handle clinical 403s for patients
            const [complaintsRes, hpiRes, mseRes, historyRes, rosRes] = await Promise.allSettled([
                ChiefComplaintService.listComplaints({ patientId: hexId, limit: 1 }),
                HPIService.getHPIList({ patient_id: hexId }),
                MSEService.listMSEByPatient(hexId),
                PastHistoryService.getPastHistoryByPatient(hexId),
                ROSService.getROSByPatient(hexId)
            ]);

            // 3. Fetch Treatment Progress (using numeric ID)
            try {
                let resolvedTreatmentId: string | number = numericId || userId || '';

                // If we don't have a numeric ID yet, try to resolve it
                if (typeof resolvedTreatmentId === 'string' && resolvedTreatmentId.length > 20) {
                    const assessmentData = await AssessmentService.getQuestions(resolvedTreatmentId);
                    if (assessmentData.profile?.userId) {
                        resolvedTreatmentId = Number(assessmentData.profile.userId);
                    }
                }

                console.log(`[Health] Fetching treatment progress with ID: ${resolvedTreatmentId}`);
                const rawData = await TreatmentService.getPatientProgress(resolvedTreatmentId);
                let data: any = rawData;

                // Handle API response where stages are in a 'data' array (flexible parsing)
                if (data && data.data && Array.isArray(data.data)) {
                    const stageArray = data.data;
                    data = {
                        stages: stageArray,
                        overall_progress: Math.round((stageArray.filter((s: any) => s.status === 'completed').length / (stageArray.length || 1)) * 100),
                        diagnosis: data.diagnosis || 'Therapeutic Framework',
                        patientId: String(resolvedTreatmentId)
                    };
                }

                if (data && !Array.isArray(data) && data.stages) {
                    setTreatmentProgress(data);
                }
            } catch (treatmentError) {
                console.warn('[Health] Treatment progress fetch failed:', treatmentError);
            }

            // Update individual states based on Settlement results
            if (complaintsRes.status === 'fulfilled') {
                const res = complaintsRes.value;
                const complaints = res?.data || res || [];
                if (Array.isArray(complaints) && complaints.length > 0) setLatestComplaint(complaints[0]);
            }

            if (hpiRes.status === 'fulfilled') {
                const res = hpiRes.value;
                const hpis = res?.data || res || [];
                if (Array.isArray(hpis) && hpis.length > 0) setLatestHPI(hpis[0]);
            }

            if (mseRes.status === 'fulfilled') {
                const res = mseRes.value;
                const mses = res?.data || res || [];
                if (Array.isArray(mses) && mses.length > 0) setLatestMSE(mses[0]);
            }

            if (historyRes.status === 'fulfilled') {
                const res = historyRes.value;
                const history = res?.data || res || [];
                if (Array.isArray(history) && history.length > 0) setLatestHistory(history[0]);
            }

            if (rosRes.status === 'fulfilled') {
                const res = rosRes.value;
                const rosRecords = res?.data || res || [];
                if (Array.isArray(rosRecords) && rosRecords.length > 0) setLatestROS(rosRecords[0]);
            }

        } catch (error) {
            console.error('Failed to fetch latest health records:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Hydrating Clinical History...</p>
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

            {/* Three Card Row */}
            <div className="grid md:grid-cols-3 gap-6 w-full">
                {/* Chief Complaint Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => navigate(`/patients/${userId}/chief-complaint`)}
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
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                            {latestComplaint ? latestComplaint.narrative : 'No chief complaint recorded yet.'}
                        </p>
                    </div>
                </motion.div>

                {/* HPI history Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => navigate(`/patients/${userId}/hpi`)}
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

                {/* MSE Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="card-premium p-5 border-slate-100 hover:border-violet-100 transition-all group h-full flex flex-col"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Brain size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Mental Status</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Examination History</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic mb-6">
                            {latestMSE ? `Last assessed on ${new Date(latestMSE.createdAt).toLocaleDateString()}` : 'No mental status exam conducted.'}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            to={`/patients/${userId}/mse/new`}
                            className="py-3 px-4 bg-violet-600 text-white rounded-xl text-[10px] flex items-center justify-center font-black uppercase tracking-widest hover:bg-violet-700 transition-colors shadow-lg shadow-violet-100"
                        >
                            Start New
                        </Link>
                        <Link
                            to={`/patients/${userId}/mse`}
                            className="py-3 px-4 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-[10px] flex items-center justify-center font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                        >
                            View List
                        </Link>
                    </div>
                </motion.div>

                {/* AI History Assistant Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => navigate(`/patients/${userId}/ai-history-assistant?consult_id=${latestHistory?.consult_id || ''}`)}
                    className="card-premium p-5 border-slate-100 hover:border-indigo-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                            <HistoryIcon size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">AI History Assistant</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Historical Intake</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                            {latestHistory ? `Last intake documented on ${new Date(latestHistory.createdAt).toLocaleDateString()}` : 'No comprehensive history intake performed.'}
                        </p>
                    </div>
                </motion.div>

                {/* Review of Systems Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    onClick={() => navigate(`/patients/${userId}/ros`)}
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
                            {latestROS ? `Last review completed on ${new Date(latestROS.createdAt).toLocaleDateString()}` : 'No systematic review of systems performed.'}
                        </p>
                    </div>
                </motion.div>

                {/* Treatment Plan Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => navigate(`/patients/${userId}/treatment`)}
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
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-slate-700 leading-relaxed truncate">
                                    {treatmentProgress.diagnosis}
                                </p>
                                <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <span>Progress</span>
                                    <span className="text-emerald-600">{treatmentProgress.overall_progress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${treatmentProgress.overall_progress}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                                No active treatment protocol identified.
                            </p>
                        )}
                    </div>
                </motion.div>



                {/* NeuroVitals Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={() => navigate(`/neuro-vitals`)}
                    className="card-premium p-5 border-slate-100 bg-slate-900 border-none hover:shadow-2xl hover:shadow-cyan-100/50 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98] relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Activity size={80} className="text-cyan-400" />
                    </div>
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl group-hover:scale-110 transition-transform border border-cyan-500/30">
                            <Brain size={20} />
                        </div>
                        <h2 className="text-sm font-black text-white tracking-tight">NeuroVitals™</h2>
                    </div>
                    <div className="flex-1 relative z-10">
                        <p className="text-[10px] font-black text-cyan-400/60 uppercase tracking-widest mb-2">Deep Phenotyping</p>
                        <p className="text-sm font-semibold text-slate-300 leading-relaxed italic">
                            "Extract medical-grade biomarkers via AI video plethysmography..."
                        </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 relative z-10">
                        <div className="flex items-center justify-between text-[9px] font-black text-white/40 uppercase tracking-widest">
                            <span>Scan Engine v4.0</span>
                            <span className="text-emerald-400">Ready</span>
                        </div>
                    </div>
                </motion.div>

                {/* Clinical Assessments Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="card-premium p-5 border-slate-100 hover:border-indigo-100 transition-all group h-full flex flex-col"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                            <ClipboardList size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Clinical Assessments</h2>
                    </div>
                    <div className="flex-1 mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Evaluation Pool</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                            Assign or conduct standardized clinical evaluations for this patient.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate(`/clinical/assessments?patientId=${userId}`)}
                            className="py-3 px-4 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                        >
                            Start New
                        </button>
                        <button
                            onClick={() => navigate(`/clinical/assessments/history?patientId=${resolvedPatientId || userId}`)}
                            className="py-3 px-4 bg-slate-50 text-slate-600 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            View History
                        </button>
                    </div>
                </motion.div>

                {/* Symptom Snapshot Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    onClick={() => navigate(`/patients/${userId}/symptoms`)}
                    className="card-premium p-5 border-slate-100 hover:border-amber-100 transition-all group h-full flex flex-col cursor-pointer active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Activity size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Symptom Snapshots</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Patient Monitoring</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                            Track mood, anxiety, and physiological vital signs across time.
                        </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50">
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Open Analytics</span>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default Health;