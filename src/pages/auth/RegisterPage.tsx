import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Mail, Lock, User, ChevronRight, ArrowLeft,
    Stethoscope, Activity, Users,
    Smartphone, Phone, MapPin, Calendar, ShieldCheck, CheckCircle2,
    Globe, UserCheck
} from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { AuthService } from '../../api/services/auth.service';
import { type UserRole } from '../../types/user.types';

const RegisterPage = () => {
    // Basic Info
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [isdCode, setIsdCode] = useState('+91');
    const [mobile, setMobile] = useState('');
    const [role, setRole] = useState<UserRole>('patient');

    // Profile & Location
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');

    // Professional Fields
    const [specialization, setSpecialization] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [qualifications, setQualifications] = useState('');
    const [languages, setLanguages] = useState('');
    const [skills, setSkills] = useState('');
    const [consultationFee, setConsultationFee] = useState('');
    const [about, setAbout] = useState('');

    // Patient Fields
    const [bloodGroup, setBloodGroup] = useState('');
    const [emergencyContact, setEmergencyContact] = useState('');

    // Security & Preferences
    const [is2fa, setIs2fa] = useState(false);
    const [commPrefs, setCommPrefs] = useState({ email: true, sms: false, push: true });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const payload: any = {
                firstName,
                lastName,
                username,
                email,
                password,
                phone,
                mobile: mobile || phone,
                isdCode,
                role,
                dateOfBirth,
                gender,
                city,
                address,
                is2fa,
                communicationPreferences: commPrefs,
                timezoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
                profileImage: ""
            };

            if (role !== 'patient') {
                payload.specialization = specialization;
                payload.experienceYears = Number(experienceYears);
                payload.qualifications = qualifications.split(',').map(q => q.trim()).filter(Boolean);
                payload.languages = languages.split(',').map(l => l.trim()).filter(Boolean);
                payload.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
                payload.consultationFee = Number(consultationFee);
                payload.about = about;
            }

            if (role === 'patient') {
                payload.bloodGroup = bloodGroup;
                payload.emergencyContact = emergencyContact;
            }

            await AuthService.register(payload);
            navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Registration failed. Please verify your data.');
        } finally {
            setIsLoading(false);
        }
    };

    const categories = [
        { id: 'patient', label: 'Patient', icon: User, role: 'patient' },
        { id: 'clinical', label: 'Professional', icon: Stethoscope, role: 'psychiatrist' },
    ];

    const proRoles = [
        { id: 'psychiatrist', label: 'Psychiatrist' },
        { id: 'psychologist', label: 'Psychologist' },
        { id: 'nurse', label: 'Nurse' },
        { id: 'counselor', label: 'Counselor' },
    ];

    return (
        <div className="min-h-screen bg-[#F9FBFA] flex items-center justify-center p-8 py-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[800px] glass-card p-12 overflow-hidden relative"
            >
                {/* Decorative background pulse */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50" />

                <div className="mb-12 relative flex items-start justify-between">
                    <div>
                        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors mb-6 group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Back to Login</span>
                        </Link>
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary shrink-0">
                                <UserCheck size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight text-gradient-primary">Join MindBalance</h1>
                                <p className="text-slate-500 font-semibold text-sm mt-1">Start your clinical journey today.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-10 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3"
                        >
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleRegister} className="space-y-12">
                    {/* Section 1: Personal Information */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <User className="text-indigo-600" size={18} />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Personal Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="First Name" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                            <InputField label="Last Name" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                            <InputField label="Date of Birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} leftIcon={<Calendar size={18} />} required />
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                                <div className="flex p-1 bg-slate-50 rounded-xl gap-1">
                                    {['male', 'female', 'other'].map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setGender(g as any)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${gender === g ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Account Credentials */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <Lock className="text-indigo-600" size={18} />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Account & Security</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Username" placeholder="johndoe_01" value={username} onChange={(e) => setUsername(e.target.value)} leftIcon={<User size={18} />} className="md:col-span-2" required />
                            <InputField label="Email Address" type="email" placeholder="john.doe@health.com" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail size={18} />} required />
                            <InputField label="Security Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={<ShieldCheck size={18} />} required />
                            <div className="grid grid-cols-4 gap-4 md:col-span-2">
                                <InputField label="ISD" placeholder="+91" value={isdCode} onChange={(e) => setIsdCode(e.target.value)} leftIcon={<Globe size={18} />} />
                                <div className="col-span-3">
                                    <InputField label="Primary Phone" placeholder="9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} leftIcon={<Phone size={18} />} required />
                                </div>
                            </div>
                            <InputField label="Alternative Mobile (Optional)" placeholder="Alternative mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} leftIcon={<Smartphone size={18} />} className="md:col-span-2" />
                        </div>
                    </section>

                    {/* Section 3: Profile & Location */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <MapPin className="text-indigo-600" size={18} />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Profile & Location</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="City" placeholder="City name" value={city} onChange={(e) => setCity(e.target.value)} className="md:col-span-1" />
                            <InputField label="Detailed Address" placeholder="Street, Building, Suite" value={address} onChange={(e) => setAddress(e.target.value)} className="md:col-span-2" />
                        </div>
                    </section>

                    {/* Section 4: Account Role */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <Users className="text-indigo-600" size={18} />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Account Role</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex p-1.5 bg-slate-100/80 rounded-[2rem] gap-1">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            setRole(cat.role as UserRole);
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] transition-all duration-300 ${role === cat.role || (cat.id === 'clinical' && role !== 'patient') ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100/50' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        <cat.icon size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                                    </button>
                                ))}
                            </div>

                            {role !== 'patient' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-wrap gap-2"
                                >
                                    {proRoles.map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setRole(r.id as UserRole)}
                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${role === r.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </div>
                    </section>

                    {/* Section 5: Dynamic Credentials */}
                    <AnimatePresence mode="wait">
                        {role !== 'patient' ? (
                            <motion.section
                                key="pro-fields"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <ShieldCheck className="text-indigo-600" size={18} />
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Professional Credentials</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Specialization" placeholder="e.g. Clinical Psychiatry" value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Exp (Years)" type="number" placeholder="10" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} />
                                        <InputField label="Counsel Fee" type="number" placeholder="150" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} />
                                    </div>
                                    <InputField label="Qualifications" placeholder="MBBS, MD (Comma separated)" value={qualifications} onChange={(e) => setQualifications(e.target.value)} className="md:col-span-2" />
                                    <InputField label="Languages" placeholder="English, Hindi" value={languages} onChange={(e) => setLanguages(e.target.value)} />
                                    <InputField label="Clinical Skills" placeholder="CBT, Therapy" value={skills} onChange={(e) => setSkills(e.target.value)} />
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Professional Bio</label>
                                        <textarea
                                            placeholder="Tell us about your clinical experience..."
                                            value={about}
                                            onChange={(e) => setAbout(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[120px]"
                                        />
                                    </div>
                                </div>
                            </motion.section>
                        ) : (
                            <motion.section
                                key="patient-fields"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                                    <Heart className="text-indigo-600" size={18} />
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Clinical Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Blood Group" placeholder="O+ve" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />
                                    <InputField label="Emergency Contact" placeholder="9876543210" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} leftIcon={<Smartphone size={18} />} />
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {/* Section 6: Security & Preferences */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                            <Activity className="text-indigo-600" size={18} />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Security & Preferences</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Enable 2FA</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Two-Factor Authentication</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIs2fa(!is2fa)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${is2fa ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${is2fa ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Channels</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(commPrefs).map(([key, value]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setCommPrefs(prev => ({ ...prev, [key]: !value }))}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${value ? 'bg-indigo-50 text-indigo-600 border-2 border-indigo-200' : 'bg-white text-slate-400 border-2 border-slate-100 hover:border-slate-200'}`}
                                        >
                                            {value ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />}
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="pt-8 border-t border-slate-100 flex flex-col gap-6">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            isLoading={isLoading}
                            className="w-full py-6 rounded-2xl shadow-xl shadow-indigo-100"
                            size="lg"
                            rightIcon={<ChevronRight size={18} />}
                        >
                            Complete Registration
                        </Button>
                        <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-widest leading-loose">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 transition-colors font-black">
                                Sign In
                            </Link>
                        </p>
                        <p className="text-center text-[10px] text-slate-300 uppercase tracking-[0.2em] font-black">
                            Privacy Policy • Terms of Service • Clinical Compliance
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
