import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User as UserIcon,
    Phone,
    Mail,
    Calendar,
    Activity,
    FileText,
    ChevronLeft,
    ClipboardList,
    Plus,
    Video,
    Send,
    HeartPulse,
    PieChart,
    Info,
    Mic,
    TrendingUp
} from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { getStatusColor, type StatusType } from '../../utils/statusMapping';
import { UserService } from '../../api/services/user.service';
import { AssessmentService } from '../../api/services/assessment.service';
import { DashboardService } from '../../api/services/dashboard.service';
import type { AssessmentResult } from '../../types/assessment.types';
import type { Patient, ClinicalNote } from '../../types/user.types';
import type { PatientStats } from '../../types/stats.types';
import MindBalanceHelpModal from '../../components/clinical/MindBalanceHelpModal';

const PatientRecord = () => {
    const { patientId: id } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isFocused = searchParams.get('view') === 'focused';

    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<AssessmentResult[]>([]);
    const [stats, setStats] = useState<PatientStats | null>(null);
    const [notes, setNotes] = useState<ClinicalNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newNote, setNewNote] = useState('');
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);

    // Help Modal State (Clinical Parity: about_mindbalance)
    const [helpSlug, setHelpSlug] = useState<string | null>(null);

    const openHelp = (slug: string) => setHelpSlug(slug);
    const closeHelp = () => setHelpSlug(null);

    useEffect(() => {
        const fetchPatientData = async () => {
            setIsLoading(true);
            try {
                const resolutionRitual = async (targetId: string): Promise<{ p: Patient | null; h: AssessmentResult[]; s: PatientStats | null }> => {
                    try {
                        const [pRes, hRes, sRes] = await Promise.allSettled([
                            UserService.getUserById(targetId),
                            AssessmentService.getPatientProfessionalHistory(targetId),
                            DashboardService.getPatientStatistics(targetId)
                        ]);
                        
                        let resolvedP = pRes.status === 'fulfilled' ? pRes.value as Patient : null;
                        const resolvedH = hRes.status === 'fulfilled' ? hRes.value : [];
                        const resolvedS = sRes.status === 'fulfilled' ? (sRes.value.data || sRes.value) : null;

                        if (!resolvedP) {
                            const { users } = await UserService.listUsers({ role: 'patient', search: targetId });
                            const match = users.find(u => String(u._id) === targetId || String(u.id) === targetId || String(u.userId) === targetId);
                            if (match) resolvedP = match as Patient;
                        }

                        if (!resolvedP) {
                            const aData = await AssessmentService.getProfessionalQuestions(targetId).catch(() => null);
                            if (aData?.data?.patient?.userId) {
                                const linkedId = String(aData.data.patient.userId);
                                const retry = await UserService.getUserById(linkedId).catch(() => null);
                                if (retry) {
                                    resolvedP = retry as Patient;
                                    resolvedP._id = targetId;
                                }
                            }
                        }

                        return { p: resolvedP, h: resolvedH, s: resolvedS };
                    } catch (err) {
                        return { p: null, h: [], s: null };
                    }
                };

                const { p, h, s } = await resolutionRitual(id || '');
                if (p) {
                    setPatient(p);
                    setHistory(h);
                    setStats(s);
                }
            } catch (error) {
                console.error('[PatientRecord] Critical failure:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchPatientData();
    }, [id]);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsSubmittingNote(true);
        try {
            const noteObj: ClinicalNote = {
                id: Date.now().toString(),
                content: newNote,
                createdAt: new Date().toISOString(),
                author: 'Clinical Provider'
            };
            setNotes(prev => [noteObj, ...prev]);
            setNewNote('');
        } catch (error) {
            console.error('Failed to add note:', error);
        } finally {
            setIsSubmittingNote(false);
        }
    };

    const handleRequestAssessment = () => {
        if (!patient) return;
        navigate(`/clinical/assessments?patientId=${patient.userId || id}&patientName=${patient.firstName} ${patient.lastName || ''}`);
    };

    const getRiskColor = (risk: string) => {
        switch (risk?.toLowerCase()) {
            case 'high': return 'text-red-600 bg-red-50 border-red-100';
            case 'medium': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Patient Record...</p>
            </div>
        );
    }

    if (!patient) return <div className="p-8 text-center text-slate-500">Patient not found</div>;

    return (
        <div className="p-8 max-w-7xl  space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-6">
                    <button onClick={() => navigate('/patients')} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors mt-2">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                {patient.firstName} {patient.lastName}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskColor(patient.riskLevel || 'Low')}`}>
                                {patient.riskLevel || 'Low'} Risk
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            ID: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{patient.id}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {!isFocused && (
                        <>
                            <Button variant="outline" leftIcon={<Activity size={18} />} onClick={() => navigate(`/patients/${patient.userId || id}/statistics`)}>Mind Health</Button>
                            <Button variant="outline" leftIcon={<HeartPulse size={18} />} onClick={() => navigate(`/patients/${patient.userId || id}/health`)}>Health</Button>
                            <Button variant="outline" leftIcon={<ClipboardList size={18} />} onClick={() => navigate(`/patients/${patient.userId || id}/clinical-hub`)}>Clinical Hub</Button>
                            <Button variant="outline" leftIcon={<TrendingUp size={18} />} onClick={() => navigate(`/patients/${patient.userId || id}/treatment`)}>Treatment Journey</Button>
                            <Button variant="outline" leftIcon={<Video size={18} />} onClick={() => navigate(`/clinical-schedule?patientId=${patient.userId || id}`)}>Teleconsult</Button>
                            <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleRequestAssessment}>Request Assessment</Button>
                        </>
                    )}
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Col: Demographics & Quick Actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Emergency Contact (Crisis Aware - Mobile Parity) */}
                    <div className={`card-premium p-6 border-2 transition-all ${patient.riskLevel === 'high'
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-slate-100 bg-white'
                        }`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-2.5 rounded-xl ${patient.riskLevel === 'high' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                                }`}>
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className={`text-[10px] font-black uppercase tracking-widest ${patient.riskLevel === 'high' ? 'text-rose-600' : 'text-slate-400'
                                    }`}>
                                    {patient.riskLevel === 'high' ? 'Critical Crisis Contact' : 'Emergency Contact'}
                                </p>
                                <h4 className="text-sm font-black text-slate-900">
                                    {patient.emergencyContact || 'Not Specified'}
                                </h4>
                            </div>
                        </div>
                        {patient.emergencyContact && (
                            <a
                                href={`tel:${patient.emergencyContact}`}
                                className={`w-full py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${patient.riskLevel === 'high'
                                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200'
                                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                    }`}
                            >
                                <Phone size={12} /> Call Emergency
                            </a>
                        )}
                    </div>

                    <div className="card-premium p-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Patient Demographics</h3>

                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <Phone size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                    <p className="text-sm font-bold text-slate-900">{patient.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <Mail size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{patient.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <Calendar size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</p>
                                    <p className="text-sm font-bold text-slate-900">{patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <UserIcon size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                                    <p className="text-sm font-bold text-slate-900">{patient.gender || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isFocused && (
                        <div className="card-premium p-6 bg-indigo-600 border-none text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Activity size={100} />
                            </div>
                            <h3 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-6 relative z-10">Clinical Profile</h3>

                            <div className="space-y-4 relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Primary Diagnosis</p>
                                    <p className="font-bold">{patient.diagnosis}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Treatment Plan</p>
                                    <p className="text-sm text-indigo-100 font-medium leading-relaxed">{patient.plan}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Clinical Tools (Notes & History) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Clinical Notes */}
                    {!isFocused && (
                        <div className="card-premium p-6 flex flex-col h-[500px]">
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <FileText className="text-indigo-600" size={20} /> Clinical Notes
                                </h2>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar mb-4">
                                {notes.length > 0 ? notes.map((note) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={note.id}
                                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100"
                                    >
                                        <p className="text-slate-700 font-medium leading-relaxed mb-3 text-sm">{note.content}</p>
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                                            <span className="uppercase tracking-wider">{note.author}</span>
                                            <span>{new Date(note.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <FileText size={40} className="mb-2 opacity-20" />
                                        <p className="text-sm font-bold">No clinical notes recorded yet.</p>
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0 flex gap-3 pt-4 border-t border-slate-100">
                                <InputField
                                    placeholder="Add a new clinical note..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    containerClassName="flex-1"
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote() }}
                                />
                                <Button
                                    variant="primary"
                                    className="mt-2 h-[56px] w-[56px] p-0 flex items-center justify-center shrink-0"
                                    onClick={handleAddNote}
                                    isLoading={isSubmittingNote}
                                    disabled={!newNote.trim()}
                                >
                                    <Send size={18} className="translate-x-0.5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Mind Balance Section (Mood Distribution) */}
                    {!isFocused && stats?.moodAnalytics?.distribution && (
                        <div
                            onClick={() => navigate(`/patients/${patient.userId || id}/statistics`)}
                            className="card-premium p-6 border-slate-100 hover:border-indigo-100 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <PieChart size={20} className="text-violet-600" /> Mind Balance
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Emotional Distribution Matrix</p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openHelp('about_mindbalance');
                                    }}
                                    className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all hover:scale-110 active:scale-95"
                                    title="About Mind Balance"
                                >
                                    <Info size={16} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {Object.entries(stats.moodAnalytics.distribution).slice(0, 4).map(([mood, count]) => {
                                    const total = Object.values(stats.moodAnalytics.distribution).reduce((a, b) => Number(a) + Number(b), 0);
                                    const percentage = total > 0 ? (Number(count) / total) * 100 : 0;

                                    // Assign colors based on mood names
                                    const getColor = (m: string) => {
                                        const lower = m.toLowerCase();
                                        if (lower.includes('happy') || lower.includes('great')) return 'bg-emerald-500';
                                        if (lower.includes('sad') || lower.includes('down')) return 'bg-rose-500';
                                        if (lower.includes('anxious') || lower.includes('stressed')) return 'bg-amber-500';
                                        return 'bg-indigo-500';
                                    };

                                    return (
                                        <div key={mood} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{mood}</span>
                                                <span className="text-xs font-black text-slate-900 italic">{Math.round(percentage)}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                                    className={`h-full rounded-full ${getColor(mood)} shadow-sm opacity-80 group-hover:opacity-100 transition-opacity`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-8 pt-4 border-t border-slate-50 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Updated Real-time</span>
                                <span className="text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                    Deep Analytics <ChevronLeft size={10} className="rotate-180" />
                                </span>
                            </div>
                        </div>
                    )}

                    {/* MindBalance Web Platform Branding Card */}
                    {!isFocused && (
                        <motion.div
                            whileHover={{ y: -5 }}
                            onClick={() => openHelp('about_mindbalance')}
                            className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 text-white shadow-xl shadow-indigo-100 border border-white/10 cursor-pointer relative overflow-hidden group"
                        >
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-700" />

                            <div className="relative z-10 flex flex-col gap-6">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                    <Activity size={24} className="text-white" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black tracking-tight leading-tight uppercase italic">MindBalance</h3>
                                    <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em]">Clinical Decision Support Platform</p>
                                </div>
                                <div className="py-4 border-t border-white/10 group-hover:border-white/30 transition-colors flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest">About Platform</span>
                                    <ChevronLeft size={14} className="rotate-180 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Mind Health Section (Feature Parity with Mobile WellnessSnapshot) */}
                    {!isFocused && history.length > 0 && (
                        <div className="card-premium p-6 border-indigo-100 bg-white/50 backdrop-blur-sm relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                        <HeartPulse size={20} className="text-indigo-600" /> Mind Health Snapshot
                                    </h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Latest Wellness Analysis</p>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Activity size={20} />
                                </div>
                            </div>

                            <div className="flex items-center gap-8 py-4 px-6 bg-slate-50/50 rounded-3xl border border-white/50">
                                <div className="text-center">
                                    <span className={`text-4xl font-black block tracking-tighter ${Number(history[0].score) > 10 ? 'text-rose-600' : 'text-emerald-600'
                                        }`}>
                                        {history[0].percentage ?? history[0].score}%
                                    </span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Mental Pulse</span>
                                </div>

                                <div className="w-px h-12 bg-slate-200" />

                                <div className="flex-1">
                                    <h4 className="text-lg font-black text-slate-900 leading-tight">
                                        {history[0].interpretation}
                                    </h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        {history[0].category} • Last Checked {new Date(history[0].date || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 grid grid-cols-2 gap-4">
                                <Button 
                                    variant="outline" 
                                    className="rounded-[1.5rem] border-slate-200 text-slate-600 hover:bg-slate-50 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    onClick={() => navigate(`/patients/${patient?.userId || id}/ai-history-assistant`)}
                                >
                                    <Mic size={14} className="text-indigo-600" /> Record Narrative
                                </Button>
                                <Button 
                                    variant="primary" 
                                    className="rounded-[1.5rem] bg-slate-900 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    onClick={() => navigate(`/patients/${patient?.userId || id}/ai-history-assistant?mode=manual`)}
                                >
                                    <Plus size={14} /> Add Manual Entry
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Assessment History */}
                    <div className="card-premium p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <ClipboardList className="text-indigo-600" size={20} /> Assessment History
                            </h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/history/professional/${patient?.userId || id}`)}>View All</Button>
                        </div>

                        <div className="space-y-3">
                            {history.length > 0 ? history.map((record) => (
                                <div key={record.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(record.status as StatusType).bg} ${getStatusColor(record.status as StatusType).text} font-black text-xs`}>
                                            {record.percentage ?? record.score}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 lowercase first-letter:uppercase">{record.category?.replace(/_/g, ' ')}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                {new Date(record.date || record.createdAt || '').toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${getStatusColor(record.status as StatusType).bg} ${getStatusColor(record.status as StatusType).text} border ${getStatusColor(record.status as StatusType).border}`}>
                                            {record.interpretation}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm font-medium text-slate-500 text-center py-4">No assessments completed.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Help Modal */}
            <MindBalanceHelpModal
                isOpen={!!helpSlug}
                onClose={closeHelp}
                slug={helpSlug || ''}
            />
        </div>
    );
};

export default PatientRecord;
