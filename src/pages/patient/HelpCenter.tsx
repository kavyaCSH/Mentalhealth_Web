import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Moon, Brain, HelpCircle, ShieldCheck, FileText, ChevronRight, BookOpen, MessageCircle, Sparkles
} from 'lucide-react';
import { PortalService } from '../../api/services/portal.service';
import type { HelpTopic } from '../../api/services/portal.service';

const HelpCenter = () => {
    const navigate = useNavigate();
    const [topics, setTopics] = useState<HelpTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const data = await PortalService.getHelpCenter();
                setTopics(data);
            } catch (error) {
                console.error('Error fetching help center:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTopics();
    }, []);

    const getIconForSlug = (slug: string) => {
        const s = slug.toLowerCase();
        if (s.includes('sleep')) return <Moon className="text-purple-500" />;
        if (s.includes('mood')) return <Sparkles className="text-pink-500" />;
        if (s.includes('anxiety')) return <Brain className="text-emerald-500" />;
        if (s.includes('faq')) return <HelpCircle className="text-blue-500" />;
        if (s.includes('privacy')) return <ShieldCheck className="text-amber-500" />;
        if (s.includes('terms')) return <FileText className="text-slate-500" />;
        return <BookOpen className="text-indigo-500" />;
    };

    const getBgColorForSlug = (slug: string) => {
        const s = slug.toLowerCase();
        if (s.includes('sleep')) return 'bg-purple-50';
        if (s.includes('mood')) return 'bg-pink-50';
        if (s.includes('anxiety')) return 'bg-emerald-50';
        if (s.includes('faq')) return 'bg-blue-50';
        if (s.includes('privacy')) return 'bg-amber-50';
        if (s.includes('terms')) return 'bg-slate-50';
        return 'bg-indigo-50';
    };

    const filteredTopics = topics.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.preview.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F9FBFA] pb-24">
            {/* Premium Header Section */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Help Center</h1>
                            <p className="text-slate-500 font-medium mt-1">Guidelines, Support & Resources</p>
                        </div>
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text"
                                placeholder="Search guidelines..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none transition-all font-medium text-slate-900"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-12">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-48 bg-white rounded-[2rem] animate-pulse border border-slate-100 shadow-sm"></div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Explore Topics */}
                        <section>
                            <div className="flex items-center gap-3 mb-8 ml-2">
                                <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Explore Topics</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredTopics.filter(t => !t.slug.includes('privacy') && !t.slug.includes('terms')).map((topic) => (
                                    <button 
                                        key={topic.id}
                                        onClick={() => navigate(`/help/article/${topic.slug}`, { state: { title: topic.title } })}
                                        className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all text-left flex items-start gap-6"
                                    >
                                        <div className={`w-16 h-16 shrink-0 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:scale-110 ${getBgColorForSlug(topic.slug)}`}>
                                            {React.cloneElement(getIconForSlug(topic.slug) as React.ReactElement<any>, { size: 28 })}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors truncate">{topic.title}</h3>
                                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 font-medium">
                                                {topic.preview.replace(/[#*]/g, '').trim()}
                                            </p>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:text-indigo-500 mt-1" size={20} />
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Legal Section */}
                        <section>
                            <div className="flex items-center gap-3 mb-8 ml-2">
                                <div className="w-1 h-6 bg-slate-900 rounded-full"></div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Legal & Policy</h2>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                {topics.filter(t => t.slug.includes('privacy') || t.slug.includes('terms')).map((topic, i, arr) => (
                                    <button 
                                        key={topic.id}
                                        onClick={() => navigate(`/help/article/${topic.slug}`, { state: { title: topic.title } })}
                                        className={`w-full p-8 flex items-center gap-6 hover:bg-slate-50 transition-colors text-left ${i !== arr.length - 1 ? 'border-b border-slate-50' : ''}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getBgColorForSlug(topic.slug)}`}>
                                            {React.cloneElement(getIconForSlug(topic.slug) as React.ReactElement<any>, { size: 24 })}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-black text-slate-900 text-lg">{topic.title}</h3>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">Official Guideline</p>
                                        </div>
                                        <ChevronRight className="text-slate-300" size={20} />
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Support CTA */}
                        <div className="bg-slate-900 rounded-[3rem] p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[100px] -mr-48 -mt-48 rounded-full group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Need direct assistance?</h2>
                                    <p className="text-indigo-200 font-medium">Our clinical support team is here to help you 24/7.</p>
                                </div>
                                <button className="bg-white text-slate-900 px-10 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-colors shadow-2xl flex items-center gap-3">
                                    <MessageCircle size={18} />
                                    Contact Support
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HelpCenter;
