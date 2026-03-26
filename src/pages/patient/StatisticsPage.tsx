import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
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
    Flame
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
            setError(null);
            const response = await DashboardService.getPatientStatistics();
            const d = response?.data || response;
            if (d && Object.keys(d).length > 2) { // Heuristic: check if we got real stats
                setData(d);
            } else {
                throw new Error('Incomplete data');
            }
        } catch (err: any) {
            console.error('Failed to fetch clinical statistics', err);
            // Fallback to basic dashboard stats if specific ones fail
            try {
                const dashRes = await DashboardService.getPatientDashboard();
                const d = dashRes?.data || dashRes;
                if (d) {
                    setData({
                        activity: { currentStreak: 0, totalMoodLogs: 0 },
                        consultations: { attended: 0, upcoming: 0, cancelled: 0 },
                        assessments: { 
                            completionRate: d.stats?.profileCompleteness || 0,
                            completed: d.stats?.totalAssessments || 0,
                            pending: 0 
                        },
                        moodAnalytics: { period: 'Weekly', distribution: {} }
                    });
                }
            } catch (fallbackErr) {
                setError('Analytics engine unreachable. Please verify session state.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const [error, setError] = useState<string | null>(null);

    // Mobile-aligned Data Mapping with fallback to safety
    const completionRate = data?.assessments?.completionRate || 0;
    const completedAssessments = data?.assessments?.completed || 0;
    const pendingTasks = data?.assessments?.pending || 0;
    
    // Support trend data from API or fallback to sample for UX verification
    const trendData = (Array.isArray(data?.moodAnalytics?.trend) && data.moodAnalytics.trend.length > 0) 
        ? data.moodAnalytics.trend.map((item: any) => ({
            label: item.date ? new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }) : '--',
            value: parseInt(item.score) || 0
          }))
        : [
            { label: '6d ago', value: 65 },
            { label: '5d ago', value: 72 },
            { label: '4d ago', value: 68 },
            { label: '3d ago', value: 75 },
            { label: '2d ago', value: 82 },
            { label: '1d ago', value: 78 },
            { label: 'Today', value: 85 },
        ];

    const activityMetrics = [
        { label: 'Active Streak', value: `${data?.activity?.currentStreak || 0} Days`, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'Consistency active' },
        { label: 'Mood Logs', value: data?.activity?.totalMoodLogs || 0, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Total recordings' },
    ];

    const sessionSummary = [
        { label: 'Attended', value: data?.consultations?.attended || 0, color: 'text-emerald-600' },
        { label: 'Upcoming', value: data?.consultations?.upcoming || 0, color: 'text-indigo-600' },
        { label: 'Cancelled', value: data?.consultations?.cancelled || 0, color: 'text-rose-600' },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <BarChart3 size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Wellness Analytics</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Performance</h1>
                    <p className="text-slate-500 font-medium">Monitoring your wellness journey across sessions and assessments.</p>
                </div>
                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''} text-indigo-600`} />
                    Synchronize Analytics
                </button>
            </header>

            {loading && !data ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Analyzing Wellness Matrix...</p>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="mb-8 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-600 animate-in fade-in slide-in-from-top-2">
                            <div className="p-2 bg-rose-100 rounded-xl">
                                <Activity size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">System Notification</p>
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-10 lg:grid-cols-12">
                    {/* Main Stats Grid */}
                    <div className="lg:col-span-8 space-y-10">
                        <section className="card-premium p-10 bg-white border-slate-100 flex flex-col md:flex-row items-center gap-12 shadow-2xl shadow-indigo-50/50">
                            <div className="flex-shrink-0">
                                <CircularProgress 
                                    size={180}
                                    centerValue={`${completionRate}%`}
                                    centerLabel="COMPLETE"
                                    rings={[
                                        { id: 'completion', progress: completionRate / 100, color: '#6366f1', radius: 75, strokeWidth: 14 },
                                        { id: 'streak', progress: Math.min((data?.activity?.currentStreak || 0) / 30, 1), color: '#10b981', radius: 55, strokeWidth: 12 },
                                        { id: 'total', progress: Math.min((data?.activity?.totalMoodLogs || 0) / 100, 1), color: '#f59e0b', radius: 38, strokeWidth: 10 }
                                    ]}
                                />
                            </div>
                            <div className="flex-1 space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={16} className="text-orange-400" />
                                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Health Engagement</h2>
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Assessment Success</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
                                        <p className="text-xl font-black text-slate-900 italic tracking-tight">{completedAssessments}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Pending</span>
                                        <p className="text-xl font-black text-indigo-600 italic tracking-tight">{pendingTasks}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Streak</span>
                                        <p className="text-xl font-black text-emerald-600 italic tracking-tight">{data?.activity?.currentStreak || 0}d</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Logs</span>
                                        <p className="text-xl font-black text-amber-600 italic tracking-tight">{data?.activity?.totalMoodLogs || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activityMetrics.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="card-premium p-8 group hover:border-indigo-100 transition-all cursor-default bg-white border-slate-100 shadow-xl shadow-slate-100/30"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                            <stat.icon size={28} />
                                        </div>
                                        <ArrowUpRight className="text-slate-200 group-hover:text-indigo-400 transition-colors" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                        <h3 className="text-4xl font-black text-slate-900 mt-2">{stat.value}</h3>
                                        <div className="flex items-center gap-2 mt-3 p-2 bg-slate-50 rounded-xl inline-flex border border-slate-100">
                                            <TrendingUp size={12} className="text-emerald-500" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.trend}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </section>

                        {/* Session Summary Card */}
                        <section className="card-premium p-10 bg-white border-slate-100 shadow-xl shadow-indigo-50/30">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tight">Session Summary</h2>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Clinical consultation engagement</p>
                                </div>
                                <Zap className="text-indigo-600" size={24} />
                            </div>
                            <div className="grid grid-cols-3 gap-6">
                                {sessionSummary.map((item, i) => (
                                    <div key={i} className="text-center p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <span className={`text-4xl font-black ${item.color} block mb-2`}>{item.value}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="card-premium p-10 space-y-10 bg-white border-slate-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-1">Wellness Index</h2>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Aggregate Progress Trajectory</p>
                                </div>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <Activity size={24} />
                                </div>
                            </div>
                            <TrendAreaChart data={trendData} height={240} color="#6366f1" />
                        </section>
                    </div>

                    {/* Sidebar: Breakdowns */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Mood Balance Card */}
                        <section className="card-premium p-8 space-y-8 bg-white border-slate-100 shadow-2xl shadow-indigo-50/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Mood Balance</h2>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">30-Day Distribution</p>
                                </div>
                                <ChevronDown size={20} className="text-slate-300" />
                            </div>

                            <div className="space-y-10">
                                {data?.moodAnalytics?.distribution && Object.entries(data.moodAnalytics.distribution).length > 0 ? (
                                    Object.entries(data.moodAnalytics.distribution).map(([mood, count]: [string, any], i: number) => {
                                        const distribution = data?.moodAnalytics?.distribution || {};
                                        const totalValues = Object.values(distribution) as number[];
                                        const total = totalValues.reduce((a, b) => a + b, 0);
                                        const percentage = total > 0 ? (Number(count) / total) * 100 : 0;
                                        
                                        return (
                                            <div key={i} className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg bg-indigo-50 text-indigo-600`}>
                                                            <Heart size={16} />
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{mood}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-indigo-600 italic">{count} logs</span>
                                                </div>
                                                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percentage}%` }}
                                                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.5 + i * 0.1 }}
                                                        className={`h-full rounded-full bg-indigo-600 shadow-sm`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center gap-3 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                        <div className="p-3 bg-white rounded-xl shadow-sm">
                                            <Activity className="text-slate-300" size={20} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Mood Logs</p>
                                    </div>
                                )}
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
                                    "Your wellness trajectory shows a <span className="text-indigo-400 font-black">positive variance</span> of 14% this week. Maintaining consistency in mood logging is critical for deep phenotyping."
                                </p>
                                <button className="w-full py-5 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all active:scale-95 shadow-xl">
                                    Unlock Protocols
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

export default StatisticsPage;
