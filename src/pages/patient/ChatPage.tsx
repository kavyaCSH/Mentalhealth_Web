import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    Send, Bot, ChevronLeft, Activity, Moon, HeartCrack, Flame, Leaf, ArrowUpRight
} from 'lucide-react';
import { connectSocket, getSocket } from '../../api/socketService';
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
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

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
                    content: m.sender_name === 'Skyheal AI' ? sanitizeAIContent(m.content) : m.content
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
                const cleanedContent = msg.sender_name === 'Skyheal AI' ? sanitizeAIContent(msg.content) : msg.content;
                if (msg.sender_name === 'Skyheal AI') setIsTyping(false);

                setMessages((prev) => {
                    if (msg.sender_name !== 'Skyheal AI') {
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

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-slate-50 md:rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in group w-full max-w-7xl mx-auto md:my-6 border border-slate-100">
            {/* Premium Header */}
            <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-indigo-400 rounded-2xl blur-lg opacity-20 animate-pulse"></div>
                            <Bot size={24} className="text-indigo-600 relative z-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-black text-slate-900 tracking-tight">Skyheal AI</h1>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                            </div>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Virtual Companion</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 relative z-10 bg-gradient-to-b from-slate-50 to-white no-scrollbar">
                {connecting ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Establishing Connection...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4 animate-fade-in">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-indigo-500 blur-[60px] opacity-20 rounded-full"></div>
                            <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center border border-slate-100 relative z-10">
                                <Bot size={48} className="text-indigo-600" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Hello, {user?.firstName || 'there'}.</h2>
                        <p className="text-slate-500 font-medium mb-12">I'm your personalized wellness companion. How are you feeling today?</p>
                        
                        <div className="w-full text-left bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-2">Suggested Topics</p>
                            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar mb-4">
                                {SUGGESTION_CATEGORIES.map((cat, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveCat(idx)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${activeCat === idx ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                                    >
                                        {cat.icon} {cat.label}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {SUGGESTION_CATEGORIES[activeCat].questions.map((q, j) => (
                                    <button
                                        key={j}
                                        onClick={() => sendMessage(q)}
                                        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-2xl text-left text-sm font-semibold transition-colors group border border-transparent hover:border-indigo-100"
                                    >
                                        <span className="truncate pr-4">{q}</span>
                                        <ArrowUpRight size={16} className="text-slate-400 group-hover:text-indigo-500 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto w-full space-y-6">
                        {messages.map((msg, i) => {
                            const isAI = msg.sender_name === 'Skyheal AI';
                            return (
                                <div key={msg._id || i} className={`flex items-end gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}>
                                    {isAI && (
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                                            <Bot size={20} />
                                        </div>
                                    )}
                                    <div className={`max-w-[80%] md:max-w-[70%] p-5 rounded-[1.5rem] shadow-sm relative ${isAI ? 'bg-white border border-slate-100 rounded-bl-sm text-slate-800' : 'bg-slate-900 border border-slate-800 rounded-br-sm text-white shadow-xl'}`}>
                                        <p className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{msg.content}</p>
                                        <span className={`text-[9px] font-bold block mt-3 ${isAI ? 'text-slate-400' : 'text-slate-400 text-right'}`}>
                                            {formatTime(msg.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {isTyping && (
                            <div className="flex items-end gap-3 justify-start">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
                                    <Bot size={20} />
                                </div>
                                <div className="bg-white border border-slate-100 p-5 rounded-[1.5rem] rounded-bl-sm shadow-sm flex gap-1.5 items-center">
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

            <div className="p-4 md:px-8 md:pb-8 md:pt-4 bg-white border-t border-slate-100 z-20">
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                    className="max-w-4xl mx-auto relative flex items-center"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message your Virtual Companion..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-slate-900 rounded-full py-4 pl-6 pr-16 text-[15px] font-medium transition-all outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className={`absolute right-2 w-10 h-10 flex items-center justify-center rounded-full transition-all ${input.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:scale-105 active:scale-95' : 'bg-slate-200 text-slate-400'}`}
                    >
                        <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPage;
