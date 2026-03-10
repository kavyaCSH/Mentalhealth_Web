import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    Clock,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Video,
    Plus,
    X,
    CheckCircle2,
    Activity,
    AlertCircle,
    Check
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { TeleConsultService } from '../../api/services/teleconsult.service';
import { SpecialistService } from '../../api/services/specialist.service';
import type { RootState } from '../../store';
import type { Consultation, Participant } from '../../types/common.types';
import type { User } from '../../types/user.types';

const SchedulePage = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Booking Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingReason, setBookingReason] = useState('');
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingTime, setBookingTime] = useState('10:00');
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState('');

    // Specialist State
    const [specialists, setSpecialists] = useState<User[]>([]);
    const [selectedSpecialist, setSelectedSpecialist] = useState<User | null>(null);
    const [loadingSpecialists, setLoadingSpecialists] = useState(false);

    // Fetch consultations
    const fetchSchedule = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) setIsLoading(true);
            const res = await TeleConsultService.listConsultations({
                page: 1,
                limit: 50,
                userId: user?.userId || user?.id,
            });
            const consultData = res.data?.consults || (res.data as any) || [];
            setAppointments(Array.isArray(consultData) ? consultData : []);
        } catch {
            setAppointments([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const fetchSpecialists = async () => {
        try {
            setLoadingSpecialists(true);
            const res = await SpecialistService.getSpecialists('psychiatrist') as any;
            if (res.success || res.code === 200) {
                const list = res.data?.masters || res.data?.users || res.data || [];
                setSpecialists(Array.isArray(list) ? list.filter((s: User) => String(s.id || s._id || s.userId) !== String(user?.id || user?._id)) : []);
            }
        } catch (err) {
            console.error('Error fetching specialists:', err);
            setSpecialists([]);
        } finally {
            setLoadingSpecialists(false);
        }
    };

    const openBookingModal = (preselected?: User) => {
        setBookingReason('');
        setSelectedSpecialist(preselected || null);
        setBookingError('');
        setBookingSuccess(false);
        setBookingDate(selectedDate.toISOString().split('T')[0]);
        setBookingTime(new Date().toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit', hour12: false }));
        setIsModalOpen(true);
        fetchSpecialists();
    };

    const handleAction = async (action: string, appt: Consultation) => {
        const apptId = String(appt.consult_id || appt.id || appt._id);
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
                const subscriber = appt.participants?.find((p: Participant) =>
                    p.role === 'subscriber' ||
                    p.participant_type?.code === 'patient' ||
                    p.participant_type?.code === 'subscriber'
                );
                const token = subscriber?.token || (appt as any).subscriber_token || (appt as any).token;

                if (token) {
                    const res = await TeleConsultService.tokenValidate(token, 'subscriber');
                    if (res.success || res.code === 200) {
                        navigate(`/teleconsult/${apptId}`, {
                            state: { appointment: appt, token }
                        });
                    } else {
                        alert(res.message || 'Call is not yet active. Please wait for the specialist.');
                    }
                } else {
                    alert('Join link not ready. Please wait for the specialist to start the session.');
                }
            }
        } catch (err) {
            console.error('Action Error:', err);
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedSpecialist || !bookingReason.trim()) {
            setBookingError('Please fill all fields');
            return;
        }

        setIsBooking(true);
        try {
            const [y, m, d] = bookingDate.split('-').map(Number);
            const [h, min] = bookingTime.split(':').map(Number);
            const scheduledAt = new Date(y, m - 1, d, h, min).toISOString();

            const profId = ((selectedSpecialist as User).userId || (selectedSpecialist as User & { _id?: string })._id || selectedSpecialist.id || '').toString();
            const patId = (user?.userId || user?._id || user?.id || '').toString();

            const submissionData = {
                scheduled_at: scheduledAt,
                reason: bookingReason.trim(),
                consult_type: 'virtual',
                participants: [
                    { participant_type: { id: 1, code: 'professional', name: 'Professional' }, ref_number: profId },
                    { participant_type: { id: 2, code: 'patient', name: 'Patient' }, ref_number: patId }
                ],
                additional_info: { notes: bookingReason.trim(), referred_by: 'Self' }
            };

            const res = await TeleConsultService.createConsultation(submissionData);
            if (res.success || (res as any).code === 201 || (res.data as any)?.consult_id) {
                setBookingSuccess(true);
                setTimeout(() => {
                    setIsModalOpen(false);
                    fetchSchedule(true);
                }, 2000);
            }
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setBookingError(error.response?.data?.message || 'Error occurred');
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

    const formatDateKey = (date: Date) => date.toISOString().split('T')[0];
    const isSameDate = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();

    const selectedDateStr = formatDateKey(selectedDate);
    const dayAppointments = appointments.filter((e) => (e.scheduled_at || '').startsWith(selectedDateStr));

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            <div className="max-w-7xl mx-auto p-8 space-y-8 animate-fade-in">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">Appointments</h3>
                        <p className="text-slate-500 font-semibold mt-2 flex items-center gap-2">
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
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
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

                    <div className="md:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900">Today's Focus</h3>
                            <p className="text-slate-500 text-sm font-medium">You have {appointments.filter(a => formatDateKey(new Date(a.scheduled_at || '')) === formatDateKey(new Date())).length} sessions today</p>
                        </div>
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-12 h-12 rounded-full border-4 border-white shadow-sm" alt="patient" />
                            ))}
                            <div className="w-12 h-12 rounded-full border-4 border-white bg-slate-50 flex items-center justify-center text-xs font-black text-slate-400">
                                +{Math.max(0, appointments.length - 3)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-12 gap-10">
                    {/* Left: Premium Calendar */}
                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h2 className="text-xl font-black text-slate-900">
                                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all">
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all">
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                                    <div key={day} className="text-[11px] font-black text-slate-400 py-2">
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
                                                    !item.isCurrentMonth ? 'text-slate-200' : 'text-slate-700 hover:bg-indigo-50'}
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
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h2>
                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                                {dayAppointments.length} Items
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="h-96 flex flex-col items-center justify-center opacity-40">
                                <Activity className="animate-spin text-indigo-600 mb-6" size={48} />
                                <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-[10px]">Syncing Schedule</p>
                            </div>
                        ) : dayAppointments.length > 0 ? (
                            <div className="space-y-6">
                                {dayAppointments.map((appt, idx) => {
                                    const dt = new Date(appt.scheduled_at || '');
                                    const statusObj = (appt as any).consult_current_status || (appt as any).consult_status;
                                    const statusName = typeof statusObj === 'string' ? statusObj : (statusObj as { name?: string })?.name || 'Scheduled';
                                    const statusSlug = typeof statusObj === 'string' ? statusObj.toLowerCase() : (statusObj as { slug?: string })?.slug || statusName.toLowerCase();
                                    const isVirtual = appt.consult_type === 'virtual';

                                    const s = statusName.toLowerCase();
                                    const sl = statusSlug.toLowerCase();

                                    const isScheduled = sl === 'scheduled' || s === 'scheduled' || sl === 'new' || s === 'new';
                                    const isInProgress = sl === 'in_progress' || s === 'in progress' || s === 'in-progress' || s === 'waiting';
                                    const isCancelable = isScheduled || isInProgress;
                                    const isActive = isInProgress || (appt as any).active || (Math.abs(Date.now() - dt.getTime()) < 3600000 && isScheduled);

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
                                            className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50 transition-all group"
                                        >
                                            <div className="flex flex-col md:flex-row">
                                                <div className={`w-2 md:w-3 ${color} shrink-0`} />
                                                <div className="p-8 flex-1">
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div className="flex items-center gap-6">
                                                            <div className={`w-16 h-16 rounded-3xl ${color}/10 flex items-center justify-center`}>
                                                                {isVirtual ? <Video className={color.replace('bg-', 'text-')} size={28} /> : <MapPin className={color.replace('bg-', 'text-')} size={28} />}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-2xl font-black text-slate-900 leading-none">
                                                                        {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                    {isActive && (
                                                                        <span className="flex items-center gap-1.5 text-[9px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase animate-pulse">
                                                                            <Activity size={10} /> Live
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[10px] font-black text-slate-400 tracking-[0.1em] uppercase mt-2">
                                                                    {isVirtual ? 'Virtual' : 'Clinical'} Consult • ID #{appt.id || appt.consult_id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 ${color.replace('bg-', 'border-')}/10 ${color.replace('bg-', 'bg-')}/5 ${color.replace('bg-', 'text-')}`}>
                                                            {statusName}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <p className="text-slate-700 font-bold text-lg">{appt.reason || 'Mental Health Consultation'}</p>
                                                        <div className="flex flex-wrap gap-4">
                                                            {appt.participants?.map((p, pi) => (
                                                                <div key={pi} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                                    <img src={`https://i.pravatar.cc/100?u=${p.ref_number}`} alt="ava" className="w-5 h-5 rounded-full" />
                                                                    <span className="text-[10px] font-bold text-slate-500">{p.name || p.participant_type?.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {(isScheduled || isInProgress || isActive) && (
                                                        <div className="flex flex-wrap gap-4 mt-8 pt-8 border-t border-slate-50">
                                                            {isVirtual && (isScheduled || isInProgress || isActive) && (
                                                                <button onClick={() => handleAction('join', appt)} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                                                                    <Video size={18} /> Join Now
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleAction('billing', appt)}
                                                                className="px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-sm border border-slate-100 hover:bg-white transition-all"
                                                            >
                                                                Billing
                                                            </button>
                                                            {isCancelable && (
                                                                <button
                                                                    onClick={() => handleAction('cancel', appt)}
                                                                    className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm border border-rose-100 hover:bg-rose-100 transition-all"
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
                            <div className="bg-white rounded-[3.5rem] p-16 text-center border-2 border-dashed border-slate-100">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-300">
                                    <CalendarIcon size={48} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-3">Quiet Day Ahead</h3>
                                <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
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
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-[2rem] shadow-2xl z-[70] overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {bookingSuccess ? (
                                <div className="p-16 text-center space-y-8">
                                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-2xl shadow-emerald-100">
                                        <CheckCircle2 size={56} />
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-900 mt-6 tracking-tight">Booked! 🎉</h2>
                                    <p className="text-slate-500 font-bold text-lg">Your session has been synchronized.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Book Appointment</h2>
                                        <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-all">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="p-6 space-y-6 overflow-y-auto">
                                        {/* Specialist Selection (Mobile Aligned) */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between px-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Specialist</label>
                                                {loadingSpecialists && <Activity size={14} className="animate-spin text-indigo-500" />}
                                            </div>
                                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x px-2">
                                                {specialists.map((s, idx) => {
                                                    const sId = (s as User & { userId?: string; _id?: string }).userId || (s as User & { _id?: string })._id || s.id;
                                                    const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`;
                                                    const isSelected = ((selectedSpecialist as User & { userId?: string; _id?: string })?.userId || (selectedSpecialist as User & { _id?: string })?._id || selectedSpecialist?.id) === sId;
                                                    return (
                                                        <button
                                                            key={sId || idx}
                                                            onClick={() => setSelectedSpecialist(s)}
                                                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 snap-center shrink-0 border-2 ${isSelected
                                                                ? 'border-indigo-600 bg-indigo-50/30'
                                                                : 'border-slate-50 bg-white hover:border-slate-100'
                                                                }`}
                                                            style={{ minWidth: '90px' }}
                                                        >
                                                            <div className="relative">
                                                                <img
                                                                    src={`https://i.pravatar.cc/100?u=${sId}`}
                                                                    className={`w-12 h-12 rounded-xl object-cover shadow-sm transition-transform duration-300 ${isSelected ? 'scale-105' : ''}`}
                                                                    alt={name}
                                                                />
                                                                {isSelected && (
                                                                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-lg p-1 border-2 border-white shadow-lg">
                                                                        <Check size={10} strokeWidth={4} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className={`text-[10px] font-black text-center max-w-[80px] truncate ${isSelected ? 'text-indigo-600' : 'text-slate-500'}`}>
                                                                {name.split(' ')[0]}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Date</label>
                                                <div className="relative group">
                                                    <CalendarIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" />
                                                    <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-[11px] font-bold focus:outline-none focus:border-indigo-600/30 focus:bg-white transition-all cursor-pointer" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Time</label>
                                                <div className="relative group">
                                                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" />
                                                    <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3 pl-11 pr-4 text-[11px] font-bold focus:outline-none focus:border-indigo-600/30 focus:bg-white transition-all cursor-pointer" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Reason</label>
                                            <textarea rows={2} placeholder="Describe briefly..." value={bookingReason} onChange={e => setBookingReason(e.target.value)} className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-[11px] font-medium focus:outline-none focus:border-indigo-600/30 focus:bg-white transition-all resize-none" />
                                        </div>

                                        {bookingError && (
                                            <div className="p-5 bg-rose-50 rounded-2xl flex items-center gap-4 text-rose-600 text-xs font-black uppercase tracking-widest border border-rose-100">
                                                <AlertCircle size={20} />
                                                {bookingError}
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            <button onClick={handleBookAppointment} disabled={isBooking} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                                                {isBooking ? <Activity className="animate-spin" size={20} /> : 'Book Now'}
                                            </button>
                                        </div>
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
