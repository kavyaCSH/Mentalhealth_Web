import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
    ChevronLeft, Camera, User, Mail, Phone, Calendar, MapPin, 
    ShieldCheck, Bell, CheckCircle, Smartphone, UserCircle, AlertCircle,
    Navigation, Crosshair, Loader2, Briefcase, Info, List, MessageCircle, Sparkles
} from 'lucide-react';
import type { RootState, AppDispatch } from '../../store';
import { setUser } from '../../features/auth/store/authSlice';
import { UserService } from '../../api/services/user.service';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';

const EditProfilePage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    // Form State
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        email: user?.email || '',
        phone: user?.phone || '',
        gender: user?.gender || 'male',
        dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        city: user?.city || '',
        address: user?.address || '',
        emergencyContact: user?.emergencyContact || '',
        bloodGroup: user?.bloodGroup || '',
        about: user?.about || '',
        specialization: user?.specialization || '',
        experienceYears: user?.experienceYears || 0,
        consultationFee: user?.consultationFee || 0,
        languages: Array.isArray(user?.languages) ? user.languages.join(', ') : '',
        skills: Array.isArray(user?.skills) ? user.skills.join(', ') : '',
        is2fa: user?.is2fa || false,
        communicationPreferences: user?.communicationPreferences || {
            email: true,
            sms: false,
            push: true
        },
        coordinates: {
            lat: user?.coordinates?.lat ?? 0,
            lng: user?.coordinates?.lng ?? 0
        }
    });

    const [isLocating, setIsLocating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggle = (name: string) => {
        if (name === 'is2fa') {
            setFormData(prev => ({ ...prev, is2fa: !prev.is2fa }));
        }
    };

    const handleCommToggle = (type: 'email' | 'sms' | 'push') => {
        setFormData(prev => ({
            ...prev,
            communicationPreferences: {
                ...prev.communicationPreferences,
                [type]: !prev.communicationPreferences[type]
            }
        }));
    };
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    coordinates: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                }));
                setIsLocating(false);
            },
            () => {
                setError('Unable to retrieve your location');
                setIsLocating(false);
            }
        );
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('profileImage', file);

        setIsUploading(true);
        setError(null);

        try {
            const updatedUser = await UserService.updateProfileImage(formData);
            dispatch(setUser(updatedUser));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload profile image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Convert comma-separated strings back to arrays
            const submissionData = {
                ...formData,
                languages: formData.languages.split(',').map(s => s.trim()).filter(s => !!s),
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => !!s),
                experienceYears: Number(formData.experienceYears),
                consultationFee: Number(formData.consultationFee)
            };

            const updatedUser = await UserService.updateMyProfile(submissionData);
            dispatch(setUser(updatedUser));
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Edit Profile</h1>
                    </div>
                    <Button 
                        onClick={handleSubmit} 
                        isLoading={isLoading}
                        className="rounded-xl px-8"
                        size="sm"
                    >
                        Save Changes
                    </Button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-12">
                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Avatar Selection */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[3rem] bg-indigo-50 border-4 border-white shadow-xl flex items-center justify-center text-indigo-600 overflow-hidden relative">
                                {isUploading ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                ) : user?.profileImage ? (
                                    <img 
                                        src={`${user.profileImage}${user.profileImage.includes('?') ? '&' : '?'}t=${new Date().getTime()}`} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <User size={48} />
                                )}
                                <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <Camera size={24} className="text-white" />
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-slate-100 rounded-2xl shadow-lg flex items-center justify-center text-indigo-600 hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
                            >
                                <Camera size={18} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                        <p className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest">
                            {isUploading ? 'Uploading...' : 'Change Profile Photo'}
                        </p>
                    </div>

                    <div className="grid gap-10">
                        {/* Personal Identity */}
                        <section className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Personal Identity</h2>
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
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Gender Identity</label>
                                    <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                        {['male', 'female', 'other'].map(g => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                                                className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                                    ${formData.gender === g ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}
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
                        </section>

                        {/* Contact & Communication */}
                        <section className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Contact Information</h2>
                            </div>

                            <InputField
                                label="Clinical Email Address"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                leftIcon={<Mail size={18} />}
                                disabled
                                className="opacity-60 grayscale"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="Username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    leftIcon={<UserCircle size={18} />}
                                />
                                <InputField
                                    label="Phone Number"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    leftIcon={<Phone size={18} />}
                                    placeholder="+91 00000 00000"
                                />
                            </div>

                            {/* Essential Medical Details (All Users) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                                <InputField
                                    label="Emergency Contact"
                                    name="emergencyContact"
                                    value={formData.emergencyContact}
                                    onChange={handleChange}
                                    leftIcon={<Phone size={18} className="text-rose-500" />}
                                    placeholder="Name or Phone Number"
                                />
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Blood Group</label>
                                    <select 
                                        name="bloodGroup"
                                        value={formData.bloodGroup}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                    >
                                        <option value="">Select Blood Group</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Professional-Specific Fields */}
                            {user?.role !== 'patient' && (
                                <div className="space-y-6 pt-6 border-t border-slate-50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Specialization"
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                            leftIcon={<Briefcase size={18} />}
                                            placeholder="e.g. Clinical Psychologist"
                                        />
                                        <InputField
                                            label="Years of Experience"
                                            name="experienceYears"
                                            type="number"
                                            value={String(formData.experienceYears)}
                                            onChange={handleChange}
                                            leftIcon={<Calendar size={18} />}
                                        />
                                        <InputField
                                            label="Consultation Fee (₹)"
                                            name="consultationFee"
                                            type="number"
                                            value={String(formData.consultationFee)}
                                            onChange={handleChange}
                                            leftIcon={<List size={18} className="text-emerald-500" />}
                                            placeholder="Standard rate"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField
                                            label="Languages Spoken"
                                            name="languages"
                                            value={formData.languages}
                                            onChange={handleChange}
                                            leftIcon={<MessageCircle size={18} />}
                                            placeholder="e.g. English, Tamil, Hindi"
                                            helperText="Separate with commas"
                                        />
                                        <InputField
                                            label="Core Skills & Therapeutic Modalities"
                                            name="skills"
                                            value={formData.skills}
                                            onChange={handleChange}
                                            leftIcon={<Sparkles size={18} />}
                                            placeholder="e.g. CBT, DBT, Mindfulness"
                                            helperText="Separate with commas"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Professional Bio</label>
                                        <div className="relative">
                                            <textarea
                                                name="about"
                                                value={formData.about}
                                                onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                                                rows={4}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                                                placeholder="Tell us about your professional background..."
                                            />
                                            <Info size={18} className="absolute top-4 right-4 text-slate-300" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Location Details */}
                        <section className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Location Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="City / Region"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    leftIcon={<MapPin size={18} />}
                                    placeholder="e.g. Bengaluru, India"
                                />
                                <InputField
                                    label="Complete Residential Address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    leftIcon={<MapPin size={18} />}
                                    placeholder="Street, Suite, Unit..."
                                />
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                                        <Navigation size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm tracking-tight">Precision GPS Basis</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                Lat: {(formData.coordinates?.lat ?? 0).toFixed(4)}
                                            </p>
                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                Lng: {(formData.coordinates?.lng ?? 0).toFixed(4)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleGetLocation}
                                    isLoading={isLocating}
                                    leftIcon={<Crosshair size={16} />}
                                    className="rounded-xl px-6 border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest shrink-0"
                                >
                                    Detect Precision Location
                                </Button>
                            </div>
                        </section>

                        {/* System Preferences */}
                        <section className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">System Preferences</h2>
                            </div>

                            {/* 2FA Toggle */}
                            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm tracking-tight">Two-Factor Authentication</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Extra Account Security</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleToggle('is2fa')}
                                    className={`w-14 h-8 rounded-full transition-all flex items-center px-1
                                        ${formData.is2fa ? 'bg-indigo-600' : 'bg-slate-200'}
                                    `}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform transform ${formData.is2fa ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Notification Channels */}
                            <div className="space-y-4">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Notification Channels</p>
                                <div className="flex flex-wrap gap-4">
                                    {[
                                        { id: 'email', label: 'Email', icon: Mail },
                                        { id: 'sms', label: 'SMS', icon: Smartphone },
                                        { id: 'push', label: 'Push', icon: Bell },
                                    ].map(ch => (
                                        <button
                                            key={ch.id}
                                            type="button"
                                            onClick={() => handleCommToggle(ch.id as any)}
                                            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest
                                                ${formData.communicationPreferences[ch.id as keyof typeof formData.communicationPreferences] 
                                                    ? 'bg-indigo-50 border-indigo-600 text-indigo-600' 
                                                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}
                                            `}
                                        >
                                            <ch.icon size={16} />
                                            {ch.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Submit Status Alerts */}
                    {error && (
                        <div className="p-6 bg-red-50 border border-red-100 rounded-3xl text-red-600 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-700 text-xs font-black uppercase tracking-widest flex items-center gap-3">
                            <CheckCircle size={18} />
                            Profile Updated Successfully
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="w-full md:w-auto px-16 py-6 rounded-[2rem] shadow-2xl shadow-indigo-200"
                        >
                            Confirm Updates
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfilePage;
