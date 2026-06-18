import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Calendar, Target, ShieldAlert, FileText, ChevronRight } from 'lucide-react';
import { DiagnosisService } from '../../api/services/diagnosis.service';
import type { AIDiagnosisData } from '../../types/diagnosis.types';

interface AIDiagnosisHistoryProps {
    patientId: number;
}

const AIDiagnosisHistory = ({ patientId }: AIDiagnosisHistoryProps) => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const data = await DiagnosisService.getAIDiagnosisHistory(patientId);
                
                if (data?.code === 404 || data?.message === 'Patient not found') {
                    setHistory([]);
                    return;
                }

                // Assume data is an array or wrapped in data.data
                const records = Array.isArray(data) ? data : (data?.data || []);
                setHistory(records);
            } catch (err: any) {
                console.error('[AIDiagnosisHistory] Fetch error:', err);
                const resData = err?.response?.data;
                if (err?.response?.status === 404 || resData?.code === 404 || resData?.message === 'Patient not found') {
                    setHistory([]);
                    setError(null);
                } else {
                    setError(resData?.message || 'Failed to load diagnosis history.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (patientId) {
            fetchHistory();
        }
    }, [patientId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-16 space-y-4">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
                <p className="text-sm font-bold text-slate-500">Loading history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                <ShieldAlert className="text-red-500" size={24} />
                <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-lg font-black text-slate-700 mb-1">No past diagnoses</h3>
                <p className="text-sm font-medium text-slate-500">
                    This patient doesn't have any AI diagnosis records yet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {history.map((record, idx) => {
                const diagnosisData: AIDiagnosisData = record.data || record;
                const primaryCondition = diagnosisData?.diagnosis?.primary?.condition || diagnosisData?.primaryDiagnosis;
                const severity = diagnosisData?.diagnosis?.severity || diagnosisData?.severity;
                const date = record.created_at || diagnosisData.generated_at;

                return (
                    <motion.div
                        key={record.id || idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => navigate(`/patients/${patientId}/ai-diagnosis/result`, { state: { result: diagnosisData } })}
                        className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-lg transition-all group cursor-pointer flex flex-col md:flex-row md:items-center gap-6"
                    >
                        {/* Date column */}
                        <div className="flex items-center gap-3 md:w-48 shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Date</p>
                                <p className="text-sm font-bold text-slate-700">
                                    {date ? new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown Date'}
                                </p>
                            </div>
                        </div>

                        {/* Condition column */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Target size={14} className="text-indigo-500 shrink-0" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Primary Diagnosis</p>
                            </div>
                            {primaryCondition ? (
                                <h4 className="text-base font-black text-slate-900 truncate">{primaryCondition}</h4>
                            ) : (
                                <p className="text-sm font-medium text-slate-500 italic">No primary diagnosis recorded</p>
                            )}
                        </div>

                        {/* Severity column */}
                        <div className="md:w-32 shrink-0">
                            {severity ? (
                                <span className="px-3 py-1 bg-rose-50 text-rose-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100">
                                    {severity}
                                </span>
                            ) : null}
                        </div>

                        {/* Action column */}
                        <div className="shrink-0 flex items-center justify-end">
                            <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default AIDiagnosisHistory;
