import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, Heart } from 'lucide-react';
import { FeedbackService } from '../../api/services/feedback.service';
import Button from '../ui/Button';

interface AppRatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingRating?: {
        rating: number;
        message?: string;
    } | null;
}

const AppRatingModal = ({ isOpen, onClose, existingRating }: AppRatingModalProps) => {
    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredStar, setHoveredStar] = useState<number | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRating(existingRating?.rating || 0);
            setMessage(existingRating?.message || '');
            setSuccess(false);
        }
    }, [isOpen, existingRating]);

    const handleSubmit = async () => {
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            await FeedbackService.submitRating({
                rating,
                message: message.trim() || undefined
            });
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit rating:', error);
            alert('Failed to submit rating. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-card w-full max-w-lg rounded-[3rem] p-10 border border-border-card shadow-2xl relative overflow-hidden"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -ml-32 -mb-32 rounded-full"></div>

                        <div className="relative z-10">
                            {success ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="w-20 h-20 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center mb-6 border border-emerald-100 shadow-inner">
                                        <Heart className="text-emerald-500 fill-emerald-500" size={32} />
                                    </div>
                                    <h3 className="text-3xl font-black text-main tracking-tight mb-3">Thank You!</h3>
                                    <p className="text-muted font-medium max-w-[280px]">
                                        Your feedback helps us make MindBalance better for everyone.
                                    </p>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="space-y-1">
                                            <h3 className="text-3xl font-black text-main tracking-tight">Enjoying the app?</h3>
                                            <p className="text-muted opacity-80 font-black uppercase tracking-widest text-[10px]">Your feedback matters</p>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="w-12 h-12 rounded-2xl bg-page flex items-center justify-center text-muted hover:bg-red-50 hover:text-red-500 transition-all hover:scale-110 active:scale-95 shadow-sm border border-border-card"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="flex justify-center gap-2 mb-12">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onMouseEnter={() => setHoveredStar(star)}
                                                onMouseLeave={() => setHoveredStar(null)}
                                                onClick={() => setRating(star)}
                                                className="group p-2 transition-transform active:scale-90"
                                            >
                                                <Star
                                                    size={48}
                                                    className={`transition-all duration-300 ${
                                                        (hoveredStar !== null ? hoveredStar >= star : rating >= star)
                                                            ? 'text-amber-400 fill-amber-400 group-hover:scale-110 group-hover:brightness-110 drop-shadow-lg'
                                                            : 'text-muted opacity-40 group-hover:text-amber-200'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-6 mb-10">
                                        <div className="relative">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1 mb-2 block">
                                                Tell us more (Optional)
                                            </label>
                                            <div className="relative group">
                                                <textarea
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder="What can we do better? What do you love?"
                                                    className="w-full bg-page border border-border-card rounded-3xl p-6 text-sm font-medium focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 outline-none transition-all min-h-[120px] resize-none text-main placeholder:opacity-50"
                                                />
                                                <MessageSquare className="absolute bottom-6 right-6 text-muted opacity-40 group-focus-within:text-amber-400 transition-colors" size={20} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={rating === 0 || isSubmitting}
                                            isLoading={isSubmitting}
                                            className={`w-full py-6 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl transition-all h-16
                                                ${rating === 0 ? 'bg-page text-muted opacity-80 cursor-not-allowed grayscale' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200/50'}
                                            `}
                                        >
                                            Submit Review
                                        </Button>
                                        <button
                                            onClick={onClose}
                                            className="text-[10px] font-black text-muted uppercase tracking-[0.2em] hover:text-main transition-colors py-2"
                                        >
                                            Maybe Later
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AppRatingModal;
