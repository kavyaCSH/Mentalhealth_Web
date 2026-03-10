import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    ChevronRight,
    Clock,
    Bell,
    CheckCircle2,
    Brain,
    Video,
    MapPin,
    User
} from 'lucide-react';
import { addMoodEntry } from '../../features/wellness/store/wellnessSlice';
import { useRealTimeClock } from '../../hooks/useRealTime';
import Button from '../../components/ui/Button';
import type { RootState } from '../../store';
import api from '../../api/client';
import type { Consultation, Notification } from '../../types/common.types';
import type { AssessmentMaster } from '../../types/assessment.types';

const PatientDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { timeString, dateString } = useRealTimeClock();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [appointments, setAppointments] = useState<Consultation[]>([]);
    const [masters, setMasters] = useState<AssessmentMaster[]>([]);
    const [isLogging, setIsLogging] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all 3 endpoints in parallel — same as mobile DashboardScreen
                const [dashRes, consultRes, mastersRes] = await Promise.allSettled([
                    api.get('/dashboards/patient'),
                    api.get('/resource/consults', { params: { page: 1, limit: 5 } }),
                    api.get(`/resource/masters/all/${user?.id || ''}`, {
                        params: { page: 1, limit: 10, is_active: 1, master_type_slug: 'mental_health' }
                    })
                ]);

                // Dashboard data
                if (dashRes.status === 'fulfilled') {
                    const data = dashRes.value.data?.data || dashRes.value.data;
                    setNotifications(Array.isArray(data?.notifications || data?.alerts) ? (data.notifications || data.alerts) : []);
                }

                // Consultations
                if (consultRes.status === 'fulfilled') {
                    const data = consultRes.value.data?.data || consultRes.value.data;
                    const consults = data?.consults || data;
                    setAppointments(Array.isArray(consults) ? consults : []);
                }

                // Masters
                if (mastersRes.status === 'fulfilled') {
                    const data = mastersRes.value.data?.data || mastersRes.value.data;
                    const list = data?.masters || data?.data?.masters || data;
                    setMasters(Array.isArray(list) ? list : []);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                // No longer setting isLoading
            }
        };
        fetchData();
    }, [user?.id]);


    const unreadNotifications = notifications.filter(n => !n.read).length;


    const handleLogProgress = () => {
        setIsLogging(true);
        const randomMood = Math.floor(Math.random() * 40) + 60;
        setTimeout(() => {
            dispatch(addMoodEntry(randomMood));
            setIsLogging(false);
        }, 800);
    };

    const getConsultStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'scheduled') return 'bg-blue-50 text-blue-600 border-blue-100';
        if (s === 'in_progress' || s === 'in progress' || s === 'waiting') return 'bg-amber-50 text-amber-600 border-amber-100';
        if (s === 'confirmed') return 'bg-teal-50 text-teal-600 border-teal-100';
        if (s === 'completed') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (s === 'cancelled' || s === 'canceled') return 'bg-red-50 text-red-500 border-red-100';
        if (s === 'payment_pending') return 'bg-orange-50 text-orange-600 border-orange-100';
        return 'bg-slate-50 text-slate-500 border-slate-100';
    };

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <Clock size={16} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{dateString} • {timeString}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 line-clamp-1 text-premium">Hello, {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.name || user?.username || 'Guest')}</h1>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 mt-1">
                            Patient
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        How are you feeling today?
                    </p>
                </div>
                <button
                    onClick={handleLogProgress}
                    disabled={isLogging}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold shadow-xl shadow-indigo-200/50 transition-all active:scale-95 disabled:opacity-70 group"
                >
                    <Plus size={20} className={`${isLogging ? 'animate-spin' : 'group-hover:rotate-90 transition-transform'}`} />
                    <span>{isLogging ? 'Logging...' : 'Log Mood'}</span>
                </button>
            </header>


            {/* Mental Health Services — from masters API */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-slate-900">Mental Health Services</h2>
                        {masters.length > 0 && (
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black border border-indigo-100">
                                {masters.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/assessments')}
                        className="flex items-center gap-1 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                    >
                        History <ChevronRight size={14} />
                    </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {masters.length > 0 ? masters.map((m: AssessmentMaster) => (
                        <motion.button
                            key={m.id || m._id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(`/assessments/${m.slug}`)}
                            className="min-w-[140px] h-[100px] p-4 card-premium flex flex-col items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-50 transition-all"
                        >
                            <Brain size={24} className="text-indigo-600" />
                            <span className="text-xs font-bold text-slate-700 text-center leading-tight line-clamp-2">{m.name}</span>
                        </motion.button>
                    )) : (
                        <p className="text-sm text-slate-400 italic">Loading services...</p>
                    )}
                </div>
            </section>

            {/* Scheduled Events — from consults API */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-slate-900">Scheduled Events</h2>
                        {appointments.length > 0 && (
                            <span className="px-2.5 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-black border border-teal-100">
                                {appointments.length}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/schedule')}
                        className="flex items-center gap-1 px-4 py-2 bg-teal-50 text-teal-600 border border-teal-100 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-teal-100 transition-colors"
                    >
                        See all <ChevronRight size={14} />
                    </button>
                </div>
                {appointments.length > 0 ? (
                    <div className="space-y-3">
                        {appointments.map((appt: Consultation, i: number) => {
                            const dt = new Date(appt.scheduled_at);
                            const extendedAppt = appt as Consultation & {
                                consult_current_status?: { name: string, slug: string } | string;
                                consult_status?: { name: string, slug: string } | string;
                            };
                            const statusObj = extendedAppt.consult_current_status || extendedAppt.consult_status;
                            const statusName = statusObj ? (typeof statusObj === 'string' ? statusObj : statusObj.name) : 'Unknown Status';
                            const statusSlug = statusObj ? (typeof statusObj === 'string' ? statusObj.toLowerCase() : statusObj.slug) : appt.status || 'scheduled';
                            const isVirtual = appt.consult_type === 'virtual';
                            const professional = appt.participants?.find(p => p.participant_type?.code === 'professional');

                            return (
                                <motion.div
                                    key={appt.id || i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="p-5 card-premium flex items-center gap-5 hover:shadow-lg transition-all"
                                >
                                    <div className="p-3 rounded-2xl bg-teal-50 text-teal-600">
                                        {isVirtual ? <Video size={20} /> : <MapPin size={20} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-slate-900 truncate">{appt.reason || 'Consultation'}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                <Clock size={12} />
                                                {!isNaN(dt.getTime()) ? `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'TBD'}
                                            </span>
                                            {professional && (
                                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                    <User size={12} />
                                                    {professional.name || 'Specialist'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${getConsultStatusColor(statusSlug)}`}>
                                        {statusName}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-slate-400 text-center py-6 italic">No scheduled events</p>
                )}
            </section>


            {/* Sidebar - Notifications & Goals */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Recent Notifications */}
                <section className="bg-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
                    <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-800 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                <Bell size={28} />
                            </div>
                            <div>
                                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Recent Clinical Alerts</p>
                                <p className="font-bold text-xl">{unreadNotifications} New Updates</p>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[200px] overflow-y-auto no-scrollbar">
                            {notifications.length > 0 ? (
                                notifications.slice(0, 3).map((n, i) => (
                                    <div key={i} className="flex items-start gap-4 py-3 border-b border-white/10 last:border-0">
                                        <div className="mt-1">
                                            <div className={`w-2 h-2 rounded-full ${n.read ? 'bg-indigo-400' : 'bg-pink-400'}`}></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium line-clamp-2">{n.message}</p>
                                            <p className="text-[10px] text-indigo-300 font-bold uppercase mt-1">Recently</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-indigo-300 italic">No recent alerts found.</p>
                            )}
                        </div>

                        <Button variant="white" size="lg" className="w-full text-indigo-900 py-5" onClick={() => navigate('/notifications')}>
                            View Notification Center
                        </Button>
                    </div>
                </section>

                {/* Goal Tracking */}
                <section className="card-premium p-8 group">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center glow-emerald">
                            <CheckCircle2 size={20} />
                        </div>
                        <h3 className="font-black text-base text-slate-900">Active Wellness Track</h3>
                    </div>
                    <p className="text-slate-500 font-medium italic leading-relaxed text-sm">
                        "Assessment streaks help identify patterns in your mental well-being over time."
                    </p>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-4 transition-all duration-300">
                            Performance Details <ChevronRight size={14} />
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PatientDashboard;
