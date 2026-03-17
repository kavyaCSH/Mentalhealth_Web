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
    User,
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
    Coffee,
    Dice1,
    LineChart,
    ChevronDown
} from 'lucide-react';
import CircularProgress from '../../components/common/CircularProgress';
import TrendAreaChart from '../../components/common/TrendAreaChart';
import { useRealTimeClock } from '../../hooks/useRealTime';
import Button from '../../components/ui/Button';
import type { RootState } from '../../store';
import api from '../../api/client';
import type { Consultation, Notification } from '../../types/common.types';
import type { AssessmentMaster } from '../../types/assessment.types';

const PatientDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const { timeString, dateString } = useRealTimeClock();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [appointments, setAppointments] = useState<Consultation[]>([]);
    const [masters, setMasters] = useState<AssessmentMaster[]>([]);

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


    const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null);

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
        ptsd_pediatric: { icon: 'Shield', color: '#EF4444' },
        acute_stress: { icon: 'Flame', color: '#F97316' },
        dissociative_symptoms: { icon: 'Eye', color: '#A855F7' },
        personality_inventory: { icon: 'Brain', color: '#6366F1' },
        irritability: { icon: 'Flame', color: '#F97316' },
    };

    const getIcon = (iconName: string, color: string) => {
        const props = { size: 24, fill: "currentColor", className: `text-[${color}] opacity-90` };
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
            case 'Coffee': return <Coffee {...props} />;
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
            </header>


            {/* Skyheal AI Hero Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 shadow-2xl shadow-indigo-500/30 text-white cursor-pointer group"
                onClick={() => navigate('/chat')}
            >
                {/* Decorative glowing blobs matching mobile */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                <div className="absolute -bottom-24 -left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000" />
                
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Icon section with pulse */}
                    <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center relative z-10 border border-white/20 shadow-xl">
                            <Bot size={40} className="text-white drop-shadow-md" />
                        </div>
                        <div className={`absolute inset-0 bg-white/20 rounded-3xl border border-white/40 transition-all duration-1000 ease-out ${pulse ? 'scale-125 opacity-0' : 'scale-100 opacity-100'}`} />
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-lg mb-4 border border-white/10 shadow-sm">
                            <Sparkles size={12} className="text-purple-200" />
                            <span className="text-[9px] font-black tracking-[0.2em] text-purple-100 uppercase">Virtual Companion</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3 drop-shadow-md">Skyheal AI</h2>
                        <p className="text-white/80 font-medium leading-relaxed max-w-xl text-sm md:text-base mb-6">
                            Your personal mental wellness guide, available 24/7 for support and insights based on your medical profile.
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-4">
                            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 border border-white/10 shadow-lg">
                                Start Conversation <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Scheduled Events — from consults API */}
            {appointments.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6 pl-2">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Upcoming Consultations</h2>
                        </div>
                        <button
                            onClick={() => navigate('/schedule')}
                            className="text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
                        >
                            My Schedule
                        </button>
                    </div>
                    <div className="space-y-4">
                        {appointments.slice(0, 2).map((appt: Consultation, i: number) => {
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
                            const isExpanded = expandedAppointment === String(appt.id);

                            return (
                                <motion.div
                                    key={appt.id || i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="card-premium bg-white p-5 border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                                    onClick={() => setExpandedAppointment(isExpanded ? null : String(appt.id))}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                {isVirtual ? <Video size={20} /> : <MapPin size={20} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 mb-1">{appt.reason || 'Consultation'}</h3>
                                                <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                                                    <span className="flex items-center gap-1.5"><Clock size={12} />{!isNaN(dt.getTime()) ? `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'TBD'}</span>
                                                    {professional && <span className="flex items-center gap-1.5"><User size={12} />{professional.name}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${getConsultStatusColor(statusSlug)}`}>
                                                {statusName}
                                            </span>
                                            <ChevronDown size={20} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-5 pt-5 border-t border-slate-50 overflow-hidden">
                                            <div className="flex gap-3">
                                                <button className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors">Reschedule</button>
                                                <button 
                                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-colors shadow-lg shadow-indigo-200"
                                                    onClick={(e) => { e.stopPropagation(); navigate('/teleconsult'); }}
                                                >
                                                    Join Session
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Mood Trajectory Chart */}
            <section className="card-premium p-10 space-y-8 bg-white border-slate-100">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={16} className="text-indigo-600" />
                            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Wellness Overview</h2>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Mood Trajectory</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic mt-1">Weekly Delta Analysis</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-3xl font-black text-indigo-600">82%</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Neural Balance</span>
                    </div>
                </div>
                
                <TrendAreaChart 
                    data={[
                        { label: 'Mon', value: 65 },
                        { label: 'Tue', value: 72 },
                        { label: 'Wed', value: 68 },
                        { label: 'Thu', value: 75 },
                        { label: 'Fri', value: 82 },
                        { label: 'Sat', value: 78 },
                        { label: 'Sun', value: 85 },
                    ]} 
                    height={200} 
                    color="#6366f1" 
                />
            </section>

            {/* Mental Health Services — from masters API */}
            <section>
                <div className="flex items-center justify-between mb-6 pl-2">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Wellness Assessments</h2>
                    </div>
                    <button
                        onClick={() => navigate('/assessments')}
                        className="text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors"
                    >
                        Explore All
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {masters.length > 0 ? masters.slice(0, 4).map((m: AssessmentMaster, i: number) => {
                        const style = slugStyleMap[m.slug || ''] || { icon: 'Brain', color: '#6366F1' };
                        const progress = Math.min(Math.floor(Math.random() * 40) + 60, 100);
                        
                        return (
                            <motion.button
                                key={m.id || m._id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => navigate(`/assessments/${m.slug}`)}
                                className="card-premium p-5 bg-white border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group text-left"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors" style={{ backgroundColor: `${style.color}15` }}>
                                        <div style={{ color: style.color }}>
                                            {getIcon(style.icon, style.color)}
                                        </div>
                                    </div>
                                    <CircularProgress 
                                        size={46} 
                                        rings={[
                                            { 
                                                progress: progress / 100, 
                                                color: style.color, 
                                                radius: 18, 
                                                strokeWidth: 4, 
                                                id: `${m.id}-ring` 
                                            }
                                        ]}
                                    />
                                </div>
                                <h3 className="font-extrabold text-sm text-slate-900 mb-3 truncate pr-2 group-hover:text-indigo-600 transition-colors">{m.name}</h3>
                                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden mt-auto mb-2">
                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: style.color }} />
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{progress}% Completed</p>
                            </motion.button>
                        );
                    }) : (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-40 bg-slate-50 rounded-3xl border border-slate-100 animate-pulse" />
                        ))
                    )}
                </div>
            </section>

            {/* Clinical Insights Gateway */}
            <section>
                <div className="flex items-center justify-between mb-6 pl-2">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 bg-teal-500 rounded-full" />
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Clinical Insights</h2>
                    </div>
                </div>
                <motion.div 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/records')}
                    className="card-premium p-6 md:p-8 bg-white border-slate-100 flex items-center justify-between cursor-pointer group hover:shadow-lg transition-all"
                >
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-emerald-200 flex items-center justify-center p-3 text-white">
                            <LineChart size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 mb-1 tracking-tight">Your progress is looking great!</h3>
                            <p className="text-sm font-medium text-slate-500">Tap to see your detailed clinical history, HPI, and reports.</p>
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        <ChevronRight size={20} />
                    </div>
                </motion.div>
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
