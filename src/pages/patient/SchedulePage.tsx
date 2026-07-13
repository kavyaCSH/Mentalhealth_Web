import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Video,
    Plus,
    X,
    CheckCircle2,
    Activity,
    AlertCircle,
    Clock,
    Search,
    Brain,
    UserPlus,
    Users,
    MessageCircle,
    Stethoscope
} from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../../api/client';
import { TeleConsultService } from '../../api/services/teleconsult.service';
import { SpecialistService } from '../../api/services/specialist.service';
import { UserService } from '../../api/services/user.service';
import type { RootState } from '../../store';
import type { Consultation, Participant } from '../../types/common.types';
import type { User } from '../../types/user.types';

const SchedulePage = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Booking Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectionStep, setSelectionStep] = useState<'type' | 'date' | 'time' | 'details'>('type');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [bookingReason, setBookingReason] = useState('');
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingTime, setBookingTime] = useState(''); // Empty initially
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
    const [hasSelectedTime, setHasSelectedTime] = useState(false);

    // Join error notification state
    const [joinError, setJoinError] = useState<string | null>(null);

    // Reschedule State
    const [reschedulingAppt, setReschedulingAppt] = useState<Consultation | null>(null);

    // Specialist State
    const [specialists, setSpecialists] = useState<User[]>([]);
    const [selectedSpecialist, setSelectedSpecialist] = useState<User | null>(null);

    // Fetch consultations
    const fetchSchedule = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) setIsLoading(true);
            const res = await TeleConsultService.listConsultations({
                page: 1,
                limit: 50,
                userId: user?.userId || user?.id,
            });
            const consultData = res.data?.consults || (res.data as unknown as Consultation[]) || [];
            setAppointments(Array.isArray(consultData) ? consultData : []);
        } catch {
            setAppointments([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const enrollPatient = async () => {
            if (user?.role === 'patient') {
                console.log('[Schedule] Ensuring clinical enrollment...');
                await UserService.deepEnroll();
            }
        }
        enrollPatient();
    }, [user]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const fetchSpecialists = async (role?: string, date?: string, time?: string) => {
        try {
            setIsAvailabilityLoading(true);
            const params: any = {};
            if (role) params.role = role;
            if (date) params.date = date;
            if (time) params.time = time;

            const res = await SpecialistService.getDirectory(params) as any;
            const data = res.data || res;

            let list: User[] = [];
            if (Array.isArray(data)) {
                list = data;
            } else if (data?.masters && Array.isArray(data.masters)) {
                list = data.masters;
            } else if (data?.data && Array.isArray(data.data)) {
                list = data.data;
            }

            list = list.filter((s: User) => String(s.id || s._id || s.userId) !== String(user?.id || user?._id || user?.userId));

            // Strict filter: only include specialists who actually have >0 slots available on requested date
            if (date && list.length > 0) {
                const availabilityChecks = await Promise.all(
                    list.map(async (doc) => {
                        try {
                            const specId = ((doc as any).userId || (doc as any)._id || doc.id || '').toString();
                            const slotsRes = await SpecialistService.getAvailableSlots({ specialist_id: specId, date, available: true });
                            const slots = slotsRes.data?.slots || slotsRes.data || [];
                            const availableSlots = Array.isArray(slots) ? slots.filter((s: any) => typeof s === 'string' ? true : s.available !== false) : [];
                            return { id: specId, hasSlots: availableSlots.length > 0 };
                        } catch {
                            return { id: ((doc as any).userId || (doc as any)._id || doc.id || '').toString(), hasSlots: false };
                        }
                    })
                );
                const validIds = new Set(availabilityChecks.filter(c => c.hasSlots).map(c => c.id));
                list = list.filter(s => validIds.has(((s as any).userId || (s as any)._id || s.id || '').toString()));
            }

            setSpecialists(list);
        } catch (err) {
            console.error('Error fetching specialists:', err);
            setSpecialists([]);
        } finally {
            setIsAvailabilityLoading(false);
        }
    };

    const processAndSortSlots = (slots: string[], _dateStr: string) => {
        // Do NOT filter by client-side time.
        // The live API (IST server) already returns only future available slots.
        // Client-side time filtering breaks when server timezone ≠ browser timezone.
        const parseTime = (timeStr: string) => {
            const match = timeStr.trim().toLowerCase().match(/^(\d+)[.:](\d+)\s*(am|pm)?$/);
            if (match) {
                let h = parseInt(match[1]);
                const m = parseInt(match[2]);
                const ampm = match[3];
                if (ampm === 'pm' && h < 12) h += 12;
                if (ampm === 'am' && h === 12) h = 0;
                return h * 60 + m;
            }
            return 0;
        };

        return slots
            .filter(slot => !!slot)
            .sort((a, b) => parseTime(a) - parseTime(b));
    };

    const fetchAvailableSlotsBySpecialist = async (specialistId: string, date: string) => {
        try {
            setIsAvailabilityLoading(true);
            const res = await SpecialistService.getAvailableSlots({ specialist_id: specialistId, date, available: true });
            const slots = res.data?.slots || res.data || [];
            const slotTimes = Array.isArray(slots)
                ? slots
                    .filter((s: any) => typeof s === 'string' ? true : s.available !== false)
                    .map((s: any) => typeof s === 'string' ? s : s.startTime || s.time)
                : [];
            setAvailableSlots(processAndSortSlots(slotTimes.filter(Boolean) as string[], date));
        } catch (err) {
            console.error('Error fetching slots:', err);
            setAvailableSlots([]);
        } finally {
            setIsAvailabilityLoading(false);
        }
    };

    const fetchPooledSlots = async (role: string, date: string) => {
        try {
            setIsAvailabilityLoading(true);
            const res = await SpecialistService.getAvailableSlots({ role, date, available: true });
            const slots = res.data?.slots || res.data || [];
            const slotTimes = Array.isArray(slots)
                ? slots
                    .filter((s: any) => typeof s === 'string' ? true : s.available !== false)
                    .map((s: any) => typeof s === 'string' ? s : s.startTime || s.time)
                : [];
            setAvailableSlots(processAndSortSlots(slotTimes.filter(Boolean) as string[], date));
        } catch (err) {
            console.error('Error fetching pooled slots:', err);
            setAvailableSlots([]);
        } finally {
            setIsAvailabilityLoading(false);
        }
    };

    const fetchSpecialistsForSlot = async (role: string, date: string, time: string) => {
        try {
            setIsAvailabilityLoading(true);
            const res = await SpecialistService.getDirectory({ role, date, time }) as any;
            const data = res.data || res;
            let list: User[] = [];
            if (Array.isArray(data)) {
                list = data;
            } else if (data?.masters && Array.isArray(data.masters)) {
                list = data.masters;
            } else if (data?.data && Array.isArray(data.data)) {
                list = data.data;
            }
            setSpecialists(list.filter((s: User) => String(s.id || s._id || s.userId) !== String(user?.id || user?._id || user?.userId)));
        } catch (err) {
            console.error('Error fetching specialists for slot:', err);
            setSpecialists([]);
        } finally {
            setIsAvailabilityLoading(false);
        }
    };

    useEffect(() => {
        if (isModalOpen && selectionStep === 'time' && selectedRole && bookingDate) {
            fetchPooledSlots(selectedRole, bookingDate);
        }
    }, [isModalOpen, selectionStep, selectedRole, bookingDate]);

    useEffect(() => {
        if (isModalOpen && selectionStep === 'time' && hasSelectedTime && selectedRole && bookingDate && bookingTime) {
            fetchSpecialistsForSlot(selectedRole, bookingDate, bookingTime);
        }
    }, [isModalOpen, selectionStep, hasSelectedTime, selectedRole, bookingDate, bookingTime]);

    useEffect(() => {
        if (isModalOpen && selectionStep === 'time' && selectedSpecialist && !selectedRole && bookingDate) {
            const specId = ((selectedSpecialist as User).userId || (selectedSpecialist as User & { _id?: string })._id || selectedSpecialist.id || '').toString();
            fetchAvailableSlotsBySpecialist(specId, bookingDate);
        }
    }, [isModalOpen, selectionStep, selectedSpecialist, selectedRole, bookingDate]);

    useEffect(() => {
        const action = searchParams.get('action');
        const professionalId = searchParams.get('professionalId');
        const consultId = searchParams.get('consultId');

        if (professionalId && !selectedSpecialist) {
            const fetchAndPreselect = async () => {
                try {
                    const res = await api.get(`/users/${professionalId}`);
                    const prof = res.data?.data || res.data;
                    if (prof) {
                        openBookingModal(prof as User);
                        navigate('/schedule', { replace: true });
                    }
                } catch (err) {
                    console.error('Failed to preselect specialist', err);
                }
            };
            fetchAndPreselect();
        } else if (action === 'reschedule' && consultId && !isModalOpen) {
            // Fetch the appointment then open the reschedule modal at the date step
            const loadAndReschedule = async () => {
                try {
                    const res = await TeleConsultService.getConsultationDetail(consultId);
                    const appt = res.data as Consultation;
                    if (appt) {
                        handleRescheduleClick(appt);
                        navigate('/schedule', { replace: true });
                    }
                } catch (err) {
                    console.error('Failed to load consultation for reschedule', err);
                }
            };
            loadAndReschedule();
        } else if (action === 'book' && !isModalOpen) {
            openBookingModal();
            navigate('/schedule', { replace: true });
        }
    }, [searchParams, navigate]);


    const openBookingModal = (preselected?: User) => {
        setBookingReason('');
        setSelectedSpecialist(preselected || null);
        setSelectedRole(null);
        setSelectionStep(preselected ? 'date' : 'type');
        setSearchQuery('');
        setBookingError('');
        setBookingSuccess(false);
        const today = new Date();
        setBookingDate(today.toISOString().split('T')[0]);
        setBookingTime('');
        setHasSelectedTime(false);
        setReschedulingAppt(null); // Clear rescheduling state for new booking
        setIsModalOpen(true);
    };

    const handleRescheduleClick = (appt: Consultation) => {
        setReschedulingAppt(appt);
        setBookingReason(appt.reason || '');

        const dt = new Date(appt.scheduled_at || '');
        if (!isNaN(dt.getTime())) {
            setBookingDate(dt.toISOString().split('T')[0]);
            const hours = dt.getHours().toString().padStart(2, '0');
            const minutes = dt.getMinutes().toString().padStart(2, '0');
            setBookingTime(`${hours}:${minutes}`);
        }

        // Robust specialist lookup so slot fetching works correctly
        const pub = appt.participants?.find(p => p.role === 'publisher') ||
            appt.participants?.find(p => p.participant_type?.code === 'professional') ||
            appt.participants?.[0];

        if (pub) {
            const firstName = (pub as any).firstName || (pub.participant_info as any)?.firstName || '';
            const lastName = (pub as any).lastName || (pub.participant_info as any)?.lastName || '';
            const name = pub.name || (pub.participant_info as any)?.name || `${firstName} ${lastName}`.trim();

            setSelectedSpecialist({
                id: pub.ref_number || (pub as any).id || (pub as any)._id || '',
                name: name || 'Specialist',
                firstName,
                lastName,
                participant_info: pub.participant_info
            } as any);
        }

        setBookingError('');
        setBookingSuccess(false);
        setSelectionStep('date');   // Start at date picker so user can select a new slot
        setIsModalOpen(true);
    };

    const handleAction = async (action: string, appt: Consultation) => {
        const apptId = String(appt.id || appt.consult_id || appt._id);
        console.log("Action:", action, "Full Appt:", appt);
        console.log("Extracted ID:", apptId);
        if (!apptId || apptId === 'undefined') return;

        try {
            if (action === 'cancel') {
                if (window.confirm('Are you sure you want to cancel this consultation?')) {
                    await TeleConsultService.cancelConsultation(apptId);
                    fetchSchedule(true);
                }
            } else if (action === 'billing') {
                try {
                    const billing = await TeleConsultService.getBilling(apptId);
                    alert(`Billing Info: ${billing.data?.amount} ${billing.data?.currency}\nStatus: ${billing.data?.status}`);
                } catch (err: unknown) {
                    const error = err as { response?: { data?: { message?: string } } };
                    alert(error.response?.data?.message || 'Could not fetch billing details.');
                }
            } else if (action === 'join') {
                console.log("Joining Consult:", JSON.stringify(appt, null, 2));
                const subscriber = appt.participants?.find((p: Participant) =>
                    p.role === 'subscriber' ||
                    p.participant_type?.code === 'patient' ||
                    p.participant_type?.code === 'subscriber'
                );
                const token = subscriber?.token || appt.subscriber_token || appt.token;

                // Always navigate to the teleconsult page.
                // The Teleconsult component has its own full token resolution that
                // fetches fresh data from the API — so pass whatever token we have
                // (even null) and let the page handle it.
                navigate(`/teleconsult/${apptId}`, {
                    state: {
                        appointment: appt,
                        ...(token ? { token } : {})
                    }
                });

                // Background validation (optional) to log status without blocking the user
                if (token) {
                    TeleConsultService.tokenValidate(token, 'subscriber').catch(err =>
                        console.warn('[Schedule] Background token validation failed:', err)
                    );
                }
            }
        } catch (err) {
            console.error('Action Error:', err);
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedSpecialist || !bookingReason.trim() || !bookingDate || !bookingTime) {
            setBookingError('Please complete all selection steps including time slot.');
            return;
        }

        setIsBooking(true);
        setBookingError('');
        try {
            const [y, m, d] = (bookingDate || new Date().toISOString().split('T')[0]).split('-').map(Number);
            
            let h = 10, min = 0;
            const timeMatch = (bookingTime || '10:00').trim().toLowerCase().match(/^(\d+)(?:[.:](\d+))?\s*(am|pm)?$/);
            if (timeMatch) {
                h = parseInt(timeMatch[1], 10);
                min = parseInt(timeMatch[2] || '0', 10);
                const ampm = timeMatch[3];
                if (ampm === 'pm' && h < 12) h += 12;
                if (ampm === 'am' && h === 12) h = 0;
            } else {
                const parts = (bookingTime || '10:00').split(':').map(p => parseInt(p, 10));
                h = parts[0];
                min = parts[1] || 0;
            }
            
            if (isNaN(y) || isNaN(h) || isNaN(min)) {
                throw new Error('Invalid date or time selected.');
            }

            const dt = new Date(y, m - 1, d, h, min);
            const scheduledAt = dt.toISOString();

            const profIdRaw = ((selectedSpecialist as User).userId || (selectedSpecialist as User & { _id?: string })._id || selectedSpecialist.id || '').toString();
            const patIdRaw  = (user?.userId || user?._id || user?.id || '').toString();

            if (!profIdRaw || !patIdRaw) {
                throw new Error('Missing identity data. Please refresh and try again.');
            }

            // Use numeric ID if it's a pure number, otherwise keep as string
            // (Backend accepts both; NaN from Number("uuid") would cause 500)
            const toRef = (raw: string) => /^\d+$/.test(raw) ? Number(raw) : raw;
            const profRef = toRef(profIdRaw);
            const patRef  = toRef(patIdRaw);

            console.log(`[SchedulePage] profIdRaw="${profIdRaw}" profRef=${profRef}`);
            console.log(`[SchedulePage] patIdRaw="${patIdRaw}"  patRef=${patRef}`);

            if (typeof profRef === 'number' && isNaN(profRef)) throw new Error(`Invalid specialist ID: "${profIdRaw}"`);
            if (typeof patRef  === 'number' && isNaN(patRef))  throw new Error(`Invalid patient ID: "${patIdRaw}"`);

            // Backend expects ref_number as a number (integer), not string
            // participant_info is NOT sent — the test-book.cjs that works doesn't include it
            const submissionData = {
                scheduled_at: scheduledAt,
                reason: bookingReason.trim(),
                consult_type: 'virtual',
                participants: [
                    { participant_type: { code: 'professional' }, ref_number: profRef },
                    { participant_type: { code: 'patient' },      ref_number: patRef  }
                ],
                additional_info: { notes: bookingReason.trim(), referred_by: 'Self' }
            };

            const rawTargetId = reschedulingAppt?.id || reschedulingAppt?.consult_id || reschedulingAppt?._id;
            const targetId = rawTargetId ? String(rawTargetId) : '';
            
            console.log(`[SchedulePage] ${reschedulingAppt ? 'Rescheduling' : 'Booking'} — Payload:`, JSON.stringify(submissionData, null, 2));

            const res: any = reschedulingAppt
                ? await TeleConsultService.rescheduleConsultation(targetId, scheduledAt)
                : await TeleConsultService.createConsultation(submissionData);

            // Handle robust response formats (Mobile vs Web backend variance)
            const isSuccess = res.success || res.code === 201 || res.code === 200 || 
                             res.status === 'success' || (res.data && (res.data.success || res.data.consult_id));

            if (isSuccess) {
                console.log("Appointment confirmed successfully.");
                setBookingSuccess(true);
                setTimeout(() => {
                    setIsModalOpen(false);
                    fetchSchedule(true);
                }, 1800);
            } else {
                setBookingError(res.message || 'The server rejected the appointment. Possibly the slot was just taken.');
            }
        } catch (error: any) {
            console.error("Booking submission failed:", error);
            const apiErrorMsg = error.response?.data?.message || error.message || 'Connection failed. Check your network.';
            setBookingError(apiErrorMsg);
        } finally {
            setIsBooking(false);
        }
    };

    // Calendar & Layout Helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];
        for (let i = firstDay.getDay() - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), isCurrentMonth: false });
        for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        while (days.length < 42) days.push({ date: new Date(year, month + 1, days.length - (lastDay.getDate() + firstDay.getDay()) + 1), isCurrentMonth: false });
        return days;
    };

    const isSameDate = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();

    const dayAppointments = appointments.filter((e) => isSameDate(new Date(e.scheduled_at || ''), selectedDate));

    return (
        <div className="min-h-screen bg-page pb-20">
            {/* Join Error Toast */}
            <AnimatePresence>
                {joinError && (
                    <motion.div
                        initial={{ opacity: 0, y: -80, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -80, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-md"
                    >
                        <div className="mx-4 bg-white border-2 border-amber-200 rounded-2xl shadow-2xl shadow-amber-100/60 overflow-hidden">
                            <div className="flex items-start gap-4 p-5">
                                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 border border-amber-200">
                                    <Clock size={20} className="text-amber-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 leading-tight">Session Not Ready Yet</p>
                                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{joinError}</p>
                                </div>
                                <button
                                    onClick={() => setJoinError(null)}
                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shrink-0"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            {/* Auto-dismiss progress bar */}
                            <motion.div
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: 0 }}
                                transition={{ duration: 5, ease: 'linear' }}
                                style={{ transformOrigin: 'left' }}
                                className="h-1 bg-amber-400"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="max-w-7xl p-8 space-y-8 animate-fade-in">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-5xl font-black text-main tracking-tight leading-tight">Appointments</h3>
                        <p className="text-muted font-semibold mt-2 flex items-center gap-2">
                            <CalendarIcon size={18} className="text-indigo-500" />
                            Your clinical schedule
                        </p>
                    </div>
                    <button
                        onClick={() => openBookingModal()}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-200 hover:scale-105 transition-all"
                    >
                        <Plus size={24} /> Book Appointment
                    </button>
                </header>

                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <CalendarIcon size={120} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="w-14 h-14 bg-card/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <CalendarIcon size={28} />
                            </div>
                            <div>
                                <p className="text-4xl font-black">{dayAppointments.length}</p>
                                <p className="text-white/70 font-bold uppercase tracking-widest text-[10px] mt-1">
                                    Appointments for {selectedDate.toLocaleDateString('default', { day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-card rounded-[2.5rem] p-8 shadow-sm border border-border-card flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-main">Today's Focus</h3>
                            <p className="text-muted text-sm font-medium">You have {appointments.filter(a => isSameDate(new Date(a.scheduled_at || ''), new Date())).length} sessions today</p>
                        </div>
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-12 h-12 rounded-full border-4 border-white shadow-sm" alt="patient" />
                            ))}
                            <div className="w-12 h-12 rounded-full border-4 border-white bg-page flex items-center justify-center text-xs font-black text-muted opacity-80">
                                +{Math.max(0, appointments.length - 3)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Left: Premium Calendar */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-card rounded-[3rem] p-8 shadow-sm border border-border-card">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h2 className="text-xl font-black text-main">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 bg-page hover:bg-slate-100 rounded-2xl text-muted transition-all">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 bg-page hover:bg-slate-100 rounded-2xl text-muted transition-all">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                    <div key={day} className="text-[11px] font-black text-muted opacity-80 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-2">
                                {getDaysInMonth(currentDate).map((item, i) => {
                                    const isSelected = isSameDate(item.date, selectedDate);
                                    const isToday = isSameDate(item.date, new Date());
                                    const hasAppt = appointments.some(a => isSameDate(new Date(a.scheduled_at || ''), item.date));

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(item.date)}
                                            className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-sm font-black transition-all relative
                                                ${isSelected ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-110 z-10' :
                                                    !item.isCurrentMonth ? 'text-slate-200' : 'text-main opacity-90 hover:bg-indigo-50'}
                                                ${isToday && !isSelected ? 'border-2 border-indigo-100' : ''}
                                            `}
                                        >
                                            {item.date.getDate()}
                                            {hasAppt && !isSelected && (
                                                <div className="absolute bottom-2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    {/* Right: Appointment List with Mobile-Aligned Cards */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-black text-main tracking-tight">
                                {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h2>
                            <span className="text-[10px] font-black text-muted opacity-80 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                {dayAppointments.length} Items
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="h-96 flex flex-col items-center justify-center opacity-40">
                                <Activity className="animate-spin text-indigo-600 mb-6" size={48} />
                                <p className="font-black text-muted opacity-80 uppercase tracking-[0.2em] text-[10px]">Syncing Schedule</p>
                            </div>
                        ) : dayAppointments.length > 0 ? (
                            <div className="space-y-6">
                                {dayAppointments.map((appt, idx) => {
                                    const dt = new Date(appt.scheduled_at || '');
                                    const statusObj = appt.consult_current_status || appt.consult_status;
                                    const statusName = typeof statusObj === 'string' ? statusObj : statusObj?.name || 'Scheduled';
                                    const statusSlug = typeof statusObj === 'string' ? statusObj.toLowerCase() : statusObj?.slug || statusName.toLowerCase();
                                    const isVirtual = appt.consult_type === 'virtual';

                                    const s = statusName.toLowerCase();
                                    const sl = statusSlug.toLowerCase();

                                    const isScheduled = sl === 'scheduled' || s === 'scheduled' || sl === 'new' || s === 'new';
                                    const isInProgress = sl === 'in_progress' || s === 'in progress' || s === 'in-progress' || s === 'waiting';
                                    const isCancelable = isScheduled || isInProgress;
                                    const isActive = isInProgress || appt.active || (Math.abs(Date.now() - dt.getTime()) < 3600000 && isScheduled);

                                    const colorsMap: Record<string, string> = {
                                        scheduled: 'bg-blue-500',
                                        new: 'bg-blue-500',
                                        completed: 'bg-emerald-500',
                                        cancelled: 'bg-rose-500',
                                        canceled: 'bg-rose-500',
                                        in_progress: 'bg-amber-500',
                                        waiting: 'bg-amber-500'
                                    };
                                    const color = colorsMap[sl] || colorsMap[s] || 'bg-indigo-500';

                                    return (
                                        <motion.div
                                            key={appt.id || idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="bg-card rounded-[3.5rem] overflow-hidden border border-border-card shadow-sm hover:shadow-2xl hover:shadow-indigo-50 transition-all group"
                                        >
                                            <div className="flex flex-col md:flex-row">
                                                <div className={`w-2 md:w-3 ${color} shrink-0`} />
                                                <div className="p-8 flex-1">
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div className="flex items-center gap-8">
                                                            <div className={`w-16 h-16 rounded-3xl ${color}/10 flex items-center justify-center`}>
                                                                {isVirtual ? <Video className={color.replace('bg-', 'text-')} size={28} /> : <MapPin className={color.replace('bg-', 'text-')} size={28} />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-2xl font-black text-main leading-none">
                                                                        {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                    {isActive && (
                                                                        <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase animate-pulse">
                                                                            <Activity size={10} /> Live
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] font-black text-muted opacity-80 tracking-[0.2em] uppercase mt-2">
                                                                    {isVirtual ? 'Virtual' : 'Clinical'} Consult • ID #{appt.id || appt.consult_id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 ${color.replace('bg-', 'border-')}/10 ${color.replace('bg-', 'bg-')}/5 ${color.replace('bg-', 'text-')}`}>
                                                            {statusName}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <p className="text-main opacity-90 font-bold text-lg">{appt.reason || 'Mental Health Consultation'}</p>
                                                        <div className="flex flex-wrap gap-4">
                                                            {appt.participants?.map((p, pi) => (
                                                                <div key={pi} className="flex items-center gap-3 bg-page px-4 py-2 rounded-xl border border-border-card">
                                                                    <img
                                                                        src={`https://i.pravatar.cc/100?u=${p.ref_number || pi}`}
                                                                        alt="avatar"
                                                                        className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                                                                    />
                                                                    <span className="text-sm font-bold text-main opacity-90">
                                                                        {(p.participant_info?.name as string) || p.name || p.participant_type?.name || 'Participant'}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {(isScheduled || isInProgress || isActive) && (
                                                        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-slate-50">
                                                            {isVirtual && (isScheduled || isInProgress || isActive) && (
                                                                <button onClick={() => handleAction('join', appt)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-xs shadow-xl shadow-indigo-200 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                                                                    <Video size={16} /> Join Now
                                                                </button>
                                                            )}
                                                            {/* <button
                                                                onClick={() => handleAction('billing', appt)}
                                                                className="px-5 py-3 bg-page text-muted rounded-xl font-black text-xs border border-border-card hover:bg-card transition-all"
                                                            >
                                                                Billing
                                                            </button> */}
                                                            <button
                                                                onClick={() => handleRescheduleClick(appt)}
                                                                className="px-5 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs border border-indigo-100 hover:bg-indigo-100 transition-all font-sans"
                                                            >
                                                                Reschedule
                                                            </button>
                                                            {isCancelable && (
                                                                <button
                                                                    onClick={() => handleAction('cancel', appt)}
                                                                    className="px-5 py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-xs border border-rose-100 hover:bg-rose-100 transition-all"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-card rounded-[3.5rem] p-16 text-center border-2 border-dashed border-border-card">
                                <div className="w-24 h-24 bg-page rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
                                    <CalendarIcon size={48} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-black text-main mb-3">Quiet Day Ahead</h3>
                                <p className="text-muted opacity-80 font-medium max-w-sm mx-auto leading-relaxed">
                                    No appointments scheduled for this date. Use the booking tool to create a new session.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Replicated Mobile Booking Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60]" onClick={() => !isBooking && setIsModalOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.9 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-card rounded-[2.5rem] shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {bookingSuccess ? (
                                <div className="p-16 text-center space-y-8">
                                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-2xl shadow-emerald-100">
                                        <CheckCircle2 size={56} />
                                    </div>
                                    <h2 className="text-4xl font-black text-main mt-6 tracking-tight">Booked! 🎉</h2>
                                    <p className="text-muted font-bold text-lg">Your clinical session is synchronized.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-6 border-b border-border-card flex items-center justify-between bg-card shrink-0">
                                        <div className="flex items-center gap-4">
                                            {selectionStep !== 'type' && !reschedulingAppt && (
                                                <button
                                                    onClick={() => {
                                                        if (selectionStep === 'details') setSelectionStep('time');
                                                        else if (selectionStep === 'time') setSelectionStep('date');
                                                        else if (selectionStep === 'date') setSelectionStep(selectedSpecialist && searchParams.get('professionalId') ? 'date' : 'type');
                                                    }}
                                                    className="p-2 text-muted opacity-80 hover:bg-page rounded-xl transition-all"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                            )}
                                            <div>
                                                <h2 className="text-xl font-black text-main tracking-tight">
                                                    {selectionStep === 'type' ? 'Select Type' :
                                                        selectionStep === 'date' ? 'Select Date' :
                                                            selectionStep === 'time' ? 'Select Slot' : 'Confirm Details'}
                                                </h2>
                                                {!reschedulingAppt && (
                                                    <div className="flex gap-1.5 mt-1">
                                                        <div className={`h-1 rounded-full transition-all duration-300 ${selectionStep === 'type' ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
                                                        <div className={`h-1 rounded-full transition-all duration-300 ${selectionStep === 'date' ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
                                                        <div className={`h-1 rounded-full transition-all duration-300 ${selectionStep === 'time' ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
                                                        <div className={`h-1 rounded-full transition-all duration-300 ${selectionStep === 'details' ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => setIsModalOpen(false)} className="p-2 text-muted opacity-80 hover:bg-page hover:text-muted rounded-xl transition-all">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
                                        {selectionStep === 'type' && (
                                            <div className="grid grid-cols-1 gap-4 animate-fade-in">
                                                {[
                                                    { id: 'psychiatrist', label: 'Psychiatrist', desc: 'Medical assessment & psychiatric care', icon: Stethoscope, bg: 'bg-indigo-50', text: 'text-indigo-500', border: 'border-indigo-100' },
                                                    { id: 'psychologist', label: 'Psychologist', desc: 'Therapy, counseling & behavioral health', icon: Brain, bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100' },
                                                    { id: 'nurse', label: 'Nurse', desc: 'Clinical support & medication management', icon: UserPlus, bg: 'bg-blue-50', text: 'text-blue-500', border: 'border-blue-100' },
                                                    { id: 'social_worker', label: 'Social Worker', desc: 'Community support & advocacy', icon: Users, bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-100' },
                                                    { id: 'counselor', label: 'Counselor', desc: 'Guidance & emotional support', icon: MessageCircle, bg: 'bg-rose-50', text: 'text-rose-500', border: 'border-rose-100' },
                                                ].map((role) => (
                                                    <button
                                                        key={role.id}
                                                        onClick={() => { setSelectedRole(role.id); setSelectionStep('date'); }}
                                                        className="flex items-center gap-6 p-6 rounded-[2rem] border-2 border-slate-50 bg-card hover:border-indigo-100 transition-all shadow-sm group text-left"
                                                    >
                                                        <div className={`w-14 h-14 rounded-2xl ${role.bg} flex items-center justify-center ${role.text} border ${role.border} group-hover:scale-110 transition-transform`}>
                                                            <role.icon size={28} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-black text-main text-lg">{role.label}</p>
                                                            <p className="text-xs font-bold text-muted opacity-80 mt-1">{role.desc}</p>
                                                        </div>
                                                        <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-all" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {selectionStep === 'date' && (
                                            <div className="space-y-8 animate-fade-in">
                                                <div className="bg-page p-6 rounded-[2.5rem] border border-border-card">
                                                    <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest block mb-4 px-1">
                                                        {reschedulingAppt ? 'Pick a New Date' : 'Consultation Date'}
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={bookingDate}
                                                        onChange={(e) => {
                                                            setBookingDate(e.target.value);
                                                            setHasSelectedTime(false);
                                                            setSelectedSpecialist(null);
                                                            setBookingTime('');
                                                        }}
                                                        className="w-full bg-card border border-border-card rounded-2xl py-4 px-6 text-sm font-black outline-none focus:border-indigo-500"
                                                        min={new Date().toISOString().split('T')[0]}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setSelectionStep('time')}
                                                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:scale-[1.02] transition-all"
                                                >
                                                    Find Available Slots
                                                </button>
                                            </div>
                                        )}

                                        {selectionStep === 'time' && (
                                            <div className="space-y-8 animate-fade-in">
                                                <div className="space-y-4">
                                                    <h3 className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest px-1">
                                                        {isAvailabilityLoading && availableSlots.length === 0 ? `Syncing Slots...` : `Available slots on ${new Date(bookingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`}
                                                    </h3>
                                                    {isAvailabilityLoading && availableSlots.length === 0 ? (
                                                        <div className="flex justify-center py-10">
                                                            <Activity className="animate-spin text-indigo-600" size={32} />
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-4 gap-3">
                                                            {availableSlots.length > 0 ? availableSlots.map((time) => (
                                                                <button
                                                                    key={time}
                                                                    onClick={() => {
                                                                        setBookingTime(time);
                                                                        setHasSelectedTime(true);
                                                                        setSelectedSpecialist(null);
                                                                    }}
                                                                    className={`py-4 rounded-2xl text-xs font-black transition-all border ${bookingTime === time ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-card border-border-card text-muted hover:border-indigo-200'}`}
                                                                >
                                                                    {time}
                                                                </button>
                                                            )) : (
                                                                <div className="col-span-4 p-8 text-center bg-rose-50 rounded-2xl border border-rose-100">
                                                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">No slots available for this date</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {hasSelectedTime && (
                                                    <div className="space-y-4 pt-6 border-t border-border-card">
                                                        <h3 className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest px-1">
                                                            Select Provider for {bookingTime}
                                                        </h3>
                                                        {isAvailabilityLoading ? (
                                                            <div className="flex justify-center py-10">
                                                                <Activity className="animate-spin text-indigo-600" size={32} />
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {specialists.map((s, idx) => {
                                                                    const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`;
                                                                    const isSelected = selectedSpecialist?.id === s.id || selectedSpecialist?.userId === s.userId;
                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={() => { setSelectedSpecialist(s); setSelectionStep('details'); }}
                                                                            className={`w-full flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all shadow-sm group ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-card hover:border-indigo-100'}`}
                                                                        >
                                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs border border-indigo-200 group-hover:scale-110 transition-transform uppercase">
                                                                                {name.substring(0, 1)}
                                                                            </div>
                                                                            <div className="text-left flex-1">
                                                                                <p className="font-black text-main">{name}</p>
                                                                                <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">{s.specialization || s.role || 'Clinical Expert'}</p>
                                                                            </div>
                                                                            {isSelected && <CheckCircle2 size={24} className="text-indigo-600" />}
                                                                        </button>
                                                                    );
                                                                })}
                                                                {specialists.length === 0 && (
                                                                    <div className="p-8 text-center opacity-40">
                                                                        <p className="text-[10px] font-black uppercase tracking-widest">No specialists available for this slot</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {selectionStep === 'details' && (
                                            <div className="space-y-8 animate-fade-in">
                                                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                                                    <div className="relative z-10 flex items-center gap-6">
                                                        <div className="w-16 h-16 bg-card/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                                            <Activity size={32} />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Session Summary</p>
                                                            <p className="text-xl font-black">
                                                                {selectedSpecialist?.name ||
                                                                    `${selectedSpecialist?.firstName || ''} ${selectedSpecialist?.lastName || ''}`.trim() ||
                                                                    'Specialist'}
                                                            </p>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">
                                                                {selectedRole ? selectedRole.replace('_', ' ') : 'Specialist'} • Virtual Consult
                                                            </p>
                                                            <p className="text-xs font-bold opacity-80 mt-1">{new Date(bookingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at {bookingTime}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest px-1">Reason for Visit</label>
                                                    <textarea
                                                        rows={4}
                                                        placeholder="Briefly describe what you'd like to discuss..."
                                                        value={bookingReason}
                                                        onChange={e => setBookingReason(e.target.value)}
                                                        className="w-full bg-page border border-border-card rounded-[2rem] p-6 text-sm font-semibold focus:outline-none focus:bg-card focus:border-indigo-200 transition-all shadow-inner resize-none"
                                                    />
                                                </div>

                                                {bookingError && (
                                                    <div className="p-4 bg-rose-50 rounded-2xl flex items-center gap-3 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 shadow-sm">
                                                        <AlertCircle size={16} />
                                                        {bookingError}
                                                    </div>
                                                )}

                                                <button
                                                    onClick={handleBookAppointment}
                                                    disabled={isBooking}
                                                    className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                                >
                                                    {isBooking ? <Activity className="animate-spin" size={20} /> : (reschedulingAppt ? 'Update Session' : 'Confirm Appointment')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SchedulePage;
