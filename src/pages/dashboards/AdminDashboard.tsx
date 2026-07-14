import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Bell,
    IndianRupee,
    TrendingUp,
    Building2,
    Video
} from 'lucide-react';
import Button from '../../components/ui/Button';
import type { RootState } from '../../store';
import api from '../../api/client';
import { DashboardService } from '../../api/services/dashboard.service';
import type { SuperAdminStats } from '../../types/stats.types';

const AdminDashboard = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [stats, setStats] = useState<any>(null);
    const [superStats, setSuperStats] = useState<SuperAdminStats | null>(null);
    const [health, setHealth] = useState<{ status?: string; version?: string; cpu_load?: string; storage_usage?: string; db_latency?: string } | null>(null);
    const [notifications, setNotifications] = useState<{ read?: boolean; message?: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const requests: Promise<any>[] = [
                    api.get('users/stats'),
                    api.get('health'),
                    api.get('notifications')
                ];

                if (isSuperAdmin) {
                    requests.push(DashboardService.getSuperAdminStats());
                }

                const results = await Promise.allSettled(requests);

                if (results[0].status === 'fulfilled') {
                    const fullData = results[0].value.data;
                    setStats(fullData?.data || fullData);
                }

                if (results[1].status === 'fulfilled') {
                    setHealth(results[1].value.data?.data || results[1].value.data);
                }

                if (results[2].status === 'fulfilled') {
                    const notifyData = results[2].value.data?.data || results[2].value.data;
                    setNotifications(Array.isArray(notifyData) ? notifyData : []);
                }

                if (isSuperAdmin && results[3]?.status === 'fulfilled') {
                    setSuperStats(results[3].value);
                }
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [isSuperAdmin]);

    const getCount = (key: string): number => {
        if (isSuperAdmin && superStats) {
            if (key === 'total') return superStats.users?.total || 0;
            if (key === 'hospital') return superStats.entities?.hospitals || 0;
            if (key === 'consultations') return superStats.consultations?.active || 0;
            return superStats.users?.byRole?.[key] || 0;
        }
        
        if (!stats) return 0;
        const s = stats as any;
        const val = s[key] !== undefined ? s[key] : s.byRole?.[key];
        if (typeof val === 'number') return val;
        
        return 0; // Simplified for brevity in this replacement
    };

    const systemMetrics = isSuperAdmin && superStats ? [
        { label: 'Global Revenue', value: (superStats.revenue?.formatted || '₹0').replace('$', '₹'), icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Active Sessions', value: (superStats.consultations?.active ?? 0).toString(), icon: Video, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Health Facilities', value: (superStats.entities?.hospitals ?? 0).toString(), icon: Building2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Total Registry', value: (superStats.users?.total ?? 0).toString(), icon: Users, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    ] : [
        { label: 'System Status', value: health?.status === 'ok' ? 'Healthy' : 'Active', icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Global Users', value: stats ? getCount('total').toString() : '...', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'API Version', value: health?.version || 'v1.0', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Active Alerts', value: notifications.filter(n => !n.read).length.toString(), icon: Bell, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    ];


    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl ">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-500 mb-1">
                        <Lock size={16} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">System Root • {isSuperAdmin ? 'Super Admin' : 'Admin'} Portal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black tracking-tight text-main">System Command Center, {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.name || user?.username || 'Admin')}.</h1>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border mt-1 shadow-sm ring-1 ${
                            isSuperAdmin ? 'bg-red-500/10 text-red-500 border-red-500/20 ring-red-500/10' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 ring-indigo-500/10'
                        }`}>
                            {isSuperAdmin ? 'Super Admin' : 'Administrator'}
                        </span>
                    </div>
                    <p className="text-muted font-medium whitespace-pre-line">
                        Monitoring the global health and security of the MindBalance clinical network.
                        {isSuperAdmin && "\nYou have full clearance for platform-wide revenue and clinical operations."}
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" className="px-6 border-border-card text-muted hover:bg-page" leftIcon={<Search size={18} />}>
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
                        className="p-8 glass-card bg-card border-border-card group relative overflow-hidden h-full flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`${metric.bg} ${metric.color} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                <metric.icon size={24} />
                            </div>
                            <ArrowUpRight className="text-muted/50 group-hover:text-indigo-500 transition-colors" size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-muted uppercase tracking-widest">{metric.label}</p>
                            <h3 className="text-3xl font-black text-main mt-2 tracking-tighter">{metric.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* System Infrastructure */}
                <section className="lg:col-span-2 card-premium bg-card overflow-hidden flex flex-col border border-border-card rounded-[2.5rem]">
                    <div className="p-8 border-b border-border-card flex items-center justify-between glass-surface">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                                <Server size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-main tracking-tight">Infrastructure Cluster</h1>
                                <p className="text-muted font-bold text-[10px] uppercase tracking-widest mt-1">Global node distribution health</p>
                            </div>
                        </div>
                        <button className="p-2 text-muted hover:bg-page rounded-xl transition-all relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>

                    <div className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-6 bg-page/50 rounded-[2rem] border border-transparent hover:border-indigo-500/30 transition-all text-center">
                                <Cpu size={32} className="mx-auto text-indigo-500 mb-4" />
                                <h4 className="font-black text-xl text-main">{health?.cpu_load || '0%'}</h4>
                                <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">CPU Load</p>
                            </div>
                            <div className="p-6 bg-page/50 rounded-[2rem] border border-transparent hover:border-emerald-500/30 transition-all text-center">
                                <Database size={32} className="mx-auto text-emerald-500 mb-4" />
                                <h4 className="font-black text-xl text-main">{health?.storage_usage || '0%'}</h4>
                                <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">Storage Usage</p>
                            </div>
                            <div className="p-6 bg-page/50 rounded-[2rem] border border-transparent hover:border-orange-500/30 transition-all text-center">
                                <Activity size={32} className="mx-auto text-orange-500 mb-4" />
                                <h4 className="font-black text-xl text-main">{health?.db_latency || '0ms'}</h4>
                                <p className="text-[10px] text-muted font-black uppercase tracking-widest mt-1">DB Latency</p>
                            </div>
                        </div>

                        <div className="mt-10 space-y-6">
                            <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">Recent System Audit Events</h4>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
                                {notifications.length > 0 ? (
                                    notifications.map((log, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-page rounded-2xl transition-all border-b border-border-card last:border-0 group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${log.read ? 'bg-muted/50' : 'bg-orange-500'}`}></div>
                                                <div>
                                                    <p className="text-sm font-bold text-main">{String(log.message || '')}</p>
                                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">Admin Event</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-muted">Recently</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm italic text-muted">No recent audit logs.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="space-y-8">
                    {/* Security Shield */}
                    <section className="bg-indigo-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-600 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-30"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-card/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                    <ShieldCheck size={28} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Security Status</p>
                                    <p className="font-bold text-xl">Active Shield 2.0</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm py-4 border-b border-white/10">
                                    <span className="text-indigo-200 font-medium">Firewall</span>
                                    <span className="font-black text-emerald-400 uppercase tracking-widest text-[10px]">Optimized</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2">
                                    <span className="text-indigo-200 font-medium">Encryption</span>
                                    <span className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                        <span className="font-black text-emerald-400 uppercase tracking-widest text-[10px]">AES-256</span>
                                    </span>
                                </div>
                            </div>

                            <Button variant="white" size="lg" className="w-full text-indigo-950 py-5">
                                Security Overview
                            </Button>
                        </div>
                    </section>

                    {/* Global Distribution */}
                    <section className="card-premium bg-card border border-border-card rounded-[2.5rem] p-8 group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center glow-primary">
                                <Users size={20} />
                            </div>
                            <h3 className="font-black text-base text-main">User Distribution</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Active Psychiatrists', count: getCount('psychiatrist'), color: 'bg-emerald-500' },
                                { label: 'Nursing Staff', count: getCount('nurse'), color: 'bg-indigo-500' },
                                { label: 'Admin Support', count: getCount('admin'), color: 'bg-orange-500' },
                            ].map((staff, i) => {
                                const total = getCount('total') || 1;
                                return (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted">
                                            <span>{staff.label}</span>
                                            <span>{staff.count}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-page rounded-full overflow-hidden">
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
