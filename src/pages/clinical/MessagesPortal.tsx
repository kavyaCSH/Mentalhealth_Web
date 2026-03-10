import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MessageSquare,
    ArrowLeft,
    Search,
    Inbox,
    Clock,
    Activity
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { MessagingService } from '../../api/services/messaging.service';

const MessagesPortal = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchConversations = async () => {
            setIsLoading(true);
            try {
                const data = await MessagingService.getConversations();
                setConversations(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch conversations:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConversations();
    }, []);

    const filteredConversations = conversations.filter(c =>
        c.participant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.participant?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Messages</h1>
                    <p className="text-slate-500 font-medium">Secure HIPAA-compliant communication with patients and staff.</p>
                </div>
                <Button variant="primary" size="lg" leftIcon={<MessageSquare size={18} />}>
                    Compose Message
                </Button>
            </header>

            <div className="grid gap-8 lg:grid-cols-3 h-[600px]">
                {/* Conversation List */}
                <div className="card-premium bg-white flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-50 space-y-4">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border-0 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoading ? (
                            <div className="flex justify-center py-10">
                                <Activity className="animate-spin text-indigo-600" size={24} />
                            </div>
                        ) : filteredConversations.length > 0 ? (
                            filteredConversations.map((c, i) => (
                                <div key={c.id || i} className={`p-4 rounded-2xl cursor-pointer transition-all ${i === 0 ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-500">
                                            {c.participant?.firstName?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-bold text-slate-900 truncate">
                                                    {c.participant?.firstName} {c.participant?.lastName}
                                                </p>
                                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                    <Clock size={10} /> 12m
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate mt-1">{c.lastMessage || 'Click to view conversation'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No conversations</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Message View (Empty/Placeholder) */}
                <div className="lg:col-span-2 card-premium bg-slate-50/30 flex flex-col items-center justify-center text-center p-12 border-dashed border-2">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-100 shadow-sm border border-slate-50 mb-6">
                        <Inbox size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Secure Messaging Portal</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-2">Select a conversation from the sidebar to view encrypted message history and respond securely.</p>
                </div>
            </div>
        </div>
    );
};

export default MessagesPortal;
