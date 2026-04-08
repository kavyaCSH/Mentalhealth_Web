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
    IndianRupee,
    Briefcase,
    ChevronRight,
    ClipboardCheck
} from 'lucide-react';
import { UserService } from '../../api/services/user.service';
import { ConsultService } from '../../api/services/consult.service';
import { ScheduleService } from '../../api/services/schedule.service';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import type { User } from '../../types/user.types';
import type { Consultation } from '../../types/common.types';
import type { TimeSlot } from '../../types/schedule.types';

const CONSULT_TYPES = [
    { value: 'virtual', label: 'Virtual', icon: <Video size={18} /> },
    { value: 'home', label: 'Home Visit', icon: <Home size={18} /> },
    { value: 'clinic', label: 'Clinic', icon: <Hospital size={18} /> },
];

const ROLES = [
    { value: 'psychiatrist', label: 'Psychiatrist', icon: <Briefcase size={24} /> },
    { value: 'psychologist', label: 'Psychologist', icon: <Users size={24} /> },
    { value: 'counselor', label: 'Counselor', icon: <Activity size={24} /> },
];

const STAGES = [
    { id: 1, name: 'Service Type' },
    { id: 2, name: 'Date & Time' },
    { id: 3, name: 'Provider' },
    { id: 4, name: 'Patient' },
    { id: 5, name: 'Final Details' },
];

