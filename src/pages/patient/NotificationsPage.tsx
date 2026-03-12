import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    Calendar,
    MessageCircle,
    Activity,
    Info,
    CheckCircle2,
    Inbox,
    Sparkles,
    Trash
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { NotificationService } from '../../api/services/notification.service';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const data = await NotificationService.getNotifications({ page: 1, limit: 20 });
            setNotifications(Array.isArray(data) ? data : []);
        } catch {
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, read: true } : n));
            await NotificationService.markAsRead(id);
        } catch {
            // Revert or handle error if necessary
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
            await NotificationService.markAllAsRead();
        } catch {
            // Revert or error
        }
    };

    const handleDelete = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        // Assume delete service call if it exists, otherwise just local state for now
    };

    const getIconInfo = (type: string) => {
        const props = { size: 22 };
        switch (type) {
            case 'appointment':
                return { icon: <Calendar {...props} />, colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-100' };
            case 'assessment':
                return { icon: <Activity {...props} />, colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100' };
            case 'message':
                return { icon: <MessageCircle {...props} />, colorClass: 'text-orange-600 bg-orange-50 border-orange-100' };
            case 'alert':
                return { icon: <Info {...props} />, colorClass: 'text-red-600 bg-red-50 border-red-100' };
            default:
                return { icon: <Bell {...props} />, colorClass: 'text-slate-600 bg-slate-100 border-slate-200' };
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead && !n.read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead && !n.read).length;

    return (
        <div className="p-8 max-w-5xl  space-y-10 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <Inbox size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Communication Hub</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-indigo-100 uppercase tracking-widest">
                                {unreadCount} Priority
                            </span>
                        )}
                    </h1>
                    <p className="text-slate-500 font-medium">Coordinate your care and stay updated on systemic events.</p>
                </div>
                <div className="flex gap-3">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                        >
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            Acknowledge All
                        </button>
                    )}
                </div>
            </header>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-[1.5rem] w-fit border border-slate-100">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                        ${filter === 'all'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'}
                    `}
                >
                    Full Stream
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                        ${filter === 'unread'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'}
                    `}
                >
                    Unread
                    {unreadCount > 0 && (
                        <span className={`w-1.5 h-1.5 rounded-full ${filter === 'unread' ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                    )}
                </button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Hub...</p>
                    </div>
                ) : filteredNotifications.length > 0 ? (
                    <AnimatePresence mode="popLayout">
                        {filteredNotifications.map((notif, index) => {
                            const { icon, colorClass } = getIconInfo(notif.type);
                            const isRead = notif.isRead || notif.read;
                            return (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`relative p-8 rounded-[2.5rem] border transition-all flex flex-col sm:flex-row sm:items-center gap-8 group hover:shadow-xl hover:shadow-indigo-50/30
                                        ${isRead ? 'bg-white border-slate-100' : 'bg-indigo-50/20 border-indigo-100 shadow-sm'}
                                    `}
                                >
                                    <div className={`w-16 h-16 shrink-0 rounded-[1.5rem] flex items-center justify-center border transition-transform group-hover:scale-110 shadow-sm ${colorClass}`}>
                                        {icon}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center gap-4">
                                            <h3 className={`text-xl font-black truncate tracking-tight ${isRead ? 'text-slate-800' : 'text-slate-900 font-black'}`}>
                                                {notif.title}
                                            </h3>
                                            {!isRead && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-[8px] font-black uppercase tracking-widest">
                                                    <Sparkles size={10} />
                                                    New
                                                </div>
                                            )}
                                        </div>
                                        <p className={`text-base leading-relaxed max-w-2xl ${isRead ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>
                                            {notif.message}
                                        </p>
                                        <div className="flex items-center gap-3 pt-2">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em]">
                                                Received {new Date(notif.created_at || notif.createdAt || notif.date || Date.now()).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                                        {!isRead && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="w-12 h-12 flex items-center justify-center text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm hover:shadow-indigo-200"
                                                title="Acknowledge"
                                            >
                                                <CheckCircle2 size={24} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notif.id)}
                                            className="w-12 h-12 flex items-center justify-center text-slate-300 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                                            title="Archive"
                                        >
                                            <Trash size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                ) : (
                    <div className="text-center py-32 glass-card">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <Bell size={40} className="text-slate-200" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3">Quiet Hub</h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">All communications have been archived or acknowledged for this stream.</p>
                        <Button className="mt-10 px-10" onClick={() => setFilter('all')}>Refresh Stream</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
