import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { PortalService } from '../../api/services/portal.service';

interface MindBalanceHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    slug: string;
}

const MindBalanceHelpModal: React.FC<MindBalanceHelpModalProps> = ({ isOpen, onClose, slug }) => {
    const [content, setContent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && slug) {
            fetchContent();
        }
    }, [isOpen, slug]);

    const fetchContent = async () => {
        setIsLoading(true);
        try {
            const data = await PortalService.getPortalContent(slug);
            setContent(data);
        } catch (err) {
            console.error('Failed to load help content:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const renderHelpMarkdown = (text: string) => {
        if (!text) return null;
        // Handle escaped newlines from JSON
        const lines = text.replace(/\\n/g, '\n').replace(/\\r/g, '').split('\n');

        return lines.map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed && line.length === 0) return <div key={index} className="h-4" />;

            if (line.startsWith('###')) {
                return (
                    <h3 key={index} className="text-xl font-black text-main mt-8 mb-4 tracking-tight uppercase">
                        {line.replace('###', '').trim()}
                    </h3>
                );
            }

            // List items (Mobile Parity: Icon Box + Text)
            const bulletMatch = line.match(/^([*-]|\d+\.)\s+(.*)/);
            if (bulletMatch) {
                const isNumbered = !!line.match(/^\d+\./);
                const itemContent = bulletMatch[2];
                return (
                    <div key={index} className="flex gap-4 mb-4 group px-2">
                        <div className="w-8 h-8 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-[10px]">
                            {isNumbered ? line.match(/^\d+\./)?.[0] : <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                        </div>
                        <p className="text-sm font-medium text-muted leading-relaxed pt-1">
                            {itemContent.split('**').map((part, i) => (
                                <span key={i} className={i % 2 === 1 ? 'font-black text-indigo-600' : ''}>{part}</span>
                            ))}
                        </p>
                    </div>
                );
            }

            // Normal text
            return (
                <p key={index} className="text-sm font-medium text-muted mb-4 leading-relaxed">
                    {line.split('**').map((part, i) => (
                        <span key={i} className={i % 2 === 1 ? 'font-black text-main' : 'opacity-90'}>{part}</span>
                    ))}
                </p>
            );
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/40 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-card rounded-[2.5rem] md:rounded-[3.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-border-card"
                    >
                        {/* Header */}
                        <div className="px-8 md:px-12 h-20 md:h-24 shrink-0 flex items-center justify-between border-b border-border-card bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                            <div>
                                <h3 className="text-lg md:text-xl font-black text-main tracking-tight uppercase">Clinical Guide</h3>
                                <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">{content?.title || 'Loading Documentation...'}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-2xl bg-page flex items-center justify-center text-muted opacity-80 hover:text-red-500 hover:bg-red-50 transition-all hover:rotate-90 active:scale-90"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-8 md:px-12 py-10 no-scrollbar">
                            {isLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-6">
                                    <div className="w-16 h-1 bg-indigo-100 rounded-full overflow-hidden">
                                        <div className="w-1/2 h-full bg-indigo-600 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" />
                                    </div>
                                    <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-[0.2em] animate-pulse italic">Aggregating Clinical Data...</p>
                                </div>
                            ) : (
                                <article className="prose prose-slate max-w-none">
                                    {content?.updatedAt && (
                                        <div className="inline-flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-lg mb-8 border border-indigo-100/50">
                                            <Clock size={12} className="text-indigo-600" />
                                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                                Updated {new Date(content.updatedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        {renderHelpMarkdown(content?.content)}
                                    </div>

                                    {/* Feedback (Mobile Parity) */}
                                    <div className="mt-16 pt-10 border-t border-border-card text-center mb-6">
                                        <h4 className="text-sm font-black text-main mb-8 uppercase tracking-tight italic">Was this clinical insight helpful?</h4>
                                        <div className="flex gap-4 max-w-xs mx-auto">
                                            <button className="flex-1 h-12 rounded-xl bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 active:scale-95 border border-emerald-100/50">
                                                <ThumbsUp size={14} /> Yes
                                            </button>
                                            <button className="flex-1 h-12 rounded-xl bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2 active:scale-95 border border-rose-100/50">
                                                <ThumbsDown size={14} /> No
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MindBalanceHelpModal;
