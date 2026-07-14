import React, { useState, useEffect } from 'react';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import { Activity, FileText } from 'lucide-react';

interface ConsultPatientRecordProps {
    patientId: string | number;
}

export const ConsultPatientRecord: React.FC<ConsultPatientRecordProps> = ({ patientId }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [patientId]);

    const fetchHistory = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const res = await ChiefComplaintService.listComplaints({ patient_id: patientId, limit: 10 });
            setHistory(res.data || []);
        } catch (error) {
            console.error('Failed to fetch patient history:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-lg font-black text-white px-1">Clinical Record</h2>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1 px-1">Patient History Archive</p>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Activity className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : history.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl">
                        <FileText size={32} className="mx-auto text-main mb-4" />
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">No matching records</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((entry, idx) => (
                            <div key={idx} className="bg-card p-4 rounded-xl border-2 border-border-card hover:border-indigo-500 shadow-sm transition-all group">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-page px-2.5 py-1 rounded-lg border border-border-card">
                                        Chief Complaint
                                    </span>
                                    <span className="text-[9px] text-muted opacity-80 font-bold uppercase tracking-widest tabular-nums">
                                        {new Date(entry.createdAt || entry.date || new Date()).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-[11px] text-main font-bold leading-relaxed px-1">
                                    "{entry.narrative || 'Clinical documentation entry'}"
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
