import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
    Heart,
    Lock,
    ChevronRight,
    Chrome,
    ShieldCheck,
    User as UserIcon,
    Stethoscope,
    Activity,
    Users,
    Apple,
    Sparkles
} from 'lucide-react';
import { setCredentials, getCurrentUser } from '../../features/auth/store/authSlice';
import type { AppDispatch } from '../../store';
import type { User, UserRole } from '../../types/user.types';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { AuthService } from '../../api/services/auth.service';
import loginBg from '../../assets/login_bg.png';

// Constants defined outside to prevent re-creation
const CATEGORIES = [
    { id: 'patient', label: 'Patient', icon: UserIcon, roles: ['patient'] },
    { id: 'clinical', label: 'Clinical', icon: Stethoscope, roles: ['psychiatrist', 'psychologist', 'nurse', 'social_worker', 'counselor'] },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, roles: ['hospital', 'admin', 'super_admin'] },
];

const PRO_ROLES = [
    { value: 'psychiatrist', label: 'Psychiatrist', icon: Activity },
    { value: 'psychologist', label: 'Psychologist', icon: Activity },
    { value: 'nurse', label: 'Nurse', icon: Users },
    { value: 'counselor', label: 'Counselor', icon: Activity }, // Fixed icon for consistency
];

const ADMIN_ROLES = [
    { value: 'hospital', label: 'Hospital' },
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
];

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('patient');
    const [activeCategory, setActiveCategory] = useState('patient');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const location = useLocation();
    const successMsg = location.state?.message;
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const response = await AuthService.login({ username, password, role });
            const { token, user } = response;
            dispatch(setCredentials({
                user: user || { username, role, name: username, email: '', id: '' } as User,
                token
            }));
            dispatch(getCurrentUser());
            navigate('/');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }, message?: string };
            setError(error.response?.data?.message || error.message || 'Authentication failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden font-sans">
            {/* Left Panel: Immersive Brand Anchor */}
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:flex lg:w-[55%] relative bg-slate-900 items-center justify-center overflow-hidden"
            >
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={loginBg}
                    className="absolute inset-0 w-full h-full object-cover scale-110 animate-slow-zoom transition-transform duration-[20s]"
                >
                    <source src="https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-indigo-900/40 to-transparent backdrop-blur-[1px]" />

                <div className="relative z-10 p-16 space-y-8 max-w-xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl flex items-center justify-center text-white"
                    >
                        <Heart size={40} className="drop-shadow-2xl" fill="rgba(255,255,255,0.4)" />
                    </motion.div>
                    <div className="space-y-4">
                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-6xl font-black text-white tracking-tighter"
                        >
                            MindBalance
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-xl text-indigo-100/80 font-medium leading-relaxed"
                        >
                            Your journey to mental clarity and emotional equilibrium begins with a single step.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] mt-12 shadow-2xl"
                    >
                        <div className="flex gap-4 items-start">
                            <div className="p-3 bg-indigo-500/20 text-indigo-200 rounded-xl"><Sparkles size={24} /></div>
                            <p className="text-white/90 text-lg font-bold leading-snug italic">
                                "The first step toward change is awareness. The second step is acceptance."
                            </p>
                        </div>
                    </motion.div>
                </div>

                <div className="absolute bottom-10 left-16 right-16 flex justify-between items-center text-white/40 text-[10px] font-black uppercase tracking-widest">
                    <span>© 2026 MindBalance Clinical</span>
                    <span>GDPR & HIPAA Compliant</span>
                </div>
            </motion.div>

            {/* Right Panel: High-Precision Access Terminal */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full max-w-[480px] space-y-8"
                >
                    {/* Top Branding Section */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100/50">
                                <Heart size={24} fill="currentColor" />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">MindBalance</h2>
                        </div>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-sm">
                            Welcome back!! Please choose your role and sign in below.
                        </p>
                    </div>

                    <AnimatePresence>
                        {(error || successMsg) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`p-5 rounded-2xl text-xs font-bold leading-relaxed border ${error ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                                    }`}
                            >
                                {error || successMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Segmented Identity Selection */}
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 italic">Who are you?</label>
                            <div className="flex p-1 bg-slate-50 border border-slate-100 rounded-[2rem] gap-1">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveCategory(cat.id);
                                            setRole(cat.roles[0] as UserRole);
                                        }}
                                        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[1.5rem] transition-all duration-300 relative overflow-hidden ${activeCategory === cat.id
                                                ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10 ring-1 ring-slate-100'
                                                : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        <cat.icon size={18} className="mb-1" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">{cat.label}</span>
                                        {activeCategory === cat.id && (
                                            <motion.div layoutId="active-indicator" className="absolute bottom-1 w-1 h-1 bg-indigo-600 rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Professional & Admin Sub-Roles (Animated Transition) */}
                        <LayoutGroup>
                            <AnimatePresence mode="wait">
                                {activeCategory === 'clinical' && (
                                    <motion.div
                                        key="clinical-roles"
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="grid grid-cols-2 gap-2"
                                    >
                                        {PRO_ROLES.map((r) => (
                                            <button
                                                key={r.value}
                                                type="button"
                                                onClick={() => setRole(r.value as UserRole)}
                                                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 transition-all ${role === r.value
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100'
                                                        : 'bg-white border-slate-50 text-slate-400 font-bold hover:border-slate-200'
                                                    }`}
                                            >
                                                <r.icon size={14} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{r.label}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}

                                {activeCategory === 'admin' && (
                                    <motion.div
                                        key="admin-roles"
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="grid grid-cols-3 gap-2"
                                    >
                                        {ADMIN_ROLES.map((r) => (
                                            <button
                                                key={r.value}
                                                type="button"
                                                onClick={() => setRole(r.value as UserRole)}
                                                className={`flex flex-col items-center justify-center gap-1.5 px-2 py-3.5 rounded-2xl border-2 transition-all ${role === r.value
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100'
                                                        : 'bg-white border-slate-50 text-slate-400 font-bold hover:border-slate-200'
                                                    }`}
                                            >
                                                <ShieldCheck size={14} />
                                                <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight truncate w-full">{r.label}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </LayoutGroup>

                        {/* Interaction Hub: Input Fields */}
                        <div className="space-y-4">
                            <InputField
                                label="Username"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                leftIcon={<UserIcon size={18} />}
                                required
                            />

                            <div className="space-y-1">
                                <InputField
                                    label="Password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    leftIcon={<Lock size={18} />}
                                    required
                                />
                                <div className="flex justify-end pr-1">
                                    <Link
                                        to="/forgot-password"
                                        className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                isLoading={isLoading}
                                className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-500/10 font-black uppercase tracking-[0.2em] text-[10px]"
                                rightIcon={<ChevronRight size={18} />}
                            >
                                Sign In
                            </Button>
                        </motion.div>
                    </form>

                    {/* Federated Auth Section */}
                    <div className="space-y-6 pt-6">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <span className="relative px-6 bg-white text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Or sign in with</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <motion.div whileHover={{ y: -2 }}>
                                <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-100 text-[9px] font-black uppercase tracking-widest" leftIcon={<Chrome size={16} />}>
                                    Google
                                </Button>
                            </motion.div>
                            <motion.div whileHover={{ y: -2 }}>
                                <Button variant="outline" className="w-full h-12 rounded-2xl border-slate-100 text-[9px] font-black uppercase tracking-widest" leftIcon={<Apple size={16} />}>
                                    Apple ID
                                </Button>
                            </motion.div>
                        </div>

                        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 hover:underline transition-colors ml-1 font-black">
                                Join MindBalance
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;

