import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight,
    Clock,
    Bell,
    CheckCircle2,
    Brain,
    Video,
    MapPin,
    Bot,
    Sparkles,
    Activity,
    Moon,
    Flame,
    Zap,
    Pill,
    Baby,
    PersonStanding,
    HeartCrack,
    Shield,
    Eye,
    Crosshair,
    Dice1
} from 'lucide-react';
// import CircularProgress from '../../components/common/CircularProgress';
import TrendAreaChart from '../../components/common/TrendAreaChart';
import QuickCheckIn from '../../components/dashboard/QuickCheckIn';
import DailyTasks from '../../components/dashboard/DailyTasks';
import { useRealTimeClock } from '../../hooks/useRealTime';
import Button from '../../components/ui/Button';
import type { RootState } from '../../store';
import api from '../../api/client';
import type { Consultation, Notification as ClinicalNotification } from '../../types/common.types';
import type { AssessmentMaster } from '../../types/assessment.types';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { timeString, dateString } = useRealTimeClock();
    const [notifications, setNotifications] = useState<ClinicalNotification[]>([]);
    const [appointments, setAppointments] = useState<Consultation[]>([]);
    const [masters, setMasters] = useState<AssessmentMaster[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all 3 endpoints in parallel — same as mobile DashboardScreen
                const [dashRes, consultRes, mastersRes] = await Promise.allSettled([
                    api.get('dashboards/patient'),
                    api.get('resource/consults', { params: { page: 1, limit: 5 } }),
                    api.get(`resource/masters/all/${user?.id || ''}`, {
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
                    const res = mastersRes.value.data;
                    const data = res?.data || res;
                    const list = data?.masters || (Array.isArray(data) ? data : []);
                    setMasters(list);
                }
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                // No longer setting isLoading
            }
        };
        fetchData();
    }, [user?.id]);



    // AI Card animations & effects
    const [pulse, setPulse] = useState(false);
    useEffect(() => {
        const interval = setInterval(() => {
            setPulse(p => !p);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const unreadNotifications = notifications.filter(n => !n.read).length;

    // Helper functions for assessment UI
    const slugStyleMap: Record<string, { icon: string; color: string }> = {
        depression: { icon: 'Heart', color: '#10B981' }, // emerald
        anxiety: { icon: 'Activity', color: '#6366F1' }, // indigo
        sleep: { icon: 'Moon', color: '#EC4899' }, // pink
        mania: { icon: 'Zap', color: '#F97316' }, // orange
        bipolar: { icon: 'Zap', color: '#F97316' },
        anger: { icon: 'Flame', color: '#EF4444' }, // red
        anger_pediatric: { icon: 'Flame', color: '#EF4444' },
        substance_use: { icon: 'Pill', color: '#64748B' }, // slate
        postpartum: { icon: 'Baby', color: '#EC4899' },
        somatic: { icon: 'PersonStanding', color: '#14B8A6' }, // teal
        anxiety_pediatric: { icon: 'Activity', color: '#6366F1' },
        repetitive_thoughts: { icon: 'Brain', color: '#A855F7' }, // purple
        repetitive_thoughts_pediatric: { icon: 'Brain', color: '#A855F7' },
        separation_anxiety: { icon: 'HeartCrack', color: '#EC4899' },
        odd: { icon: 'Shield', color: '#F97316' },
        social_anxiety: { icon: 'Eye', color: '#6366F1' },
        agoraphobia: { icon: 'Shield', color: '#64748B' },
        panic_disorder: { icon: 'Zap', color: '#EF4444' },
        adhd: { icon: 'Sparkles', color: '#F97316' },
        ocd: { icon: 'Crosshair', color: '#A855F7' },
        psychosis: { icon: 'Eye', color: '#64748B' },
        gambling: { icon: 'Dice1', color: '#F97316' },
        eating_disorder: { icon: 'Coffee', color: '#10B981' },
        pmdd: { icon: 'HeartCrack', color: '#EC4899' },
        autism_spectrum: { icon: 'Sparkles', color: '#6366F1' },
        ptsd_pediatric: { icon: 'Shield', color: '#EF4444' }, // Added this entry
        acute_stress: { icon: 'Flame', color: '#F97316' },
        dissociative_symptoms: { icon: 'Eye', color: '#A855F7' },
        personality_inventory: { icon: 'Brain', color: '#6366F1' },
        irritability: { icon: 'Flame', color: '#F97316' },
    };



    const getIcon = (iconName: string) => {
        const props = { size: 24, fill: "currentColor", className: "opacity-90" };
        switch (iconName) {
            case 'Heart': return <Activity {...props} />;
            case 'Activity': return <Activity {...props} />;
            case 'Moon': return <Moon {...props} />;
            case 'Zap': return <Zap {...props} />;
            case 'Flame': return <Flame {...props} />;
            case 'Pill': return <Pill {...props} />;
            case 'Baby': return <Baby {...props} />;
            case 'PersonStanding': return <PersonStanding {...props} />;
            case 'Brain': return <Brain {...props} />;
            case 'HeartCrack': return <HeartCrack {...props} />;
            case 'Shield': return <Shield {...props} />;
            case 'Eye': return <Eye {...props} />;
            case 'Sparkles': return <Sparkles {...props} />;
            case 'Crosshair': return <Crosshair {...props} />;
            case 'Dice1': return <Dice1 {...props} />;
            default: return <Brain {...props} />;
        }
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
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl ">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-50">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <Clock size={16} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{dateString} • {timeString}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 line-clamp-1 text-gradient-primary">Hello, {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.name || user?.username || 'Guest')}</h1>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 mt-1">
                            Patient
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium flex items-center gap-2">
                        How is your mental well-being today?
                    </p>
                </div>
            </header>


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Skyheal AI Hero Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 shadow-xl shadow-indigo-500/20 text-white cursor-pointer group"
                    onClick={() => navigate('/chat')}
                >
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                    <div className="relative z-10 p-8 flex flex-col md:flex-row items-center gap-6">
                        <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center relative z-10 border border-white/20">
                                <Bot size={32} className="text-white" />
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-black tracking-tight mb-2">Skyheal AI</h2>
                            <p className="text-white/70 font-medium text-xs leading-relaxed mb-4">
                                Virtual companion for instant mental wellness support.
                            </p>
                            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all">
                                Chat Now <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* NeuroVitals Clinical Hero Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-xl shadow-slate-900/20 text-white cursor-pointer group"
                    onClick={() => navigate('/neuro-vitals')}
                >
                    <div className="absolute -bottom-24 -right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                    <div className="relative z-10 p-8 flex flex-col md:flex-row items-center gap-6">
                        <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center relative z-10 border border-indigo-500/30">
                                <Activity size={32} className="text-indigo-400" />
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 bg-indigo-500/10 px-2 py-1 rounded-md mb-2 border border-indigo-500/20">
                                <Sparkles size={10} className="text-indigo-400" />
                                <span className="text-[8px] font-black tracking-widest text-indigo-400 uppercase">New Update</span>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight mb-2 text-indigo-100">NeuroVitals™</h2>
                            <p className="text-slate-400 font-medium text-xs leading-relaxed mb-4">
                                Scan clinical biomarkers using AI Deep Phenotyping.
                            </p>
                            <button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20">
                                Start Scan <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
            {/* Dashboard Protocol Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area (8 Cols) */}
                <div className="lg:col-span-8 space-y-8">
                    <QuickCheckIn />

                    {/* Upcoming Sessions Section — restored prominently */}
                    <section className="card-premium p-8 bg-white border-slate-100">
                        <div className="flex items-center justify-between mb-8 pl-2">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Upcoming Sessions</h2>
                            </div>
                            <button
                                onClick={() => navigate('/schedule')}
                                className="text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
                            >
                                Open Portal
                            </button>
                        </div>

                        {appointments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {appointments.slice(0, 2).map((appt: Consultation, i: number) => {
                                    const dt = new Date(appt.scheduled_at);
                                    const isVirtual = appt.consult_type === 'virtual';
                                    const statusStyle = getConsultStatusColor(appt.status);

                                    return (
                                        <div
                                            key={appt.id || appt._id || i}
                                            onClick={() => {
                                                const subscriber = appt.participants?.find((p: any) =>
                                                    p.role === 'subscriber' ||
                                                    p.participant_type?.code === 'patient' ||
                                                    String(p.ref_number || p.userId) === String(user?.userId || user?.id)
                                                );
                                                const token = subscriber?.token || appt.subscriber_token || appt.token;
                                                navigate(`/teleconsult/${appt.id || appt._id}`, {
                                                    state: { appointment: appt, token }
                                                });
                                            }}
                                            className="p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all group cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="flex items-start justify-between mb-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                        {isVirtual ? <Video size={22} className="text-indigo-500" /> : <MapPin size={22} className="text-emerald-500" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">{appt.reason || 'Symptom Review'}</h4>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Clinical Consultation</p>
                                                    </div>
                                                </div>
                                                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusStyle}`}>
                                                    {appt.status}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100/50">
                                                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                                                    <Clock size={14} className="text-slate-300" />
                                                    {!isNaN(dt.getTime())
                                                        ? dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) + ' at ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                        : 'Schedule TBD'}
                                                </div>
                                                <div className="w-8 h-8 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
                                    <Video size={32} className="text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No sessions scheduled for this period</p>
                                <button
                                    onClick={() => navigate('/schedule?action=book')}
                                    className="mt-4 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:text-indigo-700"
                                >
                                    Book Session Now
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Wellness Assessments — from masters API */}
                    <section className="card-premium p-8 bg-white border-slate-100">
                        <div className="flex items-center justify-between mb-8 pl-2">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Assessments</h2>
                            </div>
                            <button
                                onClick={() => navigate('/assessments')}
                                className="text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
                            >
                                View Portal
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {masters.length > 0 ? masters.slice(0, 4).map((m: AssessmentMaster, i: number) => {
                                const style = slugStyleMap[m.slug || ''] || { icon: 'Brain', color: '#6366F1' };
                                const progress = Math.min(Math.floor(Math.random() * 40) + 60, 100);
                                return (
                                    <button
                                        key={m.id || m._id || `master-${i}`}
                                        onClick={() => navigate(`/assessments/${m.slug}`)}
                                        className="p-5 bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-indigo-100 rounded-3xl hover:shadow-xl transition-all flex flex-col group text-left"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors" style={{ backgroundColor: `${style.color}15` }}>
                                                <div style={{ color: style.color }}>
                                                    {getIcon(style.icon)}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}%</span>
                                        </div>
                                        <h3 className="font-extrabold text-xs text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{m.name}</h3>
                                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden mt-auto">
                                            <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: style.color }} />
                                        </div>
                                    </button>
                                );
                            }) : (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="h-28 bg-slate-50/50 rounded-3xl border border-slate-100 animate-pulse" />
                                ))
                            )}
                        </div>
                    </section>

                    {/* Mood Trajectory Chart */}
                    <section className="card-premium p-10 space-y-8 bg-white border-slate-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity size={16} className="text-indigo-600" />
                                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Overview</h2>
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tight">Mood Trajectory</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic mt-1">Weekly Delta Analysis</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-black text-indigo-600">82%</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance Score</span>
                            </div>
                        </div>
                        <TrendAreaChart
                            data={[
                                { label: 'Mon', value: 65 }, { label: 'Tue', value: 72 }, { label: 'Wed', value: 68 },
                                { label: 'Thu', value: 75 }, { label: 'Fri', value: 82 }, { label: 'Sat', value: 78 }, { label: 'Sun', value: 85 },
                            ]}
                            height={180}
                            color="#6366f1"
                        />
                    </section>
                </div>

                {/* Sidebar Protocol (4 Cols) */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="flex-1">
                        <DailyTasks />
                    </div>
                </div>
            </div>




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
                                    <div key={n.id || n._id || `notif-${i}`} className="flex items-start gap-4 py-3 border-b border-white/10 last:border-0">
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

                        <Button variant="white" size="lg" className="w-full text-indigo-900 py-5 rounded-2xl" onClick={() => navigate('/notifications')}>
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
