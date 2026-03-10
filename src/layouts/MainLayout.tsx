import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Bell, User as UserIcon, LogOut, Menu, SearchIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../features/auth/store/authSlice';
import SideNav from '../components/SideNav';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-[#F9FBFA]">
            <SideNav />

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <header className="h-20 px-10 border-b border-slate-100 bg-white/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-6 flex-1">
                        <button className="md:hidden p-2.5 -ml-2 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-all">
                            <Menu size={22} />
                        </button>
                        <div className="max-w-md w-full relative hidden lg:block">
                            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search your wellness data..."
                                className="w-full bg-slate-100/70 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all relative group">
                            <Bell size={22} />
                            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all p-4 pointer-events-none">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Notifications</p>
                                <p className="text-sm font-bold text-slate-900">Therapy session in 1 hour.</p>
                            </div>
                        </button>

                        <div className="h-10 w-[1.5px] bg-slate-100"></div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end mr-1 hidden sm:flex">
                                <span className="text-sm font-black text-slate-900 leading-none">{user?.name}</span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1.5">{user?.role}</span>
                            </div>
                            <div className="relative group cursor-pointer">
                                <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200/50 transition-all group-hover:scale-105 active:scale-95 overflow-hidden">
                                    <UserIcon size={20} />
                                </div>

                                <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 p-2 z-50">
                                    <div className="p-4 mb-2 border-b border-slate-50">
                                        <p className="text-sm font-black text-slate-900">{user?.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.email}</p>
                                    </div>
                                    <Link to="/profile" className="flex items-center gap-3 p-3 text-sm font-bold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-2xl transition-all">
                                        <UserIcon size={18} /> Account Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 p-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-2xl transition-all mt-1"
                                    >
                                        <LogOut size={18} /> Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-[#F9FBFA] p-0 font-sans">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
