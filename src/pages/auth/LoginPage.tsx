import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Lock, ChevronRight, Github, Chrome, ShieldCheck, User as UserIcon, Hospital, Stethoscope, Activity, Users, MessageSquare } from 'lucide-react';
import { setCredentials, getCurrentUser } from '../../features/auth/store/authSlice';
import type { AppDispatch } from '../../store';
import type { User, UserRole } from '../../types/user.types';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import Select from '../../components/ui/Select';
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

    const roleOptions = [
        { value: 'super_admin', label: 'Super Administrator', icon: ShieldCheck },
        { value: 'admin', label: 'Administrator', icon: ShieldCheck },
        { value: 'hospital', label: 'Hospital Management', icon: Hospital },
        { value: 'psychiatrist', label: 'Psychiatrist', icon: Stethoscope },
        { value: 'psychologist', label: 'Psychologist', icon: Activity },
        { value: 'nurse', label: 'Clinical Nurse', icon: Users },
        { value: 'social_worker', label: 'Social Worker', icon: Users },
        { value: 'counselor', label: 'Counselor', icon: MessageSquare },
        { value: 'patient', label: 'Patient', icon: UserIcon },
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

                    <Select
                        label="Access Role"
                        options={roleOptions}
                        value={role}
                        onChange={(val) => setRole(val as UserRole)}
                    />

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
