import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCheck, UserX, Search, Activity, Building, Clock, Filter, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { UserService } from '../../api/services/user.service';
import type { User } from '../../types/user.types';

const GatekeeperPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('verified');
    const [selectedRole, setSelectedRole] = useState<string>('all');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    const roles = [
        { value: 'all', label: 'All Professionals' },
        { value: 'psychiatrist', label: 'Psychiatrists' },
        { value: 'psychologist', label: 'Psychologists' },
        { value: 'nurse', label: 'Nurses' },
        { value: 'social_worker', label: 'Social Workers' },
        { value: 'counselor', label: 'Counselors' },
        { value: 'hospital', label: 'Hospitals' },
    ];

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const roleFilter = selectedRole === 'all' 
                ? 'psychiatrist,psychologist,nurse,counselor,social_worker,hospital' 
                : selectedRole;
            const isVerifiedCheck = activeTab === 'verified';
            
            const { users: fetchedUsers } = await UserService.listUsers({ 
                role: roleFilter,
                isVerified: isVerifiedCheck 
            });
            
            setUsers(fetchedUsers);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            setError('Failed to synchronize with the authentication gateway.');
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [activeTab, selectedRole]);

    const handleToggleVerification = async (userId: string, currentStatus: boolean, skipConfirm = false) => {
        // Require explicit confirmation for revoking access
        if (currentStatus && !skipConfirm) {
            setConfirmingId(userId);
            return;
        }

        setActionLoading(userId);
        setError(null);
        setSuccessMessage(null);
        setConfirmingId(null);

        try {
            const response = await UserService.toggleVerification(userId);
            
            // Extract display info for the success message
            const targetUser = users.find(u => u.id === userId);
            const userName = targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'Professional';
            
            setSuccessMessage(`Authorization successfully ${currentStatus ? 'revoked' : 'granted'} for ${userName}.`);
            
            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(null), 5000);

            // Optimistic update - remove from current list
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (err: any) {
            console.error('Verification toggle failed:', err);
            
            if (err.response?.status === 403) {
                setError('Insufficient Security Clearance: Strictly Super Admin access required.');
            } else if (err.response?.status === 401) {
                setError('Security Token Expired: Please re-authenticate.');
            } else {
                setError(err.response?.data?.message || 'Authorization protocol failure.');
            }
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         u.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-fade-in pb-24 relative">
            {/* Confirmation Overlay for Sensitive Actions */}
            <AnimatePresence>
                {confirmingId && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-page/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-card rounded-3xl p-10 max-w-md w-full shadow-2xl border border-border-card"
                        >
                            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-main text-center mb-4 uppercase tracking-tight">Revoke Clearance?</h3>
                            <p className="text-muted text-center mb-10 font-medium tracking-tight leading-relaxed">
                                You are about to officially revoke platform authorization for this professional. 
                                They will lose access to all clinical features immediately.
                            </p>
                            <div className="flex gap-4">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 font-black uppercase tracking-widest text-xs"
                                    onClick={() => setConfirmingId(null)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs border-none shadow-xl shadow-red-500/10"
                                    onClick={() => handleToggleVerification(confirmingId, true, true)}
                                >
                                    Confirm Revoke
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
                            <ShieldCheck size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-main tracking-tight">Gatekeeper Control</h1>
                    </div>
                    <p className="text-muted font-medium text-lg lg:max-w-2xl">
                        Official authorization hub for clinical professionals and medical facilities. 
                        Grant or revoke operational clearance on the platform.
                    </p>
                </div>
                
                <div className="flex p-1 bg-page/80 rounded-2xl shrink-0 border border-border-card backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'pending' ? 'bg-card text-indigo-600 shadow-sm border border-border-card' : 'text-muted hover:text-main'
                        }`}
                    >
                        Pending Baseline
                    </button>
                    <button
                        onClick={() => setActiveTab('verified')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'verified' ? 'bg-card text-indigo-600 shadow-sm border border-border-card' : 'text-muted hover:text-main'
                        }`}
                    >
                        Verified Registry
                    </button>
                </div>
            </header>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-4 text-error shadow-sm"
                    >
                        <AlertCircle size={20} />
                        <span className="text-sm font-bold tracking-tight">{error}</span>
                    </motion.div>
                )}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 text-emerald-500 shadow-lg shadow-emerald-500/10"
                    >
                        <UserCheck size={20} />
                        <span className="text-sm font-bold tracking-tight">{successMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative w-full md:w-80 shrink-0">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Find professionals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card border border-border-card rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm text-main"
                        />
                    </div>
                    
                    <div className="relative w-full md:w-60">
                        <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600" />
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full bg-card border border-border-card rounded-2xl py-3.5 pl-12 pr-10 text-xs font-black uppercase tracking-widest text-main focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            {roles.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest bg-page px-4 py-2 rounded-xl border border-border-card">
                    <Clock size={14} className="text-indigo-400" />
                    <span>Real-time Gateway Sync</span>
                </div>
            </div>

            <div className="card-premium overflow-hidden bg-card/50 backdrop-blur-sm border-border-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-page/50 border-b border-border-card">
                                <th className="p-5 pl-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Professional Profile</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Specialization</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Operational Status</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Clearance Status</th>
                                <th className="p-5 pr-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode='popLayout'>
                                {isLoading ? (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Activity className="animate-spin text-indigo-600" size={40} />
                                                <p className="text-xs font-black text-muted uppercase tracking-widest">Synchronizing Encrypted Data...</p>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ) : filteredUsers.length > 0 ? (
                                    filteredUsers.map((user, index) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-b border-border-card hover:bg-indigo-500/5 transition-colors group"
                                        >
                                            <td className="p-5 pl-8">
                                                <div className="flex items-center gap-5">
                                                    <div className="relative">
                                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-lg border-2 border-border-card shadow-md group-hover:scale-105 transition-transform">
                                                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                                        </div>
                                                        {activeTab === 'verified' && (
                                                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-card shadow-sm">
                                                                 <ShieldCheck size={12} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-main text-base leading-tight">
                                                            {user.firstName} {user.lastName}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-muted mt-1 uppercase tracking-widest flex items-center gap-2">
                                                            <Clock size={10} /> Registered: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Baseline'}
                                                        </p>
                                                        {user.id && <span className="text-[9px] font-mono text-muted opacity-0 group-hover:opacity-100 transition-opacity">ID: {user.id.substring(0, 8)}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border w-fit ${
                                                    user.role === 'hospital' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                                                }`}>
                                                    {user.role === 'hospital' ? <Building size={10} /> : <Activity size={10} />}
                                                    {user.role?.replace('_', ' ')}
                                                </span>
                                            </td>
                                             <td className="p-5">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                                                    user.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-page text-muted border-border-card'
                                                }`}>
                                                    {user.isActive ? 'Active' : 'Dormant'}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                {activeTab === 'verified' ? (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-emerald-500">
                                                            <ShieldCheck size={14} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Active Clearance</span>
                                                        </div>
                                                        {(user as any).verifiedAt && (
                                                            <span className="text-[9px] font-bold text-muted italic pl-5">
                                                                Granted: {new Date((user as any).verifiedAt).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-orange-500">
                                                        <Clock size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Authorization</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-5 pr-8 text-right">
                                                <Button
                                                    variant={activeTab === 'verified' ? "outline" : "primary"}
                                                    size="sm"
                                                    className={`min-w-44 text-[10px] font-black uppercase tracking-widest ${
                                                        activeTab === 'verified' ? 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20' : ''
                                                    }`}
                                                    isLoading={actionLoading === user.id}
                                                    onClick={() => handleToggleVerification(user.id, activeTab === 'verified')}
                                                    leftIcon={activeTab === 'verified' ? <UserX size={14} /> : <UserCheck size={14} />}
                                                >
                                                    {activeTab === 'pending' ? 'Grant Platform Access' : 'Revoke Authorization'}
                                                </Button>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <motion.tr
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <td colSpan={4} className="p-24 text-center text-muted">
                                            <div className="max-w-xs mx-auto">
                                                <ShieldCheck size={64} className="mx-auto mb-6 text-muted opacity-20" strokeWidth={1} />
                                                <h3 className="font-black text-main text-lg mb-2 uppercase tracking-tight">Access Log Clear</h3>
                                                <p className="text-sm font-medium text-muted mb-8 leading-relaxed">
                                                    {activeTab === 'pending' 
                                                        ? "Your verification queue is empty. All professionals have been processed."
                                                        : "No verified professionals found in the primary registry."}
                                                </p>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={fetchUsers}
                                                    leftIcon={<Activity size={14} />}
                                                    className="w-full"
                                                >
                                                    Refresh Gateway
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <footer className="flex items-center justify-between pt-8 border-t border-border-card">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Live Authorization Gateway Status: Operational</p>
                </div>
                <p className="text-[10px] font-black text-muted/40 uppercase tracking-[0.5em]">System Clearance Level: Super Admin Only</p>
            </footer>
        </div>
    );
};

export default GatekeeperPage;
