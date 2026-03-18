import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    UserCheck,
    Calendar,
    ClipboardList,
    Clock,
    Video,
    MapPin,
    ChevronDown,
    RefreshCw,
    AlertCircle,
    Info,
    ChevronUp
} from 'lucide-react';
import type { RootState } from '../../store';
import api from '../../api/client';
import Button from '../../components/ui/Button';
import type { Consultation, Participant } from '../../types/common.types';
import { TeleConsultService } from '../../api/services/teleconsult.service';


const PractitionerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [stats, setStats] = useState<{ activePatients?: number; totalSessions?: number; totalRevenue?: number } | null>(null);
    const [todaySessions, setTodaySessions] = useState<Consultation[]>([]);
    const [expandedSession, setExpandedSession] = useState<string | null>(null);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [isSessionsLoading, setIsSessionsLoading] = useState(true);
    const [statsError, setStatsError] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'stable' | 'slow' | 'unresponsive'>('stable');
    const [showTroubleshoot, setShowTroubleshoot] = useState(false);

    console.log('[PractitionerDashboard] Component Mounted. Connection Status:', connectionStatus);

    // Load cached stats on mount
    useEffect(() => {
        const cached = localStorage.getItem('practitioner_stats');
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                setStats(data);
                setLastUpdated(timestamp);
            } catch {
                console.error('Failed to parse cached stats');
            }
        }
    }, []);

    const fetchStats = useCallback(async () => {
        if (!user) {
            console.warn('[API] fetchStats blocked: No user object found.');
            return;
        }
        
        setIsStatsLoading(true);
        setStatsError(false);
        setConnectionStatus('stable');
        console.info('[API] >>> TRIGGER: Requesting Specialist Stats...');
        
        try {
            // Increased timeout specifically for poor local server performance
            const res = await api.get('/dashboards/specialist', { timeout: 45000 });
            console.info('[API] <<< SUCCESS: Data Received:', res.data);
            
            const responseData = res.data;
            const data = responseData.data || responseData;
            
            if (data.stats) {
                setStats(data.stats);
                localStorage.setItem('practitioner_stats', JSON.stringify({ 
                    data: data.stats, 
                    timestamp: new Date().toISOString() 
                }));
                setStatsError(false);
                setConnectionStatus('stable');
            }
        } catch (error: unknown) {
            const err = error as { message?: string; code?: string };
            console.error('[API] Specialist Stats Failed:', err.message);
            setStatsError(true);
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                setConnectionStatus('unresponsive');
            } else {
                setConnectionStatus('slow');
            }
        } finally {
            setIsStatsLoading(false);
        }
    }, [user]);

    const fetchSessions = useCallback(async () => {
        if (!user) return;
        setIsSessionsLoading(true);
        try {
            const res = await api.get('/resource/consults', { 
                params: { 
                    page: 1, 
                    limit: 100, 
                    userId: user?.userId || user?.id,
                    role: 'publisher' 
                } 
            });
            const data = res.data.data || res.data;
            const allSessions = data.consults || data;
            
            // Filter for today's sessions
            const today = new Date().toDateString();
            const filtered = (Array.isArray(allSessions) ? allSessions : []).filter(s => {
                if (!s.scheduled_at) return false;
                return new Date(s.scheduled_at).toDateString() === today;
            });
            
            setTodaySessions(filtered);
        } catch (error) {
            console.error('Failed to fetch practitioner sessions:', error);
        } finally {
            setIsSessionsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const userId = user?.userId || user?.id || user?._id;
        console.warn('[PractitionerDashboard] useEffect fired. User Found:', !!user, 'ID:', userId);
        
        if (user) {
            console.warn('[PractitionerDashboard] Initializing data fetch sequence...');
            fetchStats();
            fetchSessions();
        } else {
            console.log('[PractitionerDashboard] Waiting for user authentication...');
        }
    }, [user, fetchStats, fetchSessions]); // Use the whole user object as dependency for maximum reliability

    const getConsultStatusColor = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'scheduled') return 'bg-blue-50 text-blue-600 border-blue-100';
        if (s === 'in_progress' || s === 'in progress' || s === 'waiting') return 'bg-amber-50 text-amber-600 border-amber-100';
        if (s === 'confirmed') return 'bg-teal-50 text-teal-600 border-teal-100';
        if (s === 'completed') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        if (s === 'cancelled' || s === 'canceled') return 'bg-red-50 text-red-500 border-red-100';
        if (s === 'payment_pending') return 'bg-orange-50 text-orange-600 border-orange-100';
        return 'bg-slate-50 text-slate-500 border-slate-100';
    };

    const metrics = [
        { 
            id: 'active_patients',
            label: 'Active Patients', 
            // Show ... so user knows it's triggering/loading
            value: stats?.activePatients !== undefined ? stats.activePatients.toString() : (isStatsLoading ? '...' : '0'), 
            icon: Users, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50' 
        },
        { 
            id: 'total_sessions',
            label: 'Total Sessions', 
            value: stats?.totalSessions !== undefined ? stats.totalSessions.toString() : (isStatsLoading ? '...' : '0'), 
            icon: ClipboardList, 
            color: 'text-orange-600', 
            bg: 'bg-orange-50' 
        },
        { 
            id: 'today_sessions',
            label: 'Today\'s Sessions', 
            value: todaySessions.length.toString(), 
            icon: Calendar, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50' 
        },
        { 
            id: 'total_revenue',
            label: 'Total Revenue', 
            value: stats?.totalRevenue !== undefined ? `₹${stats.totalRevenue}` : (isStatsLoading ? '...' : '₹0'), 
            icon: MapPin, 
            color: 'text-teal-600', 
            bg: 'bg-teal-50' 
        },
    ];

    const recentSessions = todaySessions.slice(0, 5);

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl ">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <UserCheck size={16} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{user?.role?.replace('_', ' ')} • Clinical Portal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Welcome, Dr. {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.name || user?.username || 'Practitioner')}.</h1>
                                <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                            {user?.role?.includes('psych') ? 'Specialist' : user?.role?.replace('_', ' ')}
                                        </span>
                                        {connectionStatus !== 'stable' && (
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${connectionStatus === 'unresponsive' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {connectionStatus === 'unresponsive' ? 'Server Unresponsive' : 'Sync Delay'}
                                            </span>
                                        )}
                                    </div>
                                    {isStatsLoading && (
                                        <div className="flex items-center gap-2 px-2 animate-pulse mt-1">
                                            <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Awaiting Server Response...</span>
                                        </div>
                                    )}
                                </div>
                    </div>
                </div>
                <Button variant="primary" leftIcon={<Calendar size={18} />} onClick={() => navigate('/clinical-schedule')} className="rounded-2xl shadow-lg shadow-indigo-100 py-3.5">
                    Manage Schedule
                </Button>
            </header>

            {/* Troubleshooting Guide (Visible when connection issues occur) */}
            {(connectionStatus !== 'stable' || statsError) && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 bg-amber-50 border border-amber-100 rounded-3xl"
                >
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowTroubleshoot(!showTroubleshoot)}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                                <Info size={20} />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-sm italic uppercase tracking-wider">Sync Troubleshooting</h4>
                                <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mt-0.5">Your server is taking too long to respond</p>
                            </div>
                        </div>
                        <div className="p-2 hover:bg-amber-100/50 rounded-lg transition-colors">
                            {showTroubleshoot ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </div>
                    
                    {showTroubleshoot && (
                        <div className="mt-6 space-y-4 text-xs font-bold text-slate-600 leading-relaxed border-t border-amber-100 pt-6">
                            <p>We detected that your browser sent the request (GET /dashboards/specialist), but your <span className="text-amber-700">backend server at :5000</span> failed to respond in time.</p>
                            <div className="bg-white/50 p-4 rounded-2xl space-y-2">
                                <p className="text-slate-900 uppercase text-[10px] tracking-widest">Recommended Actions:</p>
                                <ul className="list-disc pl-4 space-y-1.5 marker:text-amber-500">
                                    <li>Check if your **backend terminal** (port 5000) is running and not crashed.</li>
                                    <li>If you see "failed to load response data" in F12, restart your backend server.</li>
                                    <li>Ensure the database is connected and responding to queries.</li>
                                </ul>
                            </div>
                            <button 
                                onClick={() => fetchStats()}
                                className="w-full py-3 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-xl font-black uppercase tracking-widest transition-all"
                            >
                                Force Re-Sync Now
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-8 glass-card group relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className={`${metric.bg} ${metric.color} p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 glow-primary`}>
                                <metric.icon size={24} />
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${(statsError && metric.id !== 'today_sessions') ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50'}`}>
                                {(statsError && metric.id !== 'today_sessions') ? 'Stale Data' : 'Active'}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{metric.label}</p>
                            <div className="flex items-baseline justify-between mt-2">
                                <h3 className="text-3xl font-black text-slate-900">
                                    {metric.value}
                                </h3>
                                {(statsError && metric.id !== 'today_sessions') && !isStatsLoading && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); fetchStats(); }}
                                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                                        title="Retry"
                                    >
                                        <RefreshCw size={14} className={isStatsLoading ? 'animate-spin' : ''} />
                                    </button>
                                )}
                            </div>
                            {(statsError && metric.id !== 'today_sessions') && (
                                <div className="flex items-center gap-1.5 text-rose-500 mt-2">
                                    <AlertCircle size={10} />
                                    <span className="text-[9px] font-black uppercase tracking-tight">Service Timeout</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8">
                {/* Appointment Queue */}
                <section className="card-premium overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between glass-surface">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Today's Sessions</h1>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                                    {isSessionsLoading ? 'Refreshing sessions...' : 'Live patient encounters'}
                                    {lastUpdated && statsError && (
                                        <span className="ml-2 text-amber-500">• Last stats sync: {new Date(lastUpdated).toLocaleTimeString()}</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            {isSessionsLoading ? (
                                // Loading Skeletons
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-50 animate-pulse">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-slate-200 rounded-2xl" />
                                            <div className="flex-1 space-y-3">
                                                <div className="h-4 bg-slate-200 rounded-full w-1/3" />
                                                <div className="h-3 bg-slate-200 rounded-full w-1/2" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : recentSessions.length > 0 ? (
                                recentSessions.map((session, i) => {
                                    const patient = session.participants?.find((p: Participant) => 
                                        p.role === 'subscriber' || 
                                        p.role === 'patient' ||
                                        p.participant_type?.code === 'patient' || 
                                        p.participant_type?.code === 'subscriber' ||
                                        p.participant_type?.code === 'customer'
                                    );
                                    const dt = session.scheduled_at ? new Date(session.scheduled_at) : null;
                                    const statusObj = session.consult_current_status || session.consult_status || session.status;
                                    const statusName = typeof statusObj === 'string' ? statusObj : statusObj?.name || 'Scheduled';
                                    const statusSlug = typeof statusObj === 'string' ? statusObj.toLowerCase() : statusObj?.slug || 'scheduled';
                                    
                                    // Robust name extraction favoring First + Last name combinations
                                    const pInfo = patient?.participant_info;
                                    const pName = String(
                                        pInfo?.name ||
                                        (patient?.firstName ? `${patient.firstName} ${patient.lastName || ''}`.trim() : null) ||
                                        (patient?.first_name ? `${patient.first_name} ${patient.last_name || ''}`.trim() : null) ||
                                        (pInfo?.firstName ? `${pInfo.firstName} ${pInfo.lastName || ''}`.trim() : null) ||
                                        (pInfo?.first_name ? `${pInfo.first_name} ${pInfo.last_name || ''}`.trim() : null) ||
                                        patient?.name || 
                                        patient?.additional_info?.x_name ||
                                        'Assigned Patient'
                                    );
                                    
                                    const isVirtual = session.consult_type === 'virtual';
                                    const isExpanded = expandedSession === String(session.id || session._id);

                                    return (
                                        <motion.div
                                            key={session.id || session._id || i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="card-premium bg-white p-5 border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group"
                                            onClick={() => setExpandedSession(isExpanded ? null : String(session.id || session._id))}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border-4 border-white flex items-center justify-center text-white text-sm font-black shadow-lg group-hover:scale-110 transition-transform shrink-0">
                                                        {pName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-lg font-black text-slate-900 line-clamp-1 truncate leading-tight">
                                                            {pName}
                                                        </h3>
                                                        <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
                                                                <Clock size={12} className="text-indigo-500" />
                                                                {dt ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                                                            </span>
                                                            <span className="text-xs font-medium text-slate-400 truncate flex items-center gap-1.5">
                                                                <span className="w-1 h-1 bg-slate-300 rounded-full shrink-0" />
                                                                {session.reason || 'Standard Consultation'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border shadow-sm ${getConsultStatusColor(statusSlug)}`}>
                                                            {statusName}
                                                        </span>
                                                        {isVirtual && (
                                                            <div className="flex items-center gap-1.5 text-indigo-600">
                                                                <Video size={14} fill="currentColor" className="opacity-20" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">Virtual Session</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {isVirtual && (
                                                            <button 
                                                                className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
                                                                 onClick={async (e) => { 
                                                                    e.stopPropagation(); 
                                                                    
                                                                    const getPublisherToken = () => {
                                                                        const publisher = session.participants?.find((p: Participant) => 
                                                                            p.role === 'publisher' || 
                                                                            p.participant_type?.code === 'professional' ||
                                                                            String(p.ref_number) === String(user?.userId || user?.id)
                                                                        );
                                                                        return publisher?.token || session.publisher_token || session.token;
                                                                    };
                                                                    
                                                                    const token = getPublisherToken();
                                                                    
                                                                    if (token) {
                                                                        try {
                                                                            const validation = await TeleConsultService.tokenValidate(token, 'publisher');
                                                                            if (validation.success || validation.code === 200) {
                                                                                const baseUrl = import.meta.env.VITE_TELECONSULT_PUBLISHER_URL || 'https://teleconsult.a2zhealth.in/teleconsult-v3/';
                                                                                window.location.href = `${baseUrl}${token}?hideMenu=true`;
                                                                            } else {
                                                                                alert('Could not validate session. Please try again.');
                                                                            }
                                                                        } catch (err) {
                                                                            console.error('Validation failed', err);
                                                                            const baseUrl = import.meta.env.VITE_TELECONSULT_PUBLISHER_URL || 'https://teleconsult.a2zhealth.in/teleconsult-v3/';
                                                                            window.location.href = `${baseUrl}${token}?hideMenu=true`;
                                                                        }
                                                                    } else {
                                                                        alert('Consultation token not found.');
                                                                    }
                                                                }}
                                                                title="Join Session"
                                                            >
                                                                <Video size={18} />
                                                            </button>
                                                        )}
                                                        <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                            <ChevronDown size={18} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {isExpanded && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }} 
                                                    animate={{ height: 'auto', opacity: 1 }} 
                                                    className="mt-6 pt-6 border-t border-slate-50 space-y-4"
                                                >
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Type</p>
                                                            <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                                {isVirtual ? <Video size={14} /> : <MapPin size={14} />}
                                                                {isVirtual ? 'Virtual Consultation' : 'In-Person Visit'}
                                                            </p>
                                                        </div>
                                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Appointment ID</p>
                                                            <p className="text-sm font-mono font-bold text-slate-700">#{String(session.id || session._id).slice(-8).toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-3">
                                                        <button 
                                                            className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-sm"
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient?.id || patient?._id || ''}/clinical-hub`); }}
                                                        >
                                                            Access Clinical Hub
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    );
                                })  
                        ) : (
                            <div className="text-center p-8 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-slate-400 text-sm font-bold">
                                No sessions scheduled for today
                            </div>
                        )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PractitionerDashboard;
