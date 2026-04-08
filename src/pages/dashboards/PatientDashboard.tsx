import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    Clock,
    Video,
    MapPin,
    Bot,
    Sparkles,
    Calendar,
    FileText,
    ClipboardCheck,
    History,
    Zap,
    User,
    Mail,
    XCircle,
    ArrowUpRight,
    RefreshCcw,
    Mic,
    Plus,
    X
} from 'lucide-react';
import { useRealTimeClock } from '../../hooks/useRealTime';
import type { RootState } from '../../store';
import api from '../../api/client';
import type { Consultation } from '../../types/common.types';


const PatientDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { timeString, dateString } = useRealTimeClock();
    const [appointments, setAppointments] = useState<Consultation[]>([]);
    const [showHistoryOptions, setShowHistoryOptions] = useState(false);

    const fetchData = async () => {
        try {
            const consultRes = await api.get('resource/consults', { params: { page: 1, limit: 5 } });
            const data = consultRes.data?.data || consultRes.data;
            // Support multiple API response formats (standard array, nested consults, or mobile-style history)
            const consults = data?.history?.consultations || data?.consults || (Array.isArray(data) ? data : []);
            setAppointments(consults);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.id]);

    const quickActions = [
        {
            id: 'self-assessment',
            label: 'Self Assessment',
            icon: <ClipboardCheck size={24} />,
            onPress: () => navigate('/assessments'),
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            border: 'border-indigo-100'
        },
        {
            id: 'book',
            label: 'Book Session',
            icon: <Calendar size={24} />,
            onPress: () => navigate('/schedule?action=book'),
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100'
        },
        {
            id: 'records',
            label: 'My Records',
            icon: <FileText size={24} />,
            onPress: () => navigate('/records'),
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            border: 'border-amber-100'
        },
        {
            id: 'history',
            label: 'Health History',
            icon: <History size={24} />,
            onPress: () => navigate('/history/assistant?mode=list'),
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            border: 'border-rose-100'
        },
        {
            id: 'history-assistant',
            label: 'AI History Asst',
            icon: <Bot size={24} />,
            onPress: () => navigate('/history/assistant?view=assistant'),
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            border: 'border-violet-100'
        },
        {
            id: 'neuro-vitals',
            label: 'NeuroVitals',
            icon: <Zap size={24} />,
            onPress: () => navigate('/neuro-vitals'),
            color: 'text-sky-600',
            bg: 'bg-sky-50',
            border: 'border-sky-100'
        }
    ];

    const getConsultStatusInfo = (status?: any) => {
        const s = (typeof status === 'string' ? status : status?.name || status?.slug || 'Scheduled').toLowerCase();

        if (s === 'scheduled') return { label: 'Scheduled', style: 'bg-blue-50 text-blue-600 border-blue-100', color: 'blue' };
        if (['in progress', 'in-progress', 'in_progress', 'waiting', 'ongoing'].includes(s))
            return { label: 'In Progress', style: 'bg-amber-50 text-amber-600 border-amber-100', color: 'amber' };
        if (s === 'confirmed') return { label: 'Confirmed', style: 'bg-teal-50 text-teal-600 border-teal-100', color: 'teal' };
        if (s === 'completed') return { label: 'Completed', style: 'bg-emerald-50 text-emerald-600 border-emerald-100', color: 'emerald' };
        if (['cancelled', 'canceled'].includes(s))
            return { label: 'Cancelled', style: 'bg-red-50 text-red-500 border-red-100', color: 'red' };
        if (s === 'payment pending') return { label: 'Pending Payment', style: 'bg-violet-50 text-violet-600 border-violet-100', color: 'violet' };

        return { label: s.charAt(0).toUpperCase() + s.slice(1), style: 'bg-slate-50 text-slate-500 border-slate-100', color: 'slate' };
    };

    const handleJoinCall = (appt: Consultation) => {
        const token = appt.subscriber_token || appt.token;
        if (token) {
            navigate(`/teleconsult/${appt.id || appt._id}?token=${token}&role=subscriber`);
        } else {
            navigate(`/teleconsult/${appt.id || appt._id}`);
        }
    };

    const handleCancel = async (apptId: string) => {
        if (window.confirm('Are you sure you want to cancel this consultation?')) {
            try {
                await api.post(`resource/consults/${apptId}/cancel`);
                // Reload data
                window.location.reload();
            } catch (err) {
                console.error('Failed to cancel consultation', err);
            }
        }
    };

    const handleReschedule = (apptId: string) => {
        navigate(`/schedule?action=reschedule&consultId=${apptId}`);
    };

    return (
        <div className="p-8 space-y-12 animate-fade-in max-w-7xl mx-auto pb-24">
            {/* Header Mirroring Mobile AppHeader home variant */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-50">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <Clock size={16} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{dateString} • {timeString}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 line-clamp-1">
                            Hello, <span className="text-indigo-600">{user?.firstName || 'Patient'}</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest mt-1">
                        How is your mental well-being today?
                    </p>
                </div>
            </header>

            {/* Premium futuristic AI Card - Primary Hero */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate('/chat')}
                className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 shadow-2xl shadow-indigo-200 cursor-pointer group"
            >
                {/* Decorative Blobs mirrored from mobile */}
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute -bottom-20 -left-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />

                <div className="relative z-10 p-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative flex-shrink-0">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-xl relative animate-pulse-slow">
                            <Bot size={48} className="text-white" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                            <Sparkles size={12} className="text-white" />
                            <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Virtual Companion</span>
                        </div>
                        <h2 className="text-4xl font-black text-white tracking-tight">Skyheal AI</h2>
                        <p className="text-white/80 font-bold text-lg leading-relaxed max-w-xl">
                            Your personal mental wellness guide, available 24/7 for support and clinical insights.
                        </p>
                        <div className="pt-4 flex justify-center md:justify-start">
                            <button className="bg-white text-indigo-600 px-8 py-4 rounded-[2rem] flex items-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-black/10">
                                Start Conversation <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Upcoming Consultations Section */}
            {appointments.length > 0 && (
                <section className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Upcoming Consultations</h2>
                        </div>
                        <button
                            onClick={() => navigate('/schedule')}
                            className="text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:text-indigo-700 transition-colors"
                        >
                            My Schedule
                        </button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {appointments.slice(0, 2).map((appt, idx) => {
                            if (!appt) return null;
                            const dt = new Date(appt.scheduled_at);
                            const isVirtual = appt.consult_type === 'virtual';
                            const statusInfo = getConsultStatusInfo(appt.consult_current_status || appt.consult_status || appt.status);
                            const specialist = appt.participants?.find(p => p.role === 'publisher' || (p.participant_type as any)?.code === 'PRACTITIONER');

                            return (
                                <motion.div
                                    key={appt.id || appt._id || idx}
                                    whileHover={{ y: -5 }}
                                    className="bg-white border border-slate-100 rounded-[2.5rem] hover:border-indigo-100 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
                                >
                                    <div className="p-8">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors shadow-inner ${isVirtual ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {isVirtual ? <Video size={32} /> : <MapPin size={32} />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-xl font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                                                            {appt.reason || 'Symptom Review'}
                                                        </h4>
                                                        {appt.active && (
                                                            <div className="bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase animate-pulse">LIVE</div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            {isVirtual ? 'Virtual Consultation' : 'In-Person Visit'}
                                                        </span>
                                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                                            ID #{appt.consult_id || (appt.id || appt._id || '').toString().substring(0, 8)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusInfo.style}`}>
                                                {statusInfo.label}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-8 border-t border-slate-50">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scheduled For</span>
                                                        <span className="text-sm font-black text-slate-700">
                                                            {!isNaN(dt.getTime())
                                                                ? dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                                                : 'TBD'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                        <Clock size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time Slot</span>
                                                        <span className="text-sm font-black text-slate-700">
                                                            {!isNaN(dt.getTime())
                                                                ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                                : 'TBD'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 p-4 rounded-3xl space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm overflow-hidden">
                                                        {(specialist?.participant_info as any)?.profile_pic ? (
                                                            <img src={(specialist?.participant_info as any)?.profile_pic} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User size={20} />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Specialist</span>
                                                        <span className="text-xs font-black text-slate-900 leading-tight">
                                                            {specialist?.name || (specialist as any)?.firstName ? `${(specialist as any)?.firstName || ''} ${(specialist as any)?.lastName || ''}`.trim() : 'Assigning Specialist...'}
                                                            {specialist?.name && !((specialist as any)?.firstName) && specialist.name}
                                                        </span>
                                                    </div>
                                                </div>
                                                {(specialist?.participant_info as any)?.email && (
                                                    <div className="flex items-center gap-2 text-slate-400 px-1">
                                                        <Mail size={12} />
                                                        <span className="text-[10px] font-bold truncate max-w-[150px]">{(specialist?.participant_info as any)?.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-8">
                                            {isVirtual && (['scheduled', 'confirmed', 'waiting', 'in_progress', 'ongoing', 'live'].includes(statusInfo.label.toLowerCase()) || appt.active) && (
                                                <button
                                                    onClick={() => handleJoinCall(appt)}
                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                                                >
                                                    <Video size={16} />
                                                    Join Consultation
                                                </button>
                                            )}
                                            {['scheduled', 'payment pending', 'new'].includes(statusInfo.label.toLowerCase()) && (
                                                <button
                                                    onClick={() => handleCancel(appt.id || appt._id || '')}
                                                    className="flex-1 h-12 border border-slate-100 hover:border-red-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                >
                                                    <XCircle size={16} />
                                                    Cancel
                                                </button>
                                            )}
                                            {['scheduled', 'payment pending', 'new'].includes(statusInfo.label.toLowerCase()) && (
                                                <button
                                                    onClick={() => handleReschedule(appt.id || appt._id || '')}
                                                    className="flex-1 h-12 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                                >
                                                    <RefreshCcw size={16} />
                                                    Reschedule
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/teleconsult/${appt.id || appt._id}`)}
                                                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <ArrowUpRight size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Quick Action Grid mirrored from mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickActions.map((action) => (
                    <motion.button
                        key={action.id}
                        whileHover={{ y: -8, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={action.onPress}
                        className={`p-8 rounded-[2.5rem] border ${action.border} ${action.bg} flex flex-col items-center justify-center text-center gap-6 transition-all shadow-lg shadow-slate-100/50 hover:shadow-2xl hover:shadow-slate-200/50 group`}
                    >
                        <div className={`w-16 h-16 rounded-2xl ${action.bg} flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform shadow-inner`}>
                            {action.icon}
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase tracking-widest">{action.label}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default PatientDashboard;
