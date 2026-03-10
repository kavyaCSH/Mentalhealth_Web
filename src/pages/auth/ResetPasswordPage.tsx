import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, ChevronRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { AuthService } from '../../api/services/auth.service';

const ResetPasswordPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await AuthService.resetPassword(token as string, { password });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to reset password. The link may be expired.');
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
                <div className="mb-10 text-center">
                    <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl glow-primary">
                        <Heart size={40} fill="currentColor" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight text-gradient-primary">
                        {success ? 'Security Updated' : 'New Password'}
                    </h2>
                    <p className="text-slate-500 mt-4 font-semibold">
                        {success
                            ? 'Your credentials have been successfully reset.'
                            : 'Set a strong password for your clinical account.'}
                    </p>
                </div>

                <AnimatePresence>
                    {(error || success) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`mb-8 p-4 border rounded-2xl text-xs font-bold flex items-center gap-3 ${error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                }`}
                        >
                            {success && <CheckCircle2 size={16} />}
                            {error || 'Redirecting to sign in portal...'}
                        </motion.div>
                    )}
                </AnimatePresence>

                {!success ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <InputField
                            label="New Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            leftIcon={<Lock size={18} />}
                            required
                        />

                        <InputField
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            leftIcon={<Lock size={18} />}
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
                            Update Credentials
                        </Button>
                    </form>
                ) : (
                    <div className="text-center pt-4">
                        <Link to="/login" className="text-indigo-600 font-black text-sm hover:underline flex items-center justify-center gap-2">
                            <ArrowLeft size={16} /> Return to Login
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
