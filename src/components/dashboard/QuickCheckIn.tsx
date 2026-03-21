import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';

interface Mood {
    label: string;
    emoji: string;
    color: string;
    bgColor: string;
    description: string;
}

const moods: Mood[] = [
    { label: 'Terrible', emoji: '😔', color: 'text-red-500', bgColor: 'bg-red-50', description: 'Really struggling today' },
    { label: 'Bad', emoji: '😕', color: 'text-orange-500', bgColor: 'bg-orange-50', description: 'Feeling a bit low' },
    { label: 'Okay', emoji: '😐', color: 'text-amber-500', bgColor: 'bg-amber-50', description: 'Just managing' },
    { label: 'Good', emoji: '🙂', color: 'text-emerald-500', bgColor: 'bg-emerald-50', description: 'Feeling quite positive' },
    { label: 'Great', emoji: '🤩', color: 'text-indigo-500', bgColor: 'bg-indigo-50', description: 'Excellent and energized!' },
];

const QuickCheckIn: React.FC = () => {
    const [selectedMood, setSelectedMood] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleMoodSelect = (label: string) => {
        setSelectedMood(label);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitted(true);
        }, 600);
    };

    return (
        <section className="card-premium p-8 bg-white border-slate-100 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles size={14} className="text-amber-400" />
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Daily Pulse</h2>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">How are you feeling, jii?</h3>
                </div>
                <AnimatePresence>
                    {isSubmitted && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100"
                        >
                            <Check size={14} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Recorded</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {moods.map((mood) => {
                    const isSelected = selectedMood === mood.label;
                    const isDisabled = isSubmitted && !isSelected;

                    return (
                        <button
                            key={mood.label}
                            onClick={() => !isSubmitted && handleMoodSelect(mood.label)}
                            disabled={isDisabled}
                            className={`flex flex-col items-center gap-3 p-4 rounded-3xl transition-all duration-300 relative group/mood ${
                                isSelected 
                                    ? `${mood.bgColor} ${mood.color} scale-105 shadow-xl shadow-current/10 ring-2 ring-current ring-offset-2` 
                                    : isDisabled 
                                        ? 'opacity-30 grayscale cursor-not-allowed'
                                        : 'bg-slate-50 hover:bg-white hover:shadow-lg hover:-translate-y-1'
                            }`}
                        >
                            <span className={`text-3xl transition-transform duration-500 ${isSelected ? 'scale-125' : 'group-hover/mood:scale-110'}`}>
                                {mood.emoji}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isSelected ? 'opacity-100' : 'text-slate-400 group-hover/mood:text-slate-600'}`}>
                                {mood.label}
                            </span>
                            
                            {/* Hover description for desktop */}
                            {!isSubmitted && !isSelected && (
                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-32 p-2 bg-slate-900 text-white text-[8px] font-bold rounded-lg opacity-0 group-hover/mood:opacity-100 transition-opacity pointer-events-none z-10 text-center uppercase tracking-widest leading-tight">
                                    {mood.description}
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {isSubmitted && (
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 text-center text-sm font-bold text-slate-500 italic"
                    >
                        "Thank you for sharing. Your specialist will notice your trend."
                    </motion.p>
                )}
            </AnimatePresence>
        </section>
    );
};

export default QuickCheckIn;
