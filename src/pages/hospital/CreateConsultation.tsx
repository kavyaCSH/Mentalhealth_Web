import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Calendar,
    Clock,
    User as UserIcon,
    Users,
    Video,
    Home,
    Hospital,
    Search,
    Check,
    AlertCircle,
    Activity,
    DollarSign
} from 'lucide-react';
import { UserService } from '../../api/services/user.service';
import { ConsultService } from '../../api/services/consult.service';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import type { User } from '../../types/user.types';
import type { Consultation } from '../../types/common.types';

const CONSULT_TYPES = [
    { value: 'virtual', label: 'Virtual', icon: <Video size={18} /> },
    { value: 'home', label: 'Home Visit', icon: <Home size={18} /> },
    { value: 'clinic', label: 'Clinic', icon: <Hospital size={18} /> },
];

const CreateConsultation = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialProfId = searchParams.get('professionalId');
    const initialPatientId = searchParams.get('patientId');

    // Form State
    const [consultType, setConsultType] = useState('virtual');
    const [scheduledAt, setScheduledAt] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [fee, setFee] = useState('');

    // Participants State
    const [professional, setProfessional] = useState<User | null>(null);
    const [patient, setPatient] = useState<User | null>(null);

    // Picker State
    const [pickingRole, setPickingRole] = useState<'professional' | 'patient' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialProfId) fetchAndSetUser(initialProfId, 'professional');
        if (initialPatientId) fetchAndSetUser(initialPatientId, 'patient');
    }, [initialProfId, initialPatientId]);

    const fetchAndSetUser = async (id: string, role: 'professional' | 'patient') => {
        try {
            const user = await UserService.getUserById(id);
            if (role === 'professional') setProfessional(user);
            else setPatient(user);
        } catch (err) {
            console.error(`Failed to fetch ${role}:`, err);
        }
    };

    const handleSearch = useCallback(async () => {
        if (!pickingRole) return;
        setIsSearching(true);
        try {
            const roleFilter = pickingRole === 'professional'
                ? 'psychiatrist,psychologist,nurse,counselor,social_worker'
                : 'patient';

            const res = await UserService.listUsers({
                role: roleFilter,
                search: searchQuery
            });
            setUsers(res);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    }, [pickingRole, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (pickingRole) handleSearch();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, pickingRole, handleSearch]);

    const handleSubmit = async () => {
        if (!professional || !patient || !scheduledAt || !scheduledTime || !reason) {
            setError('Please fill in all required fields.');
            return;
        }

        if (String(professional.id || professional._id) === String(patient.id || patient._id)) {
            setError('Professional and patient cannot be the same person.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const dateTime = new Date(`${scheduledAt}T${scheduledTime}`);
            const payload = {
                scheduled_at: dateTime.toISOString(),
                consult_type: consultType,
                reason: reason.trim(),
                participants: [
                    {
                        participant_type: { id: 1, code: 'professional', name: 'Professional' },
                        ref_number: String(professional.id || professional._id),
                    },
                    {
                        participant_type: { id: 2, code: 'patient', name: 'Patient' },
                        ref_number: String(patient.id || patient._id),
                    },
                ],
                payment: fee ? { amount: Number(fee) } : undefined,
                additional_info: notes ? { notes: notes.trim() } : undefined
            };

            await ConsultService.createConsultation(payload as Partial<Consultation>);
            alert('Consultation scheduled successfully! 🎉');
            navigate(-1);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to schedule consultation.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl  space-y-10 animate-fade-in pb-20">
            <header className="space-y-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                    <ChevronLeft size={14} /> Back
                </button>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Schedule Consultation</h1>
                <p className="text-slate-500 font-medium">Create a new booking between a health professional and a patient.</p>
            </header>

            <div className="grid lg:grid-cols-2 gap-10">
                {/* Left Col: Participants */}
                <div className="space-y-8">
                    <section className="space-y-4">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest block px-1">Participants</label>

                        {/* Professional Picker */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Professional</p>
                            {professional ? (
                                <div className="p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50/30 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                                            {professional.firstName?.[0]}{professional.lastName?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{professional.firstName} {professional.lastName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{professional.role}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setProfessional(null)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                        <AlertCircle size={18} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setPickingRole('professional')}
                                    className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-slate-50 transition-all text-left flex items-center gap-3 text-slate-400"
                                >
                                    <Users size={20} />
                                    <span className="text-sm font-bold">Select Practitioner...</span>
                                </button>
                            )}
                        </div>

                        {/* Patient Picker */}
                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Patient</p>
                            {patient ? (
                                <div className="p-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                                            {patient.firstName?.[0]}{patient.lastName?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{patient.firstName} {patient.lastName}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Patient</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setPatient(null)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                        <AlertCircle size={18} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setPickingRole('patient')}
                                    className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-slate-50 transition-all text-left flex items-center gap-3 text-slate-400"
                                >
                                    <UserIcon size={20} />
                                    <span className="text-sm font-bold">Select Patient...</span>
                                </button>
                            )}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-widest block px-1">Consultation Type</label>
                        <div className="grid grid-cols-3 gap-3">
                            {CONSULT_TYPES.map(type => (
                                <button
                                    key={type.value}
                                    onClick={() => setConsultType(type.value)}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${consultType === type.value
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                        : 'border-slate-100 bg-white text-slate-400 hover:border-indigo-200'}`}
                                >
                                    {type.icon}
                                    <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Col: Details */}
                <div className="space-y-8">
                    <section className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Scheduled Date</label>
                            <InputField
                                type="date"
                                value={scheduledAt}
                                onChange={(e) => setScheduledAt(e.target.value)}
                                leftIcon={<Calendar size={18} />}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Scheduled Time</label>
                            <InputField
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                leftIcon={<Clock size={18} />}
                            />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Reason for Visit *</label>
                            <InputField
                                placeholder="Short description of the case..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                leftIcon={<Activity size={18} />}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Professional Fee (Optional)</label>
                            <InputField
                                type="number"
                                placeholder="Amount in local currency..."
                                value={fee}
                                onChange={(e) => setFee(e.target.value)}
                                leftIcon={<DollarSign size={18} />}
                            />
                        </div>
                    </section>

                    <section className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Internal Clinical Notes</label>
                        <textarea
                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                            placeholder="Private notes for the practitioner..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </section>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full h-14 rounded-2xl shadow-xl shadow-indigo-100 uppercase tracking-widest font-black"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        Review & Schedule
                    </Button>
                </div>
            </div>

            {/* Picker Modal Overlay */}
            <AnimatePresence>
                {pickingRole && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setPickingRole(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                        Select {pickingRole === 'professional' ? 'Practitioner' : 'Patient'}
                                    </h2>
                                    <button onClick={() => setPickingRole(null)} className="p-2 bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors">
                                        <ChevronLeft size={20} className="rotate-180" />
                                    </button>
                                </div>

                                <div className="relative">
                                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder={`Search by name or email...`}
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                    {isSearching ? (
                                        <div className="py-20 text-center text-slate-400">
                                            <Activity size={32} className="animate-spin mx-auto mb-4 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Searching Directory...</p>
                                        </div>
                                    ) : users.length > 0 ? (
                                        users.map(u => (
                                            <button
                                                key={u.id || u._id}
                                                onClick={() => {
                                                    const uId = String(u.id || u._id);
                                                    if (pickingRole === 'professional') {
                                                        if (patient && String(patient.id || patient._id) === uId) {
                                                            setError('This user is already selected as the patient.');
                                                            setPickingRole(null);
                                                            return;
                                                        }
                                                        setProfessional(u);
                                                    } else {
                                                        if (professional && String(professional.id || professional._id) === uId) {
                                                            setError('This user is already selected as the professional.');
                                                            setPickingRole(null);
                                                            return;
                                                        }
                                                        setPatient(u);
                                                    }
                                                    setPickingRole(null);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full p-4 rounded-2xl hover:bg-indigo-50 group flex items-center justify-between transition-all"
                                            >
                                                <div className="flex items-center gap-4 text-left">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black group-hover:bg-white transition-colors">
                                                        {u.firstName?.[0]}{u.lastName?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                                                        <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                                                    </div>
                                                </div>
                                                <Check size={18} className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center text-slate-400">
                                            <Users size={40} className="mx-auto mb-4 opacity-10" />
                                            <p className="text-sm font-bold italic">No matching results found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CreateConsultation;
