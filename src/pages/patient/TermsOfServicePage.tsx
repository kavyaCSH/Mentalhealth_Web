import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    FileText,
    Shield,
    Clock,
    Users,
    Lock,
    AlertTriangle,
    Scale,
    Globe,
    RefreshCcw,
    Mail,
    ChevronRight,
    CheckCircle2,
    Loader2,
    BookOpen,
} from 'lucide-react';
import { PortalService } from '../../api/services/portal.service';
import type { HelpContent } from '../../api/services/portal.service';

/* ───────────────────────────── section metadata ───────────────────────────── */
const SECTION_ICONS: Record<string, React.ReactNode> = {
    default: <FileText size={18} />,
    accept: <CheckCircle2 size={18} />,
    service: <Globe size={18} />,
    account: <Users size={18} />,
    privacy: <Lock size={18} />,
    conduct: <Shield size={18} />,
    medical: <AlertTriangle size={18} />,
    payment: <Scale size={18} />,
    intellectual: <BookOpen size={18} />,
    terminat: <RefreshCcw size={18} />,
    contact: <Mail size={18} />,
    liabilit: <Scale size={18} />,
};

function getSectionIcon(heading: string) {
    const lower = heading.toLowerCase();
    for (const [key, icon] of Object.entries(SECTION_ICONS)) {
        if (lower.includes(key)) return icon;
    }
    return SECTION_ICONS.default;
}

/* ─────────────────────────── raw content parser ───────────────────────────── */
type Section = { heading: string; body: string[] };

