import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { 
    Bell, 
    Mail, 
    MessageSquare, 
    Smartphone, 
    ShieldCheck, 
    Info,
    CheckCircle2,
    AlertCircle,
    ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../../store';
import { UserService } from '../../api/services/user.service';
import { getCurrentUser } from '../../features/auth/store/authSlice';

const NotificationSettingsPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [preferences, setPreferences] = useState({
        email: user?.communicationPreferences?.email ?? true,
        sms: user?.communicationPreferences?.sms ?? true,
        push: user?.communicationPreferences?.push ?? true,
    });

    const handleToggle = async (channel: 'email' | 'sms' | 'push') => {
        const newValue = !preferences[channel];
        const updatedPrefs = { ...preferences, [channel]: newValue };
        
        // Optimistic update
        setPreferences(updatedPrefs);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            setIsLoading(true);
            await UserService.updateMyProfile({
                communicationPreferences: updatedPrefs
            });
            await dispatch(getCurrentUser());
            setSuccessMessage(`${channel.toUpperCase()} preferences updated successfully.`);
        } catch (error) {
            // Rollback on failure
            setPreferences(preferences);
            setErrorMessage('Failed to update notification preferences. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const sections = [
        {
            id: 'email',
            title: 'Email Notifications',
            description: 'Direct clinical updates, session reminders, and health insights sent to your registered inbox.',
            icon: <Mail className="text-blue-500" size={24} />,
            bg: 'bg-blue-50',
            value: preferences.email
        },
        {
            id: 'sms',
            title: 'SMS Alerts',
            description: 'Instant mobile text messages for urgent appointment changes and clinical priority alerts.',
            icon: <MessageSquare className="text-emerald-500" size={24} />,
            bg: 'bg-emerald-50',
            value: preferences.sms
        },
        {
            id: 'push',
            title: 'Push Notifications',
            description: 'Real-time browser and device alerts for messages, results, and system status updates.',
            icon: <Smartphone className="text-indigo-500" size={24} />,
            bg: 'bg-indigo-50',
            value: preferences.push
        }
    ];

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in pb-24">
            <header className="space-y-6">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted hover:text-indigo-600 transition-all group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Back to Profile</span>
                </button>

                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-2">
                        <Bell size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Clinical Connectivity</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Notification Settings</h1>
                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xl">
                        Control how you receive clinical signals and administrative updates across all channels.
                    </p>
                </div>
            </header>

            <AnimatePresence mode="popLayout">
                {successMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700"
                    >
                        <CheckCircle2 size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">{successMessage}</span>
                    </motion.div>
                )}

                {errorMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600"
                    >
                        <AlertCircle size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">{errorMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delivery Info Card */}
            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
                <div className="relative z-10 flex items-start gap-6">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                        <ShieldCheck size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight mb-2 uppercase">Encryption Standard</h3>
                        <p className="text-indigo-100 font-medium leading-relaxed opacity-90 text-sm">
                            All notification payloads containing protected health information (PHI) are end-to-end encrypted before delivery to third-party providers (Email/SMS).
                        </p>
                    </div>
                </div>
            </div>

            {/* Channels Grid */}
            <div className="space-y-6">
                <h2 className="text-[10px] font-black text-muted uppercase tracking-[0.4em] px-2">Delivery Channels</h2>
                
                <div className="grid gap-6">
                    {sections.map((section) => (
                        <div 
                            key={section.id}
                            className="bg-white border border-slate-100 rounded-[3rem] p-8 flex flex-col md:flex-row md:items-center gap-8 transition-all hover:border-indigo-100"
                        >
                            <div className={`w-16 h-16 shrink-0 rounded-[1.50rem] flex items-center justify-center ${section.bg}`}>
                                {section.icon}
                            </div>

                            <div className="flex-1 space-y-2">
                                <h4 className="text-xl font-black text-slate-800 tracking-tight uppercase">
                                    {section.title}
                                </h4>
                                <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">
                                    {section.description}
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleToggle(section.id as any)}
                                    disabled={isLoading}
                                    className={`relative w-20 h-10 rounded-full transition-all duration-500 focus:outline-none ring-4 ring-transparent focus:ring-indigo-100
                                        ${section.value ? 'bg-indigo-600' : 'bg-slate-100'}
                                    `}
                                >
                                    <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-500 shadow-lg transform
                                        ${section.value ? 'translate-x-11' : 'translate-x-1'}
                                    `}></div>
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-widest w-12
                                    ${section.value ? 'text-indigo-600' : 'text-slate-400'}
                                `}>
                                    {section.value ? 'On' : 'Off'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-8 rounded-[2.5rem] flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                    <Info size={20} />
                </div>
                <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                    Note: Critical biological alerts, security codes, and system maintenance bulletins will always be delivered to ensure clinical safety, regardless of these preferences.
                </p>
            </div>
        </div>
    );
};

export default NotificationSettingsPage;
