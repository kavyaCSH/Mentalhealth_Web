import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    TrendingUp,
    UserCheck,
    ChevronRight,
    Search,
    Bell,
    Calendar,
    ClipboardList,
    Clock,
    Filter
} from 'lucide-react';
import Button from '../../components/ui/Button';
import type { RootState } from '../../store';
import api from '../../api/client';
import type { User } from '../../types/user.types';
import type { Notification } from '../../types/common.types';

const PractitionerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [patients, setPatients] = useState<User[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/dashboards/specialist');
                const data = response.data.data || response.data;
                setPatients(data.patients || data.users || []);
                const notifyData = data.notifications || data.alerts || [];
                setNotifications(Array.isArray(notifyData) ? notifyData : []);
            } catch (error) {
                console.error('Failed to fetch practitioner data:', error);
            }
        };

        fetchData();
    }, []);

    const metrics = [
        { label: 'Active Patients', value: patients.length.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Total Assessments', value: patients.reduce((acc, p) => acc + (p.assessments_count || 0), 0).toString(), icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'System Alerts', value: notifications.filter(n => !n.read).length.toString(), icon: Bell, color: 'text-pink-600', bg: 'bg-pink-50' },
        { label: 'Daily Capacity', value: '100%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    const recentPatients = patients.slice(0, 5);

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl mx-auto">
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
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" className="px-6" leftIcon={<Search size={18} />}>
                        Find Patient
                    </Button>
                    <Button variant="primary" size="lg" className="px-6" leftIcon={<Calendar size={18} />}>
                        Manage Schedule
                    </Button>
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

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Appointment Queue */}
                <section className="lg:col-span-2 card-premium overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between glass-surface">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recent Patient Enrollment</h1>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Live patient registration flow</p>
                            </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                            <Filter size={20} />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            {Array.isArray(recentPatients) && recentPatients.map((p) => (
                                <motion.div
                                    key={p.id || p._id}
                                    whileHover={{ x: 10 }}
                                    className="p-5 bg-slate-50/50 hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 rounded-[1.5rem] transition-all flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-bold text-slate-400">
                                            {p.firstName?.[0] || '?'}{p.lastName?.[0] || ''}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{p.firstName} {p.lastName}</h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">{p.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Joined</p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100`}>
                                            Verified
                                        </div>
                                        <button className="p-2 bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-all" onClick={() => navigate(`/patients/${p.id || p._id}`)}>
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-6 py-4 text-xs font-black uppercase tracking-widest">
                            View Full Master Schedule
                        </Button>
                    </div>
                </section>

                <div className="space-y-8">
                    {/* Clinical Notifications */}
                    <section className="bg-orange-500 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-orange-200/50 relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-orange-400 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                    <Bell size={28} />
                                </div>
                                <div>
                                    <p className="text-orange-100 text-[10px] font-black uppercase tracking-widest">Recent Alerts</p>
                                    <p className="font-bold text-xl">{notifications.filter(n => !n.read).length} Unread</p>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[150px] overflow-y-auto no-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.slice(0, 2).map((n, i) => (
                                        <p key={i} className="text-sm font-medium leading-relaxed opacity-90 border-b border-orange-400 pb-2 last:border-0">
                                            {n.message}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-sm italic opacity-80">No priority alerts detected.</p>
                                )}
                            </div>

                            <Button variant="white" size="lg" className="w-full text-orange-600 py-5">
                                Review System Alerts
                            </Button>
                        </div>
                    </section>

                    {/* Practitioner Efficiency */}
                    <section className="card-premium p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center glow-primary">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="font-black text-base text-slate-900">Current Health</h3>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: 'Patient Reach', value: patients.length > 0 ? 100 : 0, color: 'bg-emerald-500' },
                                { label: 'System Sync', value: 100, color: 'bg-indigo-500' },
                            ].map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">{stat.label}</span>
                                        <span className="text-slate-900">{stat.value}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.value}%` }}
                                            className={`h-full ${stat.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default PractitionerDashboard;
