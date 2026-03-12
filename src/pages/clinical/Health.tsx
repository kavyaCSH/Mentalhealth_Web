import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Stethoscope, History as HistoryIcon, FileText, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import { HPIService } from '../../api/services/hpi.service';

const Health = () => {
    const navigate = useNavigate();
    const { userId } = useParams<{ userId: string }>();

    const [latestComplaint, setLatestComplaint] = useState<any>(null);
    const [latestHPI, setLatestHPI] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchLatestRecords();
        }
    }, [userId]);

    const fetchLatestRecords = async () => {
        setIsLoading(true);
        try {
            const [complaintsRes, hpiRes] = await Promise.all([
                ChiefComplaintService.listComplaints({ patientId: userId || '', limit: 1 }),
                HPIService.getHPIList({ patient_id: userId || '' })
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
            {/* Three Card Row */}
            <div className="grid md:grid-cols-3 gap-6 w-full mt-8">
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

                {/* Additional Clinical Card (placeholder) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card-premium p-5 border-slate-100 hover:border-emerald-100 transition-all group h-full flex flex-col"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Clinical Diagnosis</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Current Assessment</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                            Major Depressive Disorder (F32.2) - Moderate severity with somatic symptoms.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Health;