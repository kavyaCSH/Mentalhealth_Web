import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
    Activity,
    Users,
    ShieldCheck,
    Bell,
    Building2,
    Search,
    ArrowUpRight
} from 'lucide-react';
import Button from '../../components/ui/Button';
import type { RootState } from '../../store';
import api from '../../api/client';
import type { UserStats } from '../../types/user.types';
import type { Notification } from '../../types/common.types';

const HospitalDashboard = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, notifyRes] = await Promise.all([
                    api.get('/users/stats'),
                    api.get('/notifications')
                ]);
                setStats(statsRes.data.data);
                setNotifications(Array.isArray(notifyRes.data.data) ? notifyRes.data.data : []);
            } catch (error) {
                console.error('Failed to fetch hospital data:', error);
            }
        };
        fetchData();
    }, []);

    const facilityMetrics = [
        { label: 'Total Patients', value: stats?.patient?.toString() || '0', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Psychiatrists', value: stats?.psychiatrist?.toString() || '0', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Clinical Staff', value: stats?.nurse?.toString() || '0', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Active Alerts', value: notifications.filter(n => !n.read).length.toString(), icon: Bell, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    const staffComposition = [
        { name: 'Psychiatric Care', count: stats?.psychiatrist || 0, color: 'bg-indigo-500' },
        { name: 'Emergency Nursing', count: stats?.nurse || 0, color: 'bg-emerald-500' },
        { name: 'Facility Admin', count: stats?.admin || 0, color: 'bg-orange-400' },
    ];

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <Building2 size={16} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Facility Management • Hospital Portal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 line-clamp-1">MindBalance {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.name || 'Center')} Overview.</h1>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 mt-1">
                            Hospital Admin
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium">Real-time operational status for all clinical departments.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" className="px-6" leftIcon={<Search size={18} />}>
                        Facility Search
                    </Button>
                    <Button variant="primary" size="lg" className="px-6" leftIcon={<Activity size={18} />}>
                        Operational Report
                    </Button>
                </div>
            </header>

            {/* Facility Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {facilityMetrics.map((metric, i) => (
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
                            <ArrowUpRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-2">{metric.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Department Capacity */}
                <section className="lg:col-span-2 card-premium overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between glass-surface">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                                <Users size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Staff Composition</h1>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Live staff distribution by role</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-10">
                        {staffComposition.map((staff, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center justify-between mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                    <span>{staff.name}</span>
                                    <span className="text-slate-900">{staff.count} Active</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(Number(staff.count) / (Object.values(stats || {}).reduce((a, b) => Number(a) + Number(b), 0) || 1)) * 100}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className={`h-full ${staff.color} rounded-full`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="space-y-8">
                    {/* Recent Notifications */}
                    <section className="bg-indigo-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-800 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                    <Bell size={28} />
                                </div>
                                <div>
                                    <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Facility Alerts</p>
                                    <p className="font-bold text-xl">{notifications.filter(n => !n.read).length} New Updates</p>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[150px] overflow-y-auto no-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.slice(0, 2).map((n, i) => (
                                        <p key={i} className="text-sm font-medium leading-relaxed opacity-90 border-b border-white/10 pb-2 last:border-0">
                                            {n.message}
                                        </p>
                                    ))
                                ) : (
                                    <p className="text-sm italic opacity-80">No priority alerts detected.</p>
                                )}
                            </div>

                            <Button variant="white" size="lg" className="w-full text-indigo-900 py-5">
                                View Alerts center
                            </Button>
                        </div>
                    </section>

                    {/* Staff Distribution */}
                    <section className="card-premium p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center glow-primary">
                                <Users size={20} />
                            </div>
                            <h3 className="font-black text-base text-slate-900">Staff Distribution</h3>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: 'Active Psychiatrists', count: stats?.psychiatrist || 0, total: stats?.psychiatrist || 0 },
                                { label: 'Nursing Staff', count: stats?.nurse || 0, total: stats?.nurse || 0 },
                                { label: 'Admin Support', count: stats?.admin || 0, total: stats?.admin || 0 },
                            ].map((staff, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                    <div>
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{staff.label}</p>
                                        <p className="text-lg font-black text-slate-900 mt-1">{staff.count} <span className="text-slate-400 text-sm">/ {staff.total}</span></p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Active</div>
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

export default HospitalDashboard;
