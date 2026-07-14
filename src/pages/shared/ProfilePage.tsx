import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    User, ShieldCheck, Bell, HelpCircle, Mail, FileText, 
    Info, ChevronRight, Moon, Sun, Monitor, Pencil,
    Globe, Star, X
} from 'lucide-react';
import type { RootState } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import { SystemService } from '../../api/services/system.service';
import { AuthService } from '../../api/services/auth.service';
import { FeedbackService } from '../../api/services/feedback.service';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import AppRatingModal from '../../components/shared/AppRatingModal';


const MenuItem = ({ icon: IconComp, label, value, onClick, color = "text-indigo-500", bg = "bg-indigo-500/10" }: any) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 hover:bg-page/50 transition-all group"
    >
        <div className="flex items-center gap-5">
            <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <IconComp size={22} />
            </div>
            <div className="text-left">
                <p className="font-black text-main text-[15px] tracking-tight">{label}</p>
                {value && <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-0.5">{value}</p>}
            </div>
        </div>
        <ChevronRight className="text-muted group-hover:text-indigo-600 transition-colors" size={20} />
    </button>
);

const Section = ({ title, children }: any) => (
    <div className="bg-card rounded-[2.5rem] border border-border-card shadow-sm overflow-hidden mb-10">
        <div className="px-8 pt-8 pb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">{title}</h2>
        </div>
        <div className="divide-y divide-border-card/50">
            {children}
        </div>
    </div>
);

