import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Activity,
    CheckCircle,
    AlertCircle,
    Save,
    Droplets
} from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { UserService } from '../../api/services/user.service';
import type { Patient } from '../../types/user.types';

const HospitalEditPatient = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const [searchParams] = useSearchParams();
    const hexId = searchParams.get('hexId');
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        diagnosis: '',
        riskLevel: 'low',
    });

    // Fetch existing patient data
    useEffect(() => {
        const fetchPatient = async () => {
            setIsLoading(true);
            try {
                // Try hexId first, then patientId
                const targetId = hexId || patientId || '';
                let patient: Patient | null = null;

                try {
                    patient = await UserService.getUserById(targetId) as Patient;
                } catch {
                    // Fallback: try the other ID
                    if (hexId && patientId && hexId !== patientId) {
                        patient = await UserService.getUserById(patientId) as Patient;
                    }
                }

                if (patient) {
                    setFormData({
                        firstName: patient.firstName || '',
                        lastName: patient.lastName || '',
                        email: patient.email || '',
                        phone: patient.phone || '',
                        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : (patient.dob ? String(patient.dob).split('T')[0] : ''),
                        gender: patient.gender || 'male',
                        city: patient.city || '',
                        address: patient.address || '',
                        bloodGroup: patient.bloodGroup || '',
                        emergencyContact: patient.emergencyContact || '',
                        diagnosis: patient.diagnosis || '',
                        riskLevel: patient.riskLevel || 'low',
                    });
                }
            } catch (err) {
                console.error('[HospitalEditPatient] Failed to load patient:', err);
                setError('Failed to load patient data.');
            } finally {
                setIsLoading(false);
            }
        };

        if (patientId) fetchPatient();
    }, [patientId, hexId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const targetId = hexId || patientId || '';
            await UserService.updateUserById(targetId, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                city: formData.city,
                address: formData.address,
                bloodGroup: formData.bloodGroup,
                emergencyContact: formData.emergencyContact,
            } as any);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 4000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update patient profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-muted uppercase tracking-widest">Loading Patient Data...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-page pb-24">
            {/* Header */}
            <header className="bg-card border-b border-border-card sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-page flex items-center justify-center text-muted hover:bg-page/80 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-main tracking-tight">Edit Patient</h1>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                                {formData.firstName} {formData.lastName}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        isLoading={isSaving}
                        className="rounded-xl px-8"
                        size="sm"
                        leftIcon={<Save size={16} />}
                    >
                        Save Changes
                    </Button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-12">
                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Patient Identity Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700 rounded-[2rem] text-white relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white font-black text-2xl border border-white/20 shrink-0">
                                {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">
                                    {formData.firstName} {formData.lastName}
                                </h2>
                                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
                                    {formData.email}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                        formData.riskLevel === 'high'
                                            ? 'bg-red-500/30 text-red-100'
                                            : formData.riskLevel === 'medium'
                                            ? 'bg-orange-500/30 text-orange-100'
                                            : 'bg-emerald-500/30 text-emerald-100'
                                    }`}>
                                        {formData.riskLevel} Risk
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid gap-10">
                        {/* Personal Identity */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card p-8 md:p-10 rounded-[2.5rem] border border-border-card shadow-sm space-y-8"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted">Personal Identity</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="First Name"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    leftIcon={<User size={18} />}
                                    placeholder="Enter first name"
                                    required
                                />
                                <InputField
                                    label="Last Name"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    leftIcon={<User size={18} />}
                                    placeholder="Enter last name"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Gender</label>
                                    <div className="flex bg-page p-1.5 rounded-2xl border border-border-card">
                                        {['male', 'female', 'other'].map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                                                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                                    ${formData.gender === g ? 'bg-card text-indigo-600 shadow-sm border border-border-card' : 'text-muted hover:text-main'}
                                                `}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <InputField
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    leftIcon={<Calendar size={18} />}
                                />
                            </div>
                        </motion.section>

                        {/* Contact Information */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-card p-8 md:p-10 rounded-[2.5rem] border border-border-card shadow-sm space-y-8"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted">Contact Information</h2>
                            </div>

                            <InputField
                                label="Email Address"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                leftIcon={<Mail size={18} />}
                                disabled
                                className="opacity-60 grayscale"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="Phone Number"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    leftIcon={<Phone size={18} />}
                                    placeholder="+91 00000 00000"
                                />
                                <InputField
                                    label="Emergency Contact"
                                    name="emergencyContact"
                                    value={formData.emergencyContact}
                                    onChange={handleChange}
                                    leftIcon={<Phone size={18} className="text-rose-500" />}
                                    placeholder="Emergency phone number"
                                />
                            </div>
                        </motion.section>

                        {/* Medical & Location */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-card p-8 md:p-10 rounded-[2.5rem] border border-border-card shadow-sm space-y-8"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted">Medical & Location</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Blood Group</label>
                                    <select
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        className="w-full bg-page border border-border-card rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-main"
                                    >
                                        <option value="">Select Blood Group</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-muted uppercase tracking-widest ml-1">Risk Level</label>
                                    <div className="flex bg-page p-1.5 rounded-2xl border border-border-card">
                                        {['low', 'medium', 'high'].map(r => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, riskLevel: r }))}
                                                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                                    ${formData.riskLevel === r
                                                        ? r === 'high'
                                                            ? 'bg-red-50 text-red-600 shadow-sm border border-red-200'
                                                            : r === 'medium'
                                                            ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-200'
                                                            : 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-200'
                                                        : 'text-muted hover:text-main'
                                                    }
                                                `}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="City / Region"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    leftIcon={<MapPin size={18} />}
                                    placeholder="e.g. Chennai, India"
                                />
                                <InputField
                                    label="Full Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    leftIcon={<MapPin size={18} />}
                                    placeholder="Street, Area, Unit..."
                                />
                            </div>
                        </motion.section>
                    </div>

                    {/* Status Alerts */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-error/10 border border-error/20 rounded-3xl text-error text-xs font-black uppercase tracking-widest flex items-center gap-3"
                        >
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}

                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-emerald-500 text-xs font-black uppercase tracking-widest flex items-center gap-3"
                        >
                            <CheckCircle size={18} />
                            Patient Profile Updated Successfully
                        </motion.div>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            isLoading={isSaving}
                            leftIcon={<Save size={18} />}
                            className="w-full md:w-auto px-16 py-6 rounded-[2rem] shadow-2xl shadow-indigo-500/10"
                        >
                            Confirm Updates
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default HospitalEditPatient;
