import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mail, ChevronRight, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { AuthService } from '../../api/services/auth.service';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await AuthService.forgotPassword(email);
            setSuccess('If an account exists with that email, you will receive a reset link shortly.');
            setEmail('');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FBFA] p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[480px] glass-card p-12"
            >
                <div className="mb-10">
                    <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-8 group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Back to Login</span>
                    </Link>
                    <div className="text-center">
                        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl glow-primary">
                            <Heart size={40} fill="currentColor" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight text-gradient-primary">Reset Password</h2>
                        <p className="text-slate-500 mt-4 font-semibold">Enter your email to receive a recovery link.</p>
                    </div>
                </div>

                <AnimatePresence>
                    {(error || success) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`mb-8 p-4 border rounded-2xl text-xs font-bold leading-relaxed ${error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                }`}
                        >
                            {error || success}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!success && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputField
                            label="Email Address"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<Mail size={18} />}
                            required
                        />

                        <Button
                            type="submit"
                            disabled={isLoading}
                            isLoading={isLoading}
                            className="w-full"
                            size="lg"
                            rightIcon={<ChevronRight size={18} />}
                        >
                            Send Reset Link
                        </Button>
                    </form>
                )}

                <div className="mt-12 text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                        Remembered your password?{' '}
                        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 hover:underline transition-colors ml-1 font-black">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
