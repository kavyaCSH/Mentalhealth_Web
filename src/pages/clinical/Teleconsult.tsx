import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PhoneOff,
    Maximize2,
    Minimize2,
    Activity,
    ShieldCheck,
    Lock,
    ExternalLink,
    ChevronLeft
} from 'lucide-react';
import Button from '../../components/ui/Button';
import type { Consultation, Participant } from '../../types/common.types';

const Teleconsult = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { appointment, token: stateToken } = (location.state as { appointment?: Consultation & { subscriber_token?: string; token?: string }; token?: string }) || {};

    const [isIframeLoading, setIsIframeLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [duration, setDuration] = useState(0);

    // Extract token - mirror mobile logic
    const token = stateToken || appointment?.subscriber_token || appointment?.token;

    // Extract participant info
    const specialist = appointment?.participants?.find((p: Participant) =>
        p.participant_type?.code === 'professional' || p.role === 'provider' || p.role === 'publisher'
    );
    const doctorName = specialist?.name || (specialist as any)?.firstName ? `${(specialist as any).firstName} ${(specialist as any).lastName || ''}` : 'Clinical Specialist';

    useEffect(() => {
        if (!token && !id) {
            console.error('No consultation session found');
            navigate('/schedule');
            return;
        }

        const timer = setInterval(() => {
            setDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [token, id, navigate]);

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleEndSession = () => {
        if (window.confirm('Are you sure you want to leave the consultation session?')) {
            navigate('/schedule');
        }
    };

    const consult_url = 'https://teleconsult.a2zhealth.in/consult/';
    const iframeUrl = token ? `${consult_url}${token}` : '';

    if (!token && id) {
        // Fallback or loading if only ID is present but no state
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
                <Activity className="animate-spin text-indigo-500 mb-6" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Session #{id}...</p>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20">
                    <Lock size={32} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Access Restricted</h3>
                <p className="text-slate-400 font-medium mb-8">No valid consultation token was provided.</p>
                <Button variant="primary" onClick={() => navigate('/schedule')}>Return to Schedule</Button>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-screen bg-slate-950 overflow-hidden text-white/90 font-sans ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}>
            {/* Premium Header */}
            <header className="h-20 bg-slate-900/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 shrink-0 relative z-20">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/schedule')}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all border border-white/5"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
                            <Activity size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-lg font-black tracking-tight">{doctorName}</h1>
                                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Secure</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                Session ID: {id || 'N/A'} • {formatDuration(duration)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                        <ShieldCheck size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encrypted</span>
                    </div>

                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all border border-white/5"
                        title={isFullscreen ? 'Minimize' : 'Fullscreen'}
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>

                    <Button
                        variant="danger"
                        className="rounded-xl px-6 h-12 text-xs font-black uppercase tracking-widest gap-2"
                        leftIcon={<PhoneOff size={18} />}
                        onClick={handleEndSession}
                    >
                        End Session
                    </Button>
                </div>
            </header>

            {/* Iframe Area */}
            <main className="flex-1 relative bg-[#0a0a0a]">
                <AnimatePresence>
                    {isIframeLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950"
                        >
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-indigo-500/10 rounded-full"></div>
                                <div className="absolute inset-0 w-24 h-24 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <Activity className="absolute inset-0 m-auto text-indigo-500 animate-pulse" size={32} />
                            </div>
                            <p className="mt-8 text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Establishing Handoff</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <iframe
                    src={iframeUrl}
                    className={`w-full h-full border-none transition-opacity duration-1000 ${isIframeLoading ? 'opacity-0' : 'opacity-100'}`}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    onLoad={() => setIsIframeLoading(false)}
                    title="Clinical Consultation"
                />

                {!isIframeLoading && (
                    <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 pointer-events-none opacity-40 hover:opacity-100 transition-opacity">
                        <div className="bg-slate-900/80 backdrop-blur border border-white/5 px-4 py-2 rounded-xl flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live Stream Active</span>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer / Status Bar */}
            <footer className="h-10 bg-slate-900/80 border-t border-white/5 flex items-center justify-between px-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 shrink-0">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> WebRTC Stable
                    </span>
                    <span className="flex items-center gap-2">
                        <Lock size={10} /> a2z Encryption Active
                    </span>
                </div>
                <div className="flex items-center gap-2 text-indigo-400">
                    <ExternalLink size={10} /> teleconsult.a2zhealth.in
                </div>
            </footer>
        </div>
    );
};

export default Teleconsult;
