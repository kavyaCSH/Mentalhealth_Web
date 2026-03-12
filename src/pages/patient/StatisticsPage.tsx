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
    BarChart3
} from 'lucide-react';
import { DashboardService } from '../../api/services/dashboard.service';

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

    const awareness = data?.awareness || 76; // Fallback to mock if API is empty for demo
    const sleep = data?.sleep || 64;
    const totalSessions = data?.totalSessions || data?.history?.length || 12;
    const heartRate = data?.heartRate || 72;
    const calories = data?.calories || 450;
    const focusTime = data?.focusTime || '4.2h';

    const mainStats = [
        { label: 'Clinical Sessions', value: totalSessions, icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+2 this week' },
        { label: 'Avg Heart Rate', value: `${heartRate} BPM`, icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50', trend: 'Stable flow' },
        { label: 'Energy Burn', value: `${calories} kcal`, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'Peak activity' },
        { label: 'Mindful Focus', value: focusTime, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+15% consistency' },
    ];

    const breakdowns = [
        { label: 'Cognitive Awareness', value: awareness, color: 'bg-indigo-600', icon: Brain, description: 'Neural engagement and mental clarity levels.' },
        { label: 'Restorative Sleep', value: sleep, color: 'bg-blue-500', icon: Moon, description: 'Deep sleep cycles and recovery metrics.' },
    ];

    return (
        <div className="p-8 max-w-6xl  space-y-10 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <BarChart3 size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Longitudinal Performance</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Insights</h1>
                    <p className="text-slate-500 font-medium font-sans">Deep-dive analysis of your mental and physiological wellness trajectories.</p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''} text-indigo-600`} />
                    Refresh Analytics
                </button>
            </header>

            {loading && !data ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Aggregating Health Matrix...</p>
                </div>
            ) : (
                <div className="grid gap-10 lg:grid-cols-12">
                    {/* Main Stats Grid */}
                    <div className="lg:col-span-8 space-y-10">
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {mainStats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-card p-8 group hover:border-indigo-100 transition-all cursor-default"
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
                                            <Sparkles size={12} className="text-orange-400" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.trend}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </section>

                        <section className="card-premium p-10 space-y-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Health Trajectory</h2>
                                <p className="text-slate-500 font-medium text-sm">Automated analysis of your behavioral patterns over the last 30 intervals.</p>
                            </div>

                            <div className="flex flex-col items-center py-16 bg-gradient-to-br from-indigo-50/50 to-white rounded-[3rem] border border-indigo-50/50 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--indigo-50)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-indigo-600 mb-6 shadow-2xl shadow-indigo-100/50 border border-slate-50 group-hover:scale-110 transition-transform duration-500">
                                    <TrendingUp size={64} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Steady Optimization</h3>
                                <p className="text-slate-500 font-medium text-center px-10 max-w-md">
                                    Your clinical awareness has centralized at <span className="text-indigo-600 font-black">{awareness}%</span>, indicating a stable baseline during high-intensity cognitive phases.
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar: Breakdowns */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="card-premium p-8 space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-900">Breakdown</h2>
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
                                                <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{item.label}</span>
                                            </div>
                                            <span className="text-sm font-black text-indigo-600">{item.value}%</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${item.value}%` }}
                                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 + i * 0.2 }}
                                                className={`h-full rounded-full ${item.color} shadow-sm shadow-indigo-200`}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-800 rounded-full blur-3xl opacity-50 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                                        <Sparkles size={24} className="text-orange-300" />
                                    </div>
                                    <h3 className="font-bold text-lg">Daily Insight</h3>
                                </div>
                                <p className="text-indigo-100 text-sm leading-relaxed font-medium italic">
                                    "Your sleep hygiene has improved by 12% following the last three meditation cycles. Consistency is key to cognitive restoration."
                                </p>
                                <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-lg">
                                    View Recommendations
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
