import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TeleConsultService } from '../../api/services/teleconsult.service';
import Button from '../ui/Button';
import {
    Activity,
    History,
    Pill,
    Brain,
    ClipboardList,
    CheckCircle2,
    Calendar
} from 'lucide-react';

interface ConsultTreatmentProps {
    patientId: string | number;
    consultId?: number | string;
    onSave?: () => void;
}

export const ConsultTreatment: React.FC<ConsultTreatmentProps> = ({ patientId, consultId }) => {
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState<any[]>([]);

    // Form State
    const [plan, setPlan] = useState('');
    const [medications, setMedications] = useState('');
    const [nextSteps, setNextSteps] = useState('');

    const recommendations = [
        "Increase SSRI dosage by 5mg",
        "Introduce Mindfulness (5m/day)",
        "Schedule follow-up in 14 days",
        "Refer to support group",
        "Blood work (Thyroid, B12)",
        "CBT-i for insomnia"
    ];

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab, patientId]);

    const fetchHistory = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const res = await TeleConsultService.getTreatmentHistory(patientId);
            setHistory(res?.data || []);
        } catch (error) {
            console.error('[ConsultTreatment] Failed to fetch treatment records', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!plan.trim() && !medications.trim() && !nextSteps.trim()) return;
        setSaving(true);
        try {
            const payload = {
                patient_id: String(patientId),
                consult_id: consultId ? String(consultId) : undefined,
                plan,
                medications,
                next_steps: nextSteps,
            };
            await TeleConsultService.createTreatmentPlan(payload as any);
            setPlan('');
            setMedications('');
            setNextSteps('');
            setActiveTab('history');
            fetchHistory(); // Refresh history after save
        } catch (error) {
            console.error('[ConsultTreatment] Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const addRecommendation = (text: string) => {
        setNextSteps(prev => prev + (prev ? '\n' : '') + '• ' + text);
    };

    return (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95 duration-500 relative">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-main px-1 tracking-tight uppercase">Treatment Plan</h2>
                    <div className="flex items-center gap-2 px-1 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-[0.2em]">Active Care Protocol</p>
                    </div>
                </div>

                <div className="bg-page p-1 rounded-xl border border-border-card flex gap-1">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-indigo-600 text-white shadow-md' : 'text-muted opacity-80 hover:text-muted'}`}
                    >
                        NEW
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-muted opacity-80 hover:text-muted'}`}
                    >
                        HISTORY
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto scrollbar-hide pb-20">
                <AnimatePresence mode="wait">
                    {activeTab === 'new' ? (
                        <motion.div
                            key="new-plan"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-8"
                        >
                            {/* Clinical Impression */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Brain size={12} className="text-indigo-500" />
                                    Clinical Impression
                                </label>
                                <textarea
                                    rows={3}
                                    value={plan}
                                    onChange={e => setPlan(e.target.value)}
                                    placeholder="Enter session summary and diagnostic observations..."
                                    className="w-full bg-page border-2 border-border-card rounded-[2rem] p-6 text-sm font-bold text-main outline-none focus:bg-card focus:border-indigo-500/30 transition-all resize-none italic"
                                />
                            </div>

                            {/* Medications */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <Pill size={12} className="text-rose-500" />
                                    Medication Adjustments
                                </label>
                                <textarea
                                    rows={2}
                                    value={medications}
                                    onChange={e => setMedications(e.target.value)}
                                    placeholder="e.g. Increase Sertraline to 100mg QHS..."
                                    className="w-full bg-page border-2 border-border-card rounded-[2rem] p-6 text-sm font-bold text-main outline-none focus:bg-card focus:border-indigo-500/30 transition-all resize-none"
                                />
                            </div>

                            {/* Recommendations */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <ClipboardList size={12} className="text-emerald-500" />
                                    Recommendations & Next Steps
                                </label>
                                <textarea
                                    rows={4}
                                    value={nextSteps}
                                    onChange={e => setNextSteps(e.target.value)}
                                    placeholder="Enter future interventions or patient instructions..."
                                    className="w-full bg-card border-2 border-border-card rounded-[2rem] p-6 text-sm font-bold text-main outline-none focus:border-indigo-600/30 transition-all resize-none shadow-sm"
                                />
                            </div>

                            {/* Quick Select Chips */}
                            <div className="space-y-4">
                                <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Quick Add Recommendations</p>
                                <div className="flex flex-wrap gap-2">
                                    {recommendations.map((rec, i) => (
                                        <button
                                            key={i}
                                            onClick={() => addRecommendation(rec)}
                                            className="px-4 py-2 bg-page hover:bg-indigo-50 border border-border-card hover:border-indigo-200 text-muted hover:text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all"
                                        >
                                            + {rec}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                className="w-full h-16 rounded-[2rem] shadow-2xl shadow-indigo-100 font-black text-xs uppercase tracking-widest group"
                                onClick={handleSave}
                                isLoading={saving}
                                disabled={!plan.trim() && !medications.trim() && !nextSteps.trim()}
                                leftIcon={<CheckCircle2 size={18} />}
                            >
                                Finalize Treatment Plan
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="history-panel"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-6 pb-12"
                        >
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                    <Activity className="animate-spin text-indigo-600 mb-4" size={32} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Aggregating History...</span>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-20 bg-page border-2 border-dashed border-border-card rounded-[3rem]">
                                    <History size={32} className="text-muted opacity-40 mx-auto mb-4" />
                                    <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">No Historical Plans Found</p>
                                </div>
                            ) : (
                                history.map((record, idx) => (
                                    <div key={record.id || idx} className="card-premium p-8 bg-card border-border-card space-y-6 hover:border-indigo-100 transition-all group">
                                        <div className="flex items-center justify-between border-b border-border-card pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-page rounded-xl flex items-center justify-center text-muted opacity-80 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <Calendar size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-main">
                                                        {new Date(record.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">Treatment Snapshot</p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[8px] font-black uppercase tracking-widest">FINALIZED</span>
                                        </div>

                                        <div className="space-y-4">
                                            {record.plan && (
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Impression</p>
                                                    <p className="text-sm font-bold text-main italic leading-relaxed">"{record.plan}"</p>
                                                </div>
                                            )}
                                            {record.medications && (
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Medications</p>
                                                    <p className="text-sm font-bold text-main leading-relaxed capitalize">{record.medications}</p>
                                                </div>
                                            )}
                                            {record.next_steps && (
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Next Steps</p>
                                                    <p className="text-sm font-bold text-main leading-relaxed whitespace-pre-wrap">{record.next_steps}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
