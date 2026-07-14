import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    ChevronLeft, MessageSquare, Bug, Lightbulb, AlertTriangle, MoreHorizontal, Send, 
    CheckCircle2, Info, Loader2
} from 'lucide-react';
import { FeedbackService } from '../../api/services/feedback.service';
import type { FeedbackCategory, FeedbackRequest } from '../../types/feedback.types';

const CATEGORIES: { 
    label: string; 
    slug: FeedbackCategory; 
    icon: typeof MessageSquare; 
    colorClass: string; 
    bgClass: string;
    borderClass: string;
    shadowClass: string;
    textClass: string;
    desc: string 
}[] = [
    { 
        label: 'General Support', 
        slug: 'support', 
        icon: MessageSquare, 
        colorClass: 'bg-indigo-500',
        bgClass: 'bg-indigo-500/10',
        borderClass: 'border-indigo-500',
        shadowClass: 'shadow-indigo-500/20',
        textClass: 'text-indigo-600',
        desc: 'Help with app features, account settings, or general usage questions.'
    },
    { 
        label: 'Report a Bug', 
        slug: 'bug', 
        icon: Bug, 
        colorClass: 'bg-red-500',
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500',
        shadowClass: 'shadow-red-500/20',
        textClass: 'text-red-600',
        desc: 'Encountered a technical issue, crash, or unexpected behavior?'
    },
    { 
        label: 'Feature Request', 
        slug: 'feature_request', 
        icon: Lightbulb, 
        colorClass: 'bg-amber-500',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500',
        shadowClass: 'shadow-amber-500/20',
        textClass: 'text-amber-600',
        desc: 'Have an idea for a new feature or improvement? We would love to hear it!'
    },
    { 
        label: 'Formal Complaint', 
        slug: 'complaint', 
        icon: AlertTriangle, 
        colorClass: 'bg-orange-500',
        bgClass: 'bg-orange-500/10',
        borderClass: 'border-orange-500',
        shadowClass: 'shadow-orange-500/20',
        textClass: 'text-orange-600',
        desc: 'Issues regarding service quality, medical professionals, or billing.'
    },
    { 
        label: 'Other', 
        slug: 'other', 
        icon: MoreHorizontal, 
        colorClass: 'bg-page0',
        bgClass: 'bg-page0/10',
        borderClass: 'border-border-card0',
        shadowClass: 'shadow-slate-500/20',
        textClass: 'text-muted',
        desc: 'None of the above? Well, we are still here to listen.'
    },
];

const SupportTicket = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [category, setCategory] = useState<FeedbackCategory>(location.state?.category || 'support');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!subject.trim() || !message.trim()) {
            setError('Please enter both a subject and a detailed message.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const data: FeedbackRequest = {
                subject,
                message,
                category
            };
            await FeedbackService.submitTicket(data);
            setSuccess(true);
        } catch (err) {
            console.error('Error submitting ticket:', err);
            setError('Failed to submit ticket. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-page flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-card border border-border-card rounded-[3rem] p-12 shadow-2xl shadow-indigo-500/5 text-center flex flex-col items-center">
                    <div className="w-24 h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-8 animate-bounce">
                        <CheckCircle2 size={48} className="text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black text-main tracking-tight mb-4">Ticket Submitted!</h2>
                    <p className="text-muted font-medium leading-relaxed mb-10">
                        Thank you for reaching out. Our clinical support team has received your request and will respond within 24-48 hours.
                    </p>
                    <div className="flex flex-col gap-4 w-full">
                        <button 
                            onClick={() => navigate('/help/tickets')}
                            className="bg-indigo-600 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                        >
                            View My History
                        </button>
                        <button 
                            onClick={() => navigate('/help')}
                            className="bg-page border border-border-card text-main p-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-indigo-500/20 hover:text-indigo-500 transition-all"
                        >
                            Back to Help Center
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page pb-24">
            {/* Header */}
            <div className="bg-card border-b border-border-card sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-page flex items-center justify-center text-muted hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-lg font-black text-main leading-none">Contact Support</h1>
                        <p className="text-[10px] font-bold text-muted opacity-80 uppercase tracking-widest mt-1">Get Direct Assistance</p>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Form */}
                <div className="lg:col-span-7">
                    <div className="bg-card rounded-[2.5rem] p-10 border border-border-card shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted opacity-80">Submission Form</h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div>
                                <label className="block text-xs font-black text-muted opacity-80 uppercase tracking-widest mb-4 ml-1">Subject</label>
                                <input 
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Brief title of your request"
                                    className="w-full bg-page border border-border-card focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl py-4 px-6 outline-none transition-all font-semibold text-main placeholder:text-muted opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-muted opacity-80 uppercase tracking-widest mb-4 ml-1">Detailed Message</label>
                                <textarea 
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Please describe your clinical or technical inquiry in detail..."
                                    rows={6}
                                    className="w-full bg-page border border-border-card focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-[1.5rem] py-5 px-6 outline-none transition-all font-semibold text-main placeholder:text-muted opacity-60 resize-none"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-error/10 rounded-xl flex items-start gap-3 border border-error/20">
                                    <AlertTriangle className="text-error shrink-0 mt-0.5" size={18} />
                                    <p className="text-sm font-bold text-error leading-relaxed">{error}</p>
                                </div>
                            )}

                            <div className="pt-4">
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-indigo-600 text-white p-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Launching Ticket...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Submit Support Ticket
                                        </>
                                    )}
                                </button>
                                <div className="mt-6 flex items-center justify-center gap-2 text-muted opacity-80">
                                    <Info size={14} />
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Average response time: 27 minutes</p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Category Selection */}
                <div className="lg:col-span-5">
                    <div className="flex items-center gap-3 mb-8 ml-2">
                        <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted opacity-80">Choose Category</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {CATEGORIES.map((item) => {
                            const IconComp = item.icon;
                            const isSelected = category === item.slug;
                            
                            return (
                                <button
                                    key={item.slug}
                                    onClick={() => setCategory(item.slug)}
                                    className={`p-6 rounded-[2rem] border transition-all text-left group relative overflow-hidden ${
                                        isSelected 
                                            ? `bg-card ${item.borderClass} shadow-lg ${item.shadowClass}` 
                                            : 'bg-card border-border-card hover:border-indigo-200'
                                    }`}
                                >
                                    {isSelected && (
                                        <div className={`absolute top-0 right-0 w-32 h-32 ${item.bgClass} opacity-20 blur-3xl -mr-16 -mt-16 rounded-full`}></div>
                                    )}
                                    <div className="flex items-start gap-5 relative z-10">
                                        <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center transition-all ${
                                            isSelected ? `${item.colorClass} text-white shadow-lg ${item.shadowClass}` : `bg-page text-muted opacity-80 group-hover:bg-indigo-50 group-hover:text-indigo-500`
                                        }`}>
                                            <IconComp size={20} />
                                        </div>
                                        <div>
                                            <h3 className={`font-black text-sm mb-1 tracking-tight transition-colors ${
                                                isSelected ? `${item.textClass}` : 'text-main group-hover:text-indigo-600'
                                            }`}>
                                                {item.label}
                                            </h3>
                                            <p className="text-[11px] font-medium text-muted opacity-80 leading-relaxed line-clamp-2">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SupportTicket;
