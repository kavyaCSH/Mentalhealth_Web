import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { 
    Search, 
    Shield, 
    User as UserIcon, 
    Building, 
    UserCheck, 
    UserX, 
    Activity, 
    Monitor,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { UserService } from '../../api/services/user.service';
import type { User, UserRole } from '../../types/user.types';
import type { RootState } from '../../store';

const UserList = () => {
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('patient');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [limit] = useState(10);

    const isSuperAdmin = currentUser?.role === 'super_admin';

    const tabs = [
        { id: 'patient', label: 'Patients', icon: <UserIcon size={16} /> },
        { id: 'practitioner', label: 'Clinical Staff', icon: <Activity size={16} /> },
        { id: 'hospital', label: 'Facilities', icon: <Building size={16} /> },
        { id: 'admin', label: 'Administrators', icon: <Shield size={16} /> }
    ];

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            let roleQuery = activeTab;
            if (activeTab === 'practitioner') roleQuery = 'psychiatrist,psychologist,nurse,counselor,social_worker';
            if (activeTab === 'admin') roleQuery = 'admin,super_admin';

            const { users: fetchedUsers, total: totalCount } = await UserService.listUsers({
                role: roleQuery,
                search: searchQuery || undefined,
                page,
                limit
            });
            
            setUsers(fetchedUsers);
            setTotal(totalCount);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            setError('Synchronization with the user registry failed.');
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, searchQuery, page, limit]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        setActionLoading(userId);
        try {
            await UserService.toggleUserStatus(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
        } catch (err: any) {
            console.error('Failed to toggle user status:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleVerification = async (userId: string, currentVerified: boolean) => {
        if (!isSuperAdmin) return;
        setActionLoading(userId);
        try {
            await UserService.toggleVerification(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isVerified: !currentVerified } : u));
        } catch (err: any) {
            console.error('Failed to toggle verification:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const getRoleBadge = (role: UserRole | string) => {
        switch (role) {
            case 'super_admin':
            case 'admin': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'hospital': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'patient': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-8 max-w-7xl space-y-8 animate-fade-in pb-24">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-main tracking-tight">User Registry</h1>
                    <p className="text-muted font-medium mt-2">Manage all registered accounts across the platform network.</p>
                </div>
                {error && (
                    <div className="flex items-center gap-2 text-error bg-error/10 px-4 py-2 rounded-xl border border-error/20 text-xs font-bold shadow-sm">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}
            </header>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                <div className="flex p-1 bg-page/80 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar shadow-inner border border-border-card">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setPage(1);
                            }}
                            className={`flex items-center gap-2 whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-card text-indigo-500 shadow-sm border border-border-card' : 'text-muted hover:text-main'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-96 shrink-0">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or username..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="w-full bg-card border border-border-card rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm text-main"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="card-premium overflow-hidden border-border-card shadow-xl shadow-indigo-200/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-page/50 border-b border-border-card">
                                <th className="p-5 pl-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">User Identity</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Clearance & Role</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Contact Matrix</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap text-center">Protocol Status</th>
                                <th className="p-5 pr-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap text-right">Operational Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Activity className="animate-spin text-indigo-500" size={32} />
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Querying Global Registry...</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : users.length > 0 ? (
                                    users.map((user, index) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="border-b border-border-card hover:bg-page/60 transition-colors group"
                                        >
                                            <td className="p-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center font-black text-sm border-2 border-card shadow-sm">
                                                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-main leading-tight block text-base">
                                                            {user.firstName} {user.lastName}
                                                        </p>
                                                        <span className="text-[10px] font-mono text-muted block mt-1">UUID: {user.id ? user.id.substring(0, 8) : 'Pending'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col gap-2">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border w-fit ${getRoleBadge(user.role)}`}>
                                                        {user.role?.replace('_', ' ')}
                                                    </span>
                                                    {isSuperAdmin && (user.role !== 'patient' && user.role !== 'admin' && user.role !== 'super_admin') && (
                                                        <button 
                                                            onClick={() => handleToggleVerification(user.id, !!user.isVerified)}
                                                            className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight transition-colors ${
                                                                user.isVerified ? 'text-emerald-500 hover:text-emerald-700' : 'text-muted hover:text-main'
                                                            }`}
                                                        >
                                                            {user.isVerified ? <ShieldCheck size={12} /> : <Shield size={12} />}
                                                            {user.isVerified ? 'Verified Pro' : 'Unverified'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-sm">
                                                <p className="font-bold text-main mb-0.5">{user.email}</p>
                                                <p className="text-[10px] font-medium text-muted">{user.phone || 'No Signal Path'}</p>
                                            </td>
                                            <td className="p-5 text-center">
                                                <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${user.isActive
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    : 'bg-page text-muted border-border-card'
                                                    }`}>
                                                    {user.isActive ? 'Active' : 'Dormant'}
                                                </span>
                                            </td>
                                            <td className="p-5 pr-8 text-right">
                                                <Button
                                                    variant={user.isActive ? "outline" : "primary"}
                                                    size="sm"
                                                    className="w-36 text-[10px] font-black uppercase tracking-widest"
                                                    isLoading={actionLoading === user.id}
                                                    onClick={() => handleToggleStatus(user.id, !!user.isActive)}
                                                    leftIcon={user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                                                >
                                                    {user.isActive ? 'Decommission' : 'Restore Access'}
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr key="empty">
                                        <td colSpan={5} className="p-20 text-center text-muted">
                                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                                <Monitor size={56} className="mx-auto mb-4 text-muted opacity-20" />
                                                <p className="font-black text-main mb-1 uppercase tracking-widest text-sm">Registry Void</p>
                                                <p className="text-xs font-medium">No entities matched the current query criteria.</p>
                                            </motion.div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination Matrix */}
                {totalPages > 1 && (
                    <div className="p-6 bg-page/50 border-t border-border-card flex items-center justify-between">
                        <div className="text-[10px] font-black text-muted uppercase tracking-widest">
                            Showing Page {page} of {totalPages} <span className="mx-2">•</span> {total} Total Records
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                leftIcon={<ChevronLeft size={16} />}
                                className="px-4"
                            >
                                <span className="sr-only">Previous Page</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                leftIcon={<ChevronRight size={16} />}
                                className="px-4"
                            >
                                <span className="sr-only">Next Page</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserList;
