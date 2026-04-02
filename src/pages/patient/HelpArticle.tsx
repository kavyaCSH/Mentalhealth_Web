import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
    ChevronLeft, Clock, ThumbsUp, ThumbsDown, MessageCircle, AlertCircle, Loader2, ArrowRight
} from 'lucide-react';
import { PortalService } from '../../api/services/portal.service';
import type { HelpContent } from '../../api/services/portal.service';

const HelpArticle = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [article, setArticle] = useState<HelpContent | null>(null);
    const [loading, setLoading] = useState(true);
    const title = location.state?.title || article?.title || 'Article';

    useEffect(() => {
        const fetchContent = async () => {
            if (!slug) return;
            try {
                const data = await PortalService.getPortalContent(slug);
                setArticle(data);
            } catch (error) {
                console.error('Error fetching help content:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [slug]);

    const renderContent = (content: string) => {
        const lines = content.replace(/\\n/g, '\n').replace(/\\r/g, '\r').split('\n');
        return lines.map((line, index) => {
            if (line.startsWith('###')) {
                return (
                    <h3 key={index} className="text-2xl font-black text-slate-900 mt-12 mb-6 tracking-tight">
                        {line.replace('###', '').trim()}
                    </h3>
                );
            }
            if (line.match(/^\d+\./) || line.startsWith('*') || line.startsWith('-')) {
                const isNumbered = line.match(/^\d+\./);
                const text = line.replace(/^\d+\./, '').replace(/^[*-]/, '').trim();
                const parts = text.split('**');
                
                return (
                    <div key={index} className="flex gap-4 mb-6 group">
                        <div className="w-8 h-8 shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-xs">
                            {isNumbered ? line.match(/^\d+\./)?.[0] : <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>}
                        </div>
                        <p className="text-[17px] text-slate-700 leading-relaxed font-medium">
                            {parts.map((part, i) => (
                                <span key={i} className={i % 2 === 1 ? 'font-black text-slate-900' : ''}>
                                    {part}
                                </span>
                            ))}
                        </p>
                    </div>
                );
            }
            if (line.trim().length > 0) {
                const parts = line.split('**');
                return (
                    <p key={index} className="text-[17px] text-slate-600 mb-8 leading-relaxed font-medium">
                        {parts.map((part, i) => (
                            <span key={i} className={i % 2 === 1 ? 'font-black text-slate-900' : 'opacity-90'}>
                                {part}
                            </span>
                        ))}
                    </p>
                );
            }
            return <div key={index} className="h-4" />;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Fetching Wisdom...</p>
                </div>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
                <div className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center mb-8">
                    <AlertCircle className="text-red-500" size={48} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Content Unavailable</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium">We couldn't find the article you're looking for. It might have been moved or updated.</p>
                <button 
                    onClick={() => navigate('/help')}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-colors"
                >
                    Back to Help Center
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Minimal Header */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-30">
                <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex-1 px-6 truncate">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2">Reading</span>
                        <span className="text-sm font-black text-slate-900 truncate">{title}</span>
                    </div>
                </div>
            </div>

            {/* Article Content */}
            <article className="max-w-3xl mx-auto px-6 py-16">
                <header className="mb-16">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-8 leading-tight">{title}</h1>
                    {article.updatedAt && (
                        <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl">
                            <Clock size={14} className="text-indigo-600" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                Updated {new Date(article.updatedAt).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </header>

                <div className="content-body">
                    {renderContent(article.content)}
                </div>

                {/* Feedback Section */}
                <section className="mt-24 pt-12 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-[2.5rem] p-10 text-center">
                        <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Did this guide help you?</h3>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="flex-1 sm:max-w-[160px] h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center gap-3 text-emerald-600 font-black text-sm hover:bg-emerald-50 hover:border-emerald-100 transition-all shadow-sm">
                                <ThumbsUp size={18} />
                                Yes, thanks!
                            </button>
                            <button className="flex-1 sm:max-w-[160px] h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center gap-3 text-red-500 font-black text-sm hover:bg-red-50 hover:border-red-100 transition-all shadow-sm">
                                <ThumbsDown size={18} />
                                Not really
                            </button>
                        </div>
                    </div>
                </section>

                {/* Next Steps */}
                <footer className="mt-12 space-y-4">
                    <button 
                        onClick={() => navigate('/help/support')}
                        className="w-full bg-indigo-600 text-white p-6 rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group"
                    >
                        <MessageCircle size={18} />
                        Talk to a Professional
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </footer>
            </article>
        </div>
    );
};

export default HelpArticle;
