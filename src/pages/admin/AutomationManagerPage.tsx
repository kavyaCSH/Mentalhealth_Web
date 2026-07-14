import React, { useState, useEffect } from 'react';
import { 
    Cpu, 
    Zap, 
    Play, 
    Square, 
    Clock, 
    Activity, 
    Shield, 
    AlertCircle, 
    CheckCircle2, 
    Loader2,
    RefreshCw,
    Moon,
    Sun,
    Bell,
    Settings,
    ArrowLeft,
    Plus,
    X,
    Database,
    Sparkles,
    Calendar,
    Send,
    Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MaintenanceService } from '../../api/services/maintenance.service';
import type { ScheduledJob, AutomationActionType, CreateJobRequest } from '../../types/maintenance.types';
import Button from '../../components/ui/Button';

const AutomationManagerPage = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<ScheduledJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [lastSync, setLastSync] = useState<Date>(new Date());
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Create Job State
    const [newJob, setNewJob] = useState<CreateJobRequest>({
        name: '',
        description: '',
        cron: '',
        actionType: 'NOTIFICATION_BROADCAST',
        payload: {
            role: 'all',
            title: '',
            message: ''
        }
    });

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchJobs = async () => {
        try {
            const data = await MaintenanceService.getScheduledJobs();
            setJobs(data);
            setLastSync(new Date());
        } catch (err) {
            console.error('Failed to fetch automation jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleJob = async (name: string, isRunning: boolean) => {
        setProcessing(name);
        setMessage(null);
        try {
            const action = isRunning ? 'stop' : 'start';
            await MaintenanceService.toggleJobStatus(name, action);
            await fetchJobs();
            setMessage({ 
                type: 'success', 
                text: `${name} ${isRunning ? 'deactivated' : 'activated'} successfully.` 
            });
        } catch (err) {
            setMessage({ 
                type: 'error', 
                text: `Platform override failed for ${name}.` 
            });
        } finally {
            setProcessing(null);
        }
    };

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing('creating');
        setMessage(null);
        try {
            await MaintenanceService.createScheduledJob(newJob);
            await fetchJobs();
            setIsCreateModalOpen(false);
            setNewJob({
                name: '',
                description: '',
                cron: '',
                actionType: 'NOTIFICATION_BROADCAST',
                payload: { role: 'all', title: '', message: '' }
            });
            setMessage({ type: 'success', text: `Automation rule "${newJob.name}" synchronized successfully.` });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to register the custom automation protocol.' });
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={40} className="text-indigo-600 animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted opacity-80">Synchronizing Automation Hub...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-muted opacity-80 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> System Command
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 shadow-xl glow-indigo border border-indigo-500/20">
                            <Cpu size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-main tracking-tight text-main">Automation Manager</h1>
                            <p className="text-muted font-medium">Real-time oversight for background protocols & "Night Shift" automation.</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-2 text-right hidden lg:flex">
                        <div className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
                            <Activity size={18} className="text-indigo-600" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                Heartbeat: {lastSync.toLocaleTimeString()}
                            </span>
                        </div>
                        <p className="text-[9px] font-bold text-muted opacity-40 uppercase tracking-widest mr-2">Cluster Status: Synchronized</p>
                    </div>
                    <Button 
                        variant="primary"
                        leftIcon={<Plus size={20} />}
                        onClick={() => setIsCreateModalOpen(true)}
                        className="shadow-xl shadow-indigo-100 h-14 rounded-2xl px-8 uppercase tracking-widest font-black text-xs"
                    >
                        New Automation
                    </Button>
                </div>
            </header>

            {message && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-3xl border flex items-center gap-4 ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}
                >
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <p className="font-bold text-sm">{message.text}</p>
                </motion.div>
            )}

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                    <motion.div 
                        key={job.name}
                        layout
                        className="card-premium p-8 flex flex-col gap-8 relative overflow-hidden group border-border-card/50"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${job.isRunning ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        
                        <div className="flex justify-between items-start">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                                job.isRunning ? 'bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-100' : 'bg-page text-muted opacity-80'
                            }`}>
                                {job.actionType === 'NOTIFICATION_BROADCAST' ? <Bell size={26} /> : 
                                 job.actionType === 'AI_TIP_BROADCAST' ? <Sparkles size={26} /> :
                                 job.actionType === 'DB_CLEANUP' ? <Database size={26} /> :
                                 job.name.toLowerCase().includes('morning') ? <Sun size={26} /> : 
                                 <Zap size={26} />}
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                job.isRunning ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-page border-border-card text-muted'
                            }`}>
                                {job.status}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-main tracking-tight">{job.name}</h3>
                            <p className="text-[11px] font-bold text-muted opacity-80 uppercase tracking-widest leading-relaxed">
                                {job.description || `Automated platform protocol for ${job.name}.`}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border-card">
                            <div>
                                <p className="text-[9px] font-black text-muted opacity-40 uppercase tracking-widest mb-1">Schedule</p>
                                <div className="flex items-center gap-2 text-xs font-black text-muted">
                                    <Calendar size={14} className="text-muted opacity-40" />
                                    {job.cron || 'System Sync'}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-muted opacity-40 uppercase tracking-widest mb-1">Next Sync</p>
                                <div className="flex items-center gap-2 text-xs font-black text-indigo-600">
                                    <Activity size={14} className="text-indigo-200" />
                                    {job.nextRun ? new Date(job.nextRun).toLocaleTimeString() : 'Pending'}
                                </div>
                            </div>
                        </div>

                        <Button 
                            variant={job.isRunning ? "outline" : "primary"}
                            className="w-full rounded-2xl h-14 text-sm font-black uppercase tracking-widest group/btn"
                            onClick={() => handleToggleJob(job.name, job.isRunning)}
                            isLoading={processing === job.name}
                            leftIcon={job.isRunning ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        >
                            {job.isRunning ? 'Request Stop' : 'Initiate Job'}
                        </Button>
                    </motion.div>
                ))}
            </div>

            {/* Platform Insights */}
            <div className="grid gap-8 md:grid-cols-2 mt-20">
                <div className="card-premium p-10 space-y-6 border-indigo-100/50 bg-indigo-50/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Moon size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-main tracking-tight">The "Night Shift" Insight</h2>
                    </div>
                    <p className="text-sm font-medium text-muted leading-relaxed">
                        Automated jobs run asynchronously across our server cluster. Toggling a job manually affects the immediate availability of the logic for all patients and clinical staff.
                    </p>
                    <div className="flex flex-wrap gap-3">
                        <div className="px-5 py-2.5 bg-card border border-indigo-100 rounded-2xl flex items-center gap-3 shadow-sm">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Audit Red-Flags</span>
                        </div>
                        <div className="px-5 py-2.5 bg-card border border-indigo-100 rounded-2xl flex items-center gap-3 shadow-sm opacity-50">
                            <AlertCircle size={16} className="text-rose-500" />
                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Fail-Safe Active</span>
                        </div>
                    </div>
                </div>

                <div className="card-premium p-10 space-y-6 border-border-card/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-indigo-400 shadow-lg">
                            <Settings size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-main tracking-tight">Platform Controls</h2>
                    </div>
                    <p className="text-sm font-medium text-muted leading-relaxed">
                        Need to deploy an emergency protocol or restart the automation engine? Contact the DevOps team or use the System Config for low-level environment overrides.
                    </p>
                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform">
                        Detailed System Metrics <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Create Job Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-3xl bg-card rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center justify-between sticky top-0 bg-card z-10 -mt-2 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-main tracking-tight">Sync New Automation</h2>
                                            <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Registering Background Pulse</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="w-10 h-10 rounded-xl bg-page flex items-center justify-center text-muted opacity-80 hover:bg-rose-50 hover:text-rose-500 transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateJob} className="space-y-8 pb-4">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Job Identifier</label>
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="e.g., weekly_wellness_pulse"
                                                className="w-full bg-page border border-border-card rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                                value={newJob.name}
                                                onChange={(e) => setNewJob({...newJob, name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Cron Expression</label>
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="e.g., 0 9 * * 1"
                                                className="w-full bg-page border border-border-card rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                                                value={newJob.cron}
                                                onChange={(e) => setNewJob({...newJob, cron: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Abstract / Description</label>
                                        <textarea 
                                            required
                                            rows={2}
                                            placeholder="What does this protocol accomplish?"
                                            className="w-full bg-page border border-border-card rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none"
                                            value={newJob.description}
                                            onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Execution Action</label>
                                        <div className="relative">
                                            <select 
                                                className="w-full bg-page border border-border-card rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer"
                                                value={newJob.actionType}
                                                onChange={(e) => setNewJob({...newJob, actionType: e.target.value as any})}
                                            >
                                                <option value="NOTIFICATION_BROADCAST">📢 Notification Broadcast</option>
                                                <option value="AI_TIP_BROADCAST">✨ AI Wellness Tip</option>
                                                <option value="DB_CLEANUP">🧹 DB maintenance</option>
                                            </select>
                                            <Settings className="absolute right-6 top-1/2 -translate-y-1/2 text-muted opacity-40 pointer-events-none" size={18} />
                                        </div>
                                    </div>

                                    {newJob.actionType === 'NOTIFICATION_BROADCAST' && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-8 bg-indigo-50 rounded-[30px] space-y-6 border border-indigo-100/50 shadow-inner"
                                        >
                                            <div className="flex items-center gap-3 text-indigo-600 mb-2">
                                                <Bell size={20} />
                                                <span className="text-xs font-black uppercase tracking-widest">Broadcast Settings</span>
                                            </div>
                                            <div className="grid gap-6 md:grid-cols-2">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Target Audience</label>
                                                    <div className="relative">
                                                        <select 
                                                            className="w-full bg-card border border-indigo-100 rounded-xl px-5 py-3 text-xs font-bold outline-none appearance-none cursor-pointer"
                                                            value={newJob.payload.role}
                                                            onChange={(e) => setNewJob({...newJob, payload: {...newJob.payload, role: e.target.value}})}
                                                        >
                                                            <option value="all">🌍 All Hub Users</option>
                                                            <option value="patient">💆 Active Patients</option>
                                                            <option value="psychiatrist">👨‍⚕️ Psychiatrists</option>
                                                            <option value="psychologist">🧠 Psychologists</option>
                                                            <option value="hospital">🏥 Facility Admins</option>
                                                        </select>
                                                        <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-200 pointer-events-none" size={14} />
                                                    </div>
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder="Notification Title"
                                                    className="w-full bg-card border border-indigo-100 rounded-xl px-5 py-3 text-xs font-bold outline-none"
                                                    value={newJob.payload.title}
                                                    onChange={(e) => setNewJob({...newJob, payload: {...newJob.payload, title: e.target.value}})}
                                                />
                                            </div>
                                            <textarea 
                                                rows={2}
                                                placeholder="Notification Body Message"
                                                className="w-full bg-card border border-indigo-100 rounded-xl px-5 py-3 text-xs font-bold outline-none resize-none"
                                                value={newJob.payload.message}
                                                onChange={(e) => setNewJob({...newJob, payload: {...newJob.payload, message: e.target.value}})}
                                            />
                                        </motion.div>
                                    )}

                                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-card -mb-4 pb-4">
                                        <Button 
                                            variant="outline" 
                                            type="button"
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="flex-1 rounded-2xl h-14 uppercase tracking-widest font-black text-[10px]"
                                        >
                                            Abort
                                        </Button>
                                        <Button 
                                            variant="primary"
                                            className="flex-[2] rounded-2xl h-14 uppercase tracking-widest font-black text-[10px] glow-primary"
                                            isLoading={processing === 'creating'}
                                            leftIcon={<Send size={18} />}
                                            type="submit"
                                        >
                                            Register Automation
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AutomationManagerPage;
