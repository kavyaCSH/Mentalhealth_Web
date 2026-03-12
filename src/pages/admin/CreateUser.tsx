import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Shield, Activity, Building, User as UserIcon, Mail, Phone, Lock, ChevronLeft, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { AuthService } from '../../api/services/auth.service';
import { type UserRole } from '../../types/user.types';

const CreateUser = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        role: 'patient' as UserRole,
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const roles = [
        { id: 'patient', label: 'Patient', icon: <UserIcon size={18} />, desc: 'Standard platform access' },
        { id: 'psychiatrist', label: 'Psychiatrist', icon: <Activity size={18} />, desc: 'Full clinical privileges' },
        { id: 'psychologist', label: 'Psychologist', icon: <Activity size={18} />, desc: 'Therapy & Assessment' },
        { id: 'hospital', label: 'Facility', icon: <Building size={18} />, desc: 'Manage practitioners' },
        { id: 'admin', label: 'Admin', icon: <Shield size={18} />, desc: 'System management' }
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (roleId: UserRole) => {
        setFormData({ ...formData, role: roleId });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            // Using AuthService.register as per guide for admin user creation
            // Note: Admin endpoints might require special auth headers or differ in reality
            await AuthService.register({
                firstName: formData.firstName,
                lastName: formData.lastName,
                username: formData.email.split('@')[0],
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                role: formData.role as UserRole
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/admin/users');
            }, 3000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            console.error('Registration failed:', error);
            setError(error.response?.data?.message || 'Failed to create user. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="p-8 max-w-2xl  space-y-8 animate-fade-in py-20 text-center">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-100 glow-emerald">
                    <CheckCircle2 size={48} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Account Created</h1>
                <p className="text-slate-500 font-medium">The new {formData.role} account has been successfully provisioned. They can now log in using the credentials provided.</p>
                <div className="pt-8">
                    <Activity className="animate-spin text-indigo-500 mx-auto" size={24} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">Redirecting to User Directory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl  space-y-8 animate-fade-in pb-20">
            <header className="flex items-center gap-6 pb-6 border-b border-slate-100">
                <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Provision New User</h1>
                    <p className="text-slate-500 font-medium mt-2">Create a new account with specific role-based access.</p>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Role Selection */}
                <div className="card-premium p-8">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Shield className="text-indigo-600" size={18} /> Account Role
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => handleRoleSelect(role.id as UserRole)}
                                className={`p-4 text-left border-2 rounded-2xl transition-all duration-200 flex items-start gap-4 
                                    ${formData.role === role.id
                                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100'
                                        : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50/50 hover:shadow-sm'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${formData.role === role.id ? 'bg-indigo-600 text-white shadow-inner shadow-indigo-800/50' : 'bg-slate-100 text-slate-400'}`}>
                                    {role.icon}
                                </div>
                                <div>
                                    <p className={`font-bold ${formData.role === role.id ? 'text-indigo-900' : 'text-slate-700'}`}>{role.label}</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${formData.role === role.id ? 'text-indigo-500' : 'text-slate-400'}`}>
                                        {role.desc}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Personal Information */}
                <div className="card-premium p-8">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <UserIcon className="text-indigo-600" size={18} /> Personal Information
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <InputField
                            label="First Name"
                            name="firstName"
                            placeholder="e.g. Sarah"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                        <InputField
                            label="Last Name"
                            name="lastName"
                            placeholder="e.g. Mitchell"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                        <InputField
                            label="Email Address"
                            name="email"
                            type="email"
                            placeholder="sarah.m@example.com"
                            leftIcon={<Mail size={16} />}
                            value={formData.email}
                            onChange={handleChange}
                            required
                            containerClassName="md:col-span-2"
                        />
                        <InputField
                            label="Phone Number"
                            name="phone"
                            placeholder="+1 (555) 000-0000"
                            leftIcon={<Phone size={16} />}
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Security */}
                <div className="card-premium p-8">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Lock className="text-indigo-600" size={18} /> Security Credentials
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        <InputField
                            label="Temporary Password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            leftIcon={<Lock size={16} />}
                            value={formData.password}
                            onChange={handleChange}
                            required
                            helperText="Must be at least 8 characters long."
                        />
                        <InputField
                            label="Confirm Password"
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            leftIcon={<Lock size={16} />}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-bold flex items-center gap-3"
                        >
                            <UserPlus size={18} /> {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<UserPlus size={18} />}>
                        Provision Account
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;
