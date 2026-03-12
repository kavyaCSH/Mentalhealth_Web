import React, { useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SideNav from '../components/SideNav';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-[#F9FBFA]">
            {/* Mobile Overlay */}
            {isMobileNavOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={() => setIsMobileNavOpen(false)}
                />
            )}

            <SideNav isMobileOpen={isMobileNavOpen} onMobileClose={() => setIsMobileNavOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-20 px-6 lg:px-10 border-b border-slate-100 bg-white/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-6 flex-1">
                        <button 
                            onClick={() => setIsMobileNavOpen(true)}
                            className="md:hidden p-2.5 -ml-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all"
                        >
                            <Menu size={22} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-8">
                        <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all relative group">
                            <Bell size={22} />
                            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all p-4 pointer-events-none hidden sm:block">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Notifications</p>
                                <p className="text-sm font-bold text-slate-900">Therapy session in 1 hour.</p>
                            </div>
                        </button>

                        <div className="h-10 w-[1.5px] bg-slate-100 hidden sm:block"></div>

                        <div className="flex items-center gap-4">
                            <div className="flex-col items-end mr-1 hidden sm:flex">
                                <span className="text-sm font-black text-slate-900 leading-none">{user?.name}</span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1.5">{user?.role}</span>
                            </div>
                            <Link to="/profile" className="w-10 h-10 sm:w-11 sm:h-11 bg-indigo-100 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200/50 transition-all hover:scale-105 active:scale-95 overflow-hidden border-2 border-white">
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`}
                                    alt="profile"
                                    className="w-full h-full object-cover"
                                />
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-[#F9FBFA] p-0 font-sans relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
