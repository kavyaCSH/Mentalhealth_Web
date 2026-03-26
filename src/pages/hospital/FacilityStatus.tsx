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
    AlertCircle,
    ChevronRight,
    Search,
    Filter,
    Server,
    Database,
    Cloud
} from 'lucide-react';
import Button from '../../components/ui/Button';

const FacilityStatus = () => {
    const navigate = useNavigate();

    const stats = [
        { label: 'Active Depts', value: '12', icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+2' },
        { label: 'Current Load', value: '42%', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Optimal' },
        { label: 'Cloud Sync', value: 'Stable', icon: Globe, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '12ms' },
        { label: 'Staff On-Call', value: '28', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Full' }
    ];

    const departmentStatus = [
        { name: 'Radiology', status: 'Online', load: 65, color: 'bg-indigo-500' },
        { name: 'Emergency', status: 'High Volume', load: 88, color: 'bg-rose-500' },
        { name: 'Pharmacy', status: 'Online', load: 45, color: 'bg-emerald-500' },
        { name: 'Laboratory', status: 'Maintenance', load: 12, color: 'bg-amber-500' },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in pb-20">
            {/* Header with Glass Effect Profile */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-600 transition-all"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Return to Hub
                    </button>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-2xl shadow-indigo-100 border border-indigo-50 glow-primary relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white group-hover:scale-110 transition-transform" />
                            <ShieldCheck size={32} className="relative z-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Operational Intelligence Active</p>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Facility Health</h1>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" className="px-8 border-slate-200" leftIcon={<Search size={18} />}>
                        Diagnostic Search
                    </Button>
                    <Button variant="primary" size="lg" className="px-8 shadow-xl shadow-indigo-100" leftIcon={<Filter size={18} />}>
                        Dept Overrides
                    </Button>
                </div>
            </header>

            {/* Metrics Dashboard */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 glass-card group relative overflow-hidden hover:border-indigo-100"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-500`}>
                                <stat.icon size={24} />
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2.5 py-1 bg-slate-50 rounded-lg">
                                {stat.trend}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-slate-900 tracking-tight">{stat.value}</h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
                        </div>
                        <div className="absolute bottom-0 left-0 h-1 w-0 bg-indigo-500 group-hover:w-full transition-all duration-700" />
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Viewport: Infrastructure Matrix */}
                <section className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Infrastructure Matrix</h2>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Scale: Real-time</span>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {departmentStatus.map((dept, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + (i * 0.1) }}
                                className="p-8 card-premium flex flex-col justify-between group hover:border-indigo-100"
                            >
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 mb-1">{dept.name}</h3>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${dept.status === 'Online' ? 'text-emerald-500' : dept.status === 'Maintenance' ? 'text-amber-500' : 'text-rose-500'}`}>
                                            {dept.status}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Load Distribution</span>
                                        <span className="text-slate-900">{dept.load}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${dept.load}%` }}
                                            className={`h-full ${dept.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* System Feed Placeholder */}
                    <div className="p-12 text-center space-y-6 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                        <div className="flex justify-center gap-4">
                            {[Server, Database, Cloud].map((Icon, i) => (
                                <div key={i} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-200 border border-slate-100 shadow-sm">
                                    <Icon size={24} />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900 italic tracking-tight">Syncing Operational Logs...</h3>
                            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">The high-frequency diagnostic analyzer is processing telemetry data from <b>14 departments</b>. Advanced metrics will appear shortly.</p>
                        </div>
                        <Button variant="outline" className="rounded-2xl border-slate-200 font-black uppercase tracking-widest text-[10px] px-8 py-3">
                            Configure Diagnostic Thresholds
                        </Button>
                    </div>
                </section>

                <section className="space-y-8">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Alerts</h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: 'Weekly Backup Pending', desc: 'System maintenance scheduled for Sunday 2AM EST', tag: 'MAINTENANCE', pulse: 'bg-amber-500' },
                            { title: 'API Sync Latency', desc: 'Slight delay detected in international cloud regions', tag: 'NETWORK', pulse: 'bg-indigo-500' },
                            { title: 'Security Patch Available', desc: 'Version 4.1.2 ready for deployment across nodes', tag: 'SECURITY', pulse: 'bg-emerald-500' },
                        ].map((alert, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="flex gap-5 relative z-10">
                                    <div className="shrink-0 w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                                        <AlertCircle size={24} />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-1.5 h-1.5 rounded-full ${alert.pulse} animate-pulse`} />
                                            <span className="text-[8px] font-black text-slate-400 tracking-[0.2em]">{alert.tag}</span>
                                        </div>
                                        <p className="text-sm font-black text-slate-900 leading-tight">{alert.title}</p>
                                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{alert.desc}</p>
                                    </div>
                                </div>
                                <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight size={16} className="text-indigo-400" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Operational Summary Mini-Card */}
                    <div className="p-8 bg-indigo-900 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Global Status</p>
                                    <p className="font-bold text-lg">System-Wide Unity</p>
                                </div>
                            </div>
                            <p className="text-xs font-medium text-indigo-100/80 leading-relaxed italic">"All nodes operating within standard parameters. Latency is minimal across all clinical services."</p>
                            <Button variant="white" className="w-full text-indigo-900 font-black uppercase tracking-widest text-[10px] py-4">
                                View Full Analytics
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default FacilityStatus;

