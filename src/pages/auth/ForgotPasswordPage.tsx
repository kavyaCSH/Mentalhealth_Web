import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ChevronRight, ArrowLeft, Shield, Sparkles, Heart, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { AuthService } from '../../api/services/auth.service';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [otp, setOtp] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await AuthService.forgotPassword(email.trim());
            // In dev mode/demo, the OTP is returned in response.resetToken
            const resetToken = response.resetToken;
            
            if (resetToken) {
                setOtp(resetToken);
                setSuccess(`A 6-digit verification code has been generated. (Dev: ${resetToken})`);
            } else {
                setSuccess('Security verification code sent to your registered email.');
            }
            
            setIsLoading(false);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Verification failed. This email may not be registered.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-page p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[520px] bg-card p-12 rounded-[3.5rem] shadow-xl shadow-indigo-500/5 dark:shadow-none border border-border-card relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-indigo-500"><Shield size={240} /></div>
                
                <div className="relative space-y-10">
                    <header className="flex items-center justify-between border-b border-border-card pb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 glow-primary">
                                <Heart size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={14} className="text-indigo-500" />
                                    <span className="text-[10px] font-bold text-muted tracking-tight leading-none uppercase">Identity portal</span>
                                </div>
                                <h1 className="text-3xl font-black text-main tracking-tighter leading-none text-gradient-primary">Recover access</h1>
                            </div>
                        </div>
                    </header>

                    <div className="space-y-4">
                        <h2 className="text-[13px] font-bold text-main tracking-tight leading-tight">Verification required</h2>
                        <p className="text-sm font-bold text-muted tracking-tight leading-relaxed max-w-sm">Confirm your clinical email to initiate the security recovery protocol.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-[2.5rem] flex flex-col items-center text-center gap-6"
                            >
                                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><Shield size={24} /></div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tracking-tight leading-snug">{success}</p>
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 opacity-60">Redirecting to security terminal...</p>
                                </div>
                                <Button 
                                    onClick={() => navigate(`/reset-password/${otp || ''}`, { state: { token: otp || '' } })}
                                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 border-none rounded-2xl text-xs"
                                >
                                    Proceed to reset
                                </Button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold text-muted tracking-tight leading-none px-1 uppercase">Registered clinical email</label>
                                    <InputField
                                        type="email"
                                        placeholder="practitioner@mindbalance.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        leftIcon={<Mail size={22} className="text-indigo-500" />}
                                        required
                                        className="h-20 bg-page border border-border-card rounded-3xl text-sm font-black focus:ring-4 focus:border-indigo-500/50 shadow-inner"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    className="w-full h-20 rounded-3xl bg-indigo-600 hover:bg-indigo-700 border-none font-black text-[12px] tracking-[0.1em] uppercase shadow-xl shadow-indigo-500/20 dark:shadow-none transition-all"
                                    rightIcon={<ChevronRight size={22} />}
                                >
                                    Initiate recovery
                                </Button>
                            </form>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-600 dark:text-rose-400 font-bold text-xs tracking-tight">
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}

                    <footer className="pt-10 border-t border-border-card text-center">
                        <Link to="/login" className="inline-flex items-center gap-3 text-muted hover:text-indigo-500 transition-all group">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-bold tracking-tight uppercase">Return to sign in</span>
                        </Link>
                    </footer>
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPasswordPage;
