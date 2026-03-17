import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Moon,
    Brain,
    TrendingUp,
    RefreshCw,
    Heart,
    Zap,
    Clock,
    ChevronDown,
    ArrowUpRight,
    Sparkles,
    BarChart3,
    Activity,
    BrainCircuit
} from 'lucide-react';
import { DashboardService } from '../../api/services/dashboard.service';
import CircularProgress from '../../components/common/CircularProgress';
import TrendAreaChart from '../../components/common/TrendAreaChart';

const StatisticsPage = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await DashboardService.getPatientDashboard();
            const d = response?.data || response;
            setData(d);
        } catch (err) {
            console.error('Failed to fetch clinical statistics', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const awareness = data?.awareness || 76;
    const sleep = data?.sleep || 64;
    const insight = data?.insight || 82;
    const healthScore = data?.stats?.profileCompleteness || 88;
    
    const moodTrendData = [
        { label: 'Mon', value: 65 },
        { label: 'Tue', value: 72 },
        { label: 'Wed', value: 68 },
        { label: 'Thu', value: 75 },
        { label: 'Fri', value: 82 },
        { label: 'Sat', value: 78 },
        { label: 'Sun', value: 85 },
    ];

    const mainStats = [
        { label: 'Clinical Sessions', value: data?.totalSessions || 12, icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+2 this week' },
        { label: 'Avg Heart Rate', value: `${data?.heartRate || 72} BPM`, icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', trend: 'Stable flow' },
        { label: 'Energy Burn', value: `${data?.calories || 450} kcal`, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'Peak activity' },
        { label: 'Mindful Focus', value: data?.focusTime || '4.2h', icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+15% consistency' },
    ];

    const breakdowns = [
        { label: 'Cognitive Awareness', value: awareness, color: 'bg-indigo-600', icon: Brain, description: 'Neural engagement and mental clarity levels.' },
        { label: 'Restorative Sleep', value: sleep, color: 'bg-blue-500', icon: Moon, description: 'Deep sleep cycles and recovery metrics.' },
        { label: 'Clinical Insight', value: insight, color: 'bg-violet-500', icon: BrainCircuit, description: 'Awareness of symptoms and treatment alignment.' },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <BarChart3 size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Longitudinal Performance</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Wellness Analytics</h1>
                    <p className="text-slate-500 font-medium">Deep-dive analysis of your mental and physiological wellness trajectories.</p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''} text-indigo-600`} />
                    Refresh Matrix
                </button>
            </header>

            {loading && !data ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aggregating Health Matrix...</p>
                </div>
            ) : (
                <div className="grid gap-10 lg:grid-cols-12">
                    {/* Main Stats Grid */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Hero Section */}
                        <section className="card-premium p-10 bg-white border-slate-100 flex flex-col md:flex-row items-center gap-12 shadow-2xl shadow-indigo-50/50">
                            <div className="flex-shrink-0">
                                <CircularProgress 
                                    size={180}
                                    centerValue={`${healthScore}%`}
                                    centerLabel="Health Score"
                                    rings={[
                                        { id: 'awareness', progress: awareness / 100, color: '#6366f1', radius: 75 },
                                        { id: 'sleep', progress: sleep / 100, color: '#3b82f6', radius: 60 },
                                        { id: 'insight', progress: insight / 100, color: '#8b5cf6', radius: 45 },
                                    ]}
                                />
                            </div>
                            <div className="flex-1 space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={16} className="text-orange-400" />
                                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Clinical Status</h2>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Optimal Baseline</h3>
                                    <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                                        Your neural engagement and restorative sleep cycles are currently operating within the <span className="text-indigo-600 font-bold italic">High Variance Zone</span>, showing consistent improvement.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Consistency</p>
                                        <p className="text-lg font-black text-slate-900">94.2%</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Recovery Rate</p>
                                        <p className="text-lg font-black text-slate-900">Improved</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {mainStats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="card-premium p-8 group hover:border-indigo-100 transition-all cursor-default bg-white border-slate-100"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                            <stat.icon size={28} />
                                        </div>
                                        <ArrowUpRight className="text-slate-200 group-hover:text-indigo-400 transition-colors" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                        <h3 className="text-3xl font-black text-slate-900 mt-2">{stat.value}</h3>
                                        <div className="flex items-center gap-2 mt-3 p-2 bg-slate-50 rounded-xl inline-flex border border-slate-100">
                                            <TrendingUp size={12} className="text-emerald-500" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.trend}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </section>

                        <section className="card-premium p-10 space-y-10 bg-white border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-1">Mood Trajectory</h2>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Weekly Clinical Delta Analysis</p>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Activity size={24} />
                                </div>
                            </div>

                            <TrendAreaChart data={moodTrendData} height={240} color="#6366f1" />
                        </section>
                    </div>

                    {/* Sidebar: Breakdowns */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="card-premium p-8 space-y-8 bg-white border-slate-100">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Domain Analysis</h2>
                                <ChevronDown size={20} className="text-slate-300" />
                            </div>

                            <div className="space-y-10">
                                {breakdowns.map((item, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg bg-slate-50 text-slate-400`}>
                                                    <item.icon size={16} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.label}</span>
                                            </div>
                                            <span className="text-xs font-black text-indigo-600 italic">Level: {item.value}%</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.value}%` }}
                                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 + i * 0.2 }}
                                                className={`h-full rounded-full ${item.color} shadow-sm`}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
                            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500 rounded-full blur-[80px] opacity-20"></div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl shadow-black/10">
                                        <Sparkles size={28} className="text-orange-300" />
                                    </div>
                                    <h3 className="font-black text-xl tracking-tight">Clinical Insights</h3>
                                </div>
                                <p className="text-slate-400 text-sm leading-relaxed font-bold italic">
                                    "Your longitudinal sleep hygiene has improved by <span className="text-indigo-400 font-black">12%</span> following the last three meditation cycles. Continuity is critical to cognitive restoration."
                                </p>
                                <button className="w-full py-5 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all active:scale-95 shadow-xl">
                                    Unlock Protocols
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatisticsPage;
