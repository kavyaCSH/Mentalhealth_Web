import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Activity,
    ChevronLeft,
    Search,
    Calendar,
    Stethoscope,
    History as HistoryIcon,
    Brain,
    ClipboardList,
    ChevronRight,
    Plus,
    FileText,
    Download
} from 'lucide-react';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import { HPIService } from '../../api/services/hpi.service';
import { MSEService } from '../../api/services/mse.service';
import { ROSService } from '../../api/services/ros.service';
import { PastHistoryService } from '../../api/services/pastHistory.service';
import { UserService } from '../../api/services/user.service';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import Button from '../../components/ui/Button';

interface ClinicalRecord {
    id: string;
    type: 'complaint' | 'hpi' | 'mse' | 'ros' | 'past-history';
    date: string;
    narrative: string;
    status: string;
    author: string;
}

const ClinicalRecordsHub = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);

    const [records, setRecords] = useState<ClinicalRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'complaint' | 'hpi' | 'mse' | 'ros' | 'past-history'>('all');
    const [patientName, setPatientName] = useState('Patient');

    const fetchAllRecords = useCallback(async () => {
        const idToUse = patientId || currentUser?.id || (currentUser as any)?._id;
        if (!idToUse) return;
        setIsLoading(true);
        try {
            // Resolve patient name first
            let profile;
            const isPatient = (currentUser as any)?.role === 'patient' || (currentUser as any)?.group === 'PATIENT';
            
            if (isPatient && idToUse === (currentUser?.id || (currentUser as any)?._id)) {
                profile = currentUser;
            } else {
                try {
                    profile = await UserService.getUserById(idToUse);
                } catch (e) {
                    console.warn('[ClinicalRecordsHub] Could not fetch profile, using current user');
                    profile = currentUser;
                }
            }
            
            if (profile) {
                setPatientName(`${profile.firstName || ''} ${profile.lastName || ''}`);
            } else {
                setPatientName('Patient');
            }

            // Fetch all clinical data streams
            const [complaintsRes, hpiRes, mseRes, rosRes, historyRes] = await Promise.all([
                ChiefComplaintService.listComplaints({ patientId: idToUse, limit: 100 }),
                HPIService.getHPIList({ patient_id: idToUse }),
                MSEService.listMSEByPatient(idToUse),
                ROSService.getROSByPatient(idToUse),
                PastHistoryService.getPastHistoryByPatient(idToUse)
            ]);

            const normalized: ClinicalRecord[] = [];

            // Normalize Complaints
            const complaints = complaintsRes?.data || complaintsRes || [];
            if (Array.isArray(complaints)) {
                complaints.forEach((c: any) => normalized.push({
                    id: c._id || c.id,
                    type: 'complaint',
                    date: c.createdAt || c.date,
                    narrative: c.narrative || 'Primary Symptom Intake',
                    status: 'Finalized',
                    author: 'Clinical Intake'
                }));
            }

            // Normalize HPI
            const hpis = hpiRes?.data || hpiRes || [];
            if (Array.isArray(hpis)) {
                hpis.forEach((h: any) => normalized.push({
                    id: h._id || h.id,
                    type: 'hpi',
                    date: h.createdAt || h.date,
                    narrative: h.narrative || h.content || 'History of Present Illness',
                    status: 'Clinical Record',
                    author: h.recorded_by || 'Specialist'
                }));
            }

            // Normalize MSE
            const mses = mseRes?.data || mseRes || [];
            if (Array.isArray(mses)) {
                mses.forEach((m: any) => normalized.push({
                    id: m._id || m.id,
                    type: 'mse',
                    date: m.createdAt || m.date,
                    narrative: 'Mental Status Examination Completed',
                    status: 'Evaluated',
                    author: 'Clinical Provider'
                }));
            }

            // Normalize ROS
            const ross = rosRes?.data || rosRes || [];
            if (Array.isArray(ross)) {
                ross.forEach((r: any) => normalized.push({
                    id: r._id || r.id,
                    type: 'ros',
                    date: r.createdAt || r.date,
                    narrative: r.ai_notes || 'Systematic Review of Systems',
                    status: 'Documented',
                    author: 'System Intake'
                }));
            }
            // Normalize Past History
            const history = historyRes?.data || historyRes || [];
            if (Array.isArray(history)) {
                history.forEach((h: any) => normalized.push({
                    id: h._id || h.id,
                    type: 'past-history',
                    date: h.createdAt || h.date,
                    narrative: h.ai_notes || 'Comprehensive Clinical History',
                    status: 'Compiled',
                    author: 'Clinical Intake'
                }));
            }

            // Sort by date descending
            normalized.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecords(normalized);
        } catch (error) {
            console.error('Failed to aggregate clinical records:', error);
        } finally {
            setIsLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchAllRecords();
    }, [fetchAllRecords]);

    const getRecordIcon = (type: string) => {
        switch (type) {
            case 'complaint': return <Stethoscope className="text-rose-600" size={20} />;
            case 'hpi': return <HistoryIcon className="text-indigo-600" size={20} />;
            case 'mse': return <Brain className="text-violet-600" size={20} />;
            case 'ros': return <Activity className="text-emerald-600" size={20} />;
            case 'past-history': return <HistoryIcon className="text-blue-600" size={20} />;
            default: return <FileText size={20} />;
        }
    };

    const getRecordColor = (type: string) => {
        switch (type) {
            case 'complaint': return 'bg-rose-50 border-rose-100';
            case 'hpi': return 'bg-indigo-50 border-indigo-100';
            case 'mse': return 'bg-violet-50 border-violet-100';
            case 'ros': return 'bg-emerald-50 border-emerald-100';
            case 'past-history': return 'bg-blue-50 border-blue-100';
            default: return 'bg-slate-50 border-slate-100';
        }
    };

    const filteredRecords = records.filter(r => {
        const matchesSearch = r.narrative.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             r.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'all' || r.type === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const handleRecordClick = (record: ClinicalRecord) => {
        const pid = patientId || currentUser?.id || (currentUser as any)?._id;
        const paths: Record<string, string> = {
            complaint: `/patients/${pid}/chief-complaint/${record.id}`,
            hpi: `/patients/${pid}/hpi/${record.id}`,
            mse: `/patients/${pid}/mse/${record.id}`,
            ros: `/patients/${pid}/ros/${record.id}`,
            'past-history': `/patients/${pid}/past-history/${record.id}`
        };
        navigate(paths[record.type]);
    };

    return (
        <div className="p-8 max-w-7xl animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                    >
                        <ChevronLeft size={14} /> Back
                    </button>
                    <div>
                        <div className="flex items-center gap-3 text-indigo-600 mb-1">
                            <ClipboardList size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{patientId ? 'Clinical Records Vault' : 'Your Health History'}</span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            {patientId ? `${patientName}'s History` : 'My Clinical Journey'}
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Consolidated timeline of all clinical findings and intake narratives.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" leftIcon={<Download size={18} />}>Export Timeline</Button>
                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => navigate(`/patients/${patientId || currentUser?.id || (currentUser as any)?._id}/health`)}>New Intake</Button>
                </div>
            </header>

            {/* Controls */}
            <div className="grid md:grid-cols-12 gap-6 mb-8">
                <div className="md:col-span-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search longitudinal findings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>
                <div className="md:col-span-4 flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    {(['all', 'complaint', 'hpi', 'mse', 'ros', 'past-history'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {f === 'complaint' ? 'CC' : f === 'past-history' ? 'History' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline List */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center opacity-40">
                        <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating History...</p>
                    </div>
                ) : filteredRecords.length > 0 ? (
                    <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-100 hidden md:block" />
                        <div className="space-y-8">
                            {filteredRecords.map((record, idx) => (
                                <motion.div
                                    key={record.id || idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleRecordClick(record)}
                                    className="relative flex flex-col md:flex-row items-start gap-8 group cursor-pointer"
                                >
                                    {/* Date Column (MD+) */}
                                    <div className="hidden md:flex flex-col items-end w-24 shrink-0 pt-4">
                                        <p className="text-xs font-black text-slate-900 uppercase">
                                            {new Date(record.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                        </p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                            {new Date(record.date).getFullYear()}
                                        </p>
                                    </div>

                                    {/* Icon & Connection (MD+) */}
                                    <div className="hidden md:flex relative z-10 w-16 h-16 rounded-[1.25rem] items-center justify-center bg-white border-4 border-slate-50 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                        {getRecordIcon(record.type)}
                                    </div>

                                    {/* Content Card */}
                                    <div className={`flex-1 p-6 rounded-[2.5rem] border ${getRecordColor(record.type)} shadow-sm group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-white rounded-lg border border-slate-100 shadow-sm">
                                                    {record.type === 'complaint' ? 'Chief Complaint' : record.type.toUpperCase()}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                    {record.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400">
                                                <Calendar size={12} />
                                                {new Date(record.date).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <p className="text-sm font-bold text-slate-700 leading-relaxed mb-6 line-clamp-2 italic">
                                            "{record.narrative}"
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 border border-white" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{record.author}</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <FileText className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Records Found</h3>
                        <p className="text-slate-500 font-medium text-sm">No clinical history records were found matching your filters.</p>
                        <Button variant="outline" className="mt-8 px-8" onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>Clear Filters</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicalRecordsHub;
