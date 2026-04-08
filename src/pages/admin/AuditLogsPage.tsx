import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    Search, 
    Filter, 
    ShieldCheck, 
    ArrowLeft, 
    Clock, 
    User, 
    Layers, 
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Database,
    Zap,
    Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { AuditService, type AuditLogFilter } from '../../api/services/audit.service';
import type { AuditLog } from '../../types/audit.types';

const AuditLogsPage = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilters, setActiveFilters] = useState<AuditLogFilter>({
        page: 1,
        limit: 50
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await AuditService.getLogs(activeFilters);
            setLogs(Array.isArray(data) ? data : (data as any)?.logs || []);
        } catch (error) {
            console.error('Failed to retrieve audit trail:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeFilters]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const getActionColor = (action: string) => {
        switch (action) {
            case 'WRITE': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            case 'UPDATE': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
            case 'DELETE': return 'text-rose-600 bg-rose-50 border-rose-100';
            case 'LOGIN': return 'text-amber-600 bg-amber-50 border-amber-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl  pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Security HQ
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <ShieldCheck size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Governance Audit Trail</h1>
                            <p className="text-slate-500 font-medium">Real-time surveillance of administrative interventions and clinical modifications.</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" leftIcon={<Download size={18} />} className="rounded-2xl border-slate-200">
                        Export Logs
                    </Button>
                </div>
            </header>

            {/* Live Status Indicators */}
            <div className="grid gap-6 md:grid-cols-3">
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Activity size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Surveillance Status</p>
                        <h3 className="text-2xl font-black text-slate-900">Active Monitoring</h3>
                    </div>
                </div>
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Retention Policy</p>
                        <h3 className="text-2xl font-black text-slate-900">365 Days</h3>
                    </div>
                </div>
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                        <Database size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registry integrity</p>
                        <h3 className="text-2xl font-black text-slate-900">Blockchain Validated</h3>
                    </div>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="card-premium p-8 flex flex-wrap gap-4 items-center justify-between border-slate-100/50">
                <div className="flex flex-wrap gap-3">
                    <div className="relative group">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-400 transition-colors" size={16} />
                        <select 
                            className="pl-11 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                            onChange={(e) => setActiveFilters({...activeFilters, action: e.target.value})}
                        >
                            <option value="">All Actions</option>
                            <option value="WRITE">Writes</option>
                            <option value="UPDATE">Updates</option>
                            <option value="DELETE">Deletions</option>
                            <option value="LOGIN">Auth Events</option>
                        </select>
                    </div>
                    <div className="relative group">
                        <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-indigo-400 transition-colors" size={16} />
                        <select 
                            className="pl-11 pr-8 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                            onChange={(e) => setActiveFilters({...activeFilters, resource: e.target.value})}
                        >
                            <option value="">All Resources</option>
                            <option value="Question">Questions</option>
                            <option value="User">Users</option>
                            <option value="Assessment">Assessments</option>
                            <option value="TaxCode">Finance</option>
                        </select>
                    </div>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search IDs or Admins..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Audit Timeline */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100">
                        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Decrypting Audit Trail...</p>
                    </div>
                ) : logs.length > 0 ? (
                    logs.map((log, i) => (
                        <motion.div
                            key={log._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer overflow-hidden"
                            onClick={() => setSelectedLog(log)}
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-3" style={{ backgroundColor: log.action === 'DELETE' ? '#f43f5e' : log.action === 'WRITE' ? '#10b981' : log.action === 'UPDATE' ? '#6366f1' : '#f59e0b' }} />
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pl-4">
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-900 leading-tight">
                                            {log.description}
                                        </h4>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                <User size={12} className="text-slate-300" />
                                                <span>Initiated by: {log.user.name} ({log.user.role})</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                <Layers size={12} className="text-slate-300" />
                                                <span>Resource: {log.resource} ({log.resourceId || 'N/A'})</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-end md:self-center">
                                    <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-all">
                                        <ExternalLink size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="p-32 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-100">
                        <ShieldCheck size={64} className="mx-auto text-slate-200 mb-6" />
                        <h3 className="text-xl font-black text-slate-900 mb-2">Trail Clear</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto italic">No high-clearance actions have been recorded within the current surveillance window.</p>
                    </div>
                )}
            </div>

            {/* Log Detail Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <header className="p-10 bg-slate-900 text-white flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black tracking-tight uppercase">Metadata Inspector</h2>
                                    <p className="text-xs font-black text-slate-400 tracking-widest uppercase">ID: #{selectedLog._id}</p>
                                </div>
                                <div className={`p-4 rounded-2xl ${getActionColor(selectedLog.action)} border-0`}>
                                    <Zap size={24} />
                                </div>
                            </header>
                            <div className="p-12 space-y-10">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-50">Origin Information</h4>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">User Identity</p>
                                                <p className="text-sm font-black text-slate-900">{selectedLog.user.name}</p>
                                                <p className="text-[10px] font-bold text-indigo-600 uppercase">{selectedLog.user.role}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Network Signature</p>
                                                <p className="text-sm font-black text-slate-900">{selectedLog.ipAddress || '192.168.1.1'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-50">Modification Target</h4>
                                        <div className="space-y-3">
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Resource Category</p>
                                                <p className="text-sm font-black text-slate-900">{selectedLog.resource}</p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-2xl">
                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Reference ID</p>
                                                <p className="text-sm font-black text-slate-900">#{selectedLog.resourceId || 'NEW'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-50">JSON Payload Verification</h4>
                                    <pre className="p-8 bg-slate-900 rounded-[2rem] text-indigo-400 font-mono text-[10px] overflow-x-auto shadow-inner leading-relaxed">
                                        {JSON.stringify(selectedLog.metadata || { "status": "No specific metadata stored" }, null, 4)}
                                    </pre>
                                </div>

                                <Button 
                                    variant="primary" 
                                    className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black"
                                    onClick={() => setSelectedLog(null)}
                                >
                                    Dismiss Inspector
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuditLogsPage;
