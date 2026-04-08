import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    History, 
    ChevronLeft, 
    ChevronRight,
    MessageSquare,
    Brain,
    Activity,
    ClipboardList,
    HeartPulse,
    Sparkles,
    CheckCircle2,
    Calendar,
    Stethoscope
} from 'lucide-react';

import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import { HPIService } from '../../api/services/hpi.service';
import { MSEService } from '../../api/services/mse.service';
import { ROSService } from '../../api/services/ros.service';
import { AssessmentService } from '../../api/services/assessment.service';
import { PastHistoryService } from '../../api/services/pastHistory.service';

import type { RootState } from '../../store';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface ClinicalTimelineItem {
    id: string;
    type: 'complaint' | 'hpi' | 'mse' | 'ros' | 'self-assessment' | 'prof-assessment' | 'past-history';
    date: string;
    title: string;
    description: string;
    status: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    path: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * PastHistory (Enlarged Labeling Hub)
 * Standardizing on slightly larger typography for tabs and card captions as requested.
 */
const PastHistory: React.FC = () => {
    const navigate = useNavigate();
    const { patientId: urlPatientId } = useParams<{ patientId: string }>();
    const { user } = useSelector((state: RootState) => state.auth);
    
    const patientRecordId = urlPatientId || user?._id || user?.id || user?.userId;
    const numericId = urlPatientId || user?.userId || user?.id || user?._id;
    
    const isClinicalView = !!urlPatientId;

    const [loading, setLoading] = useState(true);
    const [timeline, setTimeline] = useState<ClinicalTimelineItem[]>([]);
    const [filter, setFilter] = useState<string>('all');

    const extractArray = (res: any): any[] => {
        if (res.status !== 'fulfilled') return [];
        const val = res.value;
        if (Array.isArray(val)) return val;
        if (val?.data && Array.isArray(val.data)) return val.data;
        if (val?.data?.data && Array.isArray(val.data.data)) return val.data.data;
        if (val?.history && Array.isArray(val.history)) return val.history;
        if (val?.assessments && Array.isArray(val.assessments)) return val.assessments;
        return [];
    };

    const fetchTimeline = useCallback(async () => {
        if (!patientRecordId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                ChiefComplaintService.listComplaints({ patientId: patientRecordId }),
                MSEService.listMSEByPatient(patientRecordId),
                HPIService.getHPIList({ patient_id: String(patientRecordId) }),
                ROSService.getROSByPatient(patientRecordId),
                AssessmentService.getSelfAssessmentHistory({ patientId: patientRecordId }),
                patientRecordId ? AssessmentService.getPatientProfessionalHistory(patientRecordId) : Promise.resolve([]),
                numericId ? PastHistoryService.getPatientHistory(numericId) : Promise.resolve([])
            ]);

            const [ccRes, mseRes, hpiRes, rosRes, selfRes, profRes, pastRes] = results;
            const normalized: ClinicalTimelineItem[] = [];

            const toSentence = (s: string) => {
                if (!s) return '';
                return s.charAt(0).toUpperCase() + s.slice(1);
            };
            const ICON_SIZE = 22;

            extractArray(ccRes).forEach((item: any) => {
                normalized.push({
                    id: String(item._id || item.id || Math.random()),
                    type: 'complaint',
                    date: item.createdAt || item.date || new Date().toISOString(),
                    title: toSentence('Symptoms Log'),
                    description: item.narrative || 'Clinical symptom entry.',
                    status: 'Clinical',
                    icon: <MessageSquare size={ICON_SIZE} />,
                    color: 'text-indigo-600',
                    bg: 'bg-indigo-50',
                    path: isClinicalView ? `/patients/${patientRecordId}/chief-complaint` : '/records/chief-complaint'
                });
            });

            extractArray(hpiRes).forEach((item: any) => {
                normalized.push({
                    id: String(item._id || item.id || Math.random()),
                    type: 'hpi',
                    date: item.createdAt || item.date || new Date().toISOString(),
                    title: toSentence('Illness History'),
                    description: item.narrative || 'Detailed clinical narrative.',
                    status: 'Clinical',
                    icon: <Activity size={ICON_SIZE} />,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                    path: isClinicalView ? `/patients/${patientRecordId}/hpi` : '#'
                });
            });

            extractArray(mseRes).forEach((item: any) => {
                normalized.push({
                    id: String(item._id || item.id || Math.random()),
                    type: 'mse',
                    date: item.createdAt || item.date || new Date().toISOString(),
                    title: toSentence('Mental Status'),
                    description: item.ai_notes || 'Behavioural diagnostics.',
                    status: 'Clinical',
                    icon: <Brain size={ICON_SIZE} />,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                    path: isClinicalView ? `/patients/${patientRecordId}/mse` : '#'
                });
            });

            extractArray(rosRes).forEach((item: any) => {
                normalized.push({
                    id: String(item._id || item.id || Math.random()),
                    type: 'ros',
                    date: item.createdAt || item.date || new Date().toISOString(),
                    title: toSentence('Systemic Review'),
                    description: 'Physical health reviewed.',
                    status: 'Clinical',
                    icon: <HeartPulse size={ICON_SIZE} />,
                    color: 'text-rose-600',
                    bg: 'bg-rose-50',
                    path: isClinicalView ? `/patients/${patientRecordId}/ros` : '#'
                });
            });

            extractArray(profRes).forEach((item: any) => {
                normalized.push({
                    id: String(item._id || item.id || Math.random()),
                    type: 'prof-assessment',
                    date: item.createdAt || item.date || new Date().toISOString(),
                    title: toSentence(item.assessmentName || item.category || 'Clinical Assessment'),
                    description: `Interpretation: ${item.interpretation || 'Analyzed'}`,
                    status: 'Clinical',
                    icon: <Stethoscope size={ICON_SIZE} />,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                    path: '#'
                });
            });

            extractArray(selfRes).forEach((item: any) => {
                normalized.push({
                    id: String(item._id || item.id || item.assessmentId || Math.random()),
                    type: 'self-assessment',
                    date: item.createdAt || item.date || new Date().toISOString(),
                    title: toSentence(item.assessmentName || item.category || 'Self Check'),
                    description: `Personal wellness result: ${item.totalScore || 'Log'}`,
                    status: 'Self Check',
                    icon: <ClipboardList size={ICON_SIZE} />,
                    color: 'text-violet-600',
                    bg: 'bg-violet-50',
                    path: `/history`
                });
            });

            extractArray(pastRes).forEach((item: any) => {
                normalized.push({
                    id: String(item._id || item.id || Math.random()),
                    type: 'past-history',
                    date: item.createdAt || item.date || new Date().toISOString(),
                    title: toSentence('Health Synthesis'),
                    description: item.ai_notes || 'Longitudinal record compilation.',
                    status: 'Clinical',
                    icon: <Sparkles size={ICON_SIZE} />,
                    color: 'text-indigo-700',
                    bg: 'bg-slate-50',
                    path: isClinicalView ? `/patients/${patientRecordId}/past-history/${item._id || item.id}` : `/history/past/${item._id || item.id}`
                });
            });

            normalized.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setTimeline(normalized);
        } catch (error: any) {
            console.error('History HUB sync error:', error);
        } finally {
            setLoading(false);
        }
    }, [patientRecordId, isClinicalView]);

    useEffect(() => {
        fetchTimeline();
    }, [fetchTimeline]);

    const filteredTimeline = timeline.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'clinical') return ['complaint', 'hpi', 'mse', 'ros', 'prof-assessment', 'past-history'].includes(item.type);
        if (filter === 'self') return item.type === 'self-assessment';
        return item.type === filter;
    });

    return (
        <div className="p-5 max-w-4xl mx-auto space-y-6 animate-fade-in pb-32">
            <header className="flex flex-col gap-6">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back to dashboard
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <History size={24} />
                                <span className="text-[12px] font-black uppercase tracking-[0.2em]">Health repository</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Record history</h1>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide py-1">
                    {[
                        { id: 'all', label: 'All activities' },
                        { id: 'clinical', label: 'Clinical records' },
                        { id: 'self', label: 'Self checks' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setFilter(t.id)}
                            className={`px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap shadow-sm border ${
                                filter === t.id 
                                    ? 'bg-indigo-600 text-white border-transparent' 
                                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </header>

            {loading ? (
                <div className="py-24 text-center space-y-4">
                    <History className="animate-spin text-indigo-400 mx-auto" size={40} />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Opening health vault...</p>
                </div>
            ) : (
                <div className="space-y-5 relative">
                    <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-slate-100/50 z-0 hidden md:block" />
                    
                    <AnimatePresence mode="popLayout" initial={false}>
                        {filteredTimeline.map((item, idx) => (
                            <motion.div
                                key={`${item.id}-${idx}`}
                                layout
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.03 }}
                                onClick={() => item.path !== '#' && navigate(item.path)}
                                className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer group relative z-10"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-6 items-center">
                                        <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner shrink-0`}>
                                            {item.icon}
                                        </div>
                                        <div className="space-y-2 pt-1">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                                                    <Calendar size={12} className="text-indigo-400" />
                                                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                    item.status.includes('Self')
                                                        ? 'bg-violet-50 text-violet-600 border-violet-50' 
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-50'
                                                }`}>
                                                    <CheckCircle2 size={12} />
                                                    {item.status}
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-none">
                                                {item.title}
                                            </h3>
                                            <p className="text-slate-400 font-bold text-sm leading-relaxed italic max-w-xl truncate">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner">
                                            <ChevronRight size={28} />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default PastHistory;
