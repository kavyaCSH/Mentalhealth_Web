import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Megaphone, 
    Send, 
    Users, 
    Zap, 
    ArrowLeft, 
    BellRing, 
    Settings, 
    AlertTriangle, 
    CheckCircle2, 
    Info, 
    Sparkles,
    ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { NotificationService } from '../../api/services/notification.service';
import type { BroadcastPayload, TargetedPayload } from '../../types/common.types';

const CommunicationCenter = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'broadcast' | 'targeted' | 'ai'>('broadcast');
    const [isSending, setIsSending] = useState(false);
    const [lastStatus, setLastStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Form States
    const [broadcastData, setBroadcastData] = useState<BroadcastPayload>({
        title: '',
        message: '',
        role: 'all',
        type: 'info'
    });

    const [targetedData, setTargetedData] = useState<TargetedPayload>({
        userId: '',
        title: '',
        message: '',
        type: 'info'
    });

    const handleBroadcast = async () => {
        if (!broadcastData.title || !broadcastData.message) return;
        setIsSending(true);
        setLastStatus(null);
        try {
            const res = await NotificationService.broadcastNotification(broadcastData);
            if (res.success) {
                setLastStatus({ type: 'success', message: 'Global broadcast dispatched successfully.' });
                setBroadcastData({ title: '', message: '', role: 'all', type: 'info' });
            }
        } catch (error) {
            setLastStatus({ type: 'error', message: 'Failed to initiate global broadcast.' });
        } finally {
            setIsSending(false);
        }
    };

    const handleTargeted = async () => {
        if (!targetedData.userId || !targetedData.title || !targetedData.message) return;
        setIsSending(true);
        setLastStatus(null);
        try {
            const res = await NotificationService.sendTargetedNotification(targetedData);
            if (res.success) {
                setLastStatus({ type: 'success', message: `Targeted alert sent to User #${targetedData.userId}.` });
                setTargetedData({ userId: '', title: '', message: '', type: 'info' });
            }
        } catch (error) {
            setLastStatus({ type: 'error', message: 'Failed to deliver targeted notification.' });
        } finally {
            setIsSending(false);
        }
    };

    const handleAITrigger = async () => {
        setIsSending(true);
        setLastStatus(null);
        try {
            const res = await NotificationService.triggerAIEngagement();
            if (res.success) {
                setLastStatus({ type: 'success', message: 'AI Wellness Engagement engine manually triggered.' });
            }
        } catch (error) {
            setLastStatus({ type: 'error', message: 'AI Engine manual override failed.' });
        } finally {
            setIsSending(false);
        }
    };

    const types = [
        { id: 'info', label: 'Standard Info', icon: Info, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { id: 'alert', label: 'Critical Alert', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { id: 'success', label: 'Status Success', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'wellness', label: 'Wellness Tip', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ];

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl  pb-40">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-muted uppercase tracking-widest hover:text-indigo-500 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Command
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <Megaphone size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight text-main">Megaphone Hub</h1>
                            <p className="text-muted font-medium">Unified communication governance for platform-wide alerts and mass dispatches.</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3">
                        <ShieldAlert size={18} className="text-rose-500" />
                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">High Clearance Only</span>
                    </div>
                </div>
            </header>

            {/* Global Communication Status */}
            <AnimatePresence>
                {lastStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-6 rounded-3xl border flex items-center gap-4 ${
                            lastStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                        }`}
                    >
                        {lastStatus.type === 'success' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                        <p className="font-bold text-sm tracking-tight">{lastStatus.message}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid gap-10 lg:grid-cols-12">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-4">
                    <button 
                        onClick={() => setActiveTab('broadcast')}
                        className={`w-full p-6 rounded-[2rem] text-left transition-all flex items-center gap-4 ${
                            activeTab === 'broadcast' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/10 scale-105' : 'bg-card border border-border-card text-muted hover:bg-indigo-500/5'
                        }`}
                    >
                        <BellRing size={20} />
                        <span className="text-xs font-black uppercase tracking-widest leading-none">Global Broadcast</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('targeted')}
                        className={`w-full p-6 rounded-[2rem] text-left transition-all flex items-center gap-4 ${
                            activeTab === 'targeted' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/10 scale-105' : 'bg-card border border-border-card text-muted hover:bg-indigo-500/5'
                        }`}
                    >
                        <Users size={20} />
                        <span className="text-xs font-black uppercase tracking-widest leading-none">Targeted Alert</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('ai')}
                        className={`w-full p-6 rounded-[2rem] text-left transition-all flex items-center gap-4 ${
                            activeTab === 'ai' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/10 scale-105' : 'bg-card border border-border-card text-muted hover:bg-indigo-500/5'
                        }`}
                    >
                        <Zap size={20} />
                        <span className="text-xs font-black uppercase tracking-widest leading-none">AI Engagement</span>
                    </button>

                    <div className="p-8 bg-page rounded-[2.5rem] mt-10 border border-border-card">
                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-4">Governance Note</h4>
                        <p className="text-[11px] text-muted leading-relaxed font-medium">
                            Every dispatch from the **Megaphone Hub** is logged in the clinical audit trail. Unauthorized use will trigger immediate disciplinary flagging.
                        </p>
                    </div>
                </div>

                {/* Command Panel */}
                <div className="lg:col-span-9">
                    <AnimatePresence mode="wait">
                        {activeTab === 'broadcast' && (
                            <motion.div
                                key="broadcast"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="card-premium p-12 space-y-10"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-main tracking-tight">Mass Broadcast</h2>
                                    <p className="text-muted font-medium">Inject a standardized alert into the notification streams of multiple user segments.</p>
                                </div>

                                <div className="grid gap-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Select Audience</label>
                                            <select 
                                                className="w-full bg-page border border-border-card rounded-2xl px-5 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer text-main"
                                                value={broadcastData.role}
                                                onChange={(e) => setBroadcastData({...broadcastData, role: e.target.value as any})}
                                            >
                                                <option value="all">Everyone on Platform</option>
                                                <option value="patient">All Patients</option>
                                                <option value="psychiatrist">All Psychiatrists</option>
                                                <option value="psychologist">All Psychologists</option>
                                                <option value="hospital">All Health Facilities</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Visual Theme</label>
                                            <div className="flex gap-2">
                                                {types.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setBroadcastData({...broadcastData, type: t.id})}
                                                        className={`flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                                                            broadcastData.type === t.id ? `${t.bg} ${t.color} border-indigo-500/20 shadow-inner` : 'bg-card border-border-card hover:bg-indigo-500/5 text-muted'
                                                        }`}
                                                        title={t.label}
                                                    >
                                                        <t.icon size={20} />
                                                        <span className="text-[8px] font-black uppercase tracking-tighter">{t.id}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <InputField 
                                        label="Alert Heading" 
                                        placeholder="e.g. Critical System Update"
                                        value={broadcastData.title}
                                        onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Message Content</label>
                                        <textarea 
                                            rows={5}
                                            className="w-full bg-page border border-border-card rounded-[2rem] p-8 text-sm font-bold text-main outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            placeholder="Write your platform-wide announcement here..."
                                            value={broadcastData.message}
                                            onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <Button 
                                    variant="primary" 
                                    className="w-full py-4 rounded-2xl shadow-xl shadow-indigo-500/10 h-16 font-black uppercase tracking-widest text-xs"
                                    leftIcon={<Send size={18} />}
                                    isLoading={isSending}
                                    onClick={handleBroadcast}
                                >
                                    Initiate Global Dispatch
                                </Button>
                            </motion.div>
                        )}

                        {activeTab === 'targeted' && (
                            <motion.div
                                key="targeted"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="card-premium p-12 space-y-10"
                            >
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-main tracking-tight">Direct Override</h2>
                                    <p className="text-muted font-medium">Send a specific, non-broadcast message to a single user's notification vault.</p>
                                </div>

                                <div className="grid gap-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <InputField 
                                            label="Recipient internal ID" 
                                            placeholder="e.g. 42"
                                            type="number"
                                            value={targetedData.userId}
                                            onChange={(e) => setTargetedData({...targetedData, userId: e.target.value})}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Alert Category</label>
                                            <div className="flex gap-2">
                                                {types.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setTargetedData({...targetedData, type: t.id})}
                                                        className={`flex-1 p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                                                            targetedData.type === t.id ? `${t.bg} ${t.color} border-indigo-500/20 shadow-inner` : 'bg-card border-border-card hover:bg-indigo-500/5 text-muted'
                                                        }`}
                                                    >
                                                        <t.icon size={20} />
                                                        <span className="text-[8px] font-black uppercase tracking-tighter">{t.id}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <InputField 
                                        label="Subject Line" 
                                        placeholder="Verification Status / Clinical Update"
                                        value={targetedData.title}
                                        onChange={(e) => setTargetedData({...targetedData, title: e.target.value})}
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Private Message</label>
                                        <textarea 
                                            rows={5}
                                            className="w-full bg-page border border-border-card rounded-[2rem] p-8 text-sm font-bold text-main outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            placeholder="Enter message for specific recipient..."
                                            value={targetedData.message}
                                            onChange={(e) => setTargetedData({...targetedData, message: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <Button 
                                    variant="primary" 
                                    className="w-full py-4 rounded-2xl shadow-xl shadow-indigo-500/10 h-16 font-black uppercase tracking-widest text-xs"
                                    leftIcon={<Send size={18} />}
                                    isLoading={isSending}
                                    onClick={handleTargeted}
                                >
                                    Deliver Targeted Alert
                                </Button>
                            </motion.div>
                        )}

                        {activeTab === 'ai' && (
                            <motion.div
                                key="ai"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="card-premium p-12 space-y-12 text-center"
                            >
                                <div className="space-y-4 max-w-2xl mx-auto">
                                    <div className="w-24 h-24 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-500 mx-auto animate-pulse">
                                        <Sparkles size={48} />
                                    </div>
                                    <h2 className="text-4xl font-black text-main tracking-tight">AI Engagement Trigger</h2>
                                    <p className="text-muted font-medium leading-relaxed">
                                        You are about to manually invoke the **MindBalance Personalization Engine**. This will bypass the CRON schedule and immediately analyze assessment data to send targeted wellness tips to all eligible patients.
                                    </p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                                    <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 text-left space-y-3">
                                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                                            <Settings size={20} />
                                        </div>
                                        <h4 className="text-sm font-black text-main">Personalization Batch</h4>
                                        <p className="text-[11px] text-muted font-medium tracking-tight">The engine will parse clinical insights from the last 24 hours to generate contextual tips.</p>
                                    </div>
                                    <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 text-left space-y-3">
                                        <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <h4 className="text-sm font-black text-main">Manual Override</h4>
                                        <p className="text-[11px] text-muted font-medium tracking-tight">This will result in a global notification spike. Use only during strategic community milestones.</p>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-border-card">
                                    <Button 
                                        variant="primary" 
                                        className="px-16 py-4 rounded-2xl shadow-xl shadow-indigo-500/10 h-20 font-black uppercase tracking-[0.15em]"
                                        leftIcon={<Zap size={20} />}
                                        isLoading={isSending}
                                        onClick={handleAITrigger}
                                    >
                                        Execute AI Dispatch Cycle
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default CommunicationCenter;
