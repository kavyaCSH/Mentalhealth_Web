import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Mail, Lock, User, ChevronRight, ArrowLeft,
    Hospital, Stethoscope, Activity, Users, MessageSquare
} from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import Select from '../../components/ui/Select';
import { AuthService } from '../../api/services/auth.service';
import { type UserRole } from '../../types/user.types';

const RegisterPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<UserRole>('patient');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await AuthService.register({
                firstName,
                lastName,
                username,
                email,
                password,
                phone,
                role
            });

            // On success, redirect to login
            navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Incomplete registration. Please check your data.');
        } finally {
            setIsLoading(false);
        }
    };

    const roleOptions = [
        { value: 'patient', label: 'Patient', icon: User },
        { value: 'hospital', label: 'Hospital Staff', icon: Hospital },
        { value: 'psychiatrist', label: 'Psychiatrist', icon: Stethoscope },
        { value: 'psychologist', label: 'Psychologist', icon: Activity },
        { value: 'nurse', label: 'Clinical Nurse', icon: Users },
        { value: 'social_worker', label: 'Social Worker', icon: Users },
        { value: 'counselor', label: 'Counselor', icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FBFA] p-6">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full max-w-[520px] glass-card p-12"
            >
                <div className="mb-10">
                    <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-8 group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Back to Login</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <Heart size={32} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight text-gradient-primary">Join MindBalance</h2>
                            <p className="text-slate-500 font-semibold text-sm">Create your clinical account today.</p>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold leading-relaxed"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                        label="First Name"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        leftIcon={<User size={18} />}
                        required
                    />

                    <InputField
                        label="Last Name"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        leftIcon={<User size={18} />}
                        required
                    />

                    <InputField
                        label="Username"
                        placeholder="johndoe123"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        leftIcon={<User size={18} />}
                        className="md:col-span-2"
                        required
                    />

                    <InputField
                        label="Email Address"
                        type="email"
                        placeholder="name@personal.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        leftIcon={<Mail size={18} />}
                        required
                    />

                    <InputField
                        label="Phone Number"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        leftIcon={<Activity size={18} />}
                        required
                    />

                    <Select
                        label="Primary Role"
                        options={roleOptions}
                        value={role}
                        onChange={(val) => setRole(val as UserRole)}
                        className="md:col-span-2"
                    />

                    <InputField
                        label="Security Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock size={18} />}
                        className="md:col-span-2"
                        required
                    />

                    <div className="md:col-span-2 space-y-6 pt-4">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            isLoading={isLoading}
                            className="w-full"
                            size="lg"
                            rightIcon={<ChevronRight size={18} />}
                        >
                            Create Account
                        </Button>

                        <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">
                            By joining, you agree to our <span className="text-indigo-600 cursor-pointer hover:underline">Clinical Terms</span> and <span className="text-indigo-600 cursor-pointer hover:underline">Privacy Shield</span>.
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
