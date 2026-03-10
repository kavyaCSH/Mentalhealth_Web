import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User as UserIcon,
    Mail,
    Phone,
    Save,
    ShieldCheck,
    Heart,
    Moon,
    Sun,
    Monitor,
    Lock,
    Bell,
    HelpCircle,
    Info,
    FileText,
    Camera,
    ChevronRight,
    Settings as SettingsIcon,
    Palette
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { setUser } from '../../features/auth/store/authSlice';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { UserService } from '../../api/services/user.service';

const ProfilePage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'support'>('profile');

    // Form Status
    const [firstName, setFirstName] = useState(user?.firstName || '');
    const [lastName, setLastName] = useState(user?.lastName || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [email, setEmail] = useState(user?.email || '');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Appearance State (Mock - usually connected to a theme context)
    const [themeType, setThemeType] = useState<'light' | 'dark' | 'auto'>('light');

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setPhone(user.phone || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const data = await UserService.updateMyProfile({
                firstName,
                lastName,
                phone
            });

            dispatch(setUser(data));
            setSuccess('Profile identity updated successfully.');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Personal Information', icon: UserIcon },
        { id: 'settings', label: 'Preferences', icon: SettingsIcon },
        { id: 'support', label: 'Support & Legal', icon: HelpCircle },
    ];

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-24 h-24 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 glow-primary overflow-hidden">
                            <UserIcon size={48} />
                        </div>
                        <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white shadow-lg border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all">
                            <Camera size={18} />
                        </button>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Account Hub</h1>
                        <p className="text-slate-500 font-medium">Manage your personal settings and clinical credentials.</p>
                    </div>
                </div>

                <div className="flex bg-slate-100/50 p-1.5 rounded-[2rem] border border-slate-100">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as 'profile' | 'settings' | 'support')}
                            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2
                                ${activeTab === tab.id
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                                    : 'text-slate-500 hover:text-slate-900'}
                            `}
                        >
                            <tab.icon size={16} />
                            <span className="hidden lg:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid gap-10 lg:grid-cols-12">
                <main className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                <form onSubmit={handleUpdate} className="glass-card p-10 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="First Name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            leftIcon={<UserIcon size={18} />}
                                            required
                                        />
                                        <InputField
                                            label="Last Name"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            leftIcon={<UserIcon size={18} />}
                                            required
                                        />
                                    </div>

                                    <InputField
                                        label="Clinical Email (Primary)"
                                        value={email}
                                        disabled
                                        leftIcon={<Mail size={18} />}
                                        className="opacity-70"
                                    />

                                    <InputField
                                        label="Phone Registry"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        leftIcon={<Phone size={18} />}
                                    />

                                    <AnimatePresence>
                                        {(error || success) && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`p-4 rounded-2xl text-xs font-bold ${error ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}
                                            >
                                                {error || success}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            isLoading={isLoading}
                                            className="w-full md:w-auto px-10"
                                            leftIcon={<Save size={18} />}
                                        >
                                            Secure Save Updates
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                <section className="card-premium p-10 space-y-8">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-3">
                                            <Palette className="text-indigo-600" size={24} />
                                            Visual Appearance
                                        </h3>
                                        <p className="text-slate-500 font-medium text-sm">Customise how the platform looks on your device.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { id: 'light', label: 'Light', icon: Sun },
                                            { id: 'dark', label: 'Dark', icon: Moon },
                                            { id: 'auto', label: 'System', icon: Monitor },
                                        ].map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => setThemeType(option.id as 'light' | 'dark' | 'auto')}
                                                className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-3
                                                    ${themeType === option.id
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-100'
                                                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-200'}
                                                `}
                                            >
                                                <option.icon size={24} />
                                                <span className="font-bold text-xs uppercase tracking-widest">{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="card-premium p-10 space-y-8">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-3">
                                            <Lock className="text-indigo-600" size={24} />
                                            Security & Privacy
                                        </h3>
                                        <p className="text-slate-500 font-medium text-sm">Manage your session security and communication filters.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <button className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                    <Lock size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-black text-slate-900 text-sm">Update Password</p>
                                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Last updated 3 months ago</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-300 group-hover:text-indigo-600" size={20} />
                                        </button>

                                        <button className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                    <Bell size={20} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-black text-slate-900 text-sm">Notification Filters</p>
                                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Optimised for focus</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-300 group-hover:text-indigo-600" size={20} />
                                        </button>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeTab === 'support' && (
                            <motion.div
                                key="support"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: 'Help Center', icon: HelpCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                        { label: 'Contact Support', icon: Mail, color: 'text-orange-600', bg: 'bg-orange-50' },
                                        { label: 'Privacy Policy', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { label: 'Terms of Service', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
                                        { label: 'About App', icon: Info, color: 'text-slate-600', bg: 'bg-slate-50' },
                                    ].map((item, i) => (
                                        <button key={i} className="flex items-center gap-4 p-6 glass-card hover:border-indigo-200 transition-all group text-left">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                                                <item.icon size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{item.label}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Read Document</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="p-8 text-center text-slate-400">
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-2">A2Z Health & Consultancy • v1.0.4</p>
                                    <p className="text-xs font-medium italic">Empowering your mental wellness journey since 2026.</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                <aside className="lg:col-span-4 space-y-8">
                    <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-40 h-40 bg-indigo-900 rounded-full blur-3xl opacity-50"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                    <ShieldCheck size={24} className="text-emerald-400" />
                                </div>
                                <p className="font-bold text-lg">System Role</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Access Level</p>
                                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">
                                    {user?.role?.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="card-premium p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                <Heart size={20} fill="currentColor" />
                            </div>
                            <h3 className="font-black text-slate-900">Security Note</h3>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                            Your identity is protected by end-to-end clinical encryption. Any changes to core email must be verified through the global IT service desk.
                        </p>
                    </section>
                </aside>
            </div>
        </div>
    );
};

export default ProfilePage;
