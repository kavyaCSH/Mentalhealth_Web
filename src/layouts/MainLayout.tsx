import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import SideNav from '../components/SideNav';
import { PushNotificationManager } from '../services/pushNotification.service';
import { UserService } from '../api/services/user.service';
import type { RootState } from '../store';
import { useEffect } from 'react';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const { unreadCount } = useSelector((state: RootState) => state.notifications);

    useEffect(() => {
        const initPushAndEnroll = async () => {
            try {
                // Register for push notifications if preferred
                if (user?.communicationPreferences?.push) {
                    await PushNotificationManager.register();
                }

                // Global Enrollment: Proactively trigger all backend hooks to ensure patient record existence
                if (user?.role === 'patient') {
                    console.log(`[Clinical Enrollment] Initializing profile for user: ${user.email}`);
                    await UserService.deepEnroll();
                }
            } catch (err) {
                console.warn('Post-login initialization background tasks failed', err);
            }
        };
        if (user) initPushAndEnroll();
    }, [user]);

    // Initial count is now handled by SideNav which is always present

    return (
        <div className="flex h-screen overflow-hidden bg-page">
            {/* Mobile Overlay */}
            {isMobileNavOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsMobileNavOpen(false)}
                />
            )}

            <SideNav isMobileOpen={isMobileNavOpen} onMobileClose={() => setIsMobileNavOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-20 px-6 lg:px-10 border-b border-border-card bg-card/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-6 flex-1">
                        <button 
                            onClick={() => setIsMobileNavOpen(true)}
                            className="md:hidden p-2.5 -ml-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all"
                        >
                            <Menu size={22} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-8">
                        <button 
                            onClick={() => navigate('/notifications')}
                            className="p-2.5 text-muted hover:bg-page rounded-xl transition-all relative group"
                        >
                            <Bell size={22} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-5 h-5 bg-orange-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                                    {unreadCount}
                                </span>
                            )}
                            <div className="absolute right-0 top-full mt-2 w-64 bg-card rounded-2xl shadow-2xl border border-border-card opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all p-4 pointer-events-none hidden sm:block">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-3">Recent Alerts</p>
                                <p className="text-sm font-bold text-main">
                                    {unreadCount > 0 ? `You have ${unreadCount} unread clinical priority alerts.` : 'Your clinical hub is currently quiet.'}
                                </p>
                            </div>
                        </button>

                        <div className="h-10 w-[1.5px] bg-border-card hidden sm:block"></div>

                        <div className="flex items-center gap-4">
                            <div className="flex-col items-end mr-1 hidden sm:flex">
                                <span className="text-sm font-black text-main leading-none">{user?.name}</span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1.5">{user?.role}</span>
                            </div>
                            <Link to="/profile" className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-100 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200/50 transition-all hover:scale-105 active:scale-95 overflow-hidden border-2 border-white">
                                {user?.profileImage ? (
                                    <img
                                        src={`${user.profileImage}${user.profileImage?.includes('?') ? '&' : '?'}t=${new Date().getTime()}`}
                                        alt="profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`}
                                        alt="profile"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-page p-0 font-sans relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
