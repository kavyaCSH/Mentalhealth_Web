import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Users,
    UserCheck,
    UserX,
    Activity,
    ArrowLeft,
    Plus,
    RefreshCw,
    Mail,
    Phone,
    Video,
    MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { UserService } from '../../api/services/user.service';
import type { User } from '../../types/user.types';

const StaffDirectory = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const roles = [
        { id: '', label: 'All Staff', icon: <Users size={16} /> },
        { id: 'psychiatrist', label: 'Psychiatrists', icon: <Activity size={16} /> },
        { id: 'psychologist', label: 'Psychologists', icon: <Activity size={16} /> },
        { id: 'nurse', label: 'Nurses', icon: <Activity size={16} /> },
        { id: 'counselor', label: 'Counselors', icon: <Activity size={16} /> },
        { id: 'social_worker', label: 'Social Workers', icon: <Activity size={16} /> }
    ];

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = { limit: 100, page: 1 };
            if (roleFilter) {
                params.role = roleFilter;
            } else {
                params.role = 'psychiatrist,psychologist,nurse,counselor,social_worker';
            }

            const data = await UserService.listUsers(params);
            setUsers(data);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, [roleFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleToggleStatus = async (user: User) => {
        const userId = String(user.id || user._id || user.userId);
        setActionLoading(userId);
        try {
            await UserService.toggleUserStatus(String(userId));
            setUsers(prev => prev.map(u => (u.id || u._id || u.userId) === userId ? { ...u, isActive: !u.isActive } : u));
        } catch (error) {
            console.error('Failed to toggle status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(u => {
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) ||
            u.username?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query);
    });

    const getRoleColor = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'psychiatrist': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'psychologist': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'nurse': return 'bg-pink-50 text-pink-700 border-pink-100';
            case 'counselor': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'social_worker': return 'bg-teal-50 text-teal-700 border-teal-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <div className="p-8 max-w-7xl  space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Staff Directory</h1>
                    <p className="text-slate-500 font-medium">Manage and monitor all clinical professionals in your facility.</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={fetchUsers}
                        isLoading={isLoading}
                        leftIcon={<RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />}
                    >
                        Refresh Directory
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/staff/new')}
                        leftIcon={<Plus size={18} />}
                    >
                        Register New Staff
                    </Button>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                <div className="flex p-1 bg-slate-100/80 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setRoleFilter(role.id)}
                            className={`flex items-center gap-2 whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${roleFilter === role.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {role.icon} {role.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-80 shrink-0">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="py-24 text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Synchronizing Directory...</p>
                </div>
            ) : filteredUsers.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <AnimatePresence>
                        {filteredUsers.map((member, index) => (
                            <motion.div
                                key={member.id || member._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="card-premium group hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500"
                            >
                                <div className="p-6 space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 flex items-center justify-center font-black text-indigo-600 text-xl border border-indigo-100 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                                {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-lg leading-tight">
                                                    {member.firstName} {member.lastName}
                                                </h3>
                                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                                                    @{member.username}
                                                    {member.isActive !== false ? (
                                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                                    ) : (
                                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                            <MoreVertical size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <div className="p-2 rounded-lg bg-slate-50">
                                                <Mail size={14} />
                                            </div>
                                            <span className="text-sm font-medium truncate">{member.email}</span>
                                        </div>
                                        {member.phone && (
                                            <div className="flex items-center gap-3 text-slate-500">
                                                <div className="p-2 rounded-lg bg-slate-50">
                                                    <Phone size={14} />
                                                </div>
                                                <span className="text-sm font-medium">{member.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRoleColor(member.role)}`}>
                                            {member.role?.replace('_', ' ')}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="px-3 py-2 text-[10px] h-auto rounded-xl"
                                                onClick={() => navigate(`/hospital/consultations/new?professionalId=${member.id || member._id}`)}
                                                leftIcon={<Video size={14} />}
                                            >
                                                Schedule
                                            </Button>
                                            <Button
                                                variant={member.isActive !== false ? "outline" : "primary"}
                                                size="sm"
                                                className="px-4 py-2 text-[10px] h-auto rounded-xl"
                                                isLoading={actionLoading === (member.id || member._id)}
                                                onClick={() => handleToggleStatus(member)}
                                                leftIcon={member.isActive !== false ? <UserX size={14} /> : <UserCheck size={14} />}
                                            >
                                                {member.isActive !== false ? 'Deactivate' : 'Activate'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="py-32 text-center card-premium bg-slate-50/50 border-dashed">
                    <Users size={48} className="mx-auto mb-4 text-slate-200" />
                    <p className="font-black text-slate-900 mb-1 uppercase tracking-widest text-sm">No Results Found</p>
                    <p className="text-slate-400 font-medium text-sm">We couldn't find any staff members matching your criteria.</p>
                    <Button
                        variant="primary"
                        size="md"
                        className="mt-6"
                        onClick={() => { setSearchQuery(''); setRoleFilter(''); }}
                    >
                        Clear All Filters
                    </Button>
                </div>
            )}
        </div>
    );
};

export default StaffDirectory;
