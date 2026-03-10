import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ShieldCheck,
    Activity,
    ArrowLeft,
    Box,
    Globe,
    Zap,
    Users,
    AlertCircle
} from 'lucide-react';
import Button from '../../components/ui/Button';

const FacilityStatus = () => {
    const navigate = useNavigate();

    const stats = [
        { label: 'Active Depts', value: '12', icon: <Box className="text-indigo-600" size={20} />, color: 'bg-indigo-50 border-indigo-100' },
        { label: 'Current Load', value: '42%', icon: <Zap className="text-amber-600" size={20} />, color: 'bg-amber-50 border-amber-100' },
        { label: 'Cloud Sync', value: 'Stable', icon: <Globe className="text-emerald-600" size={20} />, color: 'bg-emerald-50 border-emerald-100' },
        { label: 'Staff On-Call', value: '28', icon: <Users className="text-purple-600" size={20} />, color: 'bg-purple-50 border-purple-100' }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            <header className="space-y-4">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Hub
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Facility Status</h1>
                        <p className="text-slate-500 font-medium">Real-time operational health and infrastructure monitoring.</p>
                    </div>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-6 rounded-3xl border ${stat.color} shadow-sm space-y-4`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                {stat.icon}
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live</span>
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <section className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight px-2">Operational Health</h2>
                    <div className="card-premium p-12 text-center space-y-6 bg-slate-50/50 border-dashed border-2">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto border border-slate-100">
                            <Activity size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900">Analytics Engine Warming Up</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto">We're aggregating data across all departments to provide detailed performance insights. Check back soon for full metrics.</p>
                        </div>
                        <Button variant="outline" size="md">
                            Configure Alert Thresholds
                        </Button>
                    </div>
                </section>

                <section className="space-y-6">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight px-2">System Alerts</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:border-indigo-100">
                                <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                    <AlertCircle size={20} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900">Weekly Backup Pending</p>
                                    <p className="text-[10px] text-slate-400 font-medium">System maintenance scheduled for Sunday 2AM EST.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default FacilityStatus;
