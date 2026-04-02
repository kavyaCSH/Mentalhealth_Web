import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
    User, ShieldCheck, Bell, HelpCircle, Mail, FileText, 
    Info, ChevronRight, Moon, Sun, Monitor, Pencil,
    Globe
} from 'lucide-react';
import type { RootState } from '../../store';
import { useTheme } from '../../context/ThemeContext';
import { SystemService } from '../../api/services/system.service';


const MenuItem = ({ icon: IconComp, label, value, onClick, color = "text-indigo-600", bg = "bg-indigo-50" }: any) => (
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

    useEffect(() => {
        const fetchVersion = async () => {
            const v = await SystemService.getWebVersion();
            setWebVersion(v);
        };
        fetchVersion();
    }, []);

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
                            <div className="w-24 h-24 rounded-[40%] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center overflow-hidden">
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
                            className="bg-white text-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-indigo-50 transition-colors shadow-xl"
                        >
                            <Pencil size={20} />
                        </button>
                    </div>
                </div>

                {/* Appearance Grid */}
                <div className="bg-card rounded-[2.5rem] border border-border-card p-8 shadow-sm mb-10">
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
                <Section title="Clinical Account">
                    <MenuItem 
                        icon={User} 
                        label="Personal Information" 
                        value="Bio, Gender, Birthday" 
                        onClick={() => navigate('/profile/edit')} 
                    />
                    <MenuItem 
                        icon={ShieldCheck} 
                        label="Security & Privacy" 
                        value="2FA, Session history" 
                        color="text-emerald-600" 
                        bg="bg-emerald-50"
                    />
                    <MenuItem 
                        icon={Bell} 
                        label="Notifications" 
                        value="Push, SMS, Email" 
                        color="text-amber-500" 
                        bg="bg-amber-50"
                    />
                    <MenuItem 
                        icon={Globe} 
                        label="Precision Location Basis" 
                        value={user?.coordinates ? `${user.coordinates.lat.toFixed(4)}, ${user.coordinates.lng.toFixed(4)}` : "Not Synchronized"} 
                        color="text-blue-500" 
                        bg="bg-blue-50"
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
                        bg="bg-orange-50"
                        onClick={() => navigate('/help/support')}
                    />
                    <MenuItem 
                        icon={ShieldCheck} 
                        label="Privacy Policy" 
                        color="text-slate-600" 
                        bg="bg-slate-50"
                        onClick={() => navigate('/help/article/privacy_policy')}
                    />
                    <MenuItem 
                        icon={FileText} 
                        label="Terms of Service" 
                        color="text-slate-600" 
                        bg="bg-slate-50"
                        onClick={() => navigate('/help/article/terms_of_service')}
                    />
                </Section>

                <Section title="Version Control">
                    <div className="p-8 flex items-center justify-between">
                        <div>
                            <p className="font-black text-main text-sm">MindBalance Web Platform</p>
                            <p className="text-[11px] text-muted font-bold uppercase tracking-widest mt-1">Stable Release v{webVersion}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-page flex items-center justify-center text-muted">
                            <Info size={20} />
                        </div>
                    </div>
                </Section>


                <p className="mt-12 text-center text-[10px] font-black text-muted/50 uppercase tracking-[0.3em]">
                    © 2026 A2Z Health & Consultancy • All Clinical Data Encrypted
                </p>
            </div>
        </div>
    );
};

export default ProfilePage;
