import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User as UserIcon,
    Users,
    ArrowLeft,
    Save,
    Shield,
    Activity,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Stethoscope,
    Briefcase,
    DollarSign,
    Info,
    CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import Select from '../../components/ui/Select';
import { UserService } from '../../api/services/user.service';
// import type { User } from '../../types/user.types';

const UserManagement = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        role: 'patient',
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        gender: 'male',
        dateOfBirth: '',
        address: '',
        city: '',
        // Professional specific
        specialization: '',
        experienceYears: '',
        consultationFee: '',
        about: '',
        qualifications: '',
        languages: '',
        // Patient specific
        emergencyContact: ''
    });

    const roles = [
        { value: 'patient', label: 'Patient', icon: Users },
        { value: 'psychiatrist', label: 'Psychiatrist', icon: Activity },
        { value: 'psychologist', label: 'Psychologist', icon: Activity },
        { value: 'nurse', label: 'Clinical Nurse', icon: Activity },
        { value: 'counselor', label: 'Counselor', icon: Activity },
        { value: 'social_worker', label: 'Social Worker', icon: Activity },
        { value: 'hospital', label: 'Hospital Admin', icon: Shield },
        { value: 'admin', label: 'System Admin', icon: Shield }
    ];

    const isProfessional = ['psychiatrist', 'psychologist', 'nurse', 'counselor', 'social_worker'].includes(formData.role);
    const isPatient = formData.role === 'patient';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload = {
                ...formData,
                experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
                consultationFee: formData.consultationFee ? parseInt(formData.consultationFee) : undefined,
                languages: formData.languages ? formData.languages.split(',').map(l => l.trim()).filter(Boolean) : undefined,
            } as any;

            await UserService.createUserByRole(formData.role, payload);

            setSuccess(true);
            setTimeout(() => {
                navigate('/staff');
            }, 2000);
        } catch (error) {
            console.error('Failed to create user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card-premium p-12 text-center max-w-md w-full space-y-6 shadow-2xl shadow-emerald-100"
                >
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto glow-emerald">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Account Created!</h2>
                        <p className="text-slate-500 font-medium leading-relaxed">The new {formData.role.replace('_', ' ')} profile has been successfully registered to the system.</p>
                    </div>
                    <div className="pt-4">
                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2 }}
                                className="h-full bg-emerald-500"
                            />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Redirecting to Directory...</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl  space-y-10 animate-fade-in pb-32">
            <header className="space-y-2">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                >
                    <ArrowLeft size={14} /> Go Back
                </button>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Registration</h1>
                <p className="text-slate-500 font-medium italic">"Every clinician added strengthens the web of collective care."</p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Role Selection Block */}
                <section className="card-premium p-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Permissions</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Define user credentials and hierarchy</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Select
                            label="Account Role Type"
                            value={formData.role}
                            options={roles}
                            onChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
                        />
                        <InputField
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            placeholder="e.g. jdoe_psych"
                            required
                        />
                    </div>
                </section>

                {/* Identity Information Block */}
                <section className="card-premium p-10 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
                            <UserIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Personal Identity</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Basic profile details and demographics</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <InputField
                            label="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            placeholder="John"
                            required
                        />
                        <InputField
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            placeholder="Doe"
                            required
                        />
                        <InputField
                            label="Email Address"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="john.doe@mindbalance.com"
                            leftIcon={<Mail size={16} />}
                            required
                        />
                        <InputField
                            label="Security Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            required
                        />
                        <InputField
                            label="Contact Number"
                            name="phone"
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                            leftIcon={<Phone size={16} />}
                        />
                        <InputField
                            label="Date of Birth"
                            name="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            leftIcon={<Calendar size={16} />}
                        />
                        <InputField
                            label="City/Region"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="New York, NY"
                            leftIcon={<MapPin size={16} />}
                        />
                    </div>
                </section>

                {/* Professional Metrics Block (Only for professionals) */}
                {isProfessional && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-premium p-10 space-y-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100">
                                <Stethoscope size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Clinical Metrics</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Specialization and experience parameters</p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <InputField
                                label="Specialization"
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleInputChange}
                                placeholder="e.g. Cognitive Behavioral Therapy"
                                leftIcon={<Briefcase size={16} />}
                            />
                            <InputField
                                label="Highest Qualification"
                                name="qualifications"
                                value={formData.qualifications}
                                onChange={handleInputChange}
                                placeholder="e.g. MD, PhD in Clinical Psychology"
                                leftIcon={<Shield size={16} />}
                            />
                            <InputField
                                label="Spoken Languages"
                                name="languages"
                                value={formData.languages}
                                onChange={handleInputChange}
                                placeholder="e.g. English, Spanish, French"
                                leftIcon={<Mail size={16} />}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="Exp. Years"
                                    name="experienceYears"
                                    type="number"
                                    value={formData.experienceYears}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                />
                                <InputField
                                    label="Fee ($)"
                                    name="consultationFee"
                                    type="number"
                                    value={formData.consultationFee}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    leftIcon={<DollarSign size={16} />}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Professional Bio</label>
                            <textarea
                                name="about"
                                value={formData.about}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="Describe your professional background and clinical approach..."
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                    </motion.section>
                )}

                {/* Patient specific fields */}
                {isPatient && (
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-premium p-10 space-y-8"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center border border-orange-100">
                                <Info size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Emergency Protocol</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Care coordinates and emergency contacts</p>
                            </div>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <InputField
                                label="Emergency Contact"
                                name="emergencyContact"
                                value={formData.emergencyContact}
                                onChange={handleInputChange}
                                placeholder="Name & Phone Number"
                                leftIcon={<Phone size={16} />}
                            />
                            <InputField
                                label="Current Address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Full residential address"
                                leftIcon={<MapPin size={16} />}
                            />
                        </div>
                    </motion.section>
                )}

                <div className="flex justify-end gap-4">
                    <Button variant="outline" size="lg" onClick={() => navigate(-1)} type="button">
                        Cancel Registration
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        type="submit"
                        isLoading={isLoading}
                        leftIcon={<Save size={18} />}
                        className="px-10 shadow-2xl shadow-indigo-200/50"
                    >
                        Register Account
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UserManagement;
