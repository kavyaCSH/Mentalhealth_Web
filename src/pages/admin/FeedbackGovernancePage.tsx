import React, { useState, useEffect } from 'react';
import { 
    MessageSquare, 
    AlertCircle, 
    CheckCircle2, 
    Loader2, 
    Search,
    Filter,
    Clock,
    User,
    Mail,
    Send,
    ArrowLeft,
    Inbox,
    RefreshCw,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FeedbackService } from '../../api/services/feedback.service';
import type { SupportTicket, TicketStatus, FeedbackCategory } from '../../types/feedback.types';
import Button from '../../components/ui/Button';

const FeedbackGovernancePage = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | 'all'>('all');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const statuses: (TicketStatus | 'all')[] = ['all', 'open', 'in_progress', 'resolved', 'closed'];
    const categories: (FeedbackCategory | 'all')[] = ['all', 'support', 'bug', 'feature_request', 'complaint', 'other'];

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const response = await FeedbackService.listAllTickets({
                status: statusFilter === 'all' ? undefined : statusFilter,
                category: categoryFilter === 'all' ? undefined : categoryFilter
            });
            setTickets(response.data);
        } catch (err) {
            console.error('Failed to load support tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResolveTicket = async (ticketId: string) => {
        setResolvingId(ticketId);
        setMessage(null);
        try {
            await FeedbackService.updateTicketStatus(ticketId, {
                status: 'resolved',
                adminNotes: adminNotes || 'Issue addressed by Super Admin.'
            });
            await fetchTickets();
            setSelectedTicket(null);
            setAdminNotes('');
            setMessage({ type: 'success', text: `Ticket ${ticketId} has been successfully resolved.` });
        } catch (err) {
            setMessage({ type: 'error', text: 'Protocol failed: Support resolution could not be synchronized.' });
        } finally {
            setResolvingId(null);
        }
    };

    const filteredTickets = tickets.filter(t => 
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading && tickets.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw size={40} className="text-indigo-600 animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Governance Ledger...</p>
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
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> System Command
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <MessageSquare size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight text-main">Quality Oversight</h1>
                            <p className="text-muted font-medium">Centralized support desk for clinicians, patients, and platform staff.</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            {tickets.filter(t => t.status === 'open').length} High-Alert Tickets
                        </span>
                    </div>
                    <Button 
                        variant="primary" 
                        leftIcon={<RefreshCw size={18} className={loading ? 'animate-spin' : ''} />}
                        onClick={fetchTickets}
                        isLoading={loading}
                        className="shadow-xl shadow-indigo-100"
                    >
                        Sync Feed
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

            <div className="grid gap-10 lg:grid-cols-[1fr,400px]">
                <div className="space-y-8">
                    {/* Filter Suite */}
                    <div className="card-premium p-6 flex flex-col md:flex-row gap-6 items-center justify-between border-slate-100/50">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0 w-full">
                            {statuses.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setStatusFilter(s); setTimeout(fetchTickets, 10); }}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        statusFilter === s 
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                        : 'bg-slate-50 text-slate-500 border border-slate-100 hover:border-indigo-200'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-80 shrink-0">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="text"
                                placeholder="Search support threads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Ticket List */}
                    <div className="space-y-6">
                        {filteredTickets.length > 0 ? (
                            filteredTickets.map((ticket) => (
                                <motion.div 
                                    key={ticket._id}
                                    layout
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`card-premium p-8 cursor-pointer transition-all border-slate-100/50 ${
                                        selectedTicket?._id === ticket._id ? 'ring-2 ring-indigo-600 ring-offset-4 shadow-2xl' : 'hover:translate-x-2'
                                    }`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                    ticket.category === 'bug' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    ticket.category === 'feature_request' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                }`}>
                                                    {ticket.category}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    ID: {ticket._id.slice(-8)}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{ticket.subject}</h3>
                                            <p className="text-sm font-medium text-slate-500 line-clamp-1">{ticket.message}</p>
                                        </div>
                                        <div className="flex items-center gap-6 shrink-0">
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Received</p>
                                                <p className="text-xs font-black text-slate-600">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                                ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                                                ticket.status === 'open' ? 'bg-rose-50 text-rose-600 animate-pulse' :
                                                'bg-amber-50 text-amber-600'
                                            }`}>
                                                {ticket.status === 'resolved' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="card-premium p-20 text-center border-dashed border-2 border-slate-100">
                                <Inbox size={60} className="mx-auto text-slate-200 mb-6" />
                                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Support Bench Clear</h3>
                                <p className="text-sm font-medium text-slate-400 mt-2">All governance protocols have been resolved.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Resolution Panel */}
                <div className="space-y-8">
                    <AnimatePresence mode="wait">
                        {selectedTicket ? (
                            <motion.div 
                                key={selectedTicket._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="card-premium p-10 bg-slate-900 text-white border-none shadow-2xl h-fit sticky top-8"
                            >
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Selected Feed</p>
                                        <h2 className="text-3xl font-black tracking-tight">{selectedTicket.subject}</h2>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700/50">
                                            <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
                                                "{selectedTicket.message}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-5 bg-slate-800/50 rounded-3xl border border-slate-700/50">
                                                <User size={18} className="text-indigo-400 mb-2" />
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Requester</p>
                                                <p className="text-xs font-black truncate">{selectedTicket.userId || 'Anonymous'}</p>
                                            </div>
                                            <div className="p-5 bg-slate-800/50 rounded-3xl border border-slate-700/50">
                                                <Clock size={18} className="text-indigo-400 mb-2" />
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Time Elapsed</p>
                                                <p className="text-xs font-black">2h 45m</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-800">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Protocol Resolution</p>
                                        <textarea 
                                            rows={4}
                                            className="w-full bg-slate-800 border-none rounded-3xl p-6 text-sm font-medium text-white placeholder-slate-500 focus:ring-2 ring-indigo-500 outline-none transition-all"
                                            placeholder="Enter operational notes or resolution steps..."
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                        />
                                        <Button 
                                            variant="primary" 
                                            className="w-full rounded-3xl h-16 text-sm font-black uppercase tracking-widest glow-primary"
                                            onClick={() => handleResolveTicket(selectedTicket._id)}
                                            isLoading={resolvingId === selectedTicket._id}
                                            leftIcon={<Send size={18} />}
                                            disabled={selectedTicket.status === 'resolved'}
                                        >
                                            {selectedTicket.status === 'resolved' ? 'Archive Protocol' : 'Sync Resolution'}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="card-premium p-10 text-center border-slate-100 h-[600px] flex flex-col items-center justify-center gap-6"
                            >
                                <div className="w-20 h-20 bg-page rounded-full flex items-center justify-center text-slate-200">
                                    <Inbox size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Protocol Selector</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Securely select a ticket to initiate resolution oversight.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default FeedbackGovernancePage;
