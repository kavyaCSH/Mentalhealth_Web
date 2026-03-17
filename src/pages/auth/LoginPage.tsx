import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, ChevronRight, Github, Chrome, ShieldCheck, User as UserIcon, Stethoscope, Activity, Users, MessageSquare } from 'lucide-react';
import { setCredentials, getCurrentUser } from '../../features/auth/store/authSlice';
import type { AppDispatch } from '../../store';
import type { User, UserRole } from '../../types/user.types';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { AuthService } from '../../api/services/auth.service';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('patient');
    const location = useLocation();
    const successMsg = location.state?.message;
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await AuthService.login({
                username,
                password,
                role
            });

            const { token, user } = response;

            // Note: If user is not returned in login, we fallback to a minimal user object
            // until getCurrentUser hydrates it.
            dispatch(setCredentials({
                user: user || { username, role, name: username, email: '', id: '' } as User,
                token
            }));

            // Hydrate full profile immediately
            dispatch(getCurrentUser());

            navigate('/');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }, message?: string };
            setError(error.response?.data?.message || error.message || 'Authentication failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const categories = [
        { id: 'patient', label: 'Patient', icon: UserIcon, roles: ['patient'] },
        { id: 'clinical', label: 'Clinical', icon: Stethoscope, roles: ['psychiatrist', 'psychologist', 'nurse', 'social_worker', 'counselor'] },
        { id: 'admin', label: 'Admin', icon: ShieldCheck, roles: ['hospital', 'admin', 'super_admin'] },
    ];

    const [activeCategory, setActiveCategory] = useState('patient');

    const proRoles = [
        { value: 'psychiatrist', label: 'Psychiatrist', icon: Activity },
        { value: 'psychologist', label: 'Psychologist', icon: Activity },
        { value: 'nurse', label: 'Nurse', icon: Users },
        { value: 'counselor', label: 'Counselor', icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FBFA] p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[480px] glass-card p-12"
            >
                <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-indigo-200 glow-primary">
                        <Heart size={48} fill="currentColor" />
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight text-gradient-primary">MindBalance</h2>
                    <p className="text-slate-500 mt-4 font-semibold text-lg">Wellness starts with awareness.</p>
                </div>

                <AnimatePresence>
                    {(error || successMsg) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`mb-8 p-4 border rounded-2xl text-xs font-bold leading-relaxed ${error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                }`}
                        >
                            {error || successMsg}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleLogin} className="space-y-6">
                    <InputField
                        label="Username"
                        placeholder="superadmin"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        leftIcon={<UserIcon size={18} />}
                        required
                    />

                    <InputField
                        label="Security Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock size={18} />}
                        required
                    />

                    <div className="flex justify-end pr-1">
                        <Link
                            to="/forgot-password"
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                        >
                            Forgot Password?
                        </Link>
                    </div>

                    <div className="space-y-4 mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">I am a...</p>
                        <div className="flex p-1.5 bg-slate-100/80 rounded-[2rem] gap-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveCategory(cat.id);
                                        setRole(cat.roles[0] as UserRole);
                                    }}
                                    className={`flex-1 flex flex-col items-center justify-center py-4 rounded-[1.5rem] transition-all duration-300 relative overflow-hidden ${activeCategory === cat.id ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100/50 scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <cat.icon size={20} className="mb-1" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                                    {activeCategory === cat.id && (
                                        <motion.div layoutId="active-dot" className="absolute bottom-2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {activeCategory === 'clinical' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-2 gap-2 mt-4"
                            >
                                {proRoles.map((r) => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setRole(r.value as UserRole)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${role === r.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                            }`}
                                    >
                                        <r.icon size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}

                        {activeCategory === 'admin' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-2"
                            >
                                {['hospital', 'admin'].map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => setRole(r as UserRole)}
                                        className={`flex-1 flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all ${role === r ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                            }`}
                                    >
                                        <ShieldCheck size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{r} Portal</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        isLoading={isLoading}
                        className="w-full"
                        size="lg"
                        rightIcon={<ChevronRight size={18} />}
                    >
                        Login
                    </Button>
                </form>

                <div className="mt-12">
                    <div className="relative flex items-center justify-center mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100"></div>
                        </div>
                        <span className="relative px-4 bg-white text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Or secure sign in with</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <Button variant="outline" className="text-[10px] py-3" leftIcon={<Chrome size={16} />}>
                            Google Cloud
                        </Button>
                        <Button variant="outline" className="text-[10px] py-3" leftIcon={<Github size={16} />}>
                            Apple ID
                        </Button>
                    </div>

                    <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-indigo-600 hover:text-indigo-700 hover:underline transition-colors ml-1 font-black">
                            Register Now
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