const CreateConsultation = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialProfId = searchParams.get('professionalId');
    const initialPatientId = searchParams.get('patientId');

    // Wizard State
    const [step, setStep] = useState(1);

    // Form State
    const [consultType, setConsultType] = useState('virtual');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [professional, setProfessional] = useState<User | null>(null);
    const [patient, setPatient] = useState<User | null>(null);
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [fee, setFee] = useState('');

    // Fetch States
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial setup (if coming from links)
    useEffect(() => {
        if (initialProfId || initialPatientId) {
            // If prefilled, we might skip standard wizard rules, but for now just load them.
            if (initialProfId) fetchAndSetUser(initialProfId, 'professional');
            if (initialPatientId) fetchAndSetUser(initialPatientId, 'patient');
        }
    }, [initialProfId, initialPatientId]);

    const fetchAndSetUser = async (id: string, role: 'professional' | 'patient') => {
        try {
            const user = await UserService.getUserById(id);
            if (role === 'professional') {
                setProfessional(user);
                setSelectedRole(user.role || 'psychiatrist');
            }
            else setPatient(user);
        } catch (err) {
            console.error(`Failed to fetch ${role}:`, err);
        }
    };

    // Load Slots when entering Step 2 with Date
    useEffect(() => {
        if (step === 2 && selectedRole && selectedDate) {
            setLoadingSlots(true);
            // Calling the new Pooling API
            ScheduleService.getAvailableSlots({ role: selectedRole, date: selectedDate })
                .then(slots => {
                    // Fallback mock if API returns nothing (for demonstration)
                    if (slots.length === 0) {
                        const mockSlots: TimeSlot[] = [
                            { date: selectedDate, startTime: '09:00', endTime: '09:30', available: true },
                            { date: selectedDate, startTime: '10:00', endTime: '10:30', available: true },
                            { date: selectedDate, startTime: '14:00', endTime: '14:30', available: false },
                            { date: selectedDate, startTime: '15:30', endTime: '16:00', available: true },
                        ];
                        setAvailableSlots(mockSlots);
                    } else {
                        setAvailableSlots(slots);
                    }
                })
                .catch(e => console.error("Slot fetch error", e))
                .finally(() => setLoadingSlots(false));
        }
    }, [step, selectedRole, selectedDate]);

    // Handle User Search (for Provider in Step 3, Patient in Step 4)
    const handleSearch = useCallback(async () => {
        if (step !== 3 && step !== 4) return;
        setIsSearching(true);
        try {
            const roleFilter = step === 3
                ? selectedRole // strictly match selected category
                : 'patient';

            const res = await UserService.listUsers({
                role: roleFilter,
                search: searchQuery
            });
            setUsers((res as any).users || res || []);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setIsSearching(false);
        }
    }, [step, selectedRole, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (step === 3 || step === 4) handleSearch();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, step, handleSearch]);

    const handleSubmit = async () => {
        if (!professional || !patient || !selectedDate || !selectedSlot || !reason) {
            setError('Please complete all wizard steps.');
            return;
        }

        if (String(professional.id || professional._id) === String(patient.id || patient._id)) {
            setError('Professional and patient cannot be the same person.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const dateTime = new Date(`${selectedDate}T${selectedSlot.startTime}`);
            const payload = {
                scheduled_at: dateTime.toISOString(),
                consult_type: consultType,
                reason: reason.trim(),
                participants: [
                    {
                        participant_type: { id: 1, code: 'professional', name: 'Professional' },
                        ref_number: String(professional.userId),
                    },
                    {
                        participant_type: { id: 2, code: 'patient', name: 'Patient' },
                        ref_number: String(patient.userId),
                    },
                ],
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

    const nextStep = () => {
        if (step === 1 && (!selectedRole || !consultType)) return setError("Please select a role and consult type.");
        if (step === 2 && (!selectedDate || !selectedSlot)) return setError("Please select a date and time slot.");
        if (step === 3 && !professional) return setError("Please select a provider.");
        if (step === 4 && !patient) return setError("Please select a patient.");
        
        setError(null);
        setStep(s => Math.min(s + 1, 5));
        setSearchQuery(''); // Reset search on step change
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in pb-20">
            <header className="space-y-4 text-center">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
                        className="flex items-center gap-2 text-xs font-black text-muted uppercase tracking-widest hover:text-indigo-500 transition-colors"
                    >
                        <ChevronLeft size={14} /> {step > 1 ? 'Previous Step' : 'Back'}
                    </button>
                    {step < 5 && (
                        <button
                            onClick={nextStep}
                            className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
                        >
                            Skip / Next <ChevronRight size={14} />
                        </button>
                    )}
                </div>
                
                <h1 className="text-4xl font-black text-main tracking-tight">Schedule Consultation</h1>
                <p className="text-muted font-medium">Follow the wizard to securely book an appointment through the Schedule Engine.</p>
            </header>

            {/* Progress Bar */}
            <div className="flex items-center justify-between relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-full before:h-1 before:bg-page/50 before:border-b before:border-border-card before:-z-10">
                {STAGES.map((s) => (
                    <div key={s.id} className="flex flex-col items-center gap-2 bg-page px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors ${
                            step === s.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' :
                            step > s.id ? 'bg-emerald-500 text-white border-emerald-500' :
                            'bg-card text-muted border-border-card'
                        }`}>
                            {step > s.id ? <Check size={14} /> : s.id}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest hidden md:block ${
                            step === s.id ? 'text-indigo-500' :
                            step > s.id ? 'text-emerald-500' : 'text-muted'
                        }`}>
                            {s.name}
                        </span>
                    </div>
                ))}
            </div>

            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-error/10 text-error text-xs font-bold rounded-xl border border-error/20 flex items-center gap-2 justify-center">
                    <AlertCircle size={16} /> {error}
                </motion.div>
            )}

            <div className="card-premium p-8 border-border-card min-h-[400px]">
                <AnimatePresence mode="wait">
                    
                    {/* STEP 1: ROLE & TYPE */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <section>
                                <h2 className="text-sm font-black text-main uppercase tracking-widest mb-4">Select Target Clinical Specialty</h2>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {ROLES.map(role => (
                                        <button
                                            key={role.value}
                                            onClick={() => setSelectedRole(role.value)}
                                            className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                                                selectedRole === role.value ? 'border-indigo-600 bg-indigo-500/10 text-indigo-500' : 'border-border-card bg-card text-muted hover:border-indigo-500/50'
                                            }`}
                                        >
                                            {role.icon}
                                            <span className="font-bold">{role.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-sm font-black text-main uppercase tracking-widest mb-4">Delivery Method</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    {CONSULT_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            onClick={() => setConsultType(type.value)}
                                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                                                consultType === type.value ? 'border-indigo-600 bg-indigo-500/10 text-indigo-500' : 'border-border-card bg-card text-muted hover:border-indigo-500/50'
                                            }`}
                                        >
                                            {type.icon}
                                            <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <Button onClick={nextStep} variant="primary" className="w-full mt-6" size="lg">Continue to Scheduling</Button>
                        </motion.div>
                    )}

                    {/* STEP 2: DATE & TIME SLOT */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div>
                                <h2 className="text-sm font-black text-main uppercase tracking-widest mb-1">Schedule Details</h2>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-6">Select a clinical availability slot</p>
                            </div>

                            <section className="space-y-4">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest block px-1">Select Date</label>
                                <InputField
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    leftIcon={<Calendar size={18} />}
                                />
                            </section>

                            <AnimatePresence>
                                {selectedDate && (
                                    <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                                        <label className="text-sm font-black text-main uppercase tracking-widest flex items-center gap-2 mt-6">
                                            <Clock size={16} /> Available Slots for {selectedRole}
                                        </label>
                                        
                                        {loadingSlots ? (
                                            <div className="py-8 flex justify-center"><Activity className="animate-spin text-indigo-500" /></div>
                                        ) : availableSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                                {availableSlots.map((slot, idx) => (
                                                    <button
                                                        key={idx}
                                                        disabled={!slot.available}
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                                                            !slot.available ? 'bg-page border-border-card text-muted opacity-30 cursor-not-allowed' :
                                                            selectedSlot?.startTime === slot.startTime ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-500/20' :
                                                            'bg-card border-border-card text-main hover:border-indigo-500/60'
                                                        }`}
                                                    >
                                                        {slot.startTime}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-6 bg-orange-500/10 text-orange-500 rounded-xl border border-orange-500/20 text-center text-sm font-bold">
                                                No time slots available for this role on the selected date. Try another day.
                                            </div>
                                        )}
                                    </motion.section>
                                )}
                            </AnimatePresence>

                            <Button onClick={nextStep} variant="primary" className="w-full mt-6" size="lg" disabled={!selectedDate || !selectedSlot}>Find Available Providers</Button>
                        </motion.div>
                    )}

                    {/* STEP 3: PROVIDER (USER SEARCH) */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h2 className="text-sm font-black text-main uppercase tracking-widest mb-4">Select {selectedRole}</h2>
                            
                            {professional && (
                                <div className="p-4 mb-4 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
                                            {professional.firstName?.[0]}{professional.lastName?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-main">{professional.firstName} {professional.lastName}</p>
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{professional.role}</p>
                                        </div>
                                    </div>
                                    <Check size={20} className="text-emerald-500" />
                                </div>
                            )}

                            <div className="relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                                <input
                                    type="text"
                                    placeholder={`Search directly for a ${selectedRole}...`}
                                    className="w-full bg-page border border-border-card rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-main"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {isSearching ? (
                                    <div className="py-10 text-center"><Activity size={24} className="animate-spin text-indigo-400 mx-auto" /></div>
                                ) : users.length > 0 ? (
                                    users.map(u => (
                                        <button
                                            key={u.id || u._id}
                                            onClick={() => setProfessional(u)}
                                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                                                professional?.id === u.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-border-card hover:border-indigo-500/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center font-black text-indigo-500">
                                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-main text-sm">{u.firstName} {u.lastName}</p>
                                                    <p className="text-[10px] text-muted font-bold">{u.email}</p>
                                                </div>
                                            </div>
                                            {(professional?.id === u.id || professional?._id === u._id) && <Check size={18} className="text-indigo-500" />}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-center text-sm font-bold text-muted py-10">No {selectedRole}s found.</p>
                                )}
                            </div>

                            <Button onClick={nextStep} variant="primary" className="w-full mt-6" size="lg" disabled={!professional}>Confirm Provider</Button>
                        </motion.div>
                    )}

                    {/* STEP 4: PATIENT (USER SEARCH) */}
                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            <h2 className="text-sm font-black text-main uppercase tracking-widest mb-4">Select Patient</h2>

                            {patient && (
                                <div className="p-4 mb-4 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black">
                                            {patient.firstName?.[0]}{patient.lastName?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-main">{patient.firstName} {patient.lastName}</p>
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Patient</p>
                                        </div>
                                    </div>
                                    <Check size={20} className="text-emerald-500" />
                                </div>
                            )}

                            <div className="relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search by patient name or email..."
                                    className="w-full bg-page border border-border-card rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-main"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {isSearching ? (
                                    <div className="py-10 text-center"><Activity size={24} className="animate-spin text-indigo-400 mx-auto" /></div>
                                ) : users.length > 0 ? (
                                    users.map(u => (
                                        <button
                                            key={u.id || u._id}
                                            onClick={() => setPatient(u)}
                                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                                                patient?.id === u.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-border-card hover:border-indigo-500/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center font-black text-indigo-500">
                                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-main text-sm">{u.firstName} {u.lastName}</p>
                                                    <p className="text-[10px] text-muted font-bold uppercase">{u.email}</p>
                                                </div>
                                            </div>
                                            {(patient?.id === u.id || patient?._id === u._id) && <Check size={18} className="text-indigo-500" />}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-center text-sm font-bold text-muted py-10">No patients found.</p>
                                )}
                            </div>

                            <Button onClick={nextStep} variant="primary" className="w-full mt-6" size="lg" disabled={!patient}>Review Final Details</Button>
                        </motion.div>
                    )}

                    {/* STEP 5: FINAL DETAILS & SUBMIT */}
                    {step === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                            {/* Summary Box */}
                            <div className="bg-page/50 p-6 rounded-2xl border border-border-card space-y-4 mb-6">
                                <h3 className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                    <ClipboardCheck size={14} /> Appointment Summary
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-muted">Date & Time</p>
                                        <p className="font-bold text-main">{selectedDate} @ {selectedSlot?.startTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted">Service Area</p>
                                        <p className="font-bold text-main capitalize">{consultType} {selectedRole}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted">Provider</p>
                                        <p className="font-bold text-indigo-500">{professional?.firstName} {professional?.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted">Patient</p>
                                        <p className="font-bold text-main">{patient?.firstName} {patient?.lastName}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Reason for Visit *</label>
                                <InputField
                                    placeholder="Short description of the clinical case..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    leftIcon={<Activity size={18} />}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Internal Notes</label>
                                    <InputField
                                        placeholder="Private notes..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <Button onClick={handleSubmit} variant="primary" className="w-full mt-6 h-14" size="lg" isLoading={isSubmitting}>
                                Confirm & Dispatch Invites
                            </Button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default CreateConsultation;
