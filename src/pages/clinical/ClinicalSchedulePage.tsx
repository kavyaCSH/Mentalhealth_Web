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
    MessageSquare,
    MoreHorizontal,
    AlertCircle,
    Play
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { TeleConsultService } from '../../api/services/teleconsult.service';
import { UserService } from '../../api/services/user.service';
import { ScheduleService } from '../../api/services/schedule.service';
import type { RootState } from '../../store';
import type { Consultation } from '../../types/common.types';
import type { Patient } from '../../types/user.types';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';

const ClinicalSchedulePage = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // View State
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Consultation[]>([]);
    const [mainAvailableSlots, setMainAvailableSlots] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Booking & Reschedule Modals
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

    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleData, setRescheduleData] = useState<Consultation | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState(new Date().toISOString().split('T')[0]);
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleAvailableSlots, setRescheduleAvailableSlots] = useState<any[]>([]);
    const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [rescheduleError, setRescheduleError] = useState('');
    const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

    // Patient Selection
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientSearch, setPatientSearch] = useState('');

    // Fetch Logic
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
            
            // Get actual override shift objects
            const currentUid = user?.userId || user?.id;
            if (currentUid) {
                const data = await ScheduleService.listOverrides(currentUid);
                // We'll merge these into the timeline in a future iteration if needed,
                // for now we ensure the fetch works without 400s.
                
                const slotsData = await ScheduleService.getAvailableSlots({
                    specialist_id: currentUid,
                    date: selectedDate.toISOString().split('T')[0],
                });
                setMainAvailableSlots(slotsData);
            }
        } catch {
            setAppointments([]);
        } finally {
            setIsLoading(false);
        }
    }, [user, selectedDate]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    // Sorting & Filtering
    const dayAppointments = useMemo(() => {
        return appointments
            .filter((e) => new Date(e.scheduled_at || '').toDateString() === selectedDate.toDateString())
            .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());
    }, [appointments, selectedDate]);

    const timelineItems = useMemo(() => {
        const items: { type: 'booked' | 'available', data: any, time: string }[] = [
            ...dayAppointments.map((a: Consultation) => ({ type: 'booked' as const, data: a, time: new Date(a.scheduled_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) })),
            ...mainAvailableSlots
                .filter(s => s.available && !dayAppointments.some((a: Consultation) => new Date(a.scheduled_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) === s.startTime))
                .map(s => ({ type: 'available' as const, data: s, time: s.startTime }))
        ];
        return items.sort((a, b) => a.time.localeCompare(b.time));
    }, [dayAppointments, mainAvailableSlots]);

    const nextSession = useMemo(() => {
        const now = new Date();
        return appointments
            .filter(a => new Date(a.scheduled_at!) > now && a.status === 'scheduled')
            .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())[0];
    }, [appointments]);

    // Handlers
    const handleJoinCall = useCallback(async (session: Consultation) => {
        const apptId = session.id || session.consult_id || (session as any)._id;
        const publisher = session.participants?.find((p: any) =>
            p.role === 'publisher' || String(p.ref_number) === String(user?.userId || user?.id)
        );
        const token = publisher?.token || (session as any).publisher_token || (session as any).token;

        if (token) {
            navigate(`/teleconsult/${apptId}`, { state: { appointment: session, token } });
        } else {
            alert('Consultation token not found.');
        }
    }, [user, navigate]);

    // Calendar Helpers
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

    return (
        <div className="min-h-screen bg-page p-8 flex gap-8">
            {/* Sidebar: Mini Calendar & Stats */}
            <aside className="w-80 flex-shrink-0 space-y-8 h-[calc(100vh-64px)] overflow-y-auto no-scrollbar pb-10">
                <div className="card-premium p-6 border-border-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-muted uppercase tracking-widest italic">Clinical Calendar</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-1.5 hover:bg-page rounded-lg text-main"><ChevronLeft size={16} /></button>
                            <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-1.5 hover:bg-page rounded-lg text-main"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-muted uppercase mb-4">
                        {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                        {/* Month Rendering Logic would go here, simplified for now to selected week */}
                        {weekDays.map(d => (
                            <button
                                key={d.toISOString()}
                                onClick={() => setSelectedDate(d)}
                                className={`h-10 rounded-xl flex flex-col items-center justify-center transition-all ${
                                    d.toDateString() === selectedDate.toDateString()
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 glow-primary'
                                    : 'hover:bg-page text-main font-bold'
                                }`}
                            >
                                <span className="text-xs">{d.getDate()}</span>
                                {appointments.some(a => new Date(a.scheduled_at!).toDateString() === d.toDateString()) && (
                                    <div className={`w-1 h-1 rounded-full mt-0.5 ${d.toDateString() === selectedDate.toDateString() ? 'bg-white' : 'bg-indigo-400'}`} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Daily Bandwidth Stats */}
                <div className="card-premium p-6 border-transparent bg-gradient-to-br from-indigo-600 to-indigo-900 text-white overflow-hidden relative shadow-lg shadow-indigo-500/20">
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Today's Bandwidth</h3>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-black">{dayAppointments.length}</span>
                            <span className="text-sm font-bold text-indigo-300 mb-1.5">Sessions</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(dayAppointments.length * 10, 100)}%` }}
                                className="h-full bg-indigo-400"
                            />
                        </div>
                        <p className="text-[10px] italic text-indigo-200 mt-4 leading-relaxed font-medium">
                            {dayAppointments.length > 5 ? "Heavy caseload detected. Ensure adequate hydration and breaks." : "Balanced load today."}
                        </p>
                    </div>
                    <Activity size={100} className="absolute -bottom-8 -right-8 text-white/5 rotate-12" />
                </div>

                {/* Quick Patient Search */}
                <div className="card-premium p-6 border-border-card">
                    <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-4">Recent Patients</h3>
                    <div className="space-y-4">
                        {/* Placeholder for recent patients */}
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-3 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-page flex items-center justify-center font-bold text-muted">P{i}</div>
                                <div>
                                    <p className="text-xs font-bold text-main">Patient #{i}04</p>
                                    <p className="text-[10px] font-black text-indigo-500 uppercase">View History</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content: Timeline */}
            <main className="flex-1 space-y-10 pb-32">
                {/* Hero Section: Up Next */}
                <AnimatePresence mode="wait">
                    {nextSession ? (
                        <motion.section 
                            key="next-session"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative"
                        >
                            <div className="card-premium p-10 border-indigo-500/20 bg-card shadow-2xl shadow-indigo-500/5 group overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                                
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                                    <div className="flex gap-8 items-center">
                                        <div className="w-24 h-24 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl glow-primary relative overflow-hidden">
                                            <Video size={40} className="relative z-10" />
                                            <motion.div 
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0 bg-white" 
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">Up Next</span>
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                                    <Clock size={14} /> {new Date(nextSession.scheduled_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h2 className="text-4xl font-black text-main tracking-tight leading-none mb-4">
                                                Teleconsult Session
                                            </h2>
                                            <div className="flex items-center gap-4 text-muted font-medium">
                                                <div className="flex -space-x-2">
                                                    <div className="w-8 h-8 rounded-full border-2 border-border-card bg-page" />
                                                </div>
                                                <p className="text-sm italic">"Reviewing previous trauma markers and anxiety response."</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        variant="primary" 
                                        leftIcon={<Play size={20} />}
                                        onClick={() => handleJoinCall(nextSession)}
                                        className="h-16 px-10 rounded-[2rem] text-lg font-black tracking-widest uppercase shadow-2xl shadow-indigo-200"
                                    >
                                        Join Room
                                    </Button>
                                </div>
                            </div>
                        </motion.section>
                    ) : (
                        <div className="p-10 border-2 border-dashed border-border-card rounded-[3rem] text-center bg-card/50">
                            <h2 className="text-2xl font-black text-muted uppercase tracking-widest">No Sessions Ready</h2>
                            <p className="text-muted italic">Your next session will appear here when it's time.</p>
                        </div>
                    )}
                </AnimatePresence>

                {/* Timeline Header */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-main shadow-sm border border-border-card">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-main tracking-tight">Today's Pulse</h2>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                    <Button variant="outline" leftIcon={<Plus size={18} />} className="rounded-2xl" onClick={() => setIsModalOpen(true)}>Manual Booking</Button>
                </div>

                {/* The Timeline */}
                <div className="relative pl-12 space-y-8">
                    {/* Vertical Line */}
                    <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-border-card" />
                    
                    {timelineItems.length === 0 && !isLoading && (
                        <div className="py-20 text-center opacity-30 italic">No activity for this date.</div>
                    )}

                    {isLoading ? (
                         <div className="py-20 text-center opacity-30"><RefreshCw className="animate-spin mx-auto" size={32} /></div>
                    ) : timelineItems.map((item, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative"
                        >
                            {/* Marker */}
                             <div className={`absolute -left-8 top-8 w-4 h-4 rounded-full border-4 border-page shadow-sm z-10 ${
                                item.type === 'booked' 
                                    ? (item.data.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600') 
                                    : 'bg-muted/30'
                            }`} />
                            
                            <div className={`card-premium p-6 border-border-card hover:border-indigo-500/30 transition-all group flex items-center justify-between ${
                                item.type === 'available' ? 'bg-card/30 border-dashed' : ''
                            }`}>
                                <div className="flex items-center gap-6">
                                    <div className="text-center w-16">
                                        <p className="text-base font-black text-main">{item.time}</p>
                                        <p className="text-[10px] font-black text-muted uppercase">30min</p>
                                    </div>
                                    <div className="w-[1px] h-10 bg-border-card" />
                                    
                                    {item.type === 'booked' ? (
                                         <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-black text-main">Virtual Consultation</span>
                                                {item.data.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500" />}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                                                    item.data.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-500'
                                                }`}>
                                                    {item.data.status}
                                                </span>
                                                <span className="text-[10px] text-muted font-bold italic">{item.data.reason || 'General Follow-up'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                         <div>
                                            <p className="text-sm font-bold text-muted italic">Available Block</p>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Open for Booking</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex gap-2">
                                    {item.type === 'booked' ? (
                                         <>
                                            <button className="p-2 text-muted/30 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all"><MessageSquare size={18} /></button>
                                            <button className="p-2 text-muted/30 hover:text-indigo-500 hover:bg-page rounded-xl transition-all"><MoreHorizontal size={18} /></button>
                                            {item.data.status === 'scheduled' && (
                                                <button 
                                                    onClick={() => handleJoinCall(item.data)}
                                                    className="ml-4 h-10 px-6 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                                >
                                                    Enter
                                                </button>
                                            )}
                                        </>
                                     ) : (
                                        <Button variant="outline" size="sm" className="rounded-xl px-4 text-[10px] font-black tracking-widest uppercase text-muted" onClick={() => setIsModalOpen(true)}>Book</Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Booking Modal (Simplified restyle) */}
            <AnimatePresence>
                 {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-page/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-card rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative border border-border-card"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 p-3 text-muted/30 hover:text-main rounded-2xl transition-all"><X size={20} /></button>
                            <h3 className="text-3xl font-black text-main tracking-tight mb-8">Manual Session</h3>
                            {/* Reuse existing booking logic components here */}
                            <p className="text-muted text-sm mb-6 font-medium italic">Please use the centralized booking engine for complex scheduling.</p>
                            <Button variant="primary" className="w-full h-14 rounded-2xl" onClick={() => setIsModalOpen(false)}>Close</Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                 .glow-primary { box-shadow: 0 0 20px rgba(79, 70, 229, 0.4); }
                .card-premium { background: var(--card-bg); border-radius: 2rem; border: 1px solid var(--border-border-card); }
            `}</style>
        </div>
    );
};

export default ClinicalSchedulePage;
