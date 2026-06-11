import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Users,
    Activity,
    Phone,
    Plus,
    X,
    UserPlus,
    Mail,
    Lock,
    Stethoscope,
    User as UserIcon
} from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import Pagination from '../../components/ui/Pagination';
import { UserService } from '../../api/services/user.service';
import { AuthService } from '../../api/services/auth.service';
import type { Patient } from '../../types/user.types';

const PatientDirectory = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    console.log("patients", patients);
    // Add Patient Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [provisionError, setProvisionError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: 'male',
        city: '',
        address: '',
        bloodGroup: '',
        emergencyContact: '',
        password: Math.random().toString(36).slice(-10) + 'A1!'
    });

    const fetchPatients = async () => {
        setIsLoading(true);
        try {
            const { users, total } = await UserService.listUsers({
                role: 'patient',
                page: currentPage,
                limit: itemsPerPage
            });

            setPatients(users as Patient[]);
            setTotalUsers(total || users.length);
        } catch (error) {
            console.error('Failed to fetch patients:', error);
            setPatients([]);
            setTotalUsers(0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [currentPage, itemsPerPage]);

    const handleProvisionPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        setProvisionError(null);
        setIsProvisioning(true);
        try {
            await AuthService.register({
                ...formData,
                username: formData.email.split('@')[0],
                role: 'patient'
            });
            setIsAddModalOpen(false);
            fetchPatients();
            alert('Patient account provisioned successfully.');
        } catch (err: any) {
            setProvisionError(err.response?.data?.message || 'Failed to create patient account.');
        } finally {
            setIsProvisioning(false);
        }
    };

    const filteredPatients = patients.filter(p =>
        p.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(totalUsers / itemsPerPage) || 1;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const getRiskColor = (risk: string) => {
        switch (risk?.toLowerCase()) {
            case 'high': return 'text-error bg-error/10 border-error/20';
            case 'medium': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            default: return 'text-muted bg-page border-border-card';
        }
    };

    return (
        <div className="p-8 max-w-7xl  space-y-8 animate-fade-in pb-20">
            {/* Search and Filters */}
            <div className="flex justify-between items-center p-2">
                <div className="flex gap-4">
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        onClick={() => setIsAddModalOpen(true)}
                        className="rounded-2xl px-6 py-2 shadow-indigo-100 shadow-lg hover:shadow-indigo-200"
                    >
                        Add Patient
                    </Button>
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-80">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Search by name, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-card border border-border-card rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm text-main"
                        />
                    </div>
                </div>
            </div>

            {/* Table List */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Activity className="animate-spin text-indigo-600" size={40} />
                </div>
            ) : filteredPatients.length > 0 ? (
                <div className="bg-card rounded-[2.5rem] border border-border-card shadow-sm overflow-visible">
                    <div className="overflow-x-visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-page/50 border-b border-border-card">
                                    <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] first:rounded-tl-[2.5rem]">Patient</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Risk Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Contact</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Clinical markers</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">Status</th>
                                    <th className="px-4 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right last:rounded-tr-[2.5rem]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-card">
                                {filteredPatients.map((patient, index) => {
                                    const patientId = patient.id || patient._id || `patient-${index}`;

                                    return (
                                        <motion.tr
                                            key={patientId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="group transition-all cursor-pointer relative hover:bg-indigo-500/5 font-bold"
                                            onClick={() => navigate(`/patients/${patient.userId || patient.id || patient._id}?hexId=${patient._id || patient.id}`)}
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-sm border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                        {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-main leading-tight group-hover:text-indigo-500 transition-colors tracking-tight text-base">
                                                            {patient.firstName} {patient.lastName}
                                                        </p>
                                                        <p className="text-[11px] font-bold text-muted mt-1">{patient.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getRiskColor(patient.riskLevel || 'Low')}`}>
                                                    {patient.riskLevel || 'Low'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-semibold text-main">
                                                <div className="flex flex-col gap-1">
                                                    <span className="flex items-center gap-2 tracking-tight">
                                                        <Phone size={12} className="text-muted/30" /> {patient.phone || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="max-w-[200px]">
                                                    <p className="text-[11px] font-black text-muted uppercase tracking-wider truncate border-b border-transparent group-hover:border-indigo-500/20 transition-all inline-block">
                                                        {patient.diagnosis || 'Standard Observation'}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-muted/60 mt-1">Last Sync: {patient.lastSession ? new Date(patient.lastSession).toLocaleDateString() : 'Pending'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end">
                                                    <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${patient.isActive !== false
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-page text-muted border-border-card'
                                                        }`}>
                                                        {patient.isActive !== false ? 'Active' : 'Archived'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-right relative">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/patients/${patient.userId || patient.id || patient._id}/health?hexId=${patient._id || patient.id}`);
                                                        }}
                                                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm group/btn"
                                                        title="Clinical Record"
                                                    >
                                                        <Stethoscope size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/patients/${patient.userId || patient.id || patient._id}?hexId=${patient._id || patient.id}`);
                                                        }}
                                                        className="p-2 bg-page text-muted hover:bg-indigo-500 hover:text-white rounded-xl transition-all shadow-sm group/btn"
                                                        title="Patient Profile"
                                                    >
                                                        <UserIcon size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalUsers}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page)}
                        onItemsPerPageChange={(count) => {
                            setItemsPerPage(count);
                            setCurrentPage(1); // Reset to first page when limit changes
                        }}
                    />
                </div>
            ) : (
                <div className="text-center py-24 glass-card">
                    <div className="w-24 h-24 bg-page rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                        <Users size={40} className="text-muted/30" />
                    </div>
                    <h3 className="text-2xl font-black text-main mb-2">Clinical Archive Empty</h3>
                    <p className="text-muted font-medium tracking-tight">No patient profiles match the active filter criteria.</p>
                </div>
            )}

            {/* Add Patient Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute inset-0 bg-page/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-card rounded-[2.5rem] shadow-2xl border border-border-card overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 pb-4 flex justify-between items-start flex-shrink-0">
                                <div>
                                    <h2 className="text-2xl font-black text-main tracking-tight">Provision Profile</h2>
                                    <p className="text-muted text-[11px] font-black uppercase tracking-widest mt-1">New Clinical Identity</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-page rounded-xl transition-colors">
                                    <X size={20} className="text-muted" />
                                </button>
                            </div>

                            <form onSubmit={handleProvisionPatient} className="p-8 pt-4 space-y-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="First Name"
                                        placeholder="e.g. John"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                    />
                                    <InputField
                                        label="Last Name"
                                        placeholder="e.g. Doe"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                                <InputField
                                    label="Email Address"
                                    type="email"
                                    leftIcon={<Mail size={16} />}
                                    placeholder="patient@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                                <InputField
                                    label="Phone (SMS enabled)"
                                    leftIcon={<Phone size={16} />}
                                    placeholder="+1 555-000-0000"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Date of Birth"
                                        type="date"
                                        value={formData.dateOfBirth}
                                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        required
                                    />
                                     <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Gender</label>
                                        <div className="flex p-1 bg-page rounded-xl gap-1">
                                            {['male', 'female', 'other'].map((g) => (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, gender: g })}
                                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-all ${formData.gender === g ? 'bg-indigo-600 text-white shadow-md' : 'text-muted hover:text-main'}`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        label="Blood Group"
                                        placeholder="O+ve"
                                        value={formData.bloodGroup}
                                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                                    />
                                    <InputField
                                        label="Emergency Contact"
                                        placeholder="Mobile Number"
                                        value={formData.emergencyContact}
                                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                    />
                                </div>

                                <InputField
                                    label="City"
                                    placeholder="City name"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                                <InputField
                                    label="Detailed Address"
                                    placeholder="Full residential address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />

                                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Lock size={12} className="text-indigo-500" />
                                        <span className="text-[10px] font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">Auto-generated Security Token</span>
                                    </div>
                                    <code className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">{formData.password}</code>
                                </div>

                                {provisionError && (
                                    <div className="p-4 bg-error/10 border border-error/20 rounded-2xl text-error text-xs font-black uppercase tracking-tight">
                                        {provisionError}
                                    </div>
                                )}

                                <div className="pt-4">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-100"
                                        isLoading={isProvisioning}
                                        leftIcon={<UserPlus size={18} />}
                                    >
                                        Finalize Registration
                                    </Button>
                                    <p className="text-[9px] font-bold text-muted text-center mt-4 px-8 leading-relaxed uppercase tracking-tight">
                                        By provisioning this clinical identity, you confirm that you have obtained the necessary consent from the patient to process their health data.
                                    </p>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PatientDirectory;
