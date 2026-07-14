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
    AlertCircle,
    Send,
    X,
    Bell,
    Plus,
    Edit3,
    Trash2,
    Eye,
    Mail,
    Phone,
    Lock,
    CheckCircle2,
    UserPlus,
    MoreVertical,
    RefreshCw,
    Download,
    Filter
} from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { UserService } from '../../api/services/user.service';
import { NotificationService } from '../../api/services/notification.service';
import type { User, UserRole } from '../../types/user.types';
import type { RootState } from '../../store';

type ModalType = 'create' | 'edit' | 'delete' | 'view' | 'notify' | null;

const UserList = () => {
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('patient');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // Modal state
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    
    // Create/Edit form
    const [formData, setFormData] = useState({
        role: 'patient' as UserRole,
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        gender: '',
        dateOfBirth: '',
        address: '',
        specialization: '',
        about: '',
        experienceYears: '',
        consultationFee: '',
        qualifications: '',
        languages: '',
        skills: '',
        emergencyContact: '',
        bloodGroup: '',
        hospitalId: '',
        professionalId: '',
        reportingTo: '',
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    
    // Notification form
    const [notifForm, setNotifForm] = useState({ title: '', message: '' });
    const [notifLoading, setNotifLoading] = useState(false);

    // Dropdown menu
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

    const allRoles: { id: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
        { id: 'patient', label: 'Patient', icon: <UserIcon size={16} />, desc: 'Standard platform access' },
        { id: 'psychiatrist', label: 'Psychiatrist', icon: <Activity size={16} />, desc: 'Full clinical privileges' },
        { id: 'psychologist', label: 'Psychologist', icon: <Activity size={16} />, desc: 'Therapy & Assessment' },
        { id: 'nurse', label: 'Nurse', icon: <Activity size={16} />, desc: 'Clinical support' },
        { id: 'counselor', label: 'Counselor', icon: <Activity size={16} />, desc: 'Counseling services' },
        { id: 'social_worker', label: 'Social Worker', icon: <Activity size={16} />, desc: 'Social services' },
        { id: 'hospital', label: 'Facility', icon: <Building size={16} />, desc: 'Manage practitioners' },
        { id: 'admin', label: 'Admin', icon: <Shield size={16} />, desc: 'System management' },
        { id: 'super_admin', label: 'Super Admin', icon: <ShieldCheck size={16} />, desc: 'Full system control' },
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
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    // Auto-dismiss success messages
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Close menu when clicking outside
    useEffect(() => {
        const handler = () => setOpenMenuId(null);
        if (openMenuId) window.addEventListener('click', handler);
        return () => window.removeEventListener('click', handler);
    }, [openMenuId]);

    const resetForm = () => {
        setFormData({
            role: 'patient',
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            gender: '',
            dateOfBirth: '',
            address: '',
            specialization: '',
            about: '',
            experienceYears: '',
            consultationFee: '',
            qualifications: '',
            languages: '',
            skills: '',
            emergencyContact: '',
            bloodGroup: '',
            hospitalId: '',
            professionalId: '',
            reportingTo: '',
        });
        setFormError(null);
    };

    const openCreateModal = () => {
        resetForm();
        setActiveModal('create');
    };

    const openEditModal = (user: User) => {
        setSelectedUser(user);
        setFormData({
            role: user.role,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            username: user.username || '',
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            confirmPassword: '',
            gender: user.gender || '',
            dateOfBirth: user.dateOfBirth || user.dob || '',
            address: user.address || '',
            specialization: user.specialization || '',
            about: user.about || '',
            experienceYears: user.experienceYears ? String(user.experienceYears) : '',
            consultationFee: user.consultationFee ? String(user.consultationFee) : '',
            qualifications: user.qualifications || '',
            languages: user.languages ? user.languages.join(', ') : '',
            skills: user.skills ? user.skills.join(', ') : '',
            emergencyContact: user.emergencyContact || '',
            bloodGroup: user.bloodGroup || '',
            hospitalId: '',
            professionalId: '',
            reportingTo: '',
        });
        setFormError(null);
        setActiveModal('edit');
        setOpenMenuId(null);
    };

    const openViewModal = (user: User) => {
        setSelectedUser(user);
        setActiveModal('view');
        setOpenMenuId(null);
    };

    const openDeleteModal = (user: User) => {
        setSelectedUser(user);
        setActiveModal('delete');
        setOpenMenuId(null);
    };

    const openNotifyModal = (user: User) => {
        setSelectedUser(user);
        setNotifForm({ title: '', message: '' });
        setActiveModal('notify');
        setOpenMenuId(null);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedUser(null);
        resetForm();
    };

    const isProfessionalRole = (role: string) => ['psychiatrist', 'psychologist', 'nurse', 'counselor', 'social_worker'].includes(role);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match.');
            return;
        }
        if (formData.password.length < 8) {
            setFormError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.');
            return;
        }

        setFormLoading(true);
        try {
            const payload: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.username || formData.email.split('@')[0],
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                isActive: true,
            };

            // Common optional fields
            if (formData.gender) payload.gender = formData.gender;
            if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
            if (formData.address) payload.address = formData.address;
            if (formData.reportingTo) payload.reportingTo = Number(formData.reportingTo);

            // Professional-specific fields
            if (isProfessionalRole(formData.role)) {
                if (formData.specialization) payload.specialization = formData.specialization;
                if (formData.about) payload.about = formData.about;
                if (formData.experienceYears) payload.experienceYears = Number(formData.experienceYears);
                if (formData.consultationFee) payload.consultationFee = Number(formData.consultationFee);
                if (formData.qualifications) payload.qualifications = formData.qualifications.split(',').map((q: string) => q.trim()).filter(Boolean);
                if (formData.languages) payload.languages = formData.languages.split(',').map((l: string) => l.trim()).filter(Boolean);
                if (formData.skills) payload.skills = formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
                if (formData.hospitalId) payload.hospitalId = Number(formData.hospitalId);
            }

            // Patient-specific fields
            if (formData.role === 'patient') {
                if (formData.emergencyContact) payload.emergencyContact = formData.emergencyContact;
                if (formData.bloodGroup) payload.bloodGroup = formData.bloodGroup;
                if (formData.hospitalId) payload.hospitalId = Number(formData.hospitalId);
                if (formData.professionalId) payload.professionalId = Number(formData.professionalId);
            }

            // Hospital-specific
            if (formData.role === 'hospital') {
                if (formData.address) payload.address = formData.address;
            }

            await UserService.createUserByRole(formData.role, payload);

            setSuccessMessage(`User "${formData.firstName} ${formData.lastName}" created successfully as ${formData.role.replace('_', ' ')}.`);
            closeModal();
            fetchUsers();
        } catch (err: any) {
            setFormError(err?.response?.data?.message || 'Failed to create user.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setFormError(null);

        setFormLoading(true);
        try {
            const updatePayload: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                role: formData.role,
            };

            if (formData.gender) updatePayload.gender = formData.gender;
            if (formData.dateOfBirth) updatePayload.dateOfBirth = formData.dateOfBirth;
            if (formData.address) updatePayload.address = formData.address;

            if (isProfessionalRole(formData.role)) {
                if (formData.specialization) updatePayload.specialization = formData.specialization;
                if (formData.about) updatePayload.about = formData.about;
                if (formData.experienceYears) updatePayload.experienceYears = Number(formData.experienceYears);
                if (formData.consultationFee) updatePayload.consultationFee = Number(formData.consultationFee);
                if (formData.qualifications) updatePayload.qualifications = formData.qualifications.split(',').map((q: string) => q.trim()).filter(Boolean);
                if (formData.languages) updatePayload.languages = formData.languages.split(',').map((l: string) => l.trim()).filter(Boolean);
                if (formData.skills) updatePayload.skills = formData.skills.split(',').map((s: string) => s.trim()).filter(Boolean);
            }

            if (formData.role === 'patient') {
                if (formData.emergencyContact) updatePayload.emergencyContact = formData.emergencyContact;
                if (formData.bloodGroup) updatePayload.bloodGroup = formData.bloodGroup;
            }

            await UserService.updateUserById(selectedUser.id, updatePayload);

            setSuccessMessage(`User "${formData.firstName} ${formData.lastName}" updated successfully.`);
            closeModal();
            fetchUsers();
        } catch (err: any) {
            setFormError(err?.response?.data?.message || 'Failed to update user.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        setFormLoading(true);
        try {
            await UserService.toggleUserStatus(selectedUser.id);
            setSuccessMessage(`User "${selectedUser.firstName} ${selectedUser.lastName}" has been deactivated.`);
            closeModal();
            fetchUsers();
        } catch (err: any) {
            setFormError(err?.response?.data?.message || 'Failed to deactivate user.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        setActionLoading(userId);
        try {
            await UserService.toggleUserStatus(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
            setSuccessMessage(`User status ${currentStatus ? 'deactivated' : 'activated'} successfully.`);
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
            setSuccessMessage(`User ${currentVerified ? 'unverified' : 'verified'} successfully.`);
        } catch (err: any) {
            console.error('Failed to toggle verification:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSendNotification = async () => {
        if (!selectedUser || !notifForm.title || !notifForm.message) return;
        setNotifLoading(true);
        try {
            await NotificationService.sendTargetedNotification({
                userId: selectedUser.id,
                title: notifForm.title,
                message: notifForm.message,
                type: 'direct'
            });
            setSuccessMessage(`Notification sent to ${selectedUser.firstName}.`);
            closeModal();
        } catch (error) {
            console.error('Failed to send notification:', error);
        } finally {
            setNotifLoading(false);
        }
    };

    const getRoleBadge = (roleValue: UserRole | string) => {
        switch (roleValue) {
            case 'super_admin':
            case 'admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'hospital': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'patient': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            default: return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="p-8 max-w-7xl space-y-8 animate-fade-in pb-24">
            {/* Success Toast */}
            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-6 right-6 z-[200] flex items-center gap-3 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-500/30 border border-emerald-400/30"
                    >
                        <CheckCircle2 size={18} />
                        <span className="text-sm font-bold">{successMessage}</span>
                        <button onClick={() => setSuccessMessage(null)} className="ml-2 p-1 hover:bg-white/20 rounded-lg transition-colors">
                            <X size={14} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-main tracking-tight">User Management</h1>
                    <p className="text-muted font-medium mt-2">Complete control over all registered accounts across the platform.</p>
                </div>
                <div className="flex items-center gap-3">
                    {error && (
                        <div className="flex items-center gap-2 text-error bg-error/10 px-4 py-2 rounded-xl border border-error/20 text-xs font-bold shadow-sm">
                            <AlertCircle size={14} />
                            {error}
                        </div>
                    )}
                    <Button variant="outline" size="sm" onClick={fetchUsers} leftIcon={<RefreshCw size={14} />}>
                        Refresh
                    </Button>
                    <Button variant="primary" onClick={openCreateModal} leftIcon={<UserPlus size={18} />}>
                        Create User
                    </Button>
                </div>
            </header>

            {/* Tabs + Search */}
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                <div className="flex p-1 bg-page/80 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar shadow-inner border border-border-card">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setPage(1);
                            }}
                            className={`flex items-center gap-2 whitespace-nowrap px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-card text-main shadow-sm border border-border-card' : 'text-muted hover:text-main'
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
                        className="w-full bg-card border border-border-card rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm text-main"
                    />
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-premium p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <UserIcon size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Total Users</p>
                        <p className="text-xl font-black text-main">{total}</p>
                    </div>
                </div>
                <div className="card-premium p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <UserCheck size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Active</p>
                        <p className="text-xl font-black text-main">{users.filter(u => u.isActive).length}</p>
                    </div>
                </div>
                <div className="card-premium p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <UserX size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Inactive</p>
                        <p className="text-xl font-black text-main">{users.filter(u => !u.isActive).length}</p>
                    </div>
                </div>
                <div className="card-premium p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Verified</p>
                        <p className="text-xl font-black text-main">{users.filter(u => u.isVerified).length}</p>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card-premium overflow-hidden border-border-card shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-page/50 border-b border-border-card">
                                <th className="p-5 pl-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">User Identity</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Role</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap">Contact</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap text-center">Status</th>
                                <th className="p-5 pr-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] whitespace-nowrap text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.tr key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Activity className="animate-spin text-muted" size={32} />
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
                                                        <span className="text-[10px] font-mono text-muted block mt-1">ID: {user.id ? user.id.substring(0, 8) : 'Pending'}</span>
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
                                                            {user.isVerified ? 'Verified' : 'Unverified'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-5 text-sm">
                                                <p className="font-bold text-main mb-0.5">{user.email}</p>
                                                <p className="text-[10px] font-medium text-muted">{user.phone || 'No phone'}</p>
                                            </td>
                                            <td className="p-5 text-center">
                                                {(() => {
                                                    const s = (user.isActive ? 'active' : 'inactive');
                                                    const styles: Record<string, string> = {
                                                        active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                                                        inactive: 'bg-page text-muted border-border-card'
                                                    };
                                                    return (
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${styles[s]}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-muted'}`} />
                                                            {s}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="p-5 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openViewModal(user)}
                                                        className="p-2 rounded-xl text-muted hover:text-main hover:bg-page transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 rounded-xl text-muted hover:text-main hover:bg-page transition-all"
                                                        title="Edit User"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openNotifyModal(user)}
                                                        className="p-2 rounded-xl text-muted hover:text-main hover:bg-page transition-all"
                                                        title="Send Notification"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(openMenuId === user.id ? null : user.id);
                                                            }}
                                                            className="p-2 rounded-xl text-muted hover:text-main hover:bg-page transition-all"
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        <AnimatePresence>
                                                            {openMenuId === user.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                                                    className="absolute right-0 top-full mt-2 w-52 bg-card border border-border-card rounded-2xl shadow-2xl z-50 py-2 overflow-hidden"
                                                                >
                                                                    <button
                                                                        onClick={() => handleToggleStatus(user.id, !!user.isActive)}
                                                                        className="w-full text-left px-4 py-3 text-sm font-bold text-main hover:bg-page flex items-center gap-3 transition-colors"
                                                                    >
                                                                        {user.isActive ? <UserX size={14} className="text-amber-500" /> : <UserCheck size={14} className="text-emerald-500" />}
                                                                        {user.isActive ? 'Deactivate' : 'Activate'}
                                                                    </button>
                                                                    {isSuperAdmin && user.role !== 'patient' && (
                                                                        <button
                                                                            onClick={() => handleToggleVerification(user.id, !!user.isVerified)}
                                                                            className="w-full text-left px-4 py-3 text-sm font-bold text-main hover:bg-page flex items-center gap-3 transition-colors"
                                                                        >
                                                                            <ShieldCheck size={14} className="text-purple-500" />
                                                                            {user.isVerified ? 'Remove Verification' : 'Verify'}
                                                                        </button>
                                                                    )}
                                                                    <div className="border-t border-border-card my-1" />
                                                                    <button
                                                                        onClick={() => openDeleteModal(user)}
                                                                        className="w-full text-left px-4 py-3 text-sm font-bold text-error hover:bg-error/5 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                        Deactivate Account
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr key="empty">
                                        <td colSpan={5} className="p-20 text-center text-muted">
                                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                                <Monitor size={56} className="mx-auto mb-4 text-muted opacity-20" />
                                                <p className="font-black text-main mb-1 uppercase tracking-widest text-sm">No Users Found</p>
                                                <p className="text-xs font-medium">No entities matched the current query criteria.</p>
                                            </motion.div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-6 bg-page/50 border-t border-border-card flex items-center justify-between">
                        <div className="text-[10px] font-black text-muted uppercase tracking-widest">
                            Page {page} of {totalPages} <span className="mx-2">•</span> {total} Total Records
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
                                <span className="sr-only">Previous</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                                leftIcon={<ChevronRight size={16} />}
                                className="px-4"
                            >
                                <span className="sr-only">Next</span>
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== MODALS ===== */}
            <AnimatePresence>
                {activeModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-page/80 backdrop-blur-md" onClick={closeModal}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`bg-card border border-border-card rounded-[2.5rem] w-full shadow-2xl overflow-hidden relative ${
                                activeModal === 'view' ? 'max-w-lg p-8' :
                                activeModal === 'delete' ? 'max-w-md p-8' :
                                activeModal === 'notify' ? 'max-w-md p-8' :
                                'max-w-2xl p-8 max-h-[90vh] overflow-y-auto'
                            }`}
                        >
                            {/* Close Button */}
                            <button onClick={closeModal} className="absolute top-6 right-6 p-2 text-muted hover:text-main hover:bg-page rounded-xl transition-all z-10">
                                <X size={20} />
                            </button>

                            {/* ── CREATE USER MODAL ── */}
                            {activeModal === 'create' && (
                                <form onSubmit={handleCreateUser} className="space-y-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                                            <UserPlus size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-main">Create New User</h2>
                                            <p className="text-xs font-bold text-muted uppercase tracking-widest">Provision a new account</p>
                                        </div>
                                    </div>

                                    {/* Role Selector */}
                                    <div>
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 block">Account Role</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {allRoles.map(role => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, role: role.id })}
                                                    className={`p-3 text-left border-2 rounded-xl transition-all text-xs font-bold ${
                                                        formData.role === role.id
                                                            ? 'border-indigo-500 bg-indigo-500/10 text-main'
                                                            : 'border-border-card bg-card text-muted hover:border-border-card hover:bg-page'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {role.icon}
                                                        <span className="truncate">{role.label}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Personal Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="First Name" name="firstName" placeholder="e.g. Sarah" value={formData.firstName} onChange={handleFormChange} required />
                                        <InputField label="Last Name" name="lastName" placeholder="e.g. Mitchell" value={formData.lastName} onChange={handleFormChange} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Username" name="username" placeholder="e.g. sarah_mitchell" value={formData.username} onChange={handleFormChange} required helperText="Unique login username" />
                                        <InputField label="Email Address" name="email" type="email" placeholder="user@example.com" leftIcon={<Mail size={16} />} value={formData.email} onChange={handleFormChange} required />
                                    </div>
                                    <InputField label="Phone Number" name="phone" placeholder="+1234567890" leftIcon={<Phone size={16} />} value={formData.phone} onChange={handleFormChange} required />
                                    
                                    {/* Common Optional */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Gender</label>
                                            <select name="gender" value={formData.gender} onChange={handleFormChange} className="w-full bg-page border border-border-card rounded-2xl p-4 text-sm font-bold outline-none transition-all text-main focus:ring-2 focus:ring-indigo-500/50">
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <InputField label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleFormChange} />
                                    </div>
                                    <InputField label="Address" name="address" placeholder="e.g. 123 Main St, City" value={formData.address} onChange={handleFormChange} />

                                    {/* ── Admin/Hospital: Reporting To ── */}
                                    {['admin', 'hospital'].includes(formData.role) && (
                                        <InputField label="Reporting To (User ID)" name="reportingTo" type="number" placeholder="e.g. 1 (supervisor userId)" value={formData.reportingTo} onChange={handleFormChange} helperText="Optional: userId of the managing admin/super_admin" />
                                    )}

                                    {/* ── Professional-specific fields ── */}
                                    {isProfessionalRole(formData.role) && (
                                        <div className="space-y-4 p-5 bg-page/50 rounded-2xl border border-border-card">
                                            <p className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2"><Activity size={14} /> Professional Details</p>
                                            <InputField label="Specialization" name="specialization" placeholder="e.g. Clinical Psychology" value={formData.specialization} onChange={handleFormChange} />
                                            <div>
                                                <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">About / Bio</label>
                                                <textarea name="about" rows={3} value={formData.about} onChange={handleFormChange} placeholder="Professional background and expertise..." className="w-full bg-page border border-border-card rounded-2xl p-4 text-sm font-bold outline-none transition-all resize-none text-main focus:ring-2 focus:ring-indigo-500/50" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField label="Experience (Years)" name="experienceYears" type="number" placeholder="e.g. 15" value={formData.experienceYears} onChange={handleFormChange} />
                                                <InputField label="Consultation Fee" name="consultationFee" type="number" placeholder="e.g. 150.00" value={formData.consultationFee} onChange={handleFormChange} />
                                            </div>
                                            <InputField label="Qualifications" name="qualifications" placeholder="PhD in Psychology, MSc in Therapy (comma-separated)" value={formData.qualifications} onChange={handleFormChange} helperText="Comma-separated list" />
                                            <InputField label="Languages" name="languages" placeholder="English, Spanish (comma-separated)" value={formData.languages} onChange={handleFormChange} helperText="Comma-separated list" />
                                            <InputField label="Skills" name="skills" placeholder="CBT, Trauma Therapy (comma-separated)" value={formData.skills} onChange={handleFormChange} helperText="Comma-separated list" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField label="Hospital ID" name="hospitalId" type="number" placeholder="e.g. 5" value={formData.hospitalId} onChange={handleFormChange} helperText="Optional: userId of hospital" />
                                                <InputField label="Reporting To (User ID)" name="reportingTo" type="number" placeholder="e.g. 2" value={formData.reportingTo} onChange={handleFormChange} helperText="Optional: supervisor userId" />
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Patient-specific fields ── */}
                                    {formData.role === 'patient' && (
                                        <div className="space-y-4 p-5 bg-page/50 rounded-2xl border border-border-card">
                                            <p className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2"><UserIcon size={14} /> Patient Details</p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField label="Emergency Contact" name="emergencyContact" placeholder="+1999888777" leftIcon={<Phone size={16} />} value={formData.emergencyContact} onChange={handleFormChange} />
                                                <div>
                                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Blood Group</label>
                                                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleFormChange} className="w-full bg-page border border-border-card rounded-2xl p-4 text-sm font-bold outline-none transition-all text-main focus:ring-2 focus:ring-indigo-500/50">
                                                        <option value="">Select Blood Group</option>
                                                        <option value="A+">A+</option>
                                                        <option value="A-">A-</option>
                                                        <option value="B+">B+</option>
                                                        <option value="B-">B-</option>
                                                        <option value="O+">O+</option>
                                                        <option value="O-">O-</option>
                                                        <option value="AB+">AB+</option>
                                                        <option value="AB-">AB-</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField label="Hospital ID" name="hospitalId" type="number" placeholder="e.g. 5" value={formData.hospitalId} onChange={handleFormChange} helperText="Optional: userId of hospital" />
                                                <InputField label="Professional ID" name="professionalId" type="number" placeholder="e.g. 10" value={formData.professionalId} onChange={handleFormChange} helperText="Optional: treating professional userId" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Password */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Password" name="password" type="password" placeholder="••••••••" leftIcon={<Lock size={16} />} value={formData.password} onChange={handleFormChange} required helperText="Min 8 chars, 1 upper, 1 lower, 1 number, 1 special" />
                                        <InputField label="Confirm Password" name="confirmPassword" type="password" placeholder="••••••••" leftIcon={<Lock size={16} />} value={formData.confirmPassword} onChange={handleFormChange} required />
                                    </div>

                                    {formError && (
                                        <div className="bg-error/10 text-error p-4 rounded-xl border border-error/20 text-sm font-bold flex items-center gap-3">
                                            <AlertCircle size={16} /> {formError}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
                                        <Button variant="primary" type="submit" isLoading={formLoading} leftIcon={<UserPlus size={16} />}>
                                            Create Account
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {/* ── EDIT USER MODAL ── */}
                            {activeModal === 'edit' && selectedUser && (
                                <form onSubmit={handleUpdateUser} className="space-y-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
                                            <Edit3 size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-main">Edit User</h2>
                                            <p className="text-xs font-bold text-muted uppercase tracking-widest">{selectedUser.firstName} {selectedUser.lastName}</p>
                                        </div>
                                    </div>

                                    {/* Role Selector */}
                                    {isSuperAdmin && (
                                        <div>
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-3 block">Account Role</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {allRoles.map(role => (
                                                    <button
                                                        key={role.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, role: role.id })}
                                                        className={`p-3 text-left border-2 rounded-xl transition-all text-xs font-bold ${
                                                            formData.role === role.id
                                                                ? 'border-indigo-500 bg-indigo-500/10 text-main'
                                                                : 'border-border-card bg-card text-muted hover:border-border-card hover:bg-page'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {role.icon}
                                                            <span className="truncate">{role.label}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="First Name" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleFormChange} required />
                                        <InputField label="Last Name" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleFormChange} required />
                                    </div>
                                    <InputField label="Email Address" name="email" type="email" placeholder="user@example.com" leftIcon={<Mail size={16} />} value={formData.email} onChange={handleFormChange} required />
                                    <InputField label="Phone Number" name="phone" placeholder="+1 (555) 000-0000" leftIcon={<Phone size={16} />} value={formData.phone} onChange={handleFormChange} />

                                    <div>
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Gender</label>
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleFormChange}
                                            className="w-full bg-page border border-border-card rounded-2xl p-4 text-sm font-bold outline-none transition-all text-main focus:ring-2 focus:ring-indigo-500/50"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    {['psychiatrist', 'psychologist', 'nurse', 'counselor', 'social_worker'].includes(formData.role) && (
                                        <InputField label="Specialization" name="specialization" placeholder="e.g. Cognitive Behavioral Therapy" value={formData.specialization} onChange={handleFormChange} />
                                    )}

                                    <div>
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">About</label>
                                        <textarea
                                            name="about"
                                            rows={3}
                                            value={formData.about}
                                            onChange={handleFormChange}
                                            placeholder="Brief description..."
                                            className="w-full bg-page border border-border-card rounded-2xl p-4 text-sm font-bold outline-none transition-all resize-none text-main focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>

                                    {formError && (
                                        <div className="bg-error/10 text-error p-4 rounded-xl border border-error/20 text-sm font-bold flex items-center gap-3">
                                            <AlertCircle size={16} /> {formError}
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
                                        <Button variant="primary" type="submit" isLoading={formLoading} leftIcon={<CheckCircle2 size={16} />}>
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            )}

                            {/* ── VIEW USER MODAL ── */}
                            {activeModal === 'view' && selectedUser && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center font-black text-xl border-2 border-card">
                                            {selectedUser.firstName?.charAt(0)}{selectedUser.lastName?.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-main">{selectedUser.firstName} {selectedUser.lastName}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getRoleBadge(selectedUser.role)}`}>
                                                    {selectedUser.role?.replace('_', ' ')}
                                                </span>
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                    selectedUser.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-page text-muted border-border-card'
                                                }`}>
                                                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-page rounded-2xl p-5 border border-border-card">
                                        <div className="flex items-center gap-3">
                                            <Mail size={16} className="text-muted shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Email</p>
                                                <p className="text-sm font-bold text-main">{selectedUser.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={16} className="text-muted shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Phone</p>
                                                <p className="text-sm font-bold text-main">{selectedUser.phone || 'Not provided'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <UserIcon size={16} className="text-muted shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Gender</p>
                                                <p className="text-sm font-bold text-main capitalize">{selectedUser.gender || 'Not specified'}</p>
                                            </div>
                                        </div>
                                        {selectedUser.specialization && (
                                            <div className="flex items-center gap-3">
                                                <Activity size={16} className="text-muted shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Specialization</p>
                                                    <p className="text-sm font-bold text-main">{selectedUser.specialization}</p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedUser.createdAt && (
                                            <div className="flex items-center gap-3">
                                                <Shield size={16} className="text-muted shrink-0" />
                                                <div>
                                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Created</p>
                                                    <p className="text-sm font-bold text-main">{new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck size={16} className="text-muted shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Verification</p>
                                                <p className={`text-sm font-bold ${selectedUser.isVerified ? 'text-emerald-500' : 'text-muted'}`}>
                                                    {selectedUser.isVerified ? 'Verified' : 'Not Verified'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button variant="outline" className="flex-1" onClick={() => { closeModal(); openEditModal(selectedUser); }} leftIcon={<Edit3 size={14} />}>
                                            Edit
                                        </Button>
                                        <Button variant="outline" className="flex-1" onClick={() => { closeModal(); openNotifyModal(selectedUser); }} leftIcon={<Send size={14} />}>
                                            Notify
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── DELETE / DEACTIVATE MODAL ── */}
                            {activeModal === 'delete' && selectedUser && (
                                <div className="space-y-6 text-center">
                                    <div className="w-20 h-20 bg-error/10 rounded-[2rem] flex items-center justify-center mx-auto">
                                        <Trash2 size={36} className="text-error" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-main mb-2">Deactivate Account</h2>
                                        <p className="text-sm text-muted font-medium">
                                            Are you sure you want to deactivate <span className="font-bold text-main">{selectedUser.firstName} {selectedUser.lastName}</span>? 
                                            This will revoke their platform access.
                                        </p>
                                    </div>

                                    {formError && (
                                        <div className="bg-error/10 text-error p-4 rounded-xl border border-error/20 text-sm font-bold flex items-center gap-3">
                                            <AlertCircle size={16} /> {formError}
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
                                        <Button variant="danger" className="flex-1" onClick={handleDeleteUser} isLoading={formLoading} leftIcon={<Trash2 size={16} />}>
                                            Deactivate
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── NOTIFY MODAL ── */}
                            {activeModal === 'notify' && selectedUser && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                                            <Bell size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-main">Send Notification</h2>
                                            <p className="text-sm font-bold text-muted uppercase tracking-widest">{selectedUser.firstName} {selectedUser.lastName}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Title</label>
                                        <input 
                                            type="text" 
                                            value={notifForm.title} 
                                            onChange={(e) => setNotifForm({...notifForm, title: e.target.value})} 
                                            placeholder="e.g. Health Review Ready" 
                                            className="w-full bg-page border border-border-card rounded-2xl p-4 text-sm font-bold outline-none transition-all text-main focus:ring-2 focus:ring-indigo-500/50" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-2 block">Message</label>
                                        <textarea 
                                            rows={4} 
                                            value={notifForm.message} 
                                            onChange={(e) => setNotifForm({...notifForm, message: e.target.value})} 
                                            placeholder="Enter notification details..." 
                                            className="w-full bg-page border border-border-card rounded-2xl p-4 text-sm font-bold outline-none transition-all resize-none text-main focus:ring-2 focus:ring-indigo-500/50" 
                                        />
                                    </div>
                                    <Button 
                                        className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs" 
                                        size="lg" 
                                        onClick={handleSendNotification} 
                                        isLoading={notifLoading} 
                                        disabled={!notifForm.title || !notifForm.message} 
                                        leftIcon={<Send size={18} />}
                                    >
                                        Send Notification
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserList;
