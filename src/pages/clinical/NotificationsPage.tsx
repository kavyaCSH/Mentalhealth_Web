import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Calendar,
    MessageCircle,
    Activity,
    CheckCircle2,
    Inbox,
    Sparkles,
    Trash,
    ChevronLeft,
    AlertCircle,
    User,
    Clock
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { NotificationService } from '../../api/services/notification.service';
import type { Notification as AppNotification } from '../../types/common.types';

const ClinicalNotificationsPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('unread');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await NotificationService.getNotifications({ page: 1, limit: 100 });
            setNotifications(response.data?.notifications || []);
        } catch {
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            setNotifications((prev: AppNotification[]) => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n));
            await NotificationService.markAsRead(id);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setNotifications((prev: AppNotification[]) => prev.map(n => ({ ...n, isRead: true, read: true })));
            await NotificationService.markAllAsRead();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        setNotifications((prev: AppNotification[]) => prev.filter(n => n.id !== id));
    };

    const getIconInfo = (type?: string) => {
        const props = { size: 22 };
        switch (type) {
            case 'alert':
            case 'emergency':
                return { icon: <AlertCircle {...props} />, colorClass: 'text-rose-600 bg-rose-50 border-rose-100' };
            case 'appointment':
                return { icon: <Calendar {...props} />, colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
            case 'assessment':
                return { icon: <Activity {...props} />, colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
            case 'message':
                return { icon: <MessageCircle {...props} />, colorClass: 'text-orange-600 bg-orange-50 border-orange-100' };
            case 'patient':
                return { icon: <User {...props} />, colorClass: 'text-blue-600 bg-blue-50 border-blue-100' };
            default:
                return { icon: <Bell {...props} />, colorClass: 'text-slate-600 bg-slate-100 border-slate-200' };
        }
    };

    const groupNotifications = (data: AppNotification[]) => {
        const filtered = data.filter(n => {
            if (filter === 'unread') return !n.isRead && !n.read;
            if (filter === 'alerts') return n.type === 'alert' || n.type === 'emergency';
            return true; 
        });

        const sections: { title: string; items: AppNotification[] }[] = [
            { title: 'Today', items: [] },
            { title: 'Yesterday', items: [] },
            { title: 'Older', items: [] }
        ];

        const now = new Date();
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);

        filtered.forEach(n => {
            const date = new Date(n.created_at || n.createdAt || Date.now());
            if (date.toDateString() === now.toDateString()) sections[0].items.push(n);
            else if (date.toDateString() === yesterday.toDateString()) sections[1].items.push(n);
            else sections[2].items.push(n);
        });

        return sections.filter(s => s.items.length > 0);
    };

    const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-fade-in pb-24">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
                    >
                        <ChevronLeft size={16} /> Central Terminal
                    </button>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-rose-600 mb-2">
                            <Inbox size={18} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Telemetry</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                            System Alerts
                            {unreadCount > 0 && (
                                <span className="bg-rose-600 text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-2xl shadow-rose-100 uppercase tracking-widest animate-pulse">
                                    {unreadCount} Critical
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-2xl">
                            Real-time monitoring of patient interventions and systemic health events.
                        </p>
                    </div>
                </div>
                
                <div className="flex bg-slate-100/50 p-1.5 rounded-[2rem] border border-slate-100">
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${unreadCount > 0 
                                ? 'bg-white text-rose-600 shadow-md border border-slate-100 hover:scale-105 active:scale-95' 
                                : 'text-slate-300 cursor-not-allowed'}
                        `}
                    >
                        <CheckCircle2 size={16} />
                        Clear Active Stream
                    </button>
                </div>
            </header>

            {/* Filter Terminal */}
            <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
                    {(['all', 'unread', 'alerts'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${filter === f
                                    ? 'bg-white text-rose-600 shadow-sm border border-slate-100 font-black'
                                    : 'text-slate-400 hover:text-slate-600'}
                            `}
                        >
                            {f === 'unread' ? 'Active Feed' : f === 'all' ? 'Archive' : 'Priority'}
                        </button>
                    ))}
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                    Synced {new Date().toLocaleTimeString()}
                </div>
            </div>

            <div className="space-y-12">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-48 space-y-6 text-center">
                        <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Establishing Secure Clinical Connection</p>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">End-to-End Encrypted Tunnel</p>
                        </div>
                    </div>
                ) : notifications.length > 0 ? (
                    groupNotifications(notifications).map((section) => (
                        <div key={section.title} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-1 bg-rose-600 rounded-full opacity-20"></div>
                                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">{section.title}</h2>
                            </div>
                            
                            <div className="grid gap-4">
                                <AnimatePresence mode="popLayout">
                                    {section.items.map((notif, index) => {
                                        const { icon, colorClass } = getIconInfo(notif.type || '');
                                        const isRead = notif.isRead || notif.read;
                                        return (
                                            <motion.div
                                                key={notif.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, x: -50 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`card-premium p-8 flex flex-col md:flex-row md:items-center gap-8 group
                                                    ${!isRead ? 'border-rose-100 bg-rose-50/10' : 'border-slate-100 hover:border-indigo-100'}
                                                `}
                                            >
                                                <div className={`w-16 h-16 shrink-0 rounded-[1.5rem] flex items-center justify-center border transition-all group-hover:scale-110 shadow-sm ${colorClass}`}>
                                                    {icon}
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex items-center gap-4">
                                                        <h3 className={`text-xl font-black tracking-tight ${!isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                                                            {notif.title}
                                                        </h3>
                                                        {!isRead && (
                                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                                Active Intervention
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-base leading-relaxed ${!isRead ? 'text-slate-600 font-bold' : 'text-slate-400'}`}>
                                                        {notif.message}
                                                    </p>
                                                    <div className="flex items-center gap-3 pt-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                        <Clock size={12} />
                                                        <span>Received {new Date(notif.createdAt || notif.created_at || Date.now()).toLocaleString()}</span>
                                                        {notif.patientName && (
                                                            <>
                                                                <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                                <span className="text-indigo-600">{notif.patientName}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                                                    {!isRead && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notif.id)}
                                                            className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl transition-all shadow-sm"
                                                            title="Acknowledge Alert"
                                                        >
                                                            <CheckCircle2 size={24} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(notif.id)}
                                                        className="w-12 h-12 flex items-center justify-center text-slate-300 hover:bg-slate-100 hover:text-slate-600 rounded-2xl transition-all"
                                                        title="Archive"
                                                    >
                                                        <Trash size={18} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-48 card-premium bg-slate-50/50 border-dashed border-2 flex flex-col items-center">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner ring-8 ring-slate-100/50">
                            <Sparkles size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3">Clear Horizon</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto text-lg">No active alerts currently require clinical intervention.</p>
                        <Button variant="outline" className="mt-12 px-14 py-5 rounded-[1.5rem]" onClick={() => setFilter('all')}>View Archives</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicalNotificationsPage;
