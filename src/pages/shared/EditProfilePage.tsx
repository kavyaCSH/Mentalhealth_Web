import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
    ChevronLeft, Camera, User, Mail, Phone, Calendar, MapPin, 
    ShieldCheck, Bell, CheckCircle, Smartphone, UserCircle, AlertCircle,
    Navigation, Crosshair
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
        is2fa: user?.is2fa || false,
        communicationPreferences: user?.communicationPreferences || {
            email: true,
            sms: false,
            push: true
        },
        coordinates: user?.coordinates || {
            lat: 0,
            lng: 0
        }
    });

    const [isLocating, setIsLocating] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const updatedUser = await UserService.updateMyProfile(formData);
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
                                {user?.profileImage ? (
                                    <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} />
                                )}
                                <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera size={24} className="text-white" />
                                </div>
                            </div>
                            <button type="button" className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-slate-100 rounded-2xl shadow-lg flex items-center justify-center text-indigo-600 hover:scale-110 transition-transform">
                                <Camera size={18} />
                            </button>
                        </div>
                        <p className="mt-4 text-xs font-black text-indigo-600 uppercase tracking-widest">Change Profile Photo</p>
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
                                                Lat: {formData.coordinates.lat.toFixed(4)}
                                            </p>
                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                Lng: {formData.coordinates.lng.toFixed(4)}
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
