import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, User as UserIcon, Building, UserCheck, UserX, Activity, Monitor } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../api/client';
import type { User, UserRole } from '../../types/user.types';

const UserList = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('patient');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const tabs = [
        { id: 'patient', label: 'Patients', icon: <UserIcon size={16} /> },
        { id: 'practitioner', label: 'Clinical Staff', icon: <Activity size={16} /> },
        { id: 'hospital', label: 'Facilities', icon: <Building size={16} /> },
        { id: 'admin', label: 'Administrators', icon: <Shield size={16} /> }
    ];

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                // Determine API role filter mapping
                let roleQuery = activeTab;
                if (activeTab === 'practitioner') roleQuery = 'psychiatrist,psychologist,nurse,counselor,social_worker';
                if (activeTab === 'admin') roleQuery = 'admin,super_admin';

                const res = await api.get(`/users/list?role=${roleQuery}`);
                setUsers(Array.isArray(res.data.data) ? res.data.data : []);
            } catch (error) {
                console.error('Failed to fetch users:', error);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [activeTab]);

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        setActionLoading(userId);
        try {
            // await api.put(`/users/${userId}/toggle-status`);

            // Optimistic Update
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
        } catch (error) {
            console.error('Failed to toggle user status:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRoleBadge = (role: UserRole | string) => {
        switch (role) {
            case 'super_admin':
            case 'admin': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'hospital': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'patient': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Users</h1>
                    <p className="text-slate-500 font-medium mt-2">Manage all registered accounts across the platform.</p>
                </div>
            </header>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                <div className="flex p-1 bg-slate-100/80 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-80 shrink-0">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="card-premium overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="p-4 pl-6 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">User</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Role</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Contact</th>
                                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                                <th className="p-4 pr-6 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center">
                                            <Activity className="animate-spin text-indigo-600 mx-auto" size={32} />
                                        </td>
                                    </tr>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user, index) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-black text-sm border border-indigo-100">
                                                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 leading-tight block">
                                                            {user.firstName} {user.lastName}
                                                        </p>
                                                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">ID: {user.id.substring(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getRoleBadge(user.role)}`}>
                                                    {user.role?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-bold text-slate-700 mb-0.5">{user.email}</p>
                                                <p className="text-xs font-medium text-slate-500">{user.phone || 'No phone'}</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${user.isActive
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                                    }`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="p-4 pr-6 text-right">
                                                <Button
                                                    variant={user.isActive ? "outline" : "primary"}
                                                    size="sm"
                                                    className="w-32 text-xs"
                                                    isLoading={actionLoading === user.id}
                                                    onClick={() => handleToggleStatus(user.id, !!user.isActive)}
                                                    leftIcon={user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                                                >
                                                    {user.isActive ? 'Suspend' : 'Activate'}
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-16 text-center text-slate-500">
                                            <Monitor size={48} className="mx-auto mb-4 text-slate-300" />
                                            <p className="font-bold text-slate-900 mb-1">No users found</p>
                                            <p className="text-sm">Try adjusting your search criteria or switching tabs.</p>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserList;
