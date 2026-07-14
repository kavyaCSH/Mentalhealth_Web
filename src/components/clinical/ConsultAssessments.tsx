import React, { useState, useEffect } from 'react';
import { AssessmentService } from '../../api/services/assessment.service';
import { Brain, FileText, Activity, History as HistoryIcon } from 'lucide-react';
import type { AssessmentMaster } from '../../types/assessment.types';

interface ConsultAssessmentsProps {
    patientId: string | number;
    onSelectAssessment: (item: AssessmentMaster) => void;
}

export const ConsultAssessments: React.FC<ConsultAssessmentsProps> = ({ patientId, onSelectAssessment }) => {
    const [topics, setTopics] = useState<Record<string, any[]>>({});
    const [history, setHistory] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'new') {
            fetchAssessments();
        } else {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchAssessments = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const res = await AssessmentService.getProfessionalQuestions(patientId);
            if (res.code === 200 || res.success) {
                setTopics(res.data?.topics || {});
            }
        } catch (error) {
            console.error('Failed to fetch assessments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const res = await AssessmentService.getPatientProfessionalHistory(patientId);
            setHistory(Array.isArray(res) ? res : []);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-8">
                <div className="flex bg-page p-1.5 rounded-2xl border border-border-card shadow-sm">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'new' ? 'bg-card text-indigo-600 shadow-lg shadow-slate-200/50' : 'text-muted opacity-80 hover:text-muted'
                        }`}
                    >
                        New MSE
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === 'history' ? 'bg-card text-indigo-600 shadow-lg shadow-slate-200/50' : 'text-muted opacity-80 hover:text-muted'
                        }`}
                    >
                        Archives
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Activity className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : activeTab === 'new' ? (
                    <div className="space-y-3">
                        {Object.keys(topics).length === 0 ? (
                            <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-2xl bg-slate-950/30">
                                <Brain className="mx-auto text-main mb-4" size={32} />
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">No Tools Available</p>
                            </div>
                        ) : (
                            Object.keys(topics).map(topic => (
                                <button
                                     key={topic}
                                     onClick={() => onSelectAssessment({ 
                                         id: topic, slug: topic, title: topic.replace(/_/g, ' ').toUpperCase(), questions: topics[topic] 
                                     } as any)}
                                     className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border-2 border-border-card hover:border-indigo-600 hover:shadow-xl transition-all text-left group"
                                 >
                                     <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 bg-page rounded-xl flex items-center justify-center border border-border-card group-hover:bg-indigo-50 transition-colors">
                                             <FileText className="text-muted opacity-80 group-hover:text-indigo-600" size={18} />
                                         </div>
                                         <div>
                                             <h3 className="text-[11px] font-black text-main uppercase tracking-tight">{topic.replace(/_/g, ' ').toUpperCase()}</h3>
                                             <p className="text-[9px] text-muted opacity-80 font-bold uppercase tracking-widest mt-0.5">
                                                 {topics[topic].length} Clinical Items
                                             </p>
                                         </div>
                                     </div>
                                     <div className="w-8 h-8 rounded-lg bg-page flex items-center justify-center text-muted opacity-40 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                         →
                                     </div>
                                 </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl">
                                <HistoryIcon size={32} className="mx-auto text-main mb-4" />
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">No past evaluations found.</p>
                            </div>
                        ) : (
                            history.map((record, i) => (
                                <div key={record.id || i} className="bg-card p-6 rounded-2xl border border-border-card shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest bg-page px-2.5 py-1 rounded-lg border border-border-card">
                                            {new Date(record.createdAt || record.date).toLocaleDateString()}
                                        </span>
                                        <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-indigo-100">
                                            {String(record.category || record.slug || 'N/A').replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    {record.notes && (
                                        <p className="text-[10px] text-muted font-bold italic bg-page p-4 rounded-xl border border-border-card leading-relaxed">
                                            "{record.notes}"
                                        </p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
