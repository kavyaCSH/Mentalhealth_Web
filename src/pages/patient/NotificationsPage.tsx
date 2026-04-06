import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Calendar,
    MessageCircle,
    Activity,
    CheckCircle2,
    Inbox,
    Sparkles,
    Trash,
    AlertCircle,
    Star,
    Clock,
    Filter,
    Settings,
    Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { decrementUnreadCount, fetchUnreadCount } from '../../features/notifications/store/notificationSlice';
import Button from '../../components/ui/Button';
import { NotificationService } from '../../api/services/notification.service';
import type { Notification } from '../../types/common.types';

const PatientNotificationsPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTriggeringAi, setIsTriggeringAi] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread' | 'alerts'>('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const data = await NotificationService.getNotifications({ page: 1, limit: 100 });
            setNotifications(Array.isArray(data) ? data : []);
        } catch {
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            const notif = notifications.find(n => n.id === id || n._id === id);
            if (notif && !notif.isRead && !notif.read) {
                dispatch(decrementUnreadCount());
            }
            setNotifications(prev => prev.map(n => (n.id === id || n._id === id) ? { ...n, isRead: true, read: true } : n));
            await NotificationService.markAsRead(id);
        } catch {
            // Silently fail as per original logic
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
            await NotificationService.markAllAsRead();
            dispatch(fetchUnreadCount()); // Sync count after global read
        } catch {
            // Silently fail as per original logic
        }
    };

    const handleTriggerAi = async () => {
        try {
            setIsTriggeringAi(true);
            const res = await NotificationService.triggerAiEngagement();
            if (res.success) {
                alert('AI Engagement broadcasted successfully!');
            }
        } catch (error) {
            alert('Failed to trigger AI engagement');
        } finally {
            setIsTriggeringAi(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id && n._id !== id));
    };

    const getNotificationDisplayTime = (dateValue: string | Date | undefined) => {
        if (!dateValue) return '';
        const now = new Date();
        const msgDate = new Date(dateValue);
        const diff = now.getTime() - msgDate.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24 && now.getDate() === msgDate.getDate()) return `${hours}h ago`;
        
        return msgDate.toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric',
            year: now.getFullYear() !== msgDate.getFullYear() ? 'numeric' : undefined
        });
    };

    const getIconInfo = (type?: string) => {
        const props = { size: 22 };
        switch (type) {
            case 'alert':
                return { icon: <AlertCircle {...props} />, colorClass: 'text-rose-600 bg-rose-50 border-rose-100' };
            case 'appointment':
                return { icon: <Calendar {...props} />, colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
            case 'reminder':
                return { icon: <Clock {...props} />, colorClass: 'text-amber-500 bg-amber-50 border-amber-100' };
            case 'welcome':
                return { icon: <Star {...props} />, colorClass: 'text-blue-500 bg-blue-50 border-blue-100' };
            case 'assessment':
                return { icon: <Activity {...props} />, colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
            case 'message':
                return { icon: <MessageCircle {...props} />, colorClass: 'text-purple-600 bg-purple-50 border-purple-100' };
            default:
                return { icon: <Bell {...props} />, colorClass: 'text-slate-600 bg-slate-100 border-slate-200' };
        }
    };

    const groupNotifications = (data: Notification[]) => {
        const filtered = data.filter(n => {
            if (filter === 'unread') return !n.isRead && !n.read;
            if (filter === 'alerts') return n.type === 'alert';
            return true;
        });

        const sections: { title: string; items: Notification[] }[] = [
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
        <div className="p-8 max-w-5xl mx-auto space-y-10 animate-fade-in pb-24">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-2">
                        <Inbox size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Signal Stream</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="bg-indigo-600 text-white text-[11px] font-black px-4 py-1.5 rounded-full shadow-2xl shadow-indigo-200 uppercase tracking-widest animate-pulse">
                                {unreadCount} New
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">
                        A real-time ledger of your clinical journey and systemic updates.
                    </p>
                </div>
                
                <div className="flex items-center gap-3 bg-slate-100/50 p-1.5 rounded-[2rem] border border-slate-100 shadow-sm">
                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                        <button
                            onClick={handleTriggerAi}
                            disabled={isTriggeringAi}
                            className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100 group"
                            title="Trigger AI Engagement"
                        >
                            <Bot size={20} className={isTriggeringAi ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/profile/notifications')}
                        className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-slate-100"
                        title="Notification Settings"
                    >
                        <Settings size={20} />
                    </button>
                    <div className="w-[1.5px] h-8 bg-slate-200 mx-1 hidden md:block"></div>
                    <button
                        onClick={handleMarkAllAsRead}
                        disabled={unreadCount === 0}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${unreadCount > 0 
                                ? 'bg-white text-indigo-600 shadow-md border border-slate-100 hover:scale-105 active:scale-95 text-xs' 
                                : 'text-slate-300 cursor-not-allowed'}
                        `}
                    >
                        <CheckCircle2 size={16} />
                        Mark All Read
                    </button>
                </div>
            </header>

            {/* Advanced Filters */}
            <div className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-3 text-slate-400 mr-2">
                    <Filter size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filter Stream</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-100">
                    {(['all', 'unread', 'alerts'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${filter === f
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                    : 'text-slate-400 hover:text-slate-600'}
                            `}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-12">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 space-y-6">
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-[1.5rem] animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Communication Hub</p>
                    </div>
                ) : notifications.length > 0 ? (
                    groupNotifications(notifications).map((section) => (
                        <div key={section.title} className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-1 bg-indigo-600 rounded-full opacity-20"></div>
                                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">{section.title}</h2>
                            </div>
                            
                            <div className="grid gap-4">
                                <AnimatePresence mode="popLayout">
                                    {section.items.map((notif, index) => {
                                        const { icon, colorClass } = getIconInfo(notif.type || '');
                                        const isRead = notif.isRead || notif.read;
                                        return (
                                            <motion.div
                                                key={notif.id || notif._id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, x: -50 }}
                                                transition={{ delay: index * 0.05 }}
                                                onClick={() => !isRead && handleMarkAsRead(notif.id || notif._id!)}
                                                className={`group relative p-8 rounded-[2rem] border border-l-4 transition-all flex flex-col md:flex-row md:items-center gap-8 cursor-pointer
                                                    ${isRead 
                                                        ? 'bg-white border-slate-100 border-l-slate-200 hover:border-indigo-100 hover:bg-slate-50/30' 
                                                        : 'bg-indigo-50/30 border-indigo-100 border-l-indigo-600 shadow-xl shadow-indigo-500/5 hover:bg-indigo-50/50'}
                                                `}
                                            >
                                                <div className={`w-16 h-16 shrink-0 rounded-[1.5rem] flex items-center justify-center border transition-all group-hover:scale-110 shadow-sm ${colorClass}`}>
                                                    {icon}
                                                </div>

                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <div className="flex items-center gap-4">
                                                        <h3 className={`text-xl font-black tracking-tight ${isRead ? 'text-slate-800 font-bold' : 'text-slate-900 font-black'}`}>
                                                            {notif.title}
                                                        </h3>
                                                        {!isRead && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"></div>}
                                                    </div>
                                                    <p className={`text-base leading-relaxed max-w-3xl ${isRead ? 'text-slate-500 font-medium' : 'text-slate-600 font-bold'}`}>
                                                        {notif.message}
                                                    </p>
                                                    <div className="flex items-center gap-3 pt-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                        <Clock size={12} />
                                                        <span>{getNotificationDisplayTime(notif.createdAt || notif.created_at)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 self-end md:self-center">
                                                    {!isRead && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id || notif._id!); }}
                                                            className="w-12 h-12 bg-white border border-slate-100 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                            title="Mark as Read"
                                                        >
                                                            <CheckCircle2 size={22} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleDelete(notif.id || notif._id!, e)}
                                                        className="w-12 h-12 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all"
                                                        title="Dismiss"
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
                    <div className="text-center py-40 bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
                        <div className="w-28 h-28 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-slate-50/50">
                            <Sparkles size={48} className="text-slate-200" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2">Caught Up!</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto text-lg leading-relaxed">
                            {filter === 'unread' ? "You've read everything." : "No new notifications right now."}
                        </p>
                        <Button className="mt-12 px-12 py-6 rounded-[2rem] shadow-2xl shadow-indigo-100" onClick={() => { setFilter('all'); fetchNotifications(); }}>
                            Reload Stream
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientNotificationsPage;
