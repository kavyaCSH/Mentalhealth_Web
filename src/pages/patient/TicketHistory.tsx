import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Clock, History, Loader2, MessageSquare, AlertCircle, ChevronRight, 
    CheckCircle2, AlertTriangle, HelpCircle, Bug, Lightbulb, MoreHorizontal
} from 'lucide-react';
import { FeedbackService } from '../../api/services/feedback.service';
import type { SupportTicket, TicketStatus, FeedbackCategory } from '../../types/feedback.types';

const TicketHistory = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const res = await FeedbackService.getMyTickets();
                if (res.code === 200) {
                    setTickets(res.data);
                }
            } catch (err) {
                console.error('Error fetching ticket history:', err);
                setError('Unable to load your clinical history. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    const getStatusStyles = (status: TicketStatus) => {
        switch (status) {
            case 'open':
                return { bg: 'bg-indigo-500/10 text-indigo-500', icon: Clock, label: 'Open' };
            case 'in_progress':
                return { bg: 'bg-blue-500/10 text-blue-500', icon: Loader2, label: 'In Progress' };
            case 'resolved':
                return { bg: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2, label: 'Resolved' };
            case 'closed':
                return { bg: 'bg-page text-muted', icon: AlertCircle, label: 'Closed' };
            default:
                return { bg: 'bg-page text-muted', icon: Clock, label: status };
        }
    };

    const getCategoryIcon = (category: FeedbackCategory) => {
        switch (category) {
            case 'support': return MessageSquare;
            case 'bug': return Bug;
            case 'feature_request': return Lightbulb;
            case 'complaint': return AlertTriangle;
            default: return MoreHorizontal;
        }
    };

    return (
        <div className="min-h-screen bg-page pb-24">
            {/* Header */}
            <div className="bg-card border-b border-border-card sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button 
                        onClick={() => navigate('/help')}
                        className="w-10 h-10 rounded-xl bg-page flex items-center justify-center text-muted hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-black text-main leading-none">Support History</h1>
                        <p className="text-[10px] font-bold text-muted opacity-80 uppercase tracking-widest mt-1">Track your request</p>
                    </div>
                    <div className="w-10" />
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-6 mt-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-card rounded-2xl border border-border-card shadow-sm">
                            <History size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-main tracking-tight">Recent Tickets</h2>
                            <p className="text-xs font-bold text-muted opacity-80 uppercase tracking-widest mt-0.5">Clinical Response Tracking</p>
                        </div>
                    </div>
                    {tickets.length > 0 && (
                        <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1.5 rounded-full uppercase tracking-widest">
                            {tickets.length} Records
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-card rounded-[2.5rem] animate-pulse border border-border-card shadow-sm"></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-card rounded-[2.5rem] p-12 text-center border border-red-50 shadow-xl shadow-red-500/5 flex flex-col items-center">
                        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
                            <AlertTriangle size={36} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-main mb-2">Error Retrieval</h3>
                        <p className="text-muted font-medium max-w-xs">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-8 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 transition-colors"
                        >
                            Retry Connection
                        </button>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="bg-card rounded-[2.5rem] p-16 text-center border border-border-card shadow-sm flex flex-col items-center">
                        <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mb-8">
                            <HelpCircle size={48} className="text-indigo-600" />
                        </div>
                        <h3 className="text-2xl font-black text-main mb-2">No Active Tickets</h3>
                        <p className="text-muted font-medium max-w-sm mb-10 leading-relaxed">
                            You haven't submitted any clinical or technical support requests yet.
                        </p>
                        <button 
                            onClick={() => navigate('/help/support')}
                            className="bg-indigo-600 text-white px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                        >
                            Submit First Ticket
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => {
                            const status = getStatusStyles(ticket.status);
                            const CategoryIcon = getCategoryIcon(ticket.category);
                            
                            return (
                                <button
                                    key={ticket._id}
                                    className="group w-full bg-card p-6 rounded-[2rem] border border-border-card shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all text-left flex items-start gap-5 relative overflow-hidden"
                                >
                                    {/* Status Indicator Bar */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${status.bg.split(' ')[0]}`}></div>
                                    
                                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-page flex items-center justify-center text-muted opacity-80 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                                        <CategoryIcon size={22} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-1.5">
                                            <h4 className="text-sm font-black text-main group-hover:text-indigo-600 transition-colors truncate tracking-tight">{ticket.subject}</h4>
                                            <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.bg}`}>
                                                <status.icon size={10} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                                                {status.label}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-muted opacity-80 line-clamp-1 mb-3">
                                            {ticket.message}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 text-muted opacity-60">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                                    {new Date(ticket.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <span className="w-1 h-1 rounded-full bg-border-card"></span>
                                            <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">
                                                ID: #{ticket._id.slice(-6).toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted opacity-60 group-hover:text-indigo-500 transition-all">
                                        <ChevronRight size={18} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TicketHistory;
