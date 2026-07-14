import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Heart,
    Calendar,
    Activity,
    BookOpen,
    Settings,
    ShieldCheck,
    Users,
    BarChart3,
    Bell,
    Percent,
    LogOut,
    Brain,
    Sparkles,
    MessageCircle,
    Receipt,
    Megaphone,
    ShieldAlert,
    Zap,
    MessageSquare,
    ClipboardCheck,
    Globe
} from 'lucide-react';
import { logout } from '../features/auth/store/authSlice';
import { SystemService } from '../api/services/system.service';
import { fetchUnreadCount } from '../features/notifications/store/notificationSlice';
import type { RootState, AppDispatch } from '../store';

interface NavItemProps {
    to: string;
    icon: React.ElementType;
    label: string;
    isCollapsed: boolean;
    badge?: string;
    end?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, isCollapsed, badge, end }) => (
    <NavLink
        to={to}
        end={end}
        className={({ isActive }) => `
      flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-300 group relative
      ${isActive
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200/50'
                : 'text-muted hover:bg-indigo-50 hover:text-indigo-700'}
    `}
    >
        <Icon size={20} className="shrink-0" />
        <AnimatePresence>
            {!isCollapsed && (
                <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-semibold text-sm whitespace-nowrap"
                >
                    {label}
                </motion.span>
            )}
        </AnimatePresence>

        {badge && !isCollapsed && (
            <span className="ml-auto bg-orange-100 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest pointer-events-none">
                {badge}
            </span>
        )}

        {isCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
                {label}
            </div>
        )}
    </NavLink>
);

