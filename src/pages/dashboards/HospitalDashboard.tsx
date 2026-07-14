import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Users,
    Bell,
    Building2,
    Search,
    ArrowUpRight,
    UserPlus,
    CalendarPlus,
    CreditCard,
    ClipboardList,
    Stethoscope,
    Brain,
    Heart,
    Calendar,
    UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import api from '../../api/client';
import type { UserStats } from '../../types/user.types';
import type { Notification } from '../../types/common.types';

const HospitalDashboard = () => {
    const navigate = useNavigate();
    // const { user } = useSelector((state: RootState) => state.auth);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, notifyRes] = await Promise.allSettled([
                    api.get('users/stats'),
                    api.get('notifications')
                ]);

                if (statsRes.status === 'fulfilled') {
                    const fullData = statsRes.value.data;
                    console.log('[HospitalDashboard] Raw stats response:', fullData);

                    // Resiliently extract stats object
                    // Based on user provided JSON: { code: 200, message: "...", data: { byRole: {...}, activeCount: 14, totalCount: 14 } }
                    const extractedStats = fullData?.data || fullData;
                    console.log('[HospitalDashboard] Extracted stats:', extractedStats);
                    setStats(extractedStats);
                }

                if (notifyRes.status === 'fulfilled') {
                    const notifyData = notifyRes.value.data?.data || notifyRes.value.data;
                    setNotifications(Array.isArray(notifyData) ? notifyData : []);
                }
            } catch (error) {
                console.error('Failed to fetch hospital data:', error);
            }
        };
        fetchData();
    }, []);

    // Helper to safely get counts from stats supporting plural/singular and nested structures
    const getCount = (key: keyof UserStats | string): number => {
        if (!stats) return 0;

        const s = stats as any;

        // Try exact key at top level or in byRole
        const val = s[key] !== undefined ? s[key] : s.byRole?.[key];
        if (typeof val === 'number') return val;
        if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);

        // Try common variations (plural/singular)
        const variations: Record<string, string[]> = {
            'patient': ['patients', 'totalPatients'],
            'psychiatrist': ['psychiatrists', 'totalPsychiatrists'],
            'psychologist': ['psychologists', 'totalPsychologists'],
            'nurse': ['nurses', 'totalNurses'],
            'social_worker': ['social_workers', 'socialWorkers', 'totalSocialWorkers'],
            'counselor': ['counselors', 'totalCounselors'],
            'admin': ['admins', 'totalAdmins'],
            'total': ['totalCount', 'total_count', 'count'],
            'consultCount': ['consults', 'totalConsults', 'consultationCount'],
            'activeCount': ['active', 'totalActive', 'activeUsers']
        };

        const currentKey = key.toString();
        const fallbackKeys = variations[currentKey] || [];

        for (const fbKey of fallbackKeys) {
            const fbVal = s[fbKey] !== undefined ? s[fbKey] : s.byRole?.[fbKey];
            if (typeof fbVal === 'number') return fbVal;
            if (typeof fbVal === 'string' && !isNaN(Number(fbVal))) return Number(fbVal);
        }

        return 0;
    };

    const facilityMetrics = [
        { label: 'Total Patients', value: getCount('patient').toString(), icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Psychiatrists', value: getCount('psychiatrist').toString(), icon: Stethoscope, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Psychologists', value: getCount('psychologist').toString(), icon: Brain, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Nurses', value: getCount('nurse').toString(), icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Social Workers', value: getCount('social_worker').toString(), icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { label: 'Consults', value: getCount('consultCount').toString(), icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Active Users', value: getCount('activeCount').toString(), icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Facility Alerts', value: notifications.filter(n => !n.read).length.toString(), icon: Bell, color: 'text-red-500', bg: 'bg-red-500/10' },
    ];

    const staffComposition = [
        { name: 'Psychiatrists', count: getCount('psychiatrist'), color: 'bg-indigo-500' },
        { name: 'Psychologists', count: getCount('psychologist'), color: 'bg-purple-500' },
        { name: 'Nursing Staff', count: getCount('nurse'), color: 'bg-orange-500' },
        { name: 'Social Workers', count: getCount('social_worker'), color: 'bg-rose-500' },
        { name: 'Facility Admin', count: getCount('admin'), color: 'bg-muted' },
    ];

    const quickActions = [
        { label: 'Register Clinician', icon: UserPlus, path: '/staff/new', color: 'bg-indigo-600', shadow: 'shadow-indigo-500/20' },
        { label: 'Staff Directory', icon: ClipboardList, path: '/staff', color: 'bg-emerald-600', shadow: 'shadow-emerald-500/20' },
        { label: 'Book Consult', icon: CalendarPlus, path: '/consultations/new', color: 'bg-orange-500', shadow: 'shadow-orange-500/20' },
        { label: 'Billing Central', icon: CreditCard, path: '/billing', color: 'bg-rose-500', shadow: 'shadow-rose-500/20' },
    ];

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl ">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-500 mb-1">
                        <Building2 size={16} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Facility Management • Hospital Portal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black tracking-tight text-main line-clamp-1">MindBalance Center Overview</h1>
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 mt-1">
                            Hospital Admin
                        </span>
                    </div>
                    <p className="text-muted font-medium">Real-time operational status for all clinical departments.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" className="px-6 border-border-card text-muted hover:bg-page" leftIcon={<Search size={18} />} onClick={() => navigate('/staff')}>
                        Facility Search
                    </Button>
                    <Button variant="primary" size="lg" className="px-6" leftIcon={<Activity size={18} />} onClick={() => navigate('/facility')}>
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
                        className="p-8 glass-card bg-card border border-border-card group relative overflow-hidden h-full flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`${metric.bg} ${metric.color} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 glow-primary`}>
                                <metric.icon size={24} />
                            </div>
                            <ArrowUpRight className="text-muted/50 group-hover:text-indigo-500 transition-colors" size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-muted uppercase tracking-widest">{metric.label}</p>
                            <h3 className="text-3xl font-black text-main mt-2">{metric.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Management Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action, i) => (
                    <motion.button
                        key={i}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(action.path)}
                        className="p-8 card-premium bg-card border-border-card flex flex-col items-center text-center group relative overflow-hidden transition-all hover:border-indigo-500/30 active:scale-95"
                    >
                        <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl ${action.shadow} group-hover:scale-110 transition-transform`}>
                            <action.icon size={26} />
                        </div>
                        <h4 className="text-sm font-black text-main uppercase tracking-widest">{action.label}</h4>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Department Capacity */}
                <section className="lg:col-span-2 card-premium bg-card overflow-hidden flex flex-col border border-border-card rounded-[2.5rem]">
                    <div className="p-8 border-b border-border-card flex items-center justify-between glass-surface">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                                <Users size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-main tracking-tight">Staff Composition</h1>
                                <p className="text-muted font-bold text-[10px] uppercase tracking-widest mt-1">Live staff distribution by role</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-10">
                        {staffComposition.map((staff, i) => {
                            const totalStaff = staffComposition.reduce((sum, item) => sum + item.count, 0) || 1;
                            const percentage = (staff.count / totalStaff) * 100;

                            return (
                                <div key={i} className="group">
                                    <div className="flex items-center justify-between mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                                        <span>{staff.name}</span>
                                        <span className="text-main">{staff.count} Active</span>
                                    </div>
                                    <div className="h-2 w-full bg-page rounded-full overflow-hidden shadow-inner">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={`h-full ${staff.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="space-y-8">
                    {/* Recent Notifications */}
                    <section className="bg-indigo-950 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-600 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700 opacity-30"></div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-card/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                    <Bell size={28} />
                                </div>
                                <div>
                                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest">Facility Alerts</p>
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

                            <Button variant="white" size="lg" className="w-full text-indigo-950 py-5" onClick={() => navigate('/notifications')}>
                                View Alerts center
                            </Button>
                        </div>
                    </section>

                    {/* Staff Distribution Detailed */}
                    <section className="card-premium bg-card border border-border-card rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center glow-primary">
                                <Users size={20} />
                            </div>
                            <h3 className="font-black text-base text-main">Staff Distribution</h3>
                        </div>

                        <div className="space-y-6">
                            {[
                                { label: 'Active Psychiatrists', count: getCount('psychiatrist') },
                                { label: 'Psychologists', count: getCount('psychologist') },
                                { label: 'Nursing Staff', count: getCount('nurse') },
                                { label: 'Social Workers', count: getCount('social_worker') },
                                { label: 'Admin Support', count: getCount('admin') },
                            ].map((staff, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-page/50 rounded-2xl border border-transparent hover:border-indigo-500/30 transition-all">
                                    <div>
                                        <p className="text-xs font-black text-muted uppercase tracking-widest">{staff.label}</p>
                                        <p className="text-lg font-black text-main mt-1">{staff.count}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">Active</div>
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
