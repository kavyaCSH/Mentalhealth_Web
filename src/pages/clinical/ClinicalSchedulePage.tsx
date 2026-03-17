import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Video,
    Plus,
    X,
    CheckCircle2,
    Activity,
    Search,
    UserCheck,
    Clock,
    FileText,
    ArrowLeft
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { TeleConsultService } from '../../api/services/teleconsult.service';
import { UserService } from '../../api/services/user.service';
import type { RootState } from '../../store';
import type { Consultation } from '../../types/common.types';
import type { Patient } from '../../types/user.types';
import Button from '../../components/ui/Button';

const ClinicalSchedulePage = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Booking Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState<'patient' | 'details'>('patient');
    const [bookingReason, setBookingReason] = useState('');
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingTime, setBookingTime] = useState('10:00');
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState('');

    // Patient Selection State
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientSearch, setPatientSearch] = useState('');

    const fetchSchedule = useCallback(async (isRefresh = false) => {
        try {
            if (!isRefresh) setIsLoading(true);
            const res = await TeleConsultService.listConsultations({
                page: 1,
                limit: 100,
                userId: user?.userId || user?.id,
                role: 'publisher'
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

    const fetchPatients = async (searchTerm = '') => {
        try {
            const res = await UserService.listUsers({ 
                role: 'patient', 
                search: searchTerm,
                isActive: true,
                page: 1,
                limit: 10 
            });
            setPatients((res as any).data?.users || res.users || (res as any).data || []);
        } catch (err) {
            console.error('Error fetching patients:', err);
        }
    };

    const openBookingModal = () => {
        setBookingStep('patient');
        setBookingReason('');
        setSelectedPatient(null);
        setBookingError('');
        setBookingSuccess(false);
        setPatientSearch('');
        const today = new Date();
        setBookingDate(today.toISOString().split('T')[0]);
        setBookingTime(today.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit', hour12: false }));
        setIsModalOpen(true);
        fetchPatients('');
    };

    const handleJoinCall = (session: Consultation) => {
        const apptId = session.id || session.consult_id || (session as any)._id;
        if (!apptId) return;
        
        navigate(`/teleconsult/${apptId}`, {
            state: {
                appointment: session,
                token: (session as any).token || (session as any).subscriber_token || (session.participants?.find((p: any) => p.token)?.token)
            }
        });
    };

    const handleBookAppointment = async () => {
        if (!selectedPatient || !bookingReason.trim()) {
            setBookingError('Please select a patient and provide a reason');
            return;
        }

        setIsBooking(true);
        try {
            const [y, m, d] = bookingDate.split('-').map(Number);
            const [h, min] = bookingTime.split(':').map(Number);
            const scheduledAt = new Date(y, m - 1, d, h, min).toISOString();

            const submissionData = {
                scheduled_at: scheduledAt,
                reason: bookingReason.trim(),
                consult_type: 'virtual',
                participants: [
                    { participant_type: { id: 1, code: 'professional', name: 'Professional' }, ref_number: (user?.userId || user?.id || '').toString() },
                    { participant_type: { id: 2, code: 'patient', name: 'Patient' }, ref_number: (selectedPatient.userId || selectedPatient.id || '').toString() }
                ],
                additional_info: { notes: bookingReason.trim() }
            };

            const res = await TeleConsultService.createConsultation(submissionData);
            if (res.success || (res as any).code === 201) {
                setBookingSuccess(true);
                setTimeout(() => {
                    setIsModalOpen(false);
                    fetchSchedule(true);
                }, 2000);
            }
        } catch (err: any) {
            setBookingError(err.response?.data?.message || 'Error occurred while scheduling');
        } finally {
            setIsBooking(false);
        }
    };



    const isSameDate = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();

    const weekDays = useMemo(() => {
        const days = [];
        const start = new Date(viewDate);
        start.setDate(viewDate.getDate() - viewDate.getDay());
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }, [viewDate]);

    const dayAppointments = appointments.filter((e) => isSameDate(new Date(e.scheduled_at || ''), selectedDate));

    return (
        <div className="p-8 max-w-7xl animate-fade-in pb-20 space-y-10">
            {/* Premium Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <CalendarIcon size={16} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Clinical Calendar • Session Management</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight text-gradient-primary">Clinical Schedule</h1>
                    <p className="text-slate-500 font-semibold text-sm">Review, manage and launch your patient sessions.</p>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={20} />}
                        onClick={openBookingModal}
                        className="rounded-2xl shadow-xl shadow-indigo-100 py-3.5"
                    >
                        Schedule Session
                    </Button>
                </div>
            </header>

            {/* Horizontal Weekly Calendar */}
            <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <CalendarIcon size={120} />
                </div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">
                                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 mt-0.5 uppercase tracking-tighter">Weekly View Pipeline</p>
                        </div>
                    </div>
                    <div className="flex p-1 bg-slate-50 rounded-xl gap-1">
                        <button onClick={() => {
                            const d = new Date(viewDate);
                            d.setDate(d.getDate() - 7);
                            setViewDate(d);
                        }} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setViewDate(new Date())} className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-all">Today</button>
                        <button onClick={() => {
                            const d = new Date(viewDate);
                            d.setDate(d.getDate() + 7);
                            setViewDate(d);
                        }} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-4 relative z-10">
                    {weekDays.map((date, i) => {
                        const isSelected = isSameDate(date, selectedDate);
                        const isToday = isSameDate(date, new Date());
                        const hasAppt = appointments.some(a => isSameDate(new Date(a.scheduled_at || ''), date));

                        return (
                            <button
                                key={i}
                                onClick={() => setSelectedDate(date)}
                                className={`flex flex-col items-center gap-4 py-6 rounded-[2rem] transition-all relative group/day ${isSelected ? 'bg-indigo-600 text-white shadow-2xl scale-105 glow-primary' : 'hover:bg-slate-50 text-slate-700'}`}
                            >
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-100' : 'text-slate-300'}`}>
                                    {date.toLocaleString('default', { weekday: 'short' })}
                                </span>
                                <span className={`text-xl font-black ${isToday && !isSelected ? 'text-indigo-600' : ''}`}>
                                    {date.getDate()}
                                </span>
                                {hasAppt && (
                                    <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />
                                )}
                                {isToday && !isSelected && (
                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Timeline Column */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                    {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                    {dayAppointments.length} Upcoming Appointments
                                </p>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20 opacity-30 animate-pulse">
                            <Activity size={32} className="animate-spin text-indigo-600" />
                        </div>
                    ) : dayAppointments.length > 0 ? (
                        <div className="space-y-6 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-slate-100">
                            {dayAppointments.map((appt, idx) => (
                                <motion.div
                                    key={appt.id || (appt as any)._id || idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative pl-20 group"
                                >
                                    <div className="absolute left-[30px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white bg-indigo-500 ring-4 ring-indigo-50 z-10 group-hover:scale-125 transition-transform" />

                                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-8 group/card">
                                        <div className="flex items-start gap-8">
                                            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-100 rounded-2xl group-hover/card:bg-indigo-50 group-hover/card:border-indigo-100 transition-colors">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                                                    {new Date(appt.scheduled_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}
                                                </p>
                                                <p className="text-lg font-black text-slate-900 leading-none">
                                                    {new Date(appt.scheduled_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-lg">
                                                        {appt.consult_type === 'virtual' ? 'Video Consult' : 'In-Person'}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {String(appt.id || (appt as any)._id).slice(-5)}</span>
                                                </div>
                                                <h4 className="text-xl font-black text-slate-900 leading-tight mb-3">
                                                    {appt.reason || 'Symptom Review & Follow-up'}
                                                </h4>
                                                <div className="flex items-center gap-3">
                                                    {(() => {
                                                        const p = appt.participants?.find(part => 
                                                            (part as any).role === 'subscriber' ||
                                                            (part as any).role === 'patient' ||
                                                            part.participant_type?.code === 'patient' || 
                                                            part.participant_type?.code === 'subscriber' ||
                                                            part.participant_type?.code === 'customer'
                                                        ) as any;
                                                        const pInfo = p?.participant_info;
                                                        const pName = 
                                                            pInfo?.name ||
                                                            (p?.firstName ? `${p.firstName} ${p.lastName || ''}`.trim() : null) ||
                                                            (p?.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : null) ||
                                                            (pInfo?.firstName ? `${pInfo.firstName} ${pInfo.lastName || ''}`.trim() : null) ||
                                                            (pInfo?.first_name ? `${pInfo.first_name} ${pInfo.last_name || ''}`.trim() : null) ||
                                                            p?.name || 
                                                            p?.additional_info?.x_name ||
                                                            'Assigned Patient';
                                                        return (
                                                            <>
                                                                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black border-2 border-white shadow-md">
                                                                    {pName.charAt(0).toUpperCase()}
                                                                </div>
                                                                <p className="text-sm font-bold text-slate-600">
                                                                    {pName}
                                                                </p>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-50 pt-6 md:pt-0 md:pl-8">
                                            {appt.consult_type === 'virtual' && (
                                                <Button
                                                    variant="primary"
                                                    leftIcon={<Video size={16} />}
                                                    onClick={() => handleJoinCall(appt)}
                                                    className="rounded-2xl text-[10px] py-4 px-8 shadow-lg shadow-indigo-100"
                                                >
                                                    Start Session
                                                </Button>
                                            )}
                                            <button className="p-4 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><X size={20} /></button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-50/50 rounded-[4rem] p-24 text-center border-2 border-dashed border-slate-100">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-slate-100/50">
                                <CalendarIcon size={40} className="text-slate-200" />
                            </div>
                            <p className="font-black text-slate-900 uppercase tracking-[0.2em] text-sm">Quiet Pipeline</p>
                            <p className="text-slate-400 font-semibold text-sm mt-2">No clinical appointments scheduled for this date.</p>
                        </div>
                    )}
                </div>

                {/* Info Column */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-indigo-900 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200/50">
                        <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-800 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000 opacity-50"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                    <Activity size={28} />
                                </div>
                                <div>
                                    <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest">Clinical Bandwidth</p>
                                    <p className="font-bold text-xl">42% Capacity used</p>
                                </div>
                            </div>
                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '42%' }} className="h-full bg-white rounded-full" />
                            </div>
                            <p className="text-xs text-indigo-100/70 font-medium leading-relaxed">
                                You have 3 more available slots for emergency triage today.
                            </p>
                        </div>
                    </div>

                    <div className="card-premium p-8 space-y-6">
                        <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b border-slate-50 pb-4">Recent Notes</h3>
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Patient Feedback • 2h ago</p>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed italic line-clamp-2">"Patient reported significant improvement in sleep hygiene after last session..."</p>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full text-[10px] py-4 rounded-xl font-black uppercase tracking-widest border-2">Review Archive</Button>
                    </div>
                </div>
            </div>

            {/* Premium 2-Step Booking Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

                        {bookingSuccess ? (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[4rem] p-16 text-center shadow-2xl space-y-8 max-w-md w-full border border-indigo-50">
                                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-100/50"><CheckCircle2 size={48} /></div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Success!</h3>
                                    <p className="text-slate-500 font-semibold mt-2">The session with {selectedPatient?.firstName} has been synchronized.</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
                                <header className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0 glass-surface relative z-10">
                                    <div className="flex items-center gap-4">
                                        {bookingStep === 'details' && (
                                            <button onClick={() => setBookingStep('patient')} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                                                <ArrowLeft size={18} />
                                            </button>
                                        )}
                                        <div>
                                            <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">
                                                {bookingStep === 'patient' ? 'Select Patient' : 'Session Details'}
                                            </h3>
                                            <div className="flex gap-2 mt-1">
                                                <div className={`h-1 rounded-full transition-all duration-500 ${bookingStep === 'patient' ? 'w-8 bg-indigo-600' : 'w-4 bg-emerald-500'}`} />
                                                <div className={`h-1 rounded-full transition-all duration-500 ${bookingStep === 'details' ? 'w-8 bg-indigo-600' : 'w-4 bg-slate-200'}`} />
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"><X size={20} /></button>
                                </header>

                                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                                    {bookingStep === 'patient' ? (
                                        <div className="space-y-8 animate-fade-in">
                                                <div className="relative group">
                                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search clinicial database by name or ID..."
                                                        value={patientSearch}
                                                        onChange={(e) => {
                                                            setPatientSearch(e.target.value);
                                                            if (e.target.value.length >= 2 || e.target.value === '') {
                                                                fetchPatients(e.target.value);
                                                            }
                                                        }}
                                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-4.5 pl-16 pr-6 text-sm font-bold focus:outline-none focus:border-indigo-500/20 focus:bg-white transition-all shadow-inner"
                                                    />
                                                </div>
    
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Recent & Matching Patients</p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {patients.map((patient: any, idx) => (
                                                            <button
                                                                key={patient.id || idx}
                                                                onClick={() => {
                                                                    setSelectedPatient(patient);
                                                                    setBookingStep('details');
                                                                }}
                                                                className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all group/p ${selectedPatient?.id === patient.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 hover:border-indigo-100 hover:bg-slate-50/50'}`}
                                                            >
                                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 border-4 border-white flex items-center justify-center text-white text-sm font-black shadow-lg group-hover/p:scale-110 transition-transform">
                                                                {(patient.firstName || patient.first_name || patient.name || '?').charAt(0).toUpperCase()}
                                                                {(patient.lastName || patient.last_name || '').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="text-left flex-1">
                                                                <p className="font-black text-slate-900 tracking-tighter">
                                                                    {patient.firstName || patient.first_name || patient.name?.split(' ')[0] || ''} {patient.lastName || patient.last_name || patient.name?.split(' ').slice(1).join(' ') || ''}
                                                                </p>
                                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">ID: {String(patient.id || patient.userId).slice(-8)}</p>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center opacity-0 group-hover/p:opacity-100 transition-opacity">
                                                                <Plus size={16} className="text-indigo-600" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-10 animate-fade-in">
                                            <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><UserCheck size={24} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Assigned Patient</p>
                                                        <p className="text-lg font-black text-indigo-900 leading-none">{selectedPatient?.firstName} {selectedPatient?.lastName}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setBookingStep('patient')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline px-4 py-2 bg-white rounded-xl shadow-sm">Change</button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 px-2">
                                                        <CalendarIcon size={14} className="text-slate-400" />
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Date</label>
                                                    </div>
                                                    <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold border-2 border-transparent focus:border-indigo-500/20 focus:bg-white transition-all outline-none" />
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 px-2">
                                                        <Clock size={14} className="text-slate-400" />
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Time</label>
                                                    </div>
                                                    <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-sm font-bold border-2 border-transparent focus:border-indigo-500/20 focus:bg-white transition-all outline-none" />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 px-2">
                                                    <FileText size={14} className="text-slate-400" />
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Reason / Objective</label>
                                                </div>
                                                <textarea 
                                                    value={bookingReason} 
                                                    onChange={e => setBookingReason(e.target.value)} 
                                                    placeholder="Specify the consultation objective (e.g. Anxiety Assessment, Med Review)..." 
                                                    rows={4} 
                                                    className="w-full bg-slate-50 rounded-3xl py-5 px-6 text-sm font-semibold border-2 border-transparent focus:border-indigo-500/20 focus:bg-white transition-all outline-none resize-none leading-relaxed" 
                                                />
                                            </div>

                                            {bookingError && (
                                                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{bookingError}</p>
                                                </div>
                                            )}

                                            <Button 
                                                variant="primary" 
                                                className="w-full rounded-[2rem] py-6 flex items-center justify-center text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-200" 
                                                onClick={handleBookAppointment} 
                                                disabled={isBooking}
                                            >
                                                {isBooking ? <Activity className="animate-spin" size={24} /> : (
                                                    <div className="flex items-center gap-3">
                                                        Finalize Clinical Schedule
                                                        <ChevronRight size={18} />
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClinicalSchedulePage;