interface SideNavProps {
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isMobileOpen, onMobileClose }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [webVersion, setWebVersion] = useState('...');
    const { user } = useSelector((state: RootState) => state.auth);
    const { unreadCount } = useSelector((state: RootState) => state.notifications);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const role = user?.role;

    useEffect(() => {
        const fetchVersion = async () => {
            const v = await SystemService.getWebVersion();
            setWebVersion(v);
        };
        fetchVersion();
        if (user) {
            dispatch(fetchUnreadCount());
        }
    }, [user, dispatch]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <motion.aside
            initial={false}
            animate={{
                width: isCollapsed ? '90px' : '290px',
                x: typeof window !== 'undefined' && window.innerWidth < 768
                    ? (isMobileOpen ? 0 : '-100%')
                    : 0
            }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className={`
                fixed md:sticky top-0 left-0 h-screen bg-card border-r border-border-card z-50 flex flex-col shadow-2xl md:shadow-none
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}
        >
            <div className={`p-6 flex items-center justify-between border-b border-border-card shrink-0 h-20 transition-all duration-300`}>
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            key="default-header"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                <Heart size={20} fill="currentColor" />
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-main">MindBalance</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:block p-2 rounded-xl border border-border-card bg-page text-muted hover:text-indigo-700 hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
                            <ChevronLeft size={18} />
                        </motion.div>
                    </button>
                    {isMobileOpen && onMobileClose && (
                        <button
                            onClick={onMobileClose}
                            className="md:hidden p-2 rounded-xl border border-border-card bg-page text-muted hover:text-indigo-700 hover:bg-indigo-50 transition-all shadow-sm"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-8 px-5 space-y-10">
                {/* Section shared by all or Role-Specific */}
                <div className="space-y-2">
                    {!isCollapsed && <p className="text-[11px] font-black text-muted uppercase tracking-widest px-4 mb-4">Core</p>}

                    <NavItem to="/" icon={Activity} label="Overview" isCollapsed={isCollapsed} end />

                    <NavItem to="/profile" icon={Users} label="My Profile" isCollapsed={isCollapsed} />
                    <NavItem 
                        to="/notifications" 
                        icon={Bell} 
                        label="Notifications" 
                        isCollapsed={isCollapsed} 
                        badge={unreadCount > 0 ? String(unreadCount) : undefined}
                    />
                </div>

                {/* Patient Sections */}
                {String(role).toUpperCase() === 'PATIENT' && (
                    <>
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[11px] font-black text-muted uppercase tracking-widest px-4 mb-4">Care Suite</p>}
                            <NavItem to="/appointments" icon={Calendar} label="Appointments" isCollapsed={isCollapsed} />
                            <NavItem to="/assessments" icon={Brain} label="Self Assessment" isCollapsed={isCollapsed} />
                            <NavItem to="/history/assistant?view=assistant&source=assistant" icon={Sparkles} label="AI History Assistant" isCollapsed={isCollapsed} />
                            <NavItem to="/history/professional" icon={ShieldCheck} label="Professional Reports" isCollapsed={isCollapsed} />
                            <NavItem to="/statistics" icon={BarChart3} label="Statistics" isCollapsed={isCollapsed} />
                            <NavItem to="/records" icon={Heart} label="Health Records" isCollapsed={isCollapsed} />
                        </div>
                    </>
                )}

                {/* Practitioner Sections */}
                {['PSYCHIATRIST', 'PSYCHOLOGIST', 'NURSE', 'SOCIAL_WORKER', 'COUNSELOR'].includes(String(role).toUpperCase()) && (
                    <>
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[11px] font-black text-muted uppercase tracking-widest px-4 mb-4">Clinical Workspace</p>}
                            <NavItem to="/clinical-schedule" icon={Calendar} label="Staff Schedule" isCollapsed={isCollapsed} />
                            <NavItem to="/patients" icon={Users} label="Patient Directory" isCollapsed={isCollapsed} end />
                        </div>
                        <div className="space-y-2">
                            <NavItem to="/neuro-vitals" icon={Brain} label="NeuroVitals™" isCollapsed={isCollapsed} />
                            <NavItem to="/clinical/statistics" icon={BarChart3} label="Clinical Analytics" isCollapsed={isCollapsed} />
                        </div>
                    </>
                )}

                {/* Hospital Admin Sections */}
                {role === 'hospital' && (
                    <>
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[11px] font-black text-muted uppercase tracking-widest px-4 mb-4">Operations</p>}
                            <NavItem to="/facility" icon={ShieldCheck} label="Facility Status" isCollapsed={isCollapsed} />
                            <NavItem to="/hospital-patients" icon={ClipboardCheck} label="Patient Directory" isCollapsed={isCollapsed} />
                            <NavItem to="/staff" icon={Users} label="Staff Directory" isCollapsed={isCollapsed} />
                        </div>
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[11px] font-black text-muted uppercase tracking-widest px-4 mb-4">Finance</p>}
                            <NavItem to="/billing" icon={BookOpen} label="Billing Central" isCollapsed={isCollapsed} />
                            <NavItem to="/tax" icon={Percent} label="Tax Systems" isCollapsed={isCollapsed} />
                        </div>
                    </>
                )}

                {/* System Admin Sections */}
                {['ADMIN', 'SUPER_ADMIN'].includes(String(role).toUpperCase()) && (
                    <div className="space-y-2">
                        {!isCollapsed && <p className="text-[11px] font-black text-muted uppercase tracking-widest px-4 mb-4">IT Governance</p>}
                        {role === 'super_admin' && (
                            <NavItem to="/admin/gatekeeper" icon={ShieldCheck} label="Gatekeeper Cabinet" isCollapsed={isCollapsed} />
                        )}
                        {(role === 'admin' || role === 'super_admin') && (
                            <NavItem to="/admin/financials" icon={Receipt} label="Financial Master" isCollapsed={isCollapsed} />
                        )}
                        <NavItem to="/admin/users" icon={Users} label="User Management" isCollapsed={isCollapsed} />
                        {(role === 'admin' || role === 'super_admin' || role === 'hospital') && (
                            <NavItem to="/admin/consultations/new" icon={Calendar} label="Book Consult" isCollapsed={isCollapsed} />
                        )}
                        {(role === 'admin' || role === 'super_admin' || role === 'hospital') && (
                            <NavItem to="/admin/knowledge-base" icon={BookOpen} label="Knowledge Base" isCollapsed={isCollapsed} />
                        )}
                        {(role === 'admin' || role === 'super_admin' || role === 'hospital') && (
                            <NavItem to="/admin/assessment-oversight" icon={ClipboardCheck} label="EHR Oversight" isCollapsed={isCollapsed} />
                        )}
                        {(role === 'super_admin' || role === 'psychiatrist') && (
                            <NavItem to="/admin/clinical-intelligence" icon={Brain} label="Clinical AI" isCollapsed={isCollapsed} />
                        )}
                        {(role === 'admin' || role === 'super_admin' || role === 'psychiatrist') && (
                            <NavItem to="/admin/global-analytics" icon={Globe} label="Global Analytics" isCollapsed={isCollapsed} />
                        )}
                        {role === 'super_admin' && (
                            <NavItem to="/admin/audit-logs" icon={ShieldCheck} label="Audit Trail" isCollapsed={isCollapsed} />
                        )}
                        {role === 'super_admin' && (
                            <NavItem to="/admin/communication" icon={Megaphone} label="Megaphone Hub" isCollapsed={isCollapsed} />
                        )}
                        {role === 'super_admin' && (
                            <NavItem to="/admin/api-access" icon={ShieldAlert} label="Access Governance" isCollapsed={isCollapsed} />
                        )}
                        {role === 'super_admin' && (
                            <NavItem to="/admin/automation" icon={Zap} label="Automation Manager" isCollapsed={isCollapsed} />
                        )}
                        {(role === 'super_admin' || role === 'admin') && (
                            <NavItem to="/admin/schedule-control" icon={Calendar} label="Schedule Control" isCollapsed={isCollapsed} />
                        )}
                        {role === 'super_admin' && (
                            <NavItem to="/admin/feedback-desk" icon={MessageSquare} label="Support Desk" isCollapsed={isCollapsed} />
                        )}
                        <NavItem to="/admin/settings" icon={Settings} label="Global Config" isCollapsed={isCollapsed} />
                    </div>
                )}
            </div>

            <div className="p-5 border-t border-border-card bg-page/30 space-y-3">
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border-card shadow-sm transition-all ${isCollapsed ? 'justify-center border-none shadow-none bg-transparent' : ''}`}>
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl overflow-hidden border border-border-card">
                        {user?.profileImage ? (
                            <img
                                src={`${user.profileImage}${user.profileImage?.includes('?') ? '&' : '?'}t=${new Date().getTime()}`}
                                alt="avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`}
                                alt="avatar"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-main truncate">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.name || 'User')}</p>
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{role?.replace('_', ' ')}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-red-600 hover:bg-red-50 transition-all duration-300 group relative
                        ${isCollapsed ? 'justify-center' : ''}
                    `}
                >
                    <LogOut size={20} className="shrink-0" />
                    {!isCollapsed && <span className="font-bold text-sm">Sign Out</span>}
                    {isCollapsed && (
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-1 group-hover:translate-x-0 whitespace-nowrap z-50 shadow-xl">
                            Sign Out
                        </div>
                    )}
                </button>

                <div className={`mt-4 pt-4 border-t border-border-card flex flex-col gap-0.5 ${isCollapsed ? 'items-center' : 'px-4'}`}>
                    <p className="text-[9px] font-black tracking-widest text-muted opacity-40 uppercase leading-none">
                        {isCollapsed ? 'V' : 'Version Control'}
                    </p>
                    <p className="text-[10px] font-bold text-muted opacity-80">
                        {isCollapsed ? webVersion : `v${webVersion}`}
                    </p>
                </div>
            </div>
        </motion.aside>
    );
};

export default SideNav;
