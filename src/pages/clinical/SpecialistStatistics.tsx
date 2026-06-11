import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BarChart3,
    Users,
    Activity,
    TrendingUp,
    RefreshCw,
    ChevronLeft,
    PieChart,
    Zap,
    ClipboardCheck,
    AlertCircle,
    UserCircle,
    Flame,
    Heart,
    Info,
    Clock
} from 'lucide-react';
import MindBalanceHelpModal from '../../components/clinical/MindBalanceHelpModal';
import { DashboardService } from '../../api/services/dashboard.service';
import type { SpecialistStats, PatientStats } from '../../types/stats.types';

const SpecialistStatistics = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();

    const [stats, setStats] = useState<SpecialistStats | null>(null);
    const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [helpSlug, setHelpSlug] = useState<string | null>(null);

    const openHelp = (slug: string) => setHelpSlug(slug);
    const closeHelp = () => setHelpSlug(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);

            if (patientId) {
                // Fetch specific patient stats (from specialist's perspective)
                // Appending patientId as a query param or path param based on backend conventions
                const res = await DashboardService.getPatientStatistics(patientId);
                setPatientStats(res.data || res);
            } else {
                // Fetch population stats
                const res = await DashboardService.getSpecialistPatientStatistics();
                setStats(res.data || res);
            }
        } catch (err: any) {
            console.error('Failed to fetch statistics:', err);
            setError('Practice analytics synchronization failure. Retrying connection...');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [patientId]);

    const renderMetricCard = (label: string, value: string | number, icon: any, colorClass: string, bgClass: string) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-8 rounded-[2rem] border border-border-card shadow-sm flex items-center gap-6 group hover:border-indigo-500/30 transition-all"
        >
            <div className={`w-14 h-14 ${bgClass} ${colorClass} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none mb-2">{label}</p>
                <h3 className="text-3xl font-black text-main tracking-tight">{value}</h3>
            </div>
        </motion.div>
    );

    const renderProgressBar = (label: string, count: number, total: number, color: string) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        return (
            <div className="space-y-3" key={label}>
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">{label}</span>
                    <span className="text-xs font-black text-main italic">{count}</span>
                </div>
                <div className="h-2.5 bg-page rounded-full overflow-hidden border border-border-card/50">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full shadow-sm"
                        style={{ backgroundColor: color }}
                    />
                </div>
            </div>
        );
    };

    if (loading && !stats && !patientStats) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <p className="text-sm font-bold text-muted uppercase tracking-widest">Compiling practice intelligence...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-fade-in pb-20 font-bold">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    {patientId && (
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest hover:text-indigo-600 transition-colors"
                        >
                            <ChevronLeft size={14} /> Back to Directory
                        </button>
                    )}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-indigo-600 mb-1">
                            <BarChart3 size={18} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {patientId ? 'Patient Progression' : 'Practice Insights'}
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-main tracking-tight">
                            {patientId ? 'Patient Health Analytics' : 'Population Statistics'}
                        </h1>
                        <p className="text-muted font-medium">
                            {patientId
                                ? 'Monitoring clinical recovery and longitudinal wellness markers.'
                                : 'Aggregate data analysis for the entire patient population.'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-3 px-6 py-4 bg-card border border-border-card hover:border-indigo-500/30 text-main/80 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw size={14} className={`${loading ? 'animate-spin' : ''} text-indigo-600`} />
                    Refresh Analytics
                </button>
            </header>

            {error && (
                <div className="p-6 bg-error/10 border border-error/20 rounded-[2rem] text-error flex items-center gap-4">
                    <AlertCircle size={20} />
                    <p className="text-sm font-black uppercase tracking-tight">{error}</p>
                </div>
            )}

            <div className="grid gap-8 lg:grid-cols-12">
                {patientId && patientStats ? (
                    /* --- PATIENT SPECIFIC VIEW --- */
                    <div className="lg:col-span-12 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {renderMetricCard('Mood Streak', `${patientStats.activity.currentStreak} Days`, <Flame size={28} />, 'text-orange-500', 'bg-orange-500/10')}
                            {renderMetricCard('Clinical Logs', patientStats.activity.totalMoodLogs, <Clock size={28} />, 'text-indigo-500', 'bg-indigo-500/10')}
                            {renderMetricCard('Completion', `${patientStats.assessments.completionRate}%`, <ClipboardCheck size={28} />, 'text-emerald-500', 'bg-emerald-500/10')}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Mood Distribution */}
                            <section className="bg-card p-10 rounded-[2.5rem] border border-border-card shadow-sm space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-main tracking-tight uppercase">Mood Balance</h2>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">30-Day Distribution Matrix</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openHelp('about_mindbalance')}
                                            className="p-2 bg-page text-muted hover:text-indigo-600 rounded-xl transition-all"
                                        >
                                            <Info size={16} />
                                        </button>
                                        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                                            <Heart size={20} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    {patientStats?.moodAnalytics?.distribution && Object.entries(patientStats.moodAnalytics.distribution).map(([mood, count]) => {
                                        const total = Object.values(patientStats.moodAnalytics.distribution).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
                                        return renderProgressBar(mood, Number(count) || 0, total, '#6366f1');
                                    })}
                                </div>
                            </section>

                            {/* Session Summary */}
                            <section className="bg-card p-10 rounded-[2.5rem] border border-border-card shadow-sm flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-main tracking-tight uppercase">Sessions</h2>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Consultation engagement</p>
                                    </div>
                                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                                        <Zap size={20} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-6 pt-10 border-t border-border-card">
                                    <div className="text-center group">
                                        <span className="text-4xl font-black text-emerald-500 block mb-2 group-hover:scale-110 transition-transform">{patientStats.consultations.attended}</span>
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Attended</span>
                                    </div>
                                    <div className="text-center group">
                                        <span className="text-4xl font-black text-indigo-500 block mb-2 group-hover:scale-110 transition-transform">{patientStats.consultations.upcoming}</span>
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Upcoming</span>
                                    </div>
                                    <div className="text-center group">
                                        <span className="text-4xl font-black text-error block mb-2 group-hover:scale-110 transition-transform">{patientStats.consultations.cancelled}</span>
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Cancelled</span>
                                    </div>
                                </div>
                                <div className="mt-auto pt-10">
                                    <div className="p-4 bg-page rounded-2xl border border-border-card flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Compliance Score</span>
                                        </div>
                                        <span className="text-sm font-black text-indigo-500 tracking-tight">V8.4 - OPTIMAL</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                ) : stats ? (
                    /* --- POPULATION VIEW --- */
                    <div className="lg:col-span-12 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {renderMetricCard('Clinical Population', stats.summary.totalPatients, <Users size={28} />, 'text-indigo-500', 'bg-indigo-500/10')}
                            {renderMetricCard('Active Assessments', stats.summary.activeAssessments, <AlertCircle size={28} />, 'text-error', 'bg-error/10')}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Gender Distribution */}
                            <section className="bg-card p-10 rounded-[2.5rem] border border-border-card shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-main uppercase tracking-tight">Gender</h2>
                                    <PieChart size={18} className="text-muted" />
                                </div>
                                <div className="space-y-6">
                                    {renderProgressBar('Male', stats.demographics?.gender?.male || 0, stats.summary?.totalPatients || 0, '#3B82F6')}
                                    {renderProgressBar('Female', stats.demographics?.gender?.female || 0, stats.summary?.totalPatients || 0, '#EC4899')}
                                    {renderProgressBar('Other', stats.demographics?.gender?.other || 0, stats.summary?.totalPatients || 0, '#8B5CF6')}
                                </div>
                            </section>

                            {/* Age Demographics */}
                            <section className="bg-card p-10 rounded-[2.5rem] border border-border-card shadow-sm space-y-8">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-main uppercase tracking-tight">Age Groups</h2>
                                    <UserCircle size={18} className="text-muted" />
                                </div>
                                <div className="space-y-6">
                                    {stats.demographics?.ageGroups && Object.entries(stats.demographics.ageGroups).map(([label, count]) =>
                                        renderProgressBar(label, Number(count) || 0, stats.summary?.totalPatients || 0, '#10b981')
                                    )}
                                </div>
                            </section>

                            {/* Enrollment Trend */}
                            <section className="bg-card p-10 rounded-[2.5rem] border border-border-card shadow-sm space-y-8 lg:row-span-1">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-black text-main uppercase tracking-tight">Enrollments</h2>
                                    <TrendingUp size={18} className="text-emerald-500" />
                                </div>
                                <div className="space-y-5">
                                    {stats.engagement.enrollmentTrend.slice(-5).map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-page rounded-2xl border border-border-card group hover:border-indigo-500/30 transition-all">
                                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">{item.month}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="h-0.5 w-12 bg-border-card group-hover:bg-indigo-500/30 transition-all"></div>
                                                <span className="text-sm font-black text-main">+{item.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Practice-wide Wellness Distribution */}
                        <section className="bg-card p-10 rounded-[2.5rem] border border-border-card shadow-sm space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-main tracking-tight uppercase">Population Mood Variance</h2>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Real-time practice-wide distribution</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openHelp('about_mindbalance')}
                                        className="p-2 bg-page text-muted hover:text-indigo-600 rounded-xl transition-all"
                                    >
                                        <Info size={16} />
                                    </button>
                                    <Activity size={24} className="text-indigo-600" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                {stats.clinical?.moodDistribution && Object.entries(stats.clinical.moodDistribution).map(([mood, count], idx) => (
                                    <motion.div
                                        key={mood}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-6 bg-page rounded-[2rem] border border-border-card text-center hover:border-indigo-500/30 hover:bg-card hover:shadow-lg transition-all group"
                                    >
                                        <span className="text-3xl font-black text-main block mb-2 group-hover:text-indigo-500 transition-colors tracking-tight italic underline decoration-indigo-500/20 underline-offset-4">{Number(count) || 0}</span>
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">{mood}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Practice-wide Assessment Pulse */}
                        <section className="bg-card p-10 rounded-[2.5rem] border border-border-card shadow-sm space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-main tracking-tight uppercase">Clinical Assessment Performance</h2>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Practice screening compliance and historical completion</p>
                                </div>
                                <ClipboardCheck size={24} className="text-emerald-500" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="card-premium p-8 bg-page border-border-card flex flex-col items-center">
                                    <span className="text-5xl font-black text-main mb-2">{stats.assessments?.total || 0}</span>
                                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Total Screenings</span>
                                </div>
                                <div className="card-premium p-8 bg-page border-border-card flex flex-col items-center">
                                    <span className="text-5xl font-black text-emerald-500 mb-2">{stats.assessments?.completed || 0}</span>
                                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Validated Results</span>
                                </div>
                                <div className="card-premium p-8 bg-page border-border-card flex flex-col items-center">
                                    <span className="text-5xl font-black text-error mb-2">{stats.assessments?.pending || 0}</span>
                                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Awaiting Intake</span>
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="lg:col-span-12 py-20 text-center bg-page rounded-[3rem] border-2 border-dashed border-border-card">
                        <BarChart3 size={40} className="mx-auto text-muted mb-4" />
                        <h3 className="text-xl font-black text-main uppercase">Synchronizing clinical data...</h3>
                    </div>
                )}
            </div>
            <MindBalanceHelpModal
                isOpen={!!helpSlug}
                onClose={closeHelp}
                slug={helpSlug || ''}
            />
        </div>
    );
};

export default SpecialistStatistics;