const ProfilePage = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const [webVersion, setWebVersion] = useState('...');

    const { theme, setTheme } = useTheme();

    const isClinical = ['psychiatrist', 'psychologist', 'nurse', 'counselor', 'social_worker'].includes(String(user?.role).toLowerCase());

    // Password State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Rating State
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [latestRating, setLatestRating] = useState<any>(null);

    useEffect(() => {
        const fetchVersion = async () => {
            const v = await SystemService.getWebVersion();
            setWebVersion(v);
        };
        const fetchRating = async () => {
            try {
                const res = await FeedbackService.getLatestRating();
                setLatestRating(res?.data || res);
            } catch (err) {
                console.error('Failed to fetch rating', err);
            }
        };
        fetchVersion();
        fetchRating();
    }, []);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setPasswordError("Passwords do not match");
            return;
        }
        if (passwords.new.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            return;
        }

        setPasswordLoading(true);
        setPasswordError(null);

        try {
            await AuthService.changePassword({
                currentPassword: passwords.current,
                newPassword: passwords.new,
                confirmPassword: passwords.confirm
            });
            setShowPasswordModal(false);
            setPasswords({ current: '', new: '', confirm: '' });
            alert("Security credentials updated successfully.");
        } catch (err: any) {
            setPasswordError(err.response?.data?.message || "Failed to update security key");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-page p-6 md:p-12 pb-32">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-main tracking-tighter">Account Hub</h1>
                    <p className="text-muted font-medium">Manage your clinical identity and app preferences.</p>
                </header>

                {/* Profile Hero Card */}
                <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-12 group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-[100px] -mr-48 -mt-48 rounded-full group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-[40%] bg-card/10 backdrop-blur-xl border border-white/20 flex items-center justify-center overflow-hidden">
                                {user?.profileImage ? (
                                    <img 
                                        src={`${user.profileImage}${user.profileImage.includes('?') ? '&' : '?'}t=${new Date().getTime()}`} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <User size={40} className="text-white/80" />
                                )}
                            </div>
                        </div>
                        
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-black tracking-tight">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-indigo-300 font-medium opacity-80 mb-4">{user?.email}</p>
                            <span className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-200">
                                {user?.role?.replace('_', ' ')} ACCREDITED
                            </span>
                        </div>

                        <button 
                            onClick={() => navigate('/profile/edit')}
                            className="bg-card text-main w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-indigo-50 transition-colors shadow-xl"
                        >
                            <Pencil size={20} />
                        </button>
                    </div>
                </div>

                {/* Professional Details Section for Clinical Users */}
                {isClinical && (
                    <div className="bg-card rounded-[2.5rem] border border-border-card p-8 md:p-10 shadow-sm mb-10 space-y-8 animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Professional Details</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">Specialization</p>
                                    <p className="text-main font-bold text-base">{user?.specialization || 'Not Specified'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">Highest Qualification</p>
                                    <p className="text-main font-bold text-base">
                                        {Array.isArray(user?.qualifications) 
                                            ? (user.qualifications as string[]).join(', ') 
                                            : (user?.qualifications || 'Not Specified')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">Years of Experience</p>
                                    <p className="text-main font-bold text-base">{user?.experienceYears ? `${user.experienceYears} Years` : 'Not Specified'}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">Languages Spoken</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {(() => {
                                            const langs = Array.isArray(user?.languages) 
                                                ? user.languages 
                                                : typeof (user?.languages as any) === 'string'
                                                    ? String(user?.languages).split(',').map(l => l.trim()).filter(Boolean)
                                                    : [];
                                            return langs.length > 0 ? (
                                                langs.map((lang: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {lang}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-muted text-sm font-medium">Not Specified</span>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5">Core Skills & Therapeutic Modalities</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {(() => {
                                            const skillsList = Array.isArray(user?.skills) 
                                                ? user.skills 
                                                : typeof (user?.skills as any) === 'string'
                                                    ? String(user?.skills).split(',').map(s => s.trim()).filter(Boolean)
                                                    : [];
                                            return skillsList.length > 0 ? (
                                                skillsList.map((skill: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {skill}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-muted text-sm font-medium">Not Specified</span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {user?.about && (
                            <div className="pt-6 border-t border-border-card space-y-2">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Professional Bio</p>
                                <p className="text-main text-sm font-medium leading-relaxed italic">
                                    "{user.about}"
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Appearance Grid */}
                <div id="visual-appearance" className="bg-card rounded-[2.5rem] border border-border-card p-8 shadow-sm mb-10 scroll-mt-24">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-6">Visual Appearance</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { id: 'light', label: 'Light', icon: Sun },
                            { id: 'dark', label: 'Dark', icon: Moon },
                            { id: 'system', label: 'System', icon: Monitor },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setTheme(opt.id as any)}
                                className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-all border
                                    ${theme === opt.id 
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20' 
                                        : 'bg-page text-muted border-border-card hover:border-indigo-400'}
                                `}
                            >
                                <opt.icon size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Settings Sections */}
                <Section title="Account Settings">
                    <MenuItem 
                        icon={User} 
                        label="Personal Information" 
                        value="Bio, Gender, Birthday" 
                        onClick={() => navigate('/profile/edit')} 
                    />
                    <MenuItem 
                        icon={Monitor} 
                        label="Appearance" 
                        value="Theme and Visual Options" 
                        color="text-indigo-500" 
                        bg="bg-indigo-500/10"
                        onClick={() => {
                            const element = document.getElementById('visual-appearance');
                            if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                            }
                        }}
                    />
                    <MenuItem 
                        icon={ShieldCheck} 
                        label="Security & Password" 
                        value="Change login credentials" 
                        color="text-emerald-500" 
                        bg="bg-emerald-500/10"
                        onClick={() => setShowPasswordModal(true)}
                    />
                    <MenuItem 
                        icon={Bell} 
                        label="Notifications" 
                        value="Push, SMS, Email" 
                        color="text-amber-500" 
                        bg="bg-amber-500/10"
                        onClick={() => navigate('/profile/notifications')}
                    />
                    <MenuItem 
                        icon={Globe} 
                        label="Precision Location Basis" 
                        value={user?.coordinates ? `${user.coordinates.lat.toFixed(4)}, ${user.coordinates.lng.toFixed(4)}` : "Not Synchronized"} 
                        color="text-blue-500" 
                        bg="bg-blue-500/10"
                        onClick={() => navigate('/profile/edit')}
                    />
                </Section>

                <Section title="Guidelines & Legal">
                    <MenuItem 
                        icon={HelpCircle} 
                        label="Help Center" 
                        value="Guidelines & Discovery" 
                        onClick={() => navigate('/help')}
                    />
                    <MenuItem 
                        icon={Mail} 
                        label="Contact Support" 
                        value="24/7 Clinical Desk" 
                        color="text-orange-500" 
                        bg="bg-orange-500/10"
                        onClick={() => navigate('/help/support')}
                    />
                    <MenuItem 
                        icon={Star} 
                        label={latestRating ? "Update My Rating" : "Rate the App"} 
                        value={latestRating ? `${latestRating.rating} Stars Recited` : "Share your experience"} 
                        color="text-amber-500" 
                        bg="bg-amber-500/10"
                        onClick={() => setShowRatingModal(true)}
                    />
                    <MenuItem 
                        icon={ShieldCheck} 
                        label="Privacy Policy" 
                        color="text-muted" 
                        bg="bg-page0/10"
                        onClick={() => navigate('/help/article/privacy_policy')}
                    />
                    <MenuItem 
                        icon={FileText} 
                        label="Terms of Service" 
                        color="text-muted" 
                        bg="bg-page0/10"
                        onClick={() => navigate('/help/article/terms_of_service')}
                    />
                </Section>

                <Section title="System Information">
                    <button 
                        onClick={() => navigate('/help/article/about_mindbalance', { state: { title: 'About MindBalance' } })}
                        className="w-full p-8 flex items-center justify-between hover:bg-page/50 transition-all group text-left"
                    >
                        <div>
                            <p className="font-black text-main text-sm">MindBalance Web Platform</p>
                            <p className="text-[11px] text-muted font-bold uppercase tracking-widest mt-1">Stable Release v{webVersion}</p>
                        </div>
                        <div className="w-12 h-12 rounded-[1.25rem] bg-page flex items-center justify-center text-muted group-hover:text-indigo-500 group-hover:bg-indigo-500/10 transition-all group-hover:scale-110">
                            <Info size={22} />
                        </div>
                    </button>
                </Section>

                <AnimatePresence>
                    {showPasswordModal && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-card w-full max-w-md rounded-[3rem] p-10 border border-border-card shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-2xl font-black text-main tracking-tight">Security Update</h3>
                                        <button 
                                            type="button"
                                            onClick={() => setShowPasswordModal(false)}
                                            className="w-10 h-10 rounded-xl bg-page flex items-center justify-center text-muted hover:bg-error/10 hover:text-error transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <form onSubmit={handlePasswordChange} className="space-y-6">
                                        <InputField
                                            label="Current Password"
                                            name="currentPassword"
                                            type="password"
                                            value={passwords.current}
                                            onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
                                            placeholder="••••••••"
                                            required
                                        />
                                        <InputField
                                            label="New Access Key"
                                            name="newPassword"
                                            type="password"
                                            value={passwords.new}
                                            onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))}
                                            placeholder="••••••••"
                                            required
                                            helperText="Minimum 8 characters"
                                        />
                                        <InputField
                                            label="Confirm New Key"
                                            name="confirmPassword"
                                            type="password"
                                            value={passwords.confirm}
                                            onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                                            placeholder="••••••••"
                                            required
                                        />

                                        {passwordError && (
                                            <div className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 text-center">
                                                {passwordError}
                                            </div>
                                        )}

                                        <Button 
                                            type="submit" 
                                            isLoading={passwordLoading}
                                            className="w-full py-6 rounded-[1.5rem]"
                                        >
                                            Secure Account
                                        </Button>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AppRatingModal 
                    isOpen={showRatingModal}
                    onClose={() => setShowRatingModal(false)}
                    existingRating={latestRating}
                />


                <p className="mt-12 text-center text-[10px] font-black text-muted/50 uppercase tracking-[0.3em]">
                    © 2026 A2Z Health & Consultancy • All Clinical Data Encrypted
                </p>
            </div>
        </div>
    );
};

export default ProfilePage;
