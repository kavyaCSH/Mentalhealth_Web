import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    UserCheck,
    ChevronRight,
    Calendar,
    ClipboardList,
    Clock,
    Filter
} from 'lucide-react';
import type { RootState } from '../../store';
import api from '../../api/client';


const PractitionerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [stats, setStats] = useState<{ activePatients?: number; totalSessions?: number; totalRevenue?: number } | null>(null);
    const [todaySessions, setTodaySessions] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/dashboards/specialist');
                const data = response.data.data || response.data;
                
                setStats(data.stats || null);
                setTodaySessions(data.todaySessions?.sessions || []);
            } catch (error) {
                console.error('Failed to fetch practitioner data:', error);
            }
        };

        fetchData();
    }, []);

    const metrics = [
        { label: 'Active Patients', value: stats?.activePatients?.toString() || '0', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Sessions', value: stats?.totalSessions?.toString() || '0', icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Today\'s Sessions', value: todaySessions.length.toString(), icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const recentSessions = todaySessions.slice(0, 5);

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl ">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <UserCheck size={16} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{user?.role?.replace('_', ' ')} • Clinical Portal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Welcome, Dr. {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.name || user?.username || 'Practitioner')}.</h1>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 mt-1">
                            {user?.role?.includes('psych') ? 'Specialist' : user?.role?.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 glass-card group relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`${metric.bg} ${metric.color} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 glow-primary`}>
                                <metric.icon size={24} />
                            </div>
                            <span className="text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                Active
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-2">{metric.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8">
                {/* Appointment Queue */}
                <section className="card-premium overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between glass-surface">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Today's Sessions</h1>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Live patient encounters</p>
                            </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                            <Filter size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            {recentSessions.length > 0 ? (
                                recentSessions.map((session) => (
                                    <motion.div
                                        key={session.id || session._id || Math.random()}
                                        whileHover={{ x: 10 }}
                                        className="p-5 bg-slate-50/50 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 rounded-[1.5rem] transition-all flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-slate-400">
                                                {session.patient?.firstName?.[0] || '?'}{session.patient?.lastName?.[0] || ''}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{session.patient?.firstName || 'Unknown'} {session.patient?.lastName || 'Patient'}</h4>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{session.status || 'Scheduled'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10">
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-900">{session.date ? new Date(session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Time</p>
                                            </div>
                                            <button className="p-2 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-all" onClick={() => navigate(`/patients/${session.patient?.id || session.patient?._id || ''}`)}>
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                            ))
                        ) : (
                            <div className="text-center p-8 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-slate-400 text-sm font-bold">
                                No sessions scheduled for today
                            </div>
                        )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PractitionerDashboard;