function parseContent(raw: string): Section[] {
    const lines = raw.replace(/\\n/g, '\n').replace(/\\r/g, '\r').split('\n');
    const sections: Section[] = [];
    let current: Section | null = null;

    for (const line of lines) {
        if (line.startsWith('###')) {
            if (current) sections.push(current);
            current = { heading: line.replace(/^###\s*/, '').trim(), body: [] };
        } else if (line.trim()) {
            if (!current) current = { heading: '', body: [] };
            current.body.push(line.trim());
        }
    }
    if (current) sections.push(current);
    return sections.filter(s => s.heading || s.body.length);
}

/* ──────────────────────────── body line renderer ──────────────────────────── */
function RenderLine({ line }: { line: string }) {
    const isBullet = line.match(/^[-*]/) || line.match(/^\d+\./);
    const isNumbered = !!line.match(/^\d+\./);
    const text = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
    const parts = text.split('**');

    const content = (
        <span>
            {parts.map((p, i) =>
                i % 2 === 1 ? (
                    <strong key={i} className="font-black text-main">{p}</strong>
                ) : (
                    <span key={i}>{p}</span>
                )
            )}
        </span>
    );

    if (isBullet) {
        return (
            <li className="flex items-start gap-3 text-[15px] text-muted leading-relaxed font-medium">
                <span className="mt-1.5 shrink-0 w-5 h-5 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[9px]">
                    {isNumbered ? line.match(/^\d+/)?.[0] : '•'}
                </span>
                <span className="flex-1">{content}</span>
            </li>
        );
    }

    return (
        <p className="text-[15px] text-muted leading-relaxed font-medium">{content}</p>
    );
}

/* ═══════════════════════════ main component ════════════════════════════════ */
const TermsOfServicePage = () => {
    const navigate = useNavigate();
    const [article, setArticle] = useState<HelpContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState(0);
    const [tocOpen, setTocOpen] = useState(false);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        PortalService.getPortalContent('terms_of_service')
            .then(setArticle)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    /* track active section on scroll */
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const idx = sectionRefs.current.indexOf(entry.target as HTMLDivElement);
                        if (idx !== -1) setActiveSection(idx);
                    }
                });
            },
            { rootMargin: '-30% 0px -60% 0px' }
        );
        sectionRefs.current.forEach(el => el && observer.observe(el));
        return () => observer.disconnect();
    }, [article]);

    const scrollTo = (idx: number) => {
        sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTocOpen(false);
    };

    /* ── loading ── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-muted font-black uppercase tracking-widest text-[10px]">Loading Terms...</p>
                </div>
            </div>
        );
    }

    const sections = article ? parseContent(article.content) : [];
    const updatedAt = article?.updatedAt
        ? new Date(article.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    /* ── main render ── */
    return (
        <div className="min-h-screen bg-page">

            {/* ── sticky top bar ── */}
            <header className="sticky top-0 z-40 bg-page/80 backdrop-blur-xl border-b border-border-card">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-xl bg-card border border-border-card flex items-center justify-center text-muted hover:text-indigo-600 hover:bg-indigo-50 transition-all shrink-0"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 text-muted text-xs font-black uppercase tracking-widest">
                        <span className="hover:text-indigo-600 cursor-pointer" onClick={() => navigate('/help')}>Help Center</span>
                        <ChevronRight size={12} />
                        <span className="text-main">Terms of Service</span>
                    </div>

                    {/* mobile TOC toggle */}
                    <button
                        onClick={() => setTocOpen(o => !o)}
                        className="ml-auto lg:hidden flex items-center gap-2 bg-card border border-border-card px-4 py-2 rounded-xl text-xs font-black text-main uppercase tracking-widest"
                    >
                        <BookOpen size={14} />
                        Contents
                    </button>
                </div>
            </header>

            {/* ── mobile TOC drawer ── */}
            <AnimatePresence>
                {tocOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="lg:hidden overflow-hidden bg-card border-b border-border-card z-30 relative"
                    >
                        <div className="p-6 space-y-2">
                            {sections.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => scrollTo(i)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm font-black transition-all ${activeSection === i
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-muted hover:bg-page hover:text-main'
                                        }`}
                                >
                                    <span className={activeSection === i ? 'text-white' : 'text-indigo-400'}>
                                        {getSectionIcon(s.heading)}
                                    </span>
                                    <span className="line-clamp-1">{s.heading || 'Introduction'}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-6 py-12 flex gap-10">

                {/* ── desktop sidebar TOC ── */}
                <aside className="hidden lg:flex flex-col w-72 shrink-0">
                    <div className="sticky top-24 space-y-1">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 px-2">Table of Contents</p>
                        {sections.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => scrollTo(i)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm font-bold transition-all group ${activeSection === i
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                    : 'text-muted hover:bg-card hover:text-main'
                                    }`}
                            >
                                <span className={`shrink-0 transition-colors ${activeSection === i ? 'text-white' : 'text-indigo-400 group-hover:text-indigo-500'}`}>
                                    {getSectionIcon(s.heading)}
                                </span>
                                <span className="line-clamp-2 leading-tight text-[13px]">{s.heading || 'Introduction'}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* ── main content ── */}
                <main className="flex-1 min-w-0">

                    {/* hero banner */}
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-10 md:p-14 mb-14">
                        <div className="absolute -top-16 -right-16 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                            <div className="w-20 h-20 shrink-0 rounded-[1.75rem] bg-white/10 backdrop-blur flex items-center justify-center border border-white/10 shadow-xl">
                                <Scale size={36} className="text-white" />
                            </div>
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                    <Shield size={11} className="text-indigo-300" />
                                    <span className="text-[10px] font-black tracking-[0.2em] text-indigo-200 uppercase">Legal Document</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                                    Terms of Service
                                </h1>
                                <p className="text-indigo-200 font-medium text-base max-w-xl leading-relaxed">
                                    Please read these terms carefully before using the Skyheal platform and its clinical services.
                                </p>
                                {updatedAt && (
                                    <div className="flex items-center gap-2 pt-2">
                                        <Clock size={13} className="text-indigo-400" />
                                        <span className="text-[11px] font-black text-indigo-300 uppercase tracking-widest">
                                            Last updated: {updatedAt}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* agreement notice */}
                    <div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-[1.5rem] p-6 mb-12">
                        <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 font-medium leading-relaxed">
                            By accessing or using Skyheal, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
                        </p>
                    </div>

                    {/* no content fallback */}
                    {!article && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-[1.75rem] flex items-center justify-center mb-6">
                                <FileText size={36} className="text-red-400" />
                            </div>
                            <h2 className="text-2xl font-black text-main mb-3">Content Unavailable</h2>
                            <p className="text-muted max-w-sm font-medium">We couldn't load the Terms of Service right now. Please try again later.</p>
                        </div>
                    )}

                    {/* sections */}
                    <div className="space-y-10">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={idx}
                                ref={el => { sectionRefs.current[idx] = el; }}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-60px' }}
                                transition={{ duration: 0.4, delay: idx * 0.04 }}
                                className="bg-card border border-border-card rounded-[2rem] overflow-hidden scroll-mt-24"
                            >
                                {/* section header */}
                                {section.heading && (
                                    <div className="flex items-center gap-4 px-8 py-6 border-b border-border-card bg-page">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                            {getSectionIcon(section.heading)}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-muted uppercase tracking-widest">
                                                {String(idx + 1).padStart(2, '0')}
                                            </span>
                                            <div className="w-px h-4 bg-border-card" />
                                            <h2 className="text-lg font-black text-main tracking-tight">
                                                {section.heading}
                                            </h2>
                                        </div>
                                    </div>
                                )}

                                {/* section body */}
                                <div className="px-8 py-8 space-y-4">
                                    <ul className="space-y-4 list-none">
                                        {section.body.map((line, li) => (
                                            <RenderLine key={li} line={line} />
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* contact / footer CTA */}
                    <div className="mt-14 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-purple-600 p-10 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
                        <div className="relative z-10 space-y-4">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-1.5 rounded-full">
                                <Mail size={12} className="text-white" />
                                <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Questions?</span>
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Need clarification on these terms?</h3>
                            <p className="text-white/80 font-medium max-w-md mx-auto">
                                Our support team is available 24/7 to address any concerns about our Terms of Service.
                            </p>
                            <button
                                onClick={() => navigate('/help/support')}
                                className="mt-2 inline-flex items-center gap-2 bg-white text-indigo-700 px-8 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-black/10"
                            >
                                Contact Support
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default TermsOfServicePage;
