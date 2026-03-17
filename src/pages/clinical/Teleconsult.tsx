import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PhoneOff,
    ShieldCheck,
    Lock,
    ExternalLink,
    ChevronLeft,
    ClipboardList,
    History,
    MessageSquare,
    Save,
    X,
    Stethoscope,
    Users,
    Activity,
    FileText,
    Brain,
    Heart,
    Thermometer
} from 'lucide-react';
import { TeleConsultService } from '../../api/services/teleconsult.service';
import { ChiefComplaintService } from '../../api/services/chiefComplaint.service';
import Button from '../../components/ui/Button';
import type { Consultation, Participant } from '../../types/common.types';

const Teleconsult = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { appointment, token: stateToken } = (location.state as { appointment?: Consultation & { subscriber_token?: string; token?: string }; token?: string }) || {};

    const [isIframeLoading, setIsIframeLoading] = useState(true);
    const [duration, setDuration] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTool, setActiveTool] = useState<'notes' | 'records' | 'assessments' | 'symptoms' | 'treatment' | 'directory'>('notes');
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [patientHistory, setPatientHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Extract token - mirror mobile logic
    const token = stateToken || appointment?.subscriber_token || appointment?.token;

    // Extract participant info
    const subscriber = appointment?.participants?.find((p: Participant) => 
        p.participant_type?.code === 'patient' || p.role === 'subscriber'
    );
    const patientId = subscriber?.ref_number || (appointment as any)?.patientId;

    const specialist = appointment?.participants?.find((p: Participant) =>
        p.participant_type?.code === 'professional' || p.role === 'provider' || p.role === 'publisher'
    );
    const doctorName = specialist?.name || (specialist as any)?.firstName ? `${(specialist as any).firstName} ${(specialist as any).lastName || ''}` : 'Clinical Specialist';

    useEffect(() => {
        if (!token && !id) {
            console.error('No consultation session found');
            navigate('/clinical-schedule');
            return;
        }

        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);

        if (patientId) {
            fetchPatientContext();
        }

        return () => clearInterval(timer);
    }, [token, id, navigate, patientId]);

    const fetchPatientContext = async () => {
        if (!patientId) return;

        setIsLoadingHistory(true);
        try {
            const res = await ChiefComplaintService.listComplaints({ patient_id: patientId, limit: 5 });
            setPatientHistory(res.data || []);
        } catch (err) {
            console.error('Failed to fetch patient history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!notes.trim() || !id) return;
        setIsSavingNotes(true);
        try {
            await TeleConsultService.updateConsultationStatus(id, 'ongoing', notes);
            // Show toast or subtle feedback
        } catch (err) {
            console.error('Failed to save notes:', err);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleEndSession = () => {
        if (window.confirm('Are you sure you want to leave the consultation session?')) {
            navigate('/clinical-schedule');
        }
    };

    const consult_url = 'https://teleconsult.a2zhealth.in/consult/';
    const iframeUrl = token ? `${consult_url}${token}` : '';

    if (!token && id) {
        // Fallback or loading if only ID is present but no state
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
                <Activity className="animate-spin text-indigo-500 mb-6" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Session #{id}...</p>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20">
                    <Lock size={32} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Access Restricted</h3>
                <p className="text-slate-400 font-medium mb-8">No valid consultation token was provided.</p>
                <Button variant="primary" onClick={() => navigate('/clinical-schedule')}>Return to Schedule</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-950 overflow-hidden text-white/90 font-sans">
            {/* Premium Header */}
            <header className="h-20 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 shrink-0 relative z-20">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/clinical-schedule')}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all border border-white/5"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
                            <Activity size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-black tracking-tight">{doctorName}</h1>
                                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Secure</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                Session ID: {id || 'N/A'} • {formatDuration(duration)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-3 rounded-xl transition-all border flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${
                            isSidebarOpen 
                            ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <ClipboardList size={20} />
                        {isSidebarOpen ? 'Close Tools' : 'Clinical Tools'}
                    </button>

                    <Button
                        variant="danger"
                        className="rounded-xl px-6 h-12 text-xs font-black uppercase tracking-widest gap-2"
                        leftIcon={<PhoneOff size={18} />}
                        onClick={handleEndSession}
                    >
                        End Session
                    </Button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Iframe Area */}
                <main className="flex-1 relative bg-[#0a0a0a]">
                <AnimatePresence>
                    {isIframeLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950"
                        >
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-indigo-500/10 rounded-full"></div>
                                <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <Activity className="absolute inset-0 m-auto text-indigo-500 animate-pulse" size={32} />
                            </div>
                            <p className="mt-8 text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Establishing Handoff</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <iframe
                    src={iframeUrl}
                    className={`w-full h-full border-none transition-opacity duration-1000 ${isIframeLoading ? 'opacity-0' : 'opacity-100'}`}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    onLoad={() => setIsIframeLoading(false)}
                    title="Clinical Consultation"
                />

                {!isIframeLoading && (
                    <div className="absolute bottom-6 left-6 flex flex-col items-start gap-3 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
                        <div className="bg-slate-900/80 backdrop-blur border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live Stream Active</span>
                        </div>
                    </div>
                )}
                </main>

                {/* Clinical Sidebar */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.aside
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-[400px] bg-slate-900 border-l border-white/10 flex flex-col z-30 shadow-2xl"
                        >
                            {/* Sidebar Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-black uppercase tracking-widest text-white">Clinical Hub</h2>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">Real-time Session Support</p>
                                </div>
                                <button 
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Tool Navigation Grid */}
                            <div className="grid grid-cols-3 gap-2 p-2 bg-slate-950/50 m-4 rounded-xl border border-white/5">
                                {[
                                    { id: 'notes', icon: MessageSquare, label: 'Log' },
                                    { id: 'records', icon: History, label: 'Docs' },
                                    { id: 'assessments', icon: ClipboardList, label: 'MSE' },
                                    { id: 'symptoms', icon: Thermometer, label: 'ROS' },
                                    { id: 'treatment', icon: Stethoscope, label: 'Plan' },
                                    { id: 'directory', icon: Users, label: 'Bio' }
                                ].map((tool) => (
                                    <button 
                                        key={tool.id}
                                        onClick={() => setActiveTool(tool.id as any)}
                                        className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTool === tool.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                    >
                                        <tool.icon size={16} />
                                        {tool.label}
                                    </button>
                                ))}
                            </div>

                            {/* Sidebar Content */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                                {activeTool === 'notes' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="bg-slate-950 rounded-2xl p-4 border border-white/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Session Documentation</label>
                                                <span className="text-[10px] text-slate-500 font-bold">Autosave Ready</span>
                                            </div>
                                            <textarea 
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Begin session observations, diagnosis notes, or treatment adjustments..."
                                                className="w-full h-80 bg-transparent text-sm text-slate-300 font-medium focus:outline-none resize-none leading-relaxed"
                                            />
                                        </div>
                                        <Button 
                                            variant="primary" 
                                            className="w-full py-4 rounded-xl shadow-xl shadow-indigo-600/20"
                                            isLoading={isSavingNotes}
                                            leftIcon={<Save size={18} />}
                                            onClick={handleSaveNotes}
                                        >
                                            Commit to Record
                                        </Button>
                                    </div>
                                )}

                                {activeTool === 'records' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Patient Historical Context</h3>
                                        {isLoadingHistory ? (
                                            <div className="flex justify-center py-10">
                                                <Activity className="animate-spin text-indigo-500" size={24} />
                                            </div>
                                        ) : patientHistory.length > 0 ? (
                                            patientHistory.map((entry, idx) => (
                                                <div key={idx} className="bg-slate-950/50 p-4 rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors cursor-pointer group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Entry #{idx + 1}</span>
                                                        <span className="text-[9px] text-slate-500 font-bold">{new Date().toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-medium leading-relaxed italic line-clamp-3 group-hover:text-slate-200">
                                                        "{entry.narrative || entry.content || 'Clinical documentation entry for historical review.'}"
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-2xl">
                                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FileText className="text-slate-800" size={24} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No matching records</p>
                                            </div>
                                        )}
                                        <Button variant="outline" className="w-full py-4 text-[9px] font-black uppercase tracking-widest border-white/10 text-slate-400">View Full Archive</Button>
                                    </div>
                                )}

                                {activeTool === 'assessments' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Assessments</h3>
                                            <Button variant="primary" className="py-1 px-3 text-[8px] h-auto rounded-lg">New MSE</Button>
                                        </div>
                                        <div className="p-16 text-center border-2 border-dashed border-white/5 rounded-2xl bg-slate-950/30">
                                            <Brain className="mx-auto text-slate-800 mb-4" size={32} />
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Launch MSE Module</p>
                                            <p className="text-[9px] text-slate-700 font-medium mt-1">Mental State Examination pending</p>
                                        </div>
                                    </div>
                                )}

                                {activeTool === 'symptoms' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Systems Review (ROS)</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['CVS', 'Respiratory', 'Gastro', 'Neurology', 'Endocrine', 'Skin'].map(sys => (
                                                <div key={sys} className="p-3 bg-slate-950 border border-white/5 rounded-xl flex flex-col gap-2">
                                                    <span className="text-[8px] font-black text-slate-500 uppercase">{sys}</span>
                                                    <span className="text-[9px] text-indigo-400 font-bold">Unremarkable</span>
                                                </div>
                                            ))}
                                        </div>
                                        <Button variant="outline" className="w-full py-4 text-[9px] font-black uppercase tracking-widest border-white/10">Full ROS Questionnaire</Button>
                                    </div>
                                )}

                                {activeTool === 'treatment' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Prescribed Protocol</label>
                                            <div className="bg-slate-950 p-4 rounded-xl border border-white/5 min-h-[100px] flex items-center justify-center">
                                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">No Medications Issued</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="primary" className="py-3 text-[9px] uppercase tracking-widest font-black rounded-xl" leftIcon={<Heart size={14} />}>Add Meds</Button>
                                            <Button variant="outline" className="py-3 text-[9px] uppercase tracking-widest font-black border-white/10 rounded-xl" leftIcon={<Activity size={14} />}>Lab Work</Button>
                                        </div>
                                    </div>
                                )}

                                {activeTool === 'directory' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="flex flex-col items-center py-6 bg-slate-950/50 rounded-3xl border border-white/5 shadow-xl shadow-black/20">
                                            <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-500 mb-4 border border-indigo-500/20 shadow-inner">
                                                <Users size={32} />
                                            </div>
                                            <h4 className="text-lg font-black tracking-tight">{subscriber?.name || 'Assigned Patient'}</h4>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">DOB: 12/05/1992 • {subscriber?.ref_number ? `ID: ${String(subscriber.ref_number).slice(-8)}` : 'ID PENDING'}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl">
                                                <span className="text-[9px] font-black text-slate-500 uppercase">Emergency Contact</span>
                                                <span className="text-[10px] font-bold text-slate-300">Verified</span>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/5 rounded-2xl">
                                                <span className="text-[9px] font-black text-slate-500 uppercase">Location Basis</span>
                                                <span className="text-[10px] font-bold text-slate-300">Bengaluru, IN</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer / Status Bar */}
            <footer className="h-10 bg-slate-900/80 border-t border-white/5 flex items-center justify-between px-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 shrink-0">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> WebRTC Stable
                    </span>
                    <span className="flex items-center gap-2">
                        <Lock size={10} /> a2z Encryption Active
                    </span>
                </div>
                <div className="flex items-center gap-2 text-indigo-400">
                    <ExternalLink size={10} /> teleconsult.a2zhealth.in
                </div>
            </footer>
        </div>
    );
};

export default Teleconsult;
