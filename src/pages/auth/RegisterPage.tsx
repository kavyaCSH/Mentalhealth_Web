import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Mail, Lock, User, ChevronRight, ArrowLeft,
    Stethoscope, Activity, Users,
    Smartphone, Phone, MapPin, Calendar, ShieldCheck, CheckCircle2,
    Globe, UserCheck, Navigation
} from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import Select from '../../components/ui/Select';
import MultiSelect from '../../components/ui/MultiSelect';
import MapLocationPicker from '../../components/ui/MapLocationPicker';
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
    const [isLocating, setIsLocating] = useState(false);

    // Professional Fields
    const [specialization, setSpecialization] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [qualifications, setQualifications] = useState('');
    const [languages, setLanguages] = useState<string[]>([]);
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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const navigate = useNavigate();

    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        if (fieldErrors[field]) {
            setFieldErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleLiveLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();
                
                if (data && data.address) {
                    const fetchedCity = data.address.city || data.address.town || data.address.village || data.address.county || '';
                    if (fetchedCity) setCity(fetchedCity);
                    
                    const displayAddr = data.display_name.split(',').slice(0, 3).join(', ');
                    setAddress(displayAddr);
                }
            } catch (err) {
                setError('Failed to fetch address from live location.');
            } finally {
                setIsLocating(false);
            }
        }, () => {
            setError('Location permission denied or unavailable.');
            setIsLocating(false);
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, string> = {};

        // Client-side validation for required fields
        if (!firstName.trim()) {
            errors.firstName = "We need your first name to personalize your experience.";
        }
        if (!lastName.trim()) {
            errors.lastName = "Please provide your last name.";
        }
        if (!dateOfBirth) {
            errors.dateOfBirth = "Your date of birth is required for age verification.";
        }
        if (!username.trim()) {
            errors.username = "Choose a unique username for your account.";
        }
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Please enter a valid email address for important updates.";
        }
        if (!password || password.length < 8) {
            errors.password = "For your safety, your password must be at least 8 characters long.";
        }
        if (!phone.trim()) {
            errors.phone = "A valid phone number is required for account security.";
        }
        
        if (role !== 'patient') {
            if (!specialization.trim()) {
                errors.specialization = "Please specify your clinical specialization.";
            }
            if (!experienceYears) {
                errors.experienceYears = "Please enter your years of professional experience.";
            }
            if (!qualifications.trim()) {
                errors.qualifications = "Your professional qualifications are required.";
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setError("Please correct the highlighted errors.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setFieldErrors({});
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
                profileImage: ""
            };

            if (role !== 'patient') {
                payload.specialization = specialization;
                payload.experienceYears = Number(experienceYears);
                payload.qualifications = qualifications.split(',').map(q => q.trim()).filter(Boolean);
                payload.languages = languages;
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
        <div className="min-h-screen bg-page flex items-center justify-center py-8 px-4 md:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-full p-4 overflow-hidden relative"
            >
                {/* Decorative background pulse */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-50 dark:bg-purple-500/10 rounded-full blur-3xl opacity-50" />

                <div className="mb-8 relative flex items-start justify-between">
                    <div>
                        <Link to="/login" className="inline-flex items-center gap-2 text-muted hover:text-indigo-600 transition-colors mb-6 group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Back to Login</span>
                        </Link>
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary shrink-0">
                                <UserCheck size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-main tracking-tight text-gradient-primary">Join MindBalance</h1>
                                <p className="text-muted font-semibold text-sm mt-1">Start your clinical journey today.</p>
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

                <form onSubmit={handleRegister} className="space-y-8" noValidate>
                    {/* Section 1: Personal Information */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 pb-2 border-b border-border-card">
                            <User className="text-indigo-600" size={18} />
                            <h3 className="text-xs font-black text-main uppercase tracking-widest">Personal Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="First Name" placeholder="John" value={firstName} onChange={handleInputChange(setFirstName, 'firstName')} error={fieldErrors.firstName} required />
                            <InputField label="Last Name" placeholder="Doe" value={lastName} onChange={handleInputChange(setLastName, 'lastName')} error={fieldErrors.lastName} required />
                            <InputField label="Date of Birth" type="date" value={dateOfBirth} onChange={handleInputChange(setDateOfBirth, 'dateOfBirth')} error={fieldErrors.dateOfBirth} leftIcon={<Calendar size={18} />} required />
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-40  0 uppercase tracking-widest ml-1">Gender</label>
                                <div className="flex p-1 bg-card rounded-xl gap-1">
                                    {['male', 'female', 'other'].map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={() => setGender(g as any)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${gender === g ? 'bg-indigo-600 text-white shadow-md' : 'text-muted hover:text-main'}`}
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
                        <div className="flex items-center gap-3 pb-2 border-b border-border-card">
                            <Lock className="text-indigo-600" size={18} />
                            <h3 className="text-xs font-black text-main uppercase tracking-widest">Account & Security</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Username" placeholder="Enter your username" value={username} onChange={handleInputChange(setUsername, 'username')} error={fieldErrors.username} leftIcon={<User size={18} />} className="md:col-span-2" required />
                            <InputField label="Email Address" type="email" placeholder="john.doe@health.com" value={email} onChange={handleInputChange(setEmail, 'email')} error={fieldErrors.email} leftIcon={<Mail size={18} />} required />
                            <InputField label="Security Password" type="password" placeholder="••••••••" value={password} onChange={handleInputChange(setPassword, 'password')} error={fieldErrors.password} leftIcon={<ShieldCheck size={18} />} required />
                            <div className="grid grid-cols-4 gap-4 md:col-span-2">
                                <InputField label="ISD" placeholder="+91" value={isdCode} onChange={(e) => setIsdCode(e.target.value)} leftIcon={<Globe size={18} />} />
                                <div className="col-span-3">
                                    <InputField label="Primary Phone" placeholder="9876543210" value={phone} onChange={handleInputChange(setPhone, 'phone')} error={fieldErrors.phone} leftIcon={<Phone size={18} />} required />
                                </div>
                            </div>
                            <InputField label="Alternative Mobile (Optional)" placeholder="Alternative mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} leftIcon={<Smartphone size={18} />} className="md:col-span-2" />
                        </div>
                    </section>

                    {/* Section 3: Profile & Location */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between pb-2 border-b border-border-card">
                            <div className="flex items-center gap-3">
                                <MapPin className="text-indigo-600" size={18} />
                                <h3 className="text-xs font-black text-main uppercase tracking-widest">Profile & Location</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleLiveLocation}
                                disabled={isLocating}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
                            >
                                {/* <Navigation size={12} className={isLocating ? 'animate-spin' : ''} /> */}
                                <span className="text-[9px] font-black uppercase tracking-widest">
                                    {isLocating ? 'Locating...' : 'Use Live Location'}
                                </span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="City" placeholder="City name" value={city} onChange={(e) => setCity(e.target.value)} className="md:col-span-1" />
                            <InputField label="Detailed Address" placeholder="Street, Building, Suite" value={address} onChange={(e) => setAddress(e.target.value)} className="md:col-span-1" />
                            {/* <div className="md:col-span-2">
                                <MapLocationPicker city={city} onCityFound={(foundCity) => {
                                    if (city.length > 3 && !city.includes(foundCity)) {
                                        console.log('Location verified:', foundCity);
                                    }
                                }} />
                            </div> */}
                        </div>
                    </section>

                    {/* Section 4: Account Role */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 pb-2 border-b border-border-card">
                            <Users className="text-indigo-600" size={18} />
                            <h3 className="text-xs font-black text-main uppercase tracking-widest">Account Role</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex p-1.5 bg-card rounded-[2rem] gap-1">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => {
                                            setRole(cat.role as UserRole);
                                        }}
                                        className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-[1.5rem] transition-all duration-300 ${role === cat.role || (cat.id === 'clinical' && role !== 'patient') ? 'bg-page text-indigo-500 shadow-xl dark:shadow-none' : 'text-muted hover:text-muted'
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
                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${role === r.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-card border-border-card text-muted hover:border-indigo-500/50'
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
                                <div className="flex items-center gap-3 pb-2 border-b border-border-card">
                                    <ShieldCheck className="text-indigo-600" size={18} />
                                    <h3 className="text-xs font-black text-main uppercase tracking-widest">Professional Credentials</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Specialization" placeholder="e.g. Clinical Psychiatry" value={specialization} onChange={handleInputChange(setSpecialization, 'specialization')} error={fieldErrors.specialization} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Exp (Years)" type="number" placeholder="10" value={experienceYears} onChange={handleInputChange(setExperienceYears, 'experienceYears')} error={fieldErrors.experienceYears} />
                                        <InputField label="Counsel Fee" type="number" placeholder="150" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} />
                                    </div>
                                    <InputField label="Qualifications" placeholder="MBBS, MD (Comma separated)" value={qualifications} onChange={handleInputChange(setQualifications, 'qualifications')} error={fieldErrors.qualifications} className="md:col-span-2" />
                                    <MultiSelect 
                                        label="Languages" 
                                        placeholder="Select Languages" 
                                        value={languages} 
                                        onChange={setLanguages}
                                        options={[
                                            { value: 'English', label: 'English' },
                                            { value: 'Spanish', label: 'Spanish' },
                                            { value: 'French', label: 'French' },
                                            { value: 'German', label: 'German' },
                                            { value: 'Mandarin', label: 'Mandarin' },
                                            { value: 'Hindi', label: 'Hindi' },
                                            { value: 'Arabic', label: 'Arabic' },
                                            { value: 'Portuguese', label: 'Portuguese' },
                                            { value: 'Russian', label: 'Russian' },
                                            { value: 'Japanese', label: 'Japanese' }
                                        ]}
                                    />
                                    <InputField label="Clinical Skills" placeholder="CBT, Therapy" value={skills} onChange={(e) => setSkills(e.target.value)} />
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Professional Bio</label>
                                        <textarea
                                            placeholder="Tell us about your clinical experience..."
                                            value={about}
                                            onChange={(e) => setAbout(e.target.value)}
                                            className="w-full bg-card border border-border-card rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all min-h-[120px]"
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
                                <div className="flex items-center gap-3 pb-2 border-b border-border-card">
                                    <Heart className="text-indigo-600" size={18} />
                                    <h3 className="text-xs font-black text-main uppercase tracking-widest">Clinical Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select 
                                        label="Blood Group" 
                                        placeholder="Select Blood Group" 
                                        value={bloodGroup} 
                                        onChange={setBloodGroup} 
                                        options={[
                                            { value: 'A+', label: 'A+' },
                                            { value: 'A-', label: 'A-' },
                                            { value: 'B+', label: 'B+' },
                                            { value: 'B-', label: 'B-' },
                                            { value: 'O+', label: 'O+' },
                                            { value: 'O-', label: 'O-' },
                                            { value: 'AB+', label: 'AB+' },
                                            { value: 'AB-', label: 'AB-' },
                                            { value: 'Unknown', label: 'Unknown' }
                                        ]} 
                                    />
                                    <InputField label="Emergency Contact" placeholder="9876543210" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} leftIcon={<Smartphone size={18} />} />
                                </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {/* Section 6: Security & Preferences */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-3 pb-2 border-b border-border-card">
                            <Activity className="text-indigo-600" size={18} />
                            <h3 className="text-xs font-black text-main uppercase tracking-widest">Security & Preferences</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center justify-between p-5 bg-card rounded-2xl border border-border-card group hover:border-indigo-200 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-page rounded-xl text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-main uppercase tracking-widest">Enable 2FA</p>
                                        <p className="text-[10px] font-bold text-muted mt-0.5">Two-Factor Authentication</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIs2fa(!is2fa)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${is2fa ? 'bg-indigo-600' : 'bg-border-card'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-all ${is2fa ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Communication Channels</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(commPrefs).map(([key, value]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setCommPrefs(prev => ({ ...prev, [key]: !value }))}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${value ? 'bg-indigo-500/10 text-indigo-500 border-2 border-indigo-200' : 'bg-card text-muted border-2 border-border-card hover:border-indigo-500/50'}`}
                                        >
                                            {value ? <CheckCircle2 size={14} /> : <div className="w-3.5 h-3.5 rounded-full border border-border-card" />}
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="pt-8 border-t border-border-card flex flex-col gap-6">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            isLoading={isLoading}
                            className="w-full py-4 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none"
                            size="lg"
                            rightIcon={<ChevronRight size={18} />}
                        >
                            Complete Registration
                        </Button>
                        <p className="text-center text-xs text-muted font-bold uppercase tracking-widest leading-loose">
                            Already have an account?{' '}
                            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 transition-colors font-black">
                                Sign In
                            </Link>
                        </p>
                        <p className="text-center text-[10px] text-muted/50 uppercase tracking-[0.2em] font-black">
                            Privacy Policy • Terms of Service • Clinical Compliance
                        </p>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
