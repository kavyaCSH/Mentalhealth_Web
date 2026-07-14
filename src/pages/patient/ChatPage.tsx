import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    Send, Bot, ChevronLeft, Activity, Moon, HeartCrack, Flame, Leaf, ArrowUpRight, User, MoreVertical, Trash2, HelpCircle, X, Sparkles
} from 'lucide-react';
import { connectSocket, getSocket } from '../../api/socketService';
import MindBalanceHelpModal from '../../components/clinical/MindBalanceHelpModal';
import type { RootState } from '../../store';

const SUGGESTION_CATEGORIES = [
    {
        label: 'Mood',
        icon: <Activity size={16} />,
        questions: ["I've been feeling really low lately", 'I feel numb and disconnected', "I can't seem to feel happy anymore", 'How do I deal with mood swings?', "I'm feeling overwhelmed today"],
    },
    {
        label: 'Anxiety',
        icon: <HeartCrack size={16} />,
        questions: ['I feel anxious all the time', 'I have panic attacks frequently', 'My mind won\'t stop racing at night', 'How do I calm myself during anxiety?', 'What are breathing techniques for anxiety?'],
    },
    {
        label: 'Sleep',
        icon: <Moon size={16} />,
        questions: ["I can't sleep no matter what I try", 'I wake up exhausted every morning', 'How do I stop overthinking at bedtime?', 'What is a good sleep routine?', 'I sleep too much but still feel tired'],
    },
    {
        label: 'Stress',
        icon: <Flame size={16} />,
        questions: ['Work stress is affecting my health', 'How do I manage burnout?', 'I feel pressure from all directions', 'How do I stop procrastinating?', 'I feel like I\'m failing at everything'],
    },
    {
        label: 'Self-care',
        icon: <Leaf size={16} />,
        questions: ['How do I start practicing mindfulness?', 'What are simple self-care habits?', 'How do I build emotional resilience?', 'How can I improve my self-esteem?', 'What are coping strategies for hard days?'],
    },
];

interface Message {
    _id?: string;
    content: string;
    sender_name: string;
    createdAt?: string;
}

const ChatPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state: RootState) => state.auth);
    
    // Support generic chat rooms via route state or default to patient's private AI
    const roomType = location.state?.roomType || 'private_ai';
    const roomId = location.state?.roomId || user?.id || null;
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [connecting, setConnecting] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [activeCat, setActiveCat] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const isAIMessage = useCallback((name?: string) => {
        if (!name) return false;
        const n = name.toLowerCase();
        return n.includes('ai') || n.includes('bot') || n.includes('sky') || n === 'skyheal ai';
    }, []);

    const sanitizeAIContent = (content: string) => {
        return content
            .replace(/【.*?】/g, '')
            .replace(/^\[?Skyheal AI\s*(\(ai\))?\]?:\s*/i, '')
            .replace(/\s*[—–-]\s*Skyheal AI\s*\(For medical advice,\s*consult a professional\.\)$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const setupChat = async () => {
        try {
            const activeRoomId = roomId || user?.id || user?._id || user?.userId;
            if (!activeRoomId) return;

            setConnecting(true);
            const socket = await connectSocket();
            console.log('[ChatPage] Socket connected:', socket.id);
            
            console.log('[ChatPage] activeRoomId:', activeRoomId, 'state roomId:', roomId, 'user:', { id: user?.id, _id: user?._id, userId: user?.userId });

            if (!activeRoomId) {
                console.warn('[ChatPage] No room ID available yet, waiting for user hydration');
                // Don't set connecting to false yet if we're waiting for user, 
                // but allow a timeout
                setTimeout(() => setConnecting(false), 3000); 
                return;
            }


            setConnecting(false);
            const activeId = String(activeRoomId);
            console.log(`[ChatPage] Joining ${roomType} room: ${activeId}`);
            socket.emit('join_room', { room_id: activeId, room_type: roomType });

            setIsTyping(true);
            socket.emit('get_history', String(activeRoomId));

            socket.on('chat_history', (history: Message[]) => {
                const cleaned = history.map(m => ({
                    ...m,
                    content: isAIMessage(m.sender_name) ? sanitizeAIContent(m.content) : m.content
                }));
                // Filter unique
                const unique = cleaned.filter((msg, index, self) =>
                    index === self.findIndex((t) => (
                        t._id === msg._id || (t.content === msg.content && t.createdAt === msg.createdAt)
                    ))
                );
                setMessages([...unique].reverse());
                setIsTyping(false);
            });

            socket.on('new_message', (msg: Message) => {
                const isAI = isAIMessage(msg.sender_name);
                const cleanedContent = isAI ? sanitizeAIContent(msg.content) : msg.content;
                if (isAI) setIsTyping(false);

                setMessages((prev) => {
                    if (!isAI) {
                        const optimisticMatchIndex = [...prev].reverse().findIndex(m =>
                            m._id?.toString().startsWith('temp_') &&
                            m.content.trim().toLowerCase() === cleanedContent.trim().toLowerCase()
                        );

                        if (optimisticMatchIndex !== -1) {
                            const realIndex = prev.length - 1 - optimisticMatchIndex;
                            const newMessages = [...prev];
                            newMessages[realIndex] = { ...msg, content: cleanedContent };
                            return newMessages;
                        }
                    }

                    const isDuplicate = prev.some(m =>
                        m._id === msg._id ||
                        (m.content.trim().toLowerCase() === cleanedContent.trim().toLowerCase() &&
                            m.sender_name === msg.sender_name &&
                            Math.abs(new Date(m.createdAt || 0).getTime() - new Date(msg.createdAt || 0).getTime()) < 10000)
                    );
                    if (isDuplicate) return prev;

                    return [...prev, { ...msg, content: cleanedContent }];
                });
            });
        } catch (err) {
            console.error('[ChatPage] Setup error:', err);
            setConnecting(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            try {
                const activeId = roomId || user?.id || user?._id || user?.userId;
                if (!activeId) {
                    if (mounted) setConnecting(false);
                    return;
                }
                await setupChat();
            } catch (err) {
                console.error('[ChatPage] Init error:', err);
                if (mounted) setConnecting(false);
            }
        };
        
        init();
        
        return () => {
            mounted = false;
            const currentSocket = getSocket();
            currentSocket?.off('new_message');
            currentSocket?.off('chat_history');
        };
    }, [roomId, roomType, user?.id, user?._id, user?.userId]);

    const sendMessage = useCallback((text?: string) => {
        const content = (text || input).trim();
        if (!content) return;
        const currentSocket = getSocket();
        const activeId = roomId || user?.id || user?._id || user?.userId;
        
        console.log('[ChatPage] Socket status:', {
            exists: !!currentSocket,
            connected: currentSocket?.connected,
            roomId: activeId,
            content: content.substring(0, 20)
        });

        if (!activeId) {
            console.error('[ChatPage] Cannot send: Effective roomId is missing');
            return;
        }

        if (!currentSocket || !currentSocket.connected) {
            console.warn('[ChatPage] Socket not connected, attempting to reconnect...');
            connectSocket().then(s => {
                s.emit('send_message', {
                    room_id: String(activeId),
                    room_type: roomType,
                    content,
                });
            }).catch(err => console.error('[ChatPage] Reconnect and send failed:', err));
        } else {
            currentSocket.emit('send_message', {
                room_id: String(activeId),
                room_type: roomType,
                content,
            });
        }

        const optimisticMsg: Message = {
            _id: `temp_${Date.now()}`,
            content,
            sender_name: 'You',
            createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, optimisticMsg]);
        setInput('');

        if (roomType === 'private_ai' || content.toLowerCase().includes('@skyheal')) {
            setIsTyping(true);
        }
    }, [input, roomId, roomType, user?.id, user?._id, user?.userId]);

    const formatTime = (iso?: string) => {
        if (!iso) return '';
        const date = new Date(iso);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleClearChat = () => {
        const socket = getSocket();
        const activeId = roomId || user?.id || user?._id || user?.userId;
        if (socket && activeId) {
            socket.emit('clear_chat', { room_id: String(activeId), session_id: 'main' });
            setMessages([]);
            setShowMenu(false);
        }
    };

    const getContextualSuggestions = () => {
        if (messages.length === 0 || isTyping) return [];
        
        const lastMsg = messages[messages.length - 1].content.toLowerCase();
        let catIndex = 4; // Default to self-care
        
        if (lastMsg.includes('sad') || lastMsg.includes('low')) catIndex = 0;
        else if (lastMsg.includes('anxio') || lastMsg.includes('panic')) catIndex = 1;
        else if (lastMsg.includes('sleep') || lastMsg.includes('tire')) catIndex = 2;
        else if (lastMsg.includes('stress') || lastMsg.includes('work')) catIndex = 3;
        
        return SUGGESTION_CATEGORIES[catIndex].questions.slice(0, 3);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-page md:rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in group w-full max-w-7xl mx-auto md:my-6 border border-border-card">
            {/* Premium Header */}
            <header className="h-20 bg-card/80 backdrop-blur-xl border-b border-border-card flex items-center justify-between px-6 z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center bg-page hover:bg-card text-muted transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 flex items-center justify-center shadow-inner relative group">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-400 to-violet-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse"></div>
                            <Bot size={24} className="text-indigo-600 relative z-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black text-main tracking-tight">Skyheal AI</h1>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                            </div>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Virtual Companion</p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${showMenu ? 'bg-indigo-600 text-white' : 'bg-page hover:bg-card text-muted'}`}
                    >
                        <MoreVertical size={20} />
                    </button>
                    
                    {showMenu && (
                        <>
                            <div 
                                className="fixed inset-0 z-40 bg-transparent" 
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 mt-3 w-64 bg-card rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-border-card z-50 overflow-hidden animate-in fade-in zoom-in slide-in-from-top-4 duration-300">
                                <div className="p-2 space-y-1">
                                    <button 
                                        onClick={handleClearChat}
                                        className="w-full flex items-center gap-3 px-4 py-4 text-left text-sm font-black text-rose-600 hover:bg-rose-50 rounded-2xl transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                                            <Trash2 size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>Clear Chat</span>
                                            <span className="text-[10px] font-medium text-rose-300 uppercase tracking-widest mt-0.5">Erase all history</span>
                                        </div>
                                    </button>
                                    
                                    <button 
                                        onClick={() => { setShowHelp(true); setShowMenu(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-4 text-left text-sm font-black text-main hover:bg-page rounded-2xl transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-page group-hover:bg-card flex items-center justify-center transition-colors">
                                            <HelpCircle size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span>About MindBalance</span>
                                            <span className="text-[10px] font-medium text-muted opacity-80 uppercase tracking-widest mt-0.5">Learn more about AI</span>
                                        </div>
                                    </button>
                                    
                                    <div className="h-px bg-page my-1 mx-4" />
                                    
                                    <button 
                                        onClick={() => setShowMenu(false)}
                                        className="w-full flex items-center gap-3 px-4 py-4 text-left text-sm font-black text-muted opacity-80 hover:bg-page rounded-2xl transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-page group-hover:bg-page flex items-center justify-center transition-colors">
                                            <X size={18} />
                                        </div>
                                        <span>Cancel</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative z-10 bg-page no-scrollbar">
                {connecting ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-xs font-black uppercase tracking-widest text-muted">Establishing Connection...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto text-center px-4 animate-fade-in">
                        <div className="relative mb-10 group cursor-default">
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 blur-[80px] opacity-30 rounded-full group-hover:opacity-50 transition-opacity duration-700"></div>
                            <div className="w-28 h-28 bg-card/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-white/20 relative z-10 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
                                <Bot size={56} className="text-indigo-600 drop-shadow-md" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-main tracking-tight mb-2">Hello, {user?.firstName || 'there'}.</h2>
                        <p className="text-muted font-medium mb-12">I'm your personalized wellness companion. How are you feeling today?</p>
                        
                        <div className="w-full text-left bg-card/60 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl border border-white/40 dark:border-white/5">
                            <div className="flex items-center gap-3 mb-6 ml-2">
                                <Sparkles size={18} className="text-indigo-500" />
                                <p className="text-xs font-black uppercase tracking-widest text-main">Suggested Topics</p>
                            </div>
                            <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar mb-4 snap-x">
                                {SUGGESTION_CATEGORIES.map((cat, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveCat(idx)}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap border snap-start ${activeCat === idx ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow-lg shadow-indigo-200/50' : 'bg-page/50 hover:bg-card text-muted border-border-card hover:border-indigo-200 hover:shadow-sm'}`}
                                    >
                                        {cat.icon} {cat.label}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {SUGGESTION_CATEGORIES[activeCat].questions.map((q, j) => (
                                    <button
                                        key={j}
                                        onClick={() => sendMessage(q)}
                                        className="flex items-center justify-between p-5 bg-page/40 hover:bg-card hover:dark:bg-slate-800 text-main rounded-[1.5rem] text-left text-[14px] font-semibold transition-all duration-300 group border border-border-card hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5"
                                    >
                                        <span className="truncate pr-4">{q}</span>
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <ArrowUpRight size={16} className="text-indigo-500" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto w-full space-y-6">
                        {messages.map((msg, i) => {
                            const isAI = isAIMessage(msg.sender_name);
                            return (
                                <div key={msg._id || i} className={`flex items-end gap-3 ${isAI ? 'justify-start' : 'justify-end animate-slide-up'}`}>
                                    {isAI && (
                                        <div className="flex flex-col items-center gap-1 shrink-0">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                                                <Bot size={20} />
                                            </div>
                                        </div>
                                    )}
                                    <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-[2rem] relative transition-all duration-300 group/bubble ${
                                        isAI 
                                            ? 'bg-card/90 backdrop-blur-sm border border-border-card rounded-bl-md text-main shadow-lg shadow-indigo-500/5' 
                                            : 'bg-gradient-to-br from-indigo-600 to-violet-600 border-none rounded-br-md text-white shadow-xl shadow-indigo-500/20'
                                    }`}>
                                        <p className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{msg.content}</p>
                                        <div className={`flex items-center gap-2 mt-3 opacity-70 ${isAI ? 'text-muted' : 'text-indigo-100 justify-end'}`}>
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    {!isAI && (
                                        <div className="w-10 h-10 rounded-2xl bg-card border border-border-card text-muted flex items-center justify-center shrink-0 shadow-sm">
                                            <User size={20} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                        {isTyping && (
                            <div className="flex items-end gap-3 justify-start">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                                    <Bot size={20} />
                                </div>
                                <div className="bg-card border border-border-card p-5 rounded-[1.5rem] rounded-bl-sm shadow-sm flex gap-1.5 items-center">
                                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2.5 h-2.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className="p-4 md:px-8 md:pb-8 md:pt-4 bg-card border-t border-border-card z-20">
                {/* Contextual Suggestions */}
                {messages.length > 0 && !isTyping && (
                    <div className="max-w-4xl mx-auto mb-4 animate-fade-in">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted opacity-80 mb-3 ml-2 italic">Suggested Continuations</p>
                        <div className="flex flex-wrap gap-2">
                            {getContextualSuggestions().map((q, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => sendMessage(q)}
                                    className="px-4 py-2 bg-indigo-50/50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 hover:border-indigo-600 rounded-xl text-xs font-black transition-all duration-300 active:scale-95 shadow-sm hover:shadow-indigo-200"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    className="max-w-4xl mx-auto relative flex items-center group/input"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-full blur-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500"></div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message your Virtual Companion..."
                        className="w-full bg-card/80 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] focus:shadow-[0_8px_30px_rgb(79,70,229,0.1)] text-main rounded-full py-4.5 pl-6 pr-16 text-[15px] font-medium transition-all outline-none"
                        style={{ paddingTop: '18px', paddingBottom: '18px' }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className={`absolute right-2.5 w-11 h-11 flex items-center justify-center rounded-full transition-all duration-300 ${input.trim() ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95' : 'bg-page text-muted opacity-40 dark:bg-slate-800 dark:text-muted'}`}
                    >
                        <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />
                    </button>
                </form>
            </div>

            {/* Help Modal */}
            <MindBalanceHelpModal 
                isOpen={showHelp} 
                onClose={() => setShowHelp(false)} 
                slug="about_mindbalance" 
            />
        </div>
    );
};

export default ChatPage;
