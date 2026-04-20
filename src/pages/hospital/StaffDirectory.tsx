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
    Video,
    Phone,
    ShieldCheck,
    Monitor,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { UserService } from '../../api/services/user.service';
import type { User } from '../../types/user.types';

const StaffDirectory = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const roles = [
        { id: '', label: 'All Staff', icon: <Users size={16} /> },
        { id: 'psychiatrist', label: 'Psychiatrists', icon: <Activity size={16} /> },
        { id: 'psychologist', label: 'Psychologists', icon: <Activity size={16} /> },
        { id: 'nurse', label: 'Nurses', icon: <Activity size={16} /> },
        { id: 'counselor', label: 'Counselors', icon: <Activity size={16} /> },
        { id: 'social_worker', label: 'Social Workers', icon: <Activity size={16} /> },
        { id: 'hospital', label: 'Admins', icon: <ShieldCheck size={16} /> }
    ];

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = { limit: itemsPerPage, page };
            if (roleFilter) {
                params.role = roleFilter;
            } else {
                params.role = 'psychiatrist,psychologist,nurse,counselor,social_worker';
            }
            if (searchQuery) {
                params.search = searchQuery;
            }

            const data = await UserService.listUsers(params);
            const fetched = (data as any).users || data || [];
            setUsers(Array.isArray(fetched) ? fetched : []);
            setTotal((data as any).total || fetched.length || 0);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            setUsers([]);
            setTotal(0);
        } finally {
            setIsLoading(false);
        }
    }, [roleFilter, searchQuery, page, itemsPerPage]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleToggleStatus = async (user: User) => {
        const userId = String(user.id || user._id || user.userId);
        setActionLoading(userId);
        try {
            await UserService.toggleUserStatus(String(userId));
            setUsers(prev => prev.map(u => {
                const uid = String(u.id || u._id || u.userId);
                return uid === userId ? { ...u, isActive: !u.isActive } : u;
            }));
        } catch (error) {
            console.error('Failed to toggle status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const getRoleColor = (role: string) => {
        switch (role?.toLowerCase()) {
            case 'psychiatrist': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            case 'psychologist': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'nurse': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
            case 'counselor': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'social_worker': return 'bg-teal-500/10 text-teal-500 border-teal-500/20';
            case 'hospital': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-page text-muted border-border-card';
        }
    };

    const totalPages = Math.ceil(total / itemsPerPage) || 1;

    return (
        <div className="p-8 max-w-7xl  space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-muted uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-black text-main tracking-tight">Staff Directory</h1>
                    <p className="text-muted font-medium">Manage and monitor all clinical professionals in your facility.</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => { setPage(1); fetchUsers(); }}
                        isLoading={isLoading}
                        leftIcon={<RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={() => navigate('/staff/new')}
                        leftIcon={<Plus size={18} />}
                    >
                        Register Staff
                    </Button>
                </div>
            </header>

            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                <div className="flex p-1 bg-page/80 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar shadow-inner border border-border-card">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => { setRoleFilter(role.id); setPage(1); }}
                            className={`flex items-center gap-2 whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${roleFilter === role.id ? 'bg-card text-indigo-500 shadow-sm border border-border-card' : 'text-muted hover:text-main'
                                }`}
                        >
                            {role.icon} {role.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-80 shrink-0">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Search by name, email..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="w-full bg-card border border-border-card rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm text-main"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="card-premium overflow-hidden border-border-card shadow-xl shadow-indigo-500/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-page/50 border-b border-border-card">
                                <th className="p-5 pl-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Staff Member</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Role</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Contact</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Specialization</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap text-center">Status</th>
                                <th className="p-5 pr-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan={6} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Activity className="animate-spin text-indigo-500" size={32} />
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Synchronizing Directory...</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : users.length > 0 ? (
                                    users.map((member, index) => {
                                        const memberId = String(member.id || member._id || member.userId);
                                        return (
                                            <motion.tr
                                                key={memberId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                                className="border-b border-border-card hover:bg-indigo-500/5 transition-colors group"
                                            >
                                                {/* Staff Member */}
                                                <td className="p-5 pl-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-sm border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm shrink-0">
                                                            {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-main leading-tight text-base group-hover:text-indigo-500 transition-colors tracking-tight">
                                                                {member.firstName} {member.lastName}
                                                            </p>
                                                            <p className="text-[11px] font-bold text-muted mt-0.5 flex items-center gap-2">
                                                                @{member.username}
                                                                {member.isActive !== false ? (
                                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                                                ) : (
                                                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="p-5">
                                                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getRoleColor(member.role)}`}>
                                                        {member.role?.replace('_', ' ')}
                                                    </span>
                                                </td>

                                                {/* Contact */}
                                                <td className="p-5">
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-main flex items-center gap-2">
                                                            <Mail size={12} className="text-muted/40" />
                                                            <span className="truncate max-w-[180px]">{member.email}</span>
                                                        </p>
                                                        {member.phone && (
                                                            <p className="text-[11px] font-medium text-muted flex items-center gap-2">
                                                                <Phone size={11} className="text-muted/30" />
                                                                {member.phone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Specialization */}
                                                <td className="p-5">
                                                    <div className="max-w-[180px]">
                                                        <p className="text-[11px] font-black text-muted uppercase tracking-wider truncate">
                                                            {(member as any).specialization || '—'}
                                                        </p>
                                                        {(member as any).qualifications && (
                                                            <p className="text-[10px] font-bold text-muted/60 mt-1 truncate">
                                                                {(member as any).qualifications}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="p-5 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                        member.isActive !== false
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : 'bg-page text-muted border-border-card'
                                                    }`}>
                                                        {member.isActive !== false ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="p-5 pr-8 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => navigate(`/consultations/new?professionalId=${member.id || member._id}`)}
                                                            className="p-2.5 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded-xl transition-all shadow-sm"
                                                            title="Schedule Consult"
                                                        >
                                                            <Video size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(member)}
                                                            disabled={actionLoading === memberId}
                                                            className={`p-2.5 rounded-xl transition-all shadow-sm ${
                                                                member.isActive !== false
                                                                    ? 'bg-page text-muted hover:bg-red-500 hover:text-white'
                                                                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white'
                                                            }`}
                                                            title={member.isActive !== false ? 'Deactivate' : 'Activate'}
                                                        >
                                                            {actionLoading === memberId ? (
                                                                <Activity size={16} className="animate-spin" />
                                                            ) : member.isActive !== false ? (
                                                                <UserX size={16} />
                                                            ) : (
                                                                <UserCheck size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                ) : (
                                    <tr key="empty">
                                        <td colSpan={6} className="p-20 text-center text-muted">
                                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                                <Monitor size={56} className="mx-auto mb-4 text-muted opacity-20" />
                                                <p className="font-black text-main mb-1 uppercase tracking-widest text-sm">No Results Found</p>
                                                <p className="text-xs font-medium">We couldn't find any staff members matching your criteria.</p>
                                                <Button
                                                    variant="primary"
                                                    size="md"
                                                    className="mt-6"
                                                    onClick={() => { setSearchQuery(''); setRoleFilter(''); setPage(1); }}
                                                >
                                                    Clear All Filters
                                                </Button>
                                            </motion.div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    itemsPerPage={itemsPerPage}
                    onPageChange={(p) => setPage(p)}
                    onItemsPerPageChange={(count) => {
                        setItemsPerPage(count);
                        setPage(1);
                    }}
                />
            </div>
        </div>
    );
};

export default StaffDirectory;
