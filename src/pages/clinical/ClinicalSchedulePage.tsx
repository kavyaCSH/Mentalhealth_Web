import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    ArrowLeft,
    Settings,
    RefreshCw,
    ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { TeleConsultService } from '../../api/services/teleconsult.service';
import { UserService } from '../../api/services/user.service';
import { SpecialistService } from '../../api/services/specialist.service';
import type { RootState } from '../../store';
import type { Consultation } from '../../types/common.types';
import type { Patient } from '../../types/user.types';
import Button from '../../components/ui/Button';

const ClinicalSchedulePage = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // The API returns slots as plain time strings (e.g. "12.00 pm") OR as objects.
    // This helper normalises both shapes into { startTime, endTime, available }.
    const normalizeSlots = (raw: any[]): { startTime: string; endTime: string; available: boolean }[] => {
        if (!Array.isArray(raw)) return [];
        return raw.map((s: any) => {
            if (typeof s === 'string') {
                return { startTime: s, endTime: '', available: true };
            }
            return {
                startTime: s.startTime || s.start_time || s.time || '',
                endTime: s.endTime || s.end_time || '',
                available: s.available !== false,
            };
        });
    };

    // Booking Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingStep, setBookingStep] = useState<'patient' | 'details'>('patient');
    const [bookingReason, setBookingReason] = useState('');
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingTime, setBookingTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState<any[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isBooking, setIsBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState('');

    // Reschedule State
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleData, setRescheduleData] = useState<Consultation | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleAvailableSlots, setRescheduleAvailableSlots] = useState<any[]>([]);
    const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [rescheduleError, setRescheduleError] = useState('');
    const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

    // Main view slots fetch for selected date
    const [mainAvailableSlots, setMainAvailableSlots] = useState<any[]>([]);
    const [isLoadingMainSlots, setIsLoadingMainSlots] = useState(false);

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

    // Main view slots fetch for selected date
    useEffect(() => {
        const fetchMainSlots = async () => {
            if (!user) return;
            setIsLoadingMainSlots(true);
            try {
                const res = await SpecialistService.getAvailableSlots({
                    specialist_id: user.userId || user.id,
                    date: selectedDate.toISOString().split('T')[0],
                });
                const raw: any[] = (res as any).data?.slots || (res as any).slots || [];
                setMainAvailableSlots(normalizeSlots(raw));
            } catch (err) {
                console.error('Failed to fetch main view slots', err);
                setMainAvailableSlots([]);
            } finally {
                setIsLoadingMainSlots(false);
            }
        };
        fetchMainSlots();
    }, [selectedDate, user]);

    const openBookingModalWithPatient = useCallback((patient: Patient) => {
        setBookingStep('details');
        setBookingReason('');
        setSelectedPatient(patient);
        setBookingError('');
        setBookingSuccess(false);
        setPatientSearch('');
        const today = new Date();
        setBookingDate(today.toISOString().split('T')[0]);
        setBookingTime('');
        setIsModalOpen(true);
    }, []);

    const fetchPatients = useCallback(async (searchTerm = '') => {
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
    }, []);

    const openBookingModal = useCallback(() => {
        setBookingStep('patient');
        setBookingReason('');
        setSelectedPatient(null);
        setBookingError('');
        setBookingSuccess(false);
        setPatientSearch('');
        const today = new Date();
        setBookingDate(today.toISOString().split('T')[0]);
        setBookingTime('');
        setIsModalOpen(true);
        fetchPatients('');
    }, [fetchPatients]);

    useEffect(() => {
        const patientId = searchParams.get('patientId');
        if (patientId && !selectedPatient) {
            const fetchAndSelect = async () => {
                try {
                    const res = await api.get(`/users/${patientId}`);
                    const patient = res.data?.data || res.data;
                    if (patient) {
                        openBookingModalWithPatient(patient as Patient);
                    }
                } catch (err) {
                    console.error('Failed to preselect patient', err);
                }
            };
            fetchAndSelect();
        } else if (searchParams.get('action') === 'book' && !isModalOpen) {
            openBookingModal();
        }
    }, [searchParams, isModalOpen, selectedPatient, openBookingModalWithPatient, openBookingModal]);

    useEffect(() => {
        if (bookingStep === 'details' && (user?.userId || user?.id)) {
            const fetchSlots = async () => {
                setIsLoadingSlots(true);
                try {
                    const res = await SpecialistService.getAvailableSlots({
                        specialist_id: user.userId || user.id,
                        date: bookingDate,
                    });
                    const raw: any[] = (res as any).data?.slots || (res as any).slots || [];
                    setAvailableSlots(normalizeSlots(raw));
                } catch (err) {
                    console.error('Failed to fetch slots', err);
                    setAvailableSlots([]);
                } finally {
                    setIsLoadingSlots(false);
                }
            };
            fetchSlots();
        }
    }, [bookingDate, bookingStep, user]);

    useEffect(() => {
        if (isRescheduleModalOpen && (user?.userId || user?.id)) {
            const fetchSlots = async () => {
                setIsLoadingRescheduleSlots(true);
                try {
                    const res = await SpecialistService.getAvailableSlots({
                        specialist_id: user.userId || user.id,
                        date: rescheduleDate,
                    });
                    const raw: any[] = (res as any).data?.slots || (res as any).slots || [];
                    setRescheduleAvailableSlots(normalizeSlots(raw));
                } catch (err) {
                    console.error('Failed to fetch slots', err);
                    setRescheduleAvailableSlots([]);
                } finally {
                    setIsLoadingRescheduleSlots(false);
                }
            };
            fetchSlots();
        }
    }, [rescheduleDate, isRescheduleModalOpen, user]);

    const handleJoinCall = useCallback(async (session: Consultation) => {
        const apptId = session.id || session.consult_id || (session as any)._id;
        if (!apptId) return;

        const publisher = session.participants?.find((p: any) =>
            p.role === 'publisher' ||
            p.participant_type?.code === 'professional' ||
            String(p.ref_number) === String(user?.userId || user?.id)
        );
        const token = publisher?.token || (session as any).publisher_token || (session as any).token;

        if (token) {
            try {
                const validation = await TeleConsultService.tokenValidate(token, 'publisher');
                const success = validation.success || (validation as any).code === 200;
                navigate(`/teleconsult/${apptId}`, {
                    state: { appointment: session, token }
                });
            } catch (err) {
                navigate(`/teleconsult/${apptId}`, {
                    state: { appointment: session, token }
                });
            }
        } else {
            alert('Consultation token not found.');
        }
    }, [user, navigate]);

    /**
     * Parses slot time strings from the API into { h, min }.
     * The API returns times like "12.00 pm" (dot-separator, AM/PM)
     * as well as 24-hr strings like "09:30".
     */
    const parseSlotTime = (timeStr: string): { h: number; min: number } | null => {
        if (!timeStr) return null;
        // 24-hr format: "09:30"
        const colonMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
        if (colonMatch) return { h: parseInt(colonMatch[1]), min: parseInt(colonMatch[2]) };
        // 12-hr format with dot or colon: "12.00 pm", "1.30 pm"
        const ampmMatch = timeStr.match(/^(\d{1,2})[.:]?(\d{2})\s*(am|pm)$/i);
        if (ampmMatch) {
            let h = parseInt(ampmMatch[1]);
            const min = parseInt(ampmMatch[2]);
            const period = ampmMatch[3].toLowerCase();
            if (period === 'pm' && h < 12) h += 12;
            if (period === 'am' && h === 12) h = 0;
            return { h, min };
        }
        return null;
    };

    const handleBookAppointment = useCallback(async () => {
        if (!selectedPatient || !bookingReason.trim()) {
            setBookingError('Please select a patient and provide a reason');
            return;
        }
        if (!bookingTime) {
            setBookingError('Please select an available time slot');
            return;
        }

        setIsBooking(true);
        try {
            const [y, m, d] = bookingDate.split('-').map(Number);
            const parsed = parseSlotTime(bookingTime);
            if (!parsed) {
                setBookingError('Invalid time slot selected. Please select again.');
                setIsBooking(false);
                return;
            }
            const scheduledAt = new Date(y, m - 1, d, parsed.h, parsed.min).toISOString();

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
    }, [selectedPatient, bookingReason, bookingTime, bookingDate, user, fetchSchedule]);

    const handleRescheduleClick = (appt: Consultation) => {
        setRescheduleData(appt);
        const apptDate = appt.scheduled_at ? new Date(appt.scheduled_at) : new Date();
        setRescheduleDate(apptDate.toISOString().split('T')[0]);
        setRescheduleTime('');
        setRescheduleError('');
        setRescheduleSuccess(false);
        setIsRescheduleModalOpen(true);
    };

    const submitReschedule = async () => {
        if (!rescheduleData) return;
        if (!rescheduleTime) {
            setRescheduleError('Please select an available time slot');
            return;
        }

        setIsRescheduling(true);
        try {
            const [y, m, d] = rescheduleDate.split('-').map(Number);
            const parsed = parseSlotTime(rescheduleTime);
            if (!parsed) {
                setRescheduleError('Invalid time slot. Please select again.');
                setIsRescheduling(false);
                return;
            }
            const newScheduledAt = new Date(y, m - 1, d, parsed.h, parsed.min).toISOString();
            const apptId = rescheduleData.id || rescheduleData.consult_id || (rescheduleData as any)._id;

            const res = await TeleConsultService.rescheduleConsultation(String(apptId), newScheduledAt);
            if (res.success || (res as any).code === 200) {
                setRescheduleSuccess(true);
                setTimeout(() => {
                    setIsRescheduleModalOpen(false);
                    fetchSchedule(true);
                }, 2000);
            } else {
                setRescheduleError((res as any).message || 'Failed to reschedule');
            }
        } catch (err: any) {
            setRescheduleError(err.response?.data?.message || err.message || 'Error occurred while rescheduling');
        } finally {
            setIsRescheduling(false);
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
        <>
            <div className="p-8 max-w-7xl animate-fade-in pb-20 space-y-10">
                {/* Premium Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-indigo-500 mb-1">
                            <CalendarIcon size={16} />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">Clinical Calendar • Session Management</span>
                        </div>
                        <h1 className="text-4xl font-black text-main tracking-tight text-gradient-primary">Clinical Schedule</h1>
                        <p className="text-muted font-semibold text-sm">Review, manage and launch your patient sessions.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="secondary"
                            leftIcon={<Settings size={20} />}
                            onClick={() => navigate('/clinical/availability')}
                            className="rounded-2xl shadow-xl shadow-slate-100 py-3.5"
                        >
                            Manage Availability
                        </Button>
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
                <section className="bg-card rounded-[2.5rem] p-8 border border-border-card shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                        <CalendarIcon size={120} />
                    </div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shadow-inner border border-indigo-500/20">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-main uppercase tracking-widest text-xs">
                                    {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h3>
                                <p className="text-[10px] font-black text-muted mt-0.5 uppercase tracking-tighter">Weekly View Pipeline</p>
                            </div>
                        </div>
                        <div className="flex p-1 bg-page border border-border-card rounded-xl gap-1">
                            <button onClick={() => {
                                const d = new Date(viewDate);
                                d.setDate(d.getDate() - 7);
                                setViewDate(d);
                            }} className="p-2 hover:bg-card hover:shadow-sm rounded-lg text-muted hover:text-indigo-500 transition-all">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => setViewDate(new Date())} className="px-4 text-[10px] font-black uppercase tracking-widest text-muted hover:text-indigo-500 hover:bg-card rounded-lg transition-all">Today</button>
                            <button onClick={() => {
                                const d = new Date(viewDate);
                                d.setDate(d.getDate() + 7);
                                setViewDate(d);
                            }} className="p-2 hover:bg-card hover:shadow-sm rounded-lg text-muted hover:text-indigo-500 transition-all">
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
                                    className={`flex flex-col items-center gap-4 py-6 rounded-[2rem] transition-all relative group/day ${isSelected ? 'bg-indigo-600 text-white shadow-2xl scale-105 glow-primary' : 'hover:bg-page text-main'}`}
                                >
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-100' : 'text-muted'}`}>
                                        {date.toLocaleString('default', { weekday: 'short' })}
                                    </span>
                                    <span className={`text-xl font-black ${isToday && !isSelected ? 'text-indigo-500' : ''}`}>
                                        {date.getDate()}
                                    </span>
                                    {hasAppt && (
                                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'} shadow-sm`} />
                                    )}
                                    {!hasAppt && mainAvailableSlots.some(s => s.available !== false) && isSameDate(date, selectedDate) && (
                                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSelected ? 'bg-white/50' : 'bg-emerald-500/50'}`} />
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
                                    <h2 className="text-2xl font-black text-main tracking-tight">
                                        {selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </h2>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">
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
                            <div className="space-y-6 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-border-card">
                                {dayAppointments.map((appt, idx) => (
                                    <motion.div
                                        key={appt.id || (appt as any)._id || idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="relative pl-20 group"
                                    >
                                        <div className="absolute left-[30px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-card bg-indigo-500 ring-4 ring-indigo-500/20 z-10 group-hover:scale-125 transition-transform" />

                                        <div className="bg-card rounded-[2.5rem] p-8 border border-border-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-8 group/card">
                                            <div className="flex items-start gap-8">
                                                <div className="flex flex-col items-center justify-center p-4 bg-page border border-border-card rounded-2xl group-hover/card:bg-indigo-500/10 group-hover/card:border-indigo-500/30 transition-colors">
                                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none mb-1">
                                                        {new Date(appt.scheduled_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}
                                                    </p>
                                                    <p className="text-lg font-black text-main leading-none">
                                                        {new Date(appt.scheduled_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}
                                                    </p>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                                            {appt.consult_type === 'virtual' ? 'Video Consult' : 'In-Person'}
                                                        </span>
                                                        <span className="text-[9px] font-black text-muted uppercase tracking-widest">ID: {String(appt.id || (appt as any)._id).slice(-5)}</span>
                                                    </div>
                                                    <h4 className="text-xl font-black text-main leading-tight mb-3">
                                                        {appt.reason || 'Symptom Review & Follow-up'}
                                                    </h4>
                                                    <div className="flex items-center gap-3">
                                                        {(() => {
                                                            const p = appt.participants?.find((part: any) =>
                                                                part.role === 'subscriber' ||
                                                                part.role === 'patient' ||
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
                                                                    <p className="text-sm font-bold text-main/80">
                                                                        {pName}
                                                                    </p>
                                                                </>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border-card pt-6 md:pt-0 md:pl-8">
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
                                                <button
                                                    className="p-4 text-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-2xl transition-all"
                                                    onClick={() => handleRescheduleClick(appt)}
                                                    title="Reschedule Session"
                                                >
                                                    <RefreshCw size={20} />
                                                </button>
                                                <button className="p-4 text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all" title="Cancel Session"><X size={20} /></button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-page/50 rounded-[4rem] p-24 text-center border-2 border-dashed border-border-card">
                                <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner shadow-black/5 border border-border-card">
                                    <CalendarIcon size={40} className="text-muted/50" />
                                </div>
                                <p className="font-black text-main uppercase tracking-[0.2em] text-sm text-gradient-primary">Quiet Pipeline</p>
                                <p className="text-muted font-semibold text-sm mt-2">No clinical appointments scheduled for this date.</p>
                            </div>
                        )}

                        {/* Highly Visible Availability Section */}
                        <div className="bg-card rounded-[2.5rem] p-10 border border-border-card shadow-sm space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20"><Clock size={20} /></div>
                                    <div>
                                        <h3 className="text-xl font-black text-main uppercase">Open Clinical Capacity</h3>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">
                                            {mainAvailableSlots.filter((s: any) => s.available !== false).length} Available Slot(s) for {selectedDate.toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" className="rounded-xl py-3 px-6 text-[10px] uppercase font-black tracking-widest border-border-card text-main hover:bg-page" onClick={() => navigate('/clinical/availability')}>Adjust Rules</Button>
                            </div>

                            {isLoadingMainSlots ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
                                    {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-page rounded-2xl" />)}
                                </div>
                            ) : mainAvailableSlots.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {mainAvailableSlots.map((slot: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-2xl border ${slot.available !== false ? 'bg-card border-border-card hover:border-indigo-500/50 hover:shadow-lg hover:-translate-y-1' : 'bg-page border-border-card opacity-40'} transition-all cursor-pointer group`}
                                            onClick={() => {
                                                if (slot.available !== false) {
                                                    setBookingDate(selectedDate.toISOString().split('T')[0]);
                                                    setBookingTime(slot.startTime);
                                                    // Stay on 'patient' step; once patient is picked,
                                                    // the details step will re-fetch slots and the
                                                    // pre-selected time will auto-highlight.
                                                    setBookingStep('patient');
                                                    setIsModalOpen(true);
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className={`text-sm font-black ${slot.available !== false ? 'text-main group-hover:text-indigo-500' : 'text-muted'}`}>
                                                    {slot.startTime || '—'}
                                                </span>
                                                {slot.endTime && (
                                                    <span className="text-[9px] font-bold text-muted">{slot.endTime}</span>
                                                )}
                                                <span className={`text-[9px] font-black uppercase tracking-tighter ${slot.available !== false ? 'text-emerald-500' : 'text-rose-400'}`}>
                                                    {slot.available !== false ? 'Available' : 'Booked'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-10 text-center bg-page rounded-3xl border border-dashed border-border-card flex flex-col items-center">
                                    <Activity size={32} className="text-muted/50 mb-4" />
                                    <p className="text-xs font-bold text-muted uppercase tracking-widest">No available slots configured for this duration.</p>
                                </div>
                            )}
                        </div>
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
                            <h3 className="font-black text-main text-xs uppercase tracking-widest border-b border-border-card pb-4">Recent Notes</h3>
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="p-4 bg-page rounded-2xl border border-border-card hover:border-indigo-500/30 transition-all">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Patient Feedback • 2h ago</p>
                                        <p className="text-xs font-bold text-main/80 leading-relaxed italic line-clamp-2">"Patient reported significant improvement in sleep hygiene after last session..."</p>
                                    </div>
                                ))}
                            </div>
                            <Button variant="outline" className="w-full text-[10px] py-4 rounded-xl font-black uppercase tracking-widest border-border-card text-main hover:bg-page">Review Archive</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium 2-Step Booking Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

                        {bookingSuccess ? (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-card rounded-[4rem] p-16 text-center shadow-sm space-y-8 max-w-md w-full border border-border-card">
                                <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto"><CheckCircle2 size={48} /></div>
                                <div>
                                    <h3 className="text-3xl font-black text-main tracking-tight">Success!</h3>
                                    <p className="text-muted font-semibold mt-2">The session with {selectedPatient?.firstName} has been synchronized.</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative bg-card rounded-[3rem] shadow-sm w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border-card">
                                <header className="p-8 border-b border-border-card flex items-center justify-between shrink-0 glass-surface relative z-10">
                                    <div className="flex items-center gap-4">
                                        {bookingStep === 'details' && (
                                            <button onClick={() => setBookingStep('patient')} className="p-2.5 bg-page hover:bg-page/80 rounded-xl transition-all">
                                                <ArrowLeft size={18} />
                                            </button>
                                        )}
                                        <div>
                                            <h3 className="font-black text-main text-xl tracking-tight uppercase">
                                                {bookingStep === 'patient' ? 'Select Patient' : 'Session Details'}
                                            </h3>
                                            <div className="flex gap-2 mt-1">
                                                <div className={`h-1 rounded-full transition-all duration-500 ${bookingStep === 'patient' ? 'w-8 bg-indigo-500' : 'w-4 bg-emerald-500'}`} />
                                                <div className={`h-1 rounded-full transition-all duration-500 ${bookingStep === 'details' ? 'w-8 bg-indigo-500' : 'w-4 bg-muted/30'}`} />
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="p-3 bg-page hover:bg-error/10 hover:text-error rounded-2xl transition-all"><X size={20} className="text-muted" /></button>
                                </header>

                                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                                    {bookingStep === 'patient' ? (
                                        <div className="space-y-8 animate-fade-in">
                                            <div className="relative group">
                                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-indigo-500 transition-colors" size={20} />
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
                                                    className="w-full bg-page border-2 border-transparent rounded-2xl py-4.5 pl-16 pr-6 text-sm font-bold focus:outline-none focus:border-indigo-500/20 text-main transition-all shadow-inner"
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Recent & Matching Patients</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {patients.map((patient: any, idx) => (
                                                        <button
                                                            key={patient.id || idx}
                                                            onClick={() => {
                                                                setSelectedPatient(patient);
                                                                setBookingStep('details');
                                                            }}
                                                            className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all group/p ${selectedPatient?.id === patient.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-border-card hover:border-indigo-500/30 hover:bg-page'}`}
                                                        >
                                                            <div className="w-14 h-14 rounded-2xl bg-indigo-500 border border-indigo-500/20 flex items-center justify-center text-white text-sm font-black shadow-sm group-hover/p:scale-110 transition-transform">
                                                                {(patient.firstName || patient.first_name || patient.name || '?').charAt(0).toUpperCase()}
                                                                {(patient.lastName || patient.last_name || '').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="text-left flex-1">
                                                                <p className="font-black text-main tracking-tighter">
                                                                    {patient.firstName || patient.first_name || patient.name?.split(' ')[0] || ''} {patient.lastName || patient.last_name || patient.name?.split(' ').slice(1).join(' ') || ''}
                                                                </p>
                                                                <p className="text-[10px] font-bold text-muted mt-0.5">ID: {String(patient.id || patient.userId).slice(-8)}</p>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full bg-page border border-border-card flex items-center justify-center opacity-0 group-hover/p:opacity-100 transition-opacity">
                                                                <Plus size={16} className="text-indigo-500" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-10 animate-fade-in">
                                            <div className="bg-indigo-500/10 rounded-[2rem] p-6 border border-indigo-500/20 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm"><UserCheck size={24} /></div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-500/70 uppercase tracking-widest leading-none mb-1">Assigned Patient</p>
                                                        <p className="text-lg font-black text-indigo-500 leading-none">{selectedPatient?.firstName} {selectedPatient?.lastName}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setBookingStep('patient')} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:underline px-4 py-2 bg-card rounded-xl shadow-sm border border-indigo-500/10">Change</button>
                                            </div>

                                            <div className="space-y-8 bg-page p-6 rounded-[2.5rem] border border-border-card">
                                                {/* Date Selector */}
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between px-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                                                <CalendarIcon size={16} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-main uppercase tracking-widest block leading-none mb-1">Session Date</label>
                                                                <span className="text-[10px] font-semibold text-muted">Choose a day for consultation</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="date"
                                                        value={bookingDate}
                                                        onChange={e => setBookingDate(e.target.value)}
                                                        className="w-full bg-card rounded-2xl py-4 px-6 text-main text-sm font-bold border-2 border-border-card focus:border-indigo-500/30 transition-all outline-none"
                                                    />
                                                </div>

                                                <div className="h-px bg-border-card w-full" />

                                                {/* Slot Selector */}
                                                <div className="space-y-5">
                                                    <div className="flex items-center justify-between px-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                                                                <Clock size={16} />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-black text-main uppercase tracking-widest block leading-none mb-1">Available Slots</label>
                                                                <span className="text-[10px] font-semibold text-muted">Select an open timeframe</span>
                                                            </div>
                                                        </div>
                                                        {availableSlots.length > 0 && !isLoadingSlots && (
                                                            <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full">
                                                                {availableSlots.filter((s: any) => s.available !== false).length} Slots
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isLoadingSlots ? (
                                                        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-[2rem] border border-border-card shadow-sm">
                                                            <Activity className="animate-spin text-indigo-500 mb-3" size={28} />
                                                            <span className="text-xs font-bold text-muted animate-pulse">Scanning schedule...</span>
                                                        </div>
                                                    ) : availableSlots.length > 0 ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[16rem] overflow-y-auto pr-2 custom-scrollbar">
                                                            {availableSlots.map((slot: any, idx) => {
                                                                const isSelected = bookingTime === slot.startTime;
                                                                const disabled = slot.available === false;
                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        onClick={() => setBookingTime(slot.startTime)}
                                                                        disabled={disabled}
                                                                        className={`relative overflow-hidden py-3 px-2 rounded-2xl border text-xs transition-all duration-300 ${disabled
                                                                                ? 'bg-page border-border-card text-muted cursor-not-allowed opacity-60'
                                                                                : isSelected
                                                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 z-10'
                                                                                    : 'bg-card border-border-card text-main font-bold hover:border-indigo-500/50 hover:text-indigo-400 hover:shadow-md hover:-translate-y-0.5'
                                                                            }`}
                                                                    >
                                                                        {isSelected && <div className="absolute inset-0 bg-white/20" />}
                                                                        <span className={`relative z-10 flex flex-col items-center gap-0.5 ${isSelected ? 'font-black' : ''}`}>
                                                                            <span>{slot.startTime || '—'}</span>
                                                                            {slot.endTime && <span className="text-[9px] opacity-70">{slot.endTime}</span>}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-card rounded-[2rem] py-8 px-6 text-center border border-border-card shadow-sm flex flex-col items-center gap-3">
                                                            <div className="w-12 h-12 bg-page rounded-full flex items-center justify-center text-muted">
                                                                <CalendarIcon size={24} />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-main">Fully Booked</p>
                                                                <p className="text-xs font-semibold text-muted mt-1">No open slots on this date.</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 px-2">
                                                    <FileText size={14} className="text-muted" />
                                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Clinical Reason / Objective</label>
                                                </div>
                                                <textarea
                                                    value={bookingReason}
                                                    onChange={e => setBookingReason(e.target.value)}
                                                    placeholder="Specify the consultation objective (e.g. Anxiety Assessment, Med Review)..."
                                                    rows={4}
                                                    className="w-full bg-page rounded-3xl py-5 px-6 text-sm font-semibold border-2 border-transparent focus:border-indigo-500/20 text-main transition-all outline-none resize-none leading-relaxed"
                                                />
                                            </div>

                                            {bookingError && (
                                                <div className="bg-error/10 p-4 rounded-2xl border border-error/20 flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-error" />
                                                    <p className="text-[10px] font-black text-error uppercase tracking-widest">{bookingError}</p>
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
                                                        <ChevronRightIcon size={18} />
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

            {/* Reschedule Modal */}
            <AnimatePresence>
                {isRescheduleModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsRescheduleModalOpen(false)} />

                        {rescheduleSuccess ? (
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[4rem] p-16 text-center shadow-2xl space-y-8 max-w-md w-full border border-indigo-50">
                                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-100/50"><CheckCircle2 size={48} /></div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Success!</h3>
                                    <p className="text-slate-500 font-semibold mt-2">The session has been successfully rescheduled.</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
                                <header className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0 glass-surface relative z-10">
                                    <div>
                                        <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">Reschedule Session</h3>
                                        <p className="text-sm text-slate-500 font-semibold">Select a new date and time</p>
                                    </div>
                                    <button onClick={() => setIsRescheduleModalOpen(false)} className="p-3 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"><X size={20} /></button>
                                </header>

                                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block leading-none mb-1">New Date</label>
                                        <input
                                            type="date"
                                            value={rescheduleDate}
                                            onChange={e => setRescheduleDate(e.target.value)}
                                            className="w-full bg-slate-50 rounded-2xl py-4 px-6 text-slate-700 text-sm font-bold border-2 border-slate-100 focus:border-indigo-500/30 focus:shadow-xl focus:shadow-indigo-500/10 transition-all outline-none"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest block leading-none">Available Slots</label>
                                            {rescheduleAvailableSlots.length > 0 && !isLoadingRescheduleSlots && (
                                                <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full">
                                                    {rescheduleAvailableSlots.filter((s: any) => s.available !== false).length} Slots
                                                </span>
                                            )}
                                        </div>

                                        {isLoadingRescheduleSlots ? (
                                            <div className="flex justify-center p-8"><Activity className="animate-spin text-indigo-500" size={24} /></div>
                                        ) : rescheduleAvailableSlots.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-3 max-h-[16rem] overflow-y-auto pr-2 custom-scrollbar">
                                                {rescheduleAvailableSlots.map((slot: any, idx) => {
                                                    const isSelected = rescheduleTime === slot.startTime;
                                                    const disabled = slot.available === false;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setRescheduleTime(slot.startTime)}
                                                            disabled={disabled}
                                                            className={`relative py-3 px-2 rounded-2xl border text-xs transition-all ${disabled ? 'bg-slate-50 border-slate-100 text-slate-300 opacity-60' :
                                                                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' :
                                                                        'bg-white border-slate-200 text-slate-600 hover:border-indigo-400'
                                                                }`}
                                                        >
                                                            <span className={isSelected ? 'font-black' : 'font-bold'}>{slot.startTime}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 text-sm font-semibold">No open slots on this date.</div>
                                        )}
                                    </div>

                                    {rescheduleError && (
                                        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center gap-3">
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{rescheduleError}</p>
                                        </div>
                                    )}

                                    <Button
                                        variant="primary"
                                        className="w-full rounded-[2rem] py-6 flex items-center justify-center text-sm font-black uppercase tracking-widest shadow-xl"
                                        onClick={submitReschedule}
                                        disabled={isRescheduling}
                                    >
                                        {isRescheduling ? <Activity className="animate-spin" size={24} /> : 'Confirm Reschedule'}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ClinicalSchedulePage;
