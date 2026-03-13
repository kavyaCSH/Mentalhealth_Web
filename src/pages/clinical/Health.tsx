import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Stethoscope, History as HistoryIcon, Activity, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import { HPIService } from '../../api/services/hpi.service';
import { MSEService } from '../../api/services/mse.service';
import { PastHistoryService } from '../../api/services/pastHistory.service';
import { ROSService } from '../../api/services/ros.service';

const Health = () => {
    const navigate = useNavigate();
    const { userId } = useParams<{ userId: string }>();

    const [latestComplaint, setLatestComplaint] = useState<any>(null);
    const [latestHPI, setLatestHPI] = useState<any>(null);
    const [latestMSE, setLatestMSE] = useState<any>(null);
    const [latestHistory, setLatestHistory] = useState<any>(null);
    const [latestROS, setLatestROS] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchLatestRecords();
        }
    }, [userId]);

    const fetchLatestRecords = async () => {
        setIsLoading(true);
        try {
            const [complaintsRes, hpiRes, mseRes, historyRes, rosRes] = await Promise.all([
                ChiefComplaintService.listComplaints({ patientId: userId || '', limit: 1 }),
                HPIService.getHPIList({ patient_id: userId || '' }),
                MSEService.listMSEByPatient(userId || ''),
                PastHistoryService.getPastHistoryByPatient(userId || ''),
                ROSService.getROSByPatient(userId || '')
            ]);

            const complaints = complaintsRes?.data || complaintsRes || [];
            if (Array.isArray(complaints) && complaints.length > 0) {
                setLatestComplaint(complaints[0]);
            }

            const hpis = hpiRes?.data || hpiRes || [];
            if (Array.isArray(hpis) && hpis.length > 0) {
                // Assuming the first one is the latest or we need to sort
                setLatestHPI(hpis[0]);
            }

            const mses = mseRes?.data || mseRes || [];
            if (Array.isArray(mses) && mses.length > 0) {
                setLatestMSE(mses[0]);
            }

            const history = historyRes?.data || historyRes || [];
            if (Array.isArray(history) && history.length > 0) {
                setLatestHistory(history[0]);
            }

            const rosRecords = rosRes?.data || rosRes || [];
            if (Array.isArray(rosRecords) && rosRecords.length > 0) {
                setLatestROS(rosRecords[0]);
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
                    onClick={() => navigate(`/patients/${userId}/mse`)}
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
                    transition={{ delay: 0.3 }}
                    onClick={() => navigate(`/patients/${userId}/past-history`)}
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

            </div>
        </div>
    );
};

export default Health;