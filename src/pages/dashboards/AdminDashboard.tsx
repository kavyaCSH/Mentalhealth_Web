import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import {
    ShieldCheck,
    Users,
    Server,
    Activity,
    Lock,
    Globe,
    Search,
    ArrowUpRight,
    Zap,
    Cpu,
    Database,
    Bell
} from 'lucide-react';
import Button from '../../components/ui/Button';
import type { RootState } from '../../store';
import api from '../../api/client';

import type { UserStats } from '../../types/user.types';

const AdminDashboard = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [health, setHealth] = useState<{ status?: string; version?: string; cpu_load?: string; storage_usage?: string; db_latency?: string } | null>(null);
    const [notifications, setNotifications] = useState<{ read?: boolean; message?: string }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, healthRes, notifyRes] = await Promise.allSettled([
                    api.get('/users/stats'),
                    api.get('/health'),
                    api.get('/notifications')
                ]);

                if (statsRes.status === 'fulfilled') {
                    const fullData = statsRes.value.data;
                    const extractedStats = fullData?.data || fullData;
                    setStats(extractedStats);
                }

                if (healthRes.status === 'fulfilled') {
                    setHealth(healthRes.value.data?.data || healthRes.value.data);
                }

                if (notifyRes.status === 'fulfilled') {
                    const notifyData = notifyRes.value.data?.data || notifyRes.value.data;
                    setNotifications(Array.isArray(notifyData) ? notifyData : []);
                }
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            }
        };
        fetchData();
    }, []);

    const getCount = (key: string): number => {
        if (!stats) return 0;
        const s = stats as any;
        const val = s[key] !== undefined ? s[key] : s.byRole?.[key];
        if (typeof val === 'number') return val;
        if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);

        const variations: Record<string, string[]> = {
            'total': ['totalCount', 'total_count', 'count'],
            'active': ['activeCount', 'active_count', 'activeUsers'],
            'psychiatrist': ['psychiatrists'],
            'nurse': ['nurses'],
            'admin': ['admins']
        };

        const fallbacks = variations[key] || [];
        for (const fbKey of fallbacks) {
            const fbVal = s[fbKey] !== undefined ? s[fbKey] : s.byRole?.[fbKey];
            if (typeof fbVal === 'number') return fbVal;
            if (typeof fbVal === 'string' && !isNaN(Number(fbVal))) return Number(fbVal);
        }
        return 0;
    };

    const systemMetrics = [
        { label: 'System Status', value: health?.status === 'ok' ? 'Healthy' : 'Active', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Global Users', value: stats ? getCount('total').toString() : '...', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'API Version', value: health?.version || 'v1.0', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: 'Active Alerts', value: notifications.filter(n => !n.read).length.toString(), icon: Bell, color: 'text-pink-600', bg: 'bg-pink-50' },
    ];


    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl ">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <Lock size={16} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">System Root • Super Admin Portal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">System Command Center, {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.name || user?.username || 'Admin')}.</h1>
                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 mt-1 shadow-sm glow-orange ring-1 ring-red-200">
                            Super Admin
                        </span>
                    </div>
                    <p className="text-slate-500 font-medium">Monitoring the global health and security of the MindBalance clinical network.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" className="px-6" leftIcon={<Search size={18} />}>
                        Audit Logs
                    </Button>
                    <Button variant="primary" size="lg" className="px-6" leftIcon={<Globe size={18} />}>
                        Network Health
                    </Button>
                </div>
            </header>

            {/* System Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {systemMetrics.map((metric, i) => (
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
                {/* System Infrastructure */}
                <section className="lg:col-span-2 card-premium overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between glass-surface">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                                <Server size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Infrastructure Cluster</h1>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Global node distribution health</p>
                            </div>
                        </div>
                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>

                    <div className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-transparent hover:border-indigo-100 transition-all text-center">
                                <Cpu size={32} className="mx-auto text-indigo-600 mb-4" />
                                <h4 className="font-black text-xl text-slate-900">{health?.cpu_load || '0%'}</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">CPU Load</p>
                            </div>
                            <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-transparent hover:border-emerald-100 transition-all text-center">
                                <Database size={32} className="mx-auto text-emerald-600 mb-4" />
                                <h4 className="font-black text-xl text-slate-900">{health?.storage_usage || '0%'}</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Storage Usage</p>
                            </div>
                            <div className="p-6 bg-slate-50/50 rounded-[2rem] border border-transparent hover:border-orange-100 transition-all text-center">
                                <Activity size={32} className="mx-auto text-orange-500 mb-4" />
                                <h4 className="font-black text-xl text-slate-900">{health?.db_latency || '0ms'}</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">DB Latency</p>
                            </div>
                        </div>

                        <div className="mt-10 space-y-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent System Audit Events</h4>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                                {notifications.length > 0 ? (
                                    notifications.map((log, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all border-b border-slate-50 last:border-0 group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${log.read ? 'bg-slate-300' : 'bg-orange-500'}`}></div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{String(log.message || '')}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Admin Event</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-slate-400">Recently</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm italic text-slate-400">No recent audit logs.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="space-y-8">
                    {/* Security Shield */}
                    <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-900 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-50"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                    <ShieldCheck size={28} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Security Status</p>
                                    <p className="font-bold text-xl">Active Shield 2.0</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm py-4 border-b border-white/5">
                                    <span className="text-slate-400 font-medium">Firewall</span>
                                    <span className="font-black text-emerald-400 uppercase tracking-widest text-[10px]">Optimized</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2">
                                    <span className="text-slate-400 font-medium">Encryption</span>
                                    <span className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        <span className="font-black text-emerald-400 uppercase tracking-widest text-[10px]">AES-256</span>
                                    </span>
                                </div>
                            </div>

                            <Button variant="white" size="lg" className="w-full text-slate-900 py-5">
                                Security Overview
                            </Button>
                        </div>
                    </section>

                    {/* Global Distribution */}
                    <section className="card-premium p-8 group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center glow-primary">
                                <Users size={20} />
                            </div>
                            <h3 className="font-black text-base text-slate-900">User Distribution</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Active Psychiatrists', count: getCount('psychiatrist'), color: 'bg-emerald-500' },
                                { label: 'Nursing Staff', count: getCount('nurse'), color: 'bg-indigo-500' },
                                { label: 'Admin Support', count: getCount('admin'), color: 'bg-orange-400' },
                            ].map((staff, i) => {
                                const total = getCount('total') || 1;
                                return (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>{staff.label}</span>
                                            <span>{staff.count}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(staff.count / total) * 100}%` }}
                                                className={`h-full ${staff.color} rounded-full`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
