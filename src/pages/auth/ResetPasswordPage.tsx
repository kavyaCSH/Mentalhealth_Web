import React, { useState } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronRight, ArrowLeft, Sparkles, Heart, CheckCircle2, AlertCircle, Key } from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { AuthService } from '../../api/services/auth.service';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const initialToken = params.token || location.state?.token || '';
    
    const [otp, setOtp] = useState(initialToken);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (otp.length < 6) {
            setError('Please enter the complete 6-digit verification code.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Security mismatch. Confirm your new password entries.');
            return;
        }

        setIsLoading(true);

        try {
            // Mapping otp to the :token path parameter as per API documentation
            await AuthService.resetPassword(otp, { password });
            
            setSuccess(true);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Verification failed. The code may be expired.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FBFA] p-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[520px] bg-white p-12 rounded-[3.5rem] shadow-[0_25px_80px_rgba(79,70,229,0.12)] relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-indigo-600"><Lock size={240} /></div>
                
                <div className="relative space-y-10">
                    <header className="flex items-center justify-between border-b border-slate-50 pb-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl">
                                <Heart size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles size={14} className="text-indigo-600" />
                                    <span className="text-[10px] font-bold text-slate-300 tracking-tight leading-none uppercase">Security terminal</span>
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Security reset</h1>
                            </div>
                        </div>
                    </header>

                    <div className="space-y-4">
                        <h2 className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight">Identify restoration</h2>
                        <p className="text-sm font-bold text-slate-400 tracking-tight leading-relaxed max-w-sm">Provide the verification code and set a resilient new password for your clinical record.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-10 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] flex flex-col items-center text-center gap-6"
                            >
                                <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-100"><CheckCircle2 size={40} /></div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-emerald-800 tracking-tight">Security updated</h3>
                                    <p className="text-sm font-bold text-emerald-600 tracking-tight opacity-80 leading-relaxed">Password changed successfully. Your credentials are now ready for use.</p>
                                </div>
                                <Button 
                                    onClick={() => navigate('/login')}
                                    className="w-full h-14 bg-emerald-600 border-none rounded-2xl text-xs"
                                >
                                    Return to login
                                </Button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-bold text-slate-400 tracking-tight leading-none px-1">Verification code (OTP)</label>
                                    <div className="relative group">
                                        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-indigo-600 group-focus-within:scale-110 transition-transform"><Key size={22} /></div>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="••••••"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            required
                                            className="w-full h-20 pl-20 pr-8 bg-slate-50 border-none rounded-3xl text-2xl font-black text-slate-900 tracking-[0.6em] outline-none transition-all placeholder:text-slate-200 placeholder:tracking-normal focus:bg-white focus:ring-4 ring-indigo-50 shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-bold text-slate-400 tracking-tight leading-none px-1">New clinical password</label>
                                        <InputField
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            leftIcon={<Lock size={22} className="text-indigo-600" />}
                                            required
                                            className="h-20 bg-slate-50 border-none rounded-3xl text-sm font-black focus:bg-white focus:ring-4 ring-indigo-50 shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-bold text-slate-400 tracking-tight leading-none px-1">Confirm security commitment</label>
                                        <InputField
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            leftIcon={<Lock size={22} className="text-indigo-600" />}
                                            required
                                            className="h-20 bg-slate-50 border-none rounded-3xl text-sm font-black focus:bg-white focus:ring-4 ring-indigo-50 shadow-inner"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    className="w-full h-20 rounded-3xl bg-slate-900 border-none font-bold text-[12px] tracking-tight shadow-2xl shadow-indigo-100"
                                    rightIcon={<ChevronRight size={22} />}
                                >
                                    Re-auth credentials
                                </Button>
                            </form>
                        )}
                    </AnimatePresence>

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 text-rose-600 font-bold text-xs tracking-tight">
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}

                    <footer className="pt-10 border-t border-slate-50 text-center">
                        <Link to="/login" className="inline-flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-all group">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-bold tracking-tight">Return to sign in</span>
                        </Link>
                    </footer>
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
