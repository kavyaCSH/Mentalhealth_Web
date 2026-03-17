import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Heart,
    Calendar,
    Activity,
    CreditCard,
    BookOpen,
    Settings,
    ShieldCheck,
    Users,
    MessageCircle,
    ClipboardList,
    BarChart3,
    Bell,
    Percent,
    LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../features/auth/store/authSlice';

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
                : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-700'}
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
            <span className="ml-auto bg-orange-100 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
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
    const { user } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const role = user?.role;

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
                fixed md:sticky top-0 left-0 h-screen bg-white border-r border-slate-100 z-50 flex flex-col shadow-2xl md:shadow-none
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}
        >
            <div className="p-6 flex items-center justify-between h-20 border-b border-slate-50 shrink-0">
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                <Heart size={20} fill="currentColor" />
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-slate-900">MindBalance</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden md:block p-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 transition-all shadow-sm"
                    >
                        <motion.div animate={{ rotate: isCollapsed ? 180 : 0 }}>
                            <ChevronLeft size={18} />
                        </motion.div>
                    </button>
                    {isMobileOpen && onMobileClose && (
                        <button
                            onClick={onMobileClose}
                            className="md:hidden p-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 transition-all shadow-sm"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-8 px-5 space-y-10">
                {/* Section shared by all or Role-Specific */}
                <div className="space-y-2">
                    {!isCollapsed && <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-4 mb-4">Core</p>}
                    <NavItem to="/" icon={Activity} label="Overview" isCollapsed={isCollapsed} end />
                    <NavItem to="/profile" icon={Users} label="My Profile" isCollapsed={isCollapsed} />
                </div>

                {/* Patient Sections */}
                {role === 'patient' && (
                    <>
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-4 mb-4">Wellness</p>}
                            <NavItem to="/assessments" icon={ClipboardList} label="Assessments" isCollapsed={isCollapsed} />
                        </div>
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-4 mb-4">Care Team</p>}
                            <NavItem to="/appointments" icon={Calendar} label="Appointments" isCollapsed={isCollapsed} />
                            <NavItem to="/history" icon={BookOpen} label="History" isCollapsed={isCollapsed} />
                            <NavItem to="/transactions" icon={CreditCard} label="Transactions" isCollapsed={isCollapsed} />
                            <NavItem to="/notifications" icon={Bell} label="Notifications" isCollapsed={isCollapsed} />
                            <NavItem to="/statistics" icon={BarChart3} label="Statistics" isCollapsed={isCollapsed} />
                            <NavItem to="/records" icon={ClipboardList} label="Health Records" isCollapsed={isCollapsed} />
                        </div>
                    </>
                )}

                {/* Practitioner Sections */}
                {(role === 'psychiatrist' || role === 'psychologist' || role === 'nurse' || role === 'social_worker' || role === 'counselor') && (
                    <>
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-4 mb-4">Clinical</p>}
                            <NavItem to="/clinical-schedule" icon={Calendar} label="Schedule" isCollapsed={isCollapsed} />
                            <NavItem to="/patients" icon={Users} label="Patients" isCollapsed={isCollapsed} end />
                        </div>
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-4 mb-4">Communication</p>}
                            <NavItem to="/messages" icon={MessageCircle} label="Internal Chat" isCollapsed={isCollapsed} />
                        </div>
                    </>
                )}

                {/* Hospital Admin Sections */}
                {role === 'hospital' && (
                    <>
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-4 mb-4">Operations</p>}
                            <NavItem to="/facility" icon={ShieldCheck} label="Facility Status" isCollapsed={isCollapsed} />
                            <NavItem to="/staff" icon={Users} label="Staff Directory" isCollapsed={isCollapsed} />
                        </div>
                        <div className="space-y-2">
                            {!isCollapsed && <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-4 mb-4">Finance</p>}
                            <NavItem to="/billing" icon={BookOpen} label="Billing Central" isCollapsed={isCollapsed} />
                            <NavItem to="/tax" icon={Percent} label="Tax Systems" isCollapsed={isCollapsed} />
                        </div>
                    </>
                )}

                {/* System Admin Sections */}
                {(role === 'admin' || role === 'super_admin') && (
                    <div className="space-y-2">
                        {!isCollapsed && <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest px-4 mb-4">IT Governance</p>}
                        <NavItem to="/users" icon={Users} label="User Management" isCollapsed={isCollapsed} />
                        <NavItem to="/logs" icon={Activity} label="System Logs" isCollapsed={isCollapsed} />
                        <NavItem to="/settings" icon={Settings} label="Global Config" isCollapsed={isCollapsed} />
                    </div>
                )}
            </div>

            <div className="p-5 border-t border-slate-50 bg-slate-50/30 space-y-3">
                <div className={`flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all ${isCollapsed ? 'justify-center border-none shadow-none bg-transparent' : ''}`}>
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl overflow-hidden border border-slate-200">
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`}
                            alt="avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : (user?.name || 'User')}</p>
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
            </div>
        </motion.aside>
    );
};

export default SideNav;
