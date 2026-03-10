import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { Stethoscope, History as HistoryIcon, FileText } from 'lucide-react';

const Health = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-[50vh] flex flex-col items-center justify-center animate-fade-in pb-16">
            {/* Header Section */}
            <div className="text-center mb-10">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Health overview</h1>
                <div className="w-12 h-1.5 bg-indigo-600 mx-auto rounded-full opacity-20" />
            </div>

            {/* Three Card Row */}
            <div className="grid md:grid-cols-3 gap-6 w-full">
                {/* Chief Complaint Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => navigate(`/patients/${id}/chief-complaint`)}
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
                            Persistent Anxiety: Significant withdrawal and sleep disturbances over 3 weeks.
                        </p>
                    </div>
                </motion.div>

                {/* Medical History Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card-premium p-5 border-slate-100 hover:border-indigo-100 transition-all group h-full flex flex-col"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                            <HistoryIcon size={20} />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 tracking-tight">Medical History</h2>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Clinical Narrative</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed italic">
                            "Symptoms began following workplace transition. No prior clinical intervention reported."
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