import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    Plus,
    X,
    Trash2,
    Edit2,
    Search,
    Clock,
    RefreshCw,
    ArrowLeft,
    UserCheck,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Activity,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScheduleService } from '../../api/services/schedule.service';
import { UserService } from '../../api/services/user.service';
import type { SpecialistDirectoryNode, TimeSlot, ScheduleOverridePayload } from '../../types/schedule.types';
import type { User } from '../../types/user.types';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';

const ScheduleControlPage = () => {
    const navigate = useNavigate();
    const [specialists, setSpecialists] = useState<SpecialistDirectoryNode[]>([]);
    const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistDirectoryNode | null>(null);
    const [isLoadingDirectory, setIsLoadingDirectory] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Clinical Timeline State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [mainAvailableSlots, setMainAvailableSlots] = useState<TimeSlot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    
    // Override State
    const [overrides, setOverrides] = useState<TimeSlot[]>([]);
    const [isLoadingOverrides, setIsLoadingOverrides] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentOverrideId, setCurrentOverrideId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({
        specialist_id: '',
        date: new Date().toISOString().split('T')[0],
        dayOfWeek: null,
        startTime: '09:00',
        endTime: '17:00',
        reason: 'Shift Override'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchDirectory = useCallback(async () => {
        setIsLoadingDirectory(true);
        try {
            const data = await ScheduleService.getDirectory();
            setSpecialists(data);
        } catch (error) {
            console.error('Failed to load specialists directory', error);
        } finally {
            setIsLoadingDirectory(false);
        }
    }, []);

    useEffect(() => {
        fetchDirectory();
    }, [fetchDirectory]);

    const fetchOverrides = useCallback(async (specialistId: string | number) => {
        setIsLoadingOverrides(true);
        try {
            // Get actual override shift objects
            const data = await ScheduleService.listOverrides(specialistId);
            setOverrides(data);
        } catch (error) {
            console.error('Failed to load overrides', error);
        } finally {
            setIsLoadingOverrides(false);
        }
    }, []);

    const fetchDailySlots = useCallback(async () => {
        if (!selectedSpecialist) return;
        setIsLoadingSlots(true);
        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            const slots = await ScheduleService.getAvailableSlots({
                specialist_id: selectedSpecialist.userId,
                date: dateStr
            });
            setMainAvailableSlots(slots);
        } catch (error) {
            console.error('Failed to fetch daily slots', error);
        } finally {
            setIsLoadingSlots(false);
        }
    }, [selectedSpecialist, selectedDate]);

    useEffect(() => {
        if (selectedSpecialist) {
            fetchOverrides(selectedSpecialist.userId);
            fetchDailySlots();
            setFormData((prev: any) => ({ ...prev, specialist_id: selectedSpecialist.userId }));
        }
    }, [selectedSpecialist, fetchOverrides, fetchDailySlots]);

    // Calendar Helpers
    const monthDays = useMemo(() => {
        const days = [];
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const numDays = new Date(year, month + 1, 0).getDate();
        
        for (let i = 1; i <= numDays; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [viewDate]);

    const filteredSpecialists = specialists.filter(s => 
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setMessage(null);
        try {
            if (modalMode === 'create') {
                await ScheduleService.createOverride(formData);
            } else {
                await ScheduleService.updateOverride(currentOverrideId!, formData);
            }
            setMessage({ 
                type: 'success', 
                text: `Schedule override ${modalMode === 'create' ? 'created' : 'updated'} successfully.` 
            });
            setIsModalOpen(false);
            if (selectedSpecialist) fetchOverrides(selectedSpecialist.userId);
        } catch (error: any) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || `Failed to ${modalMode === 'create' ? 'create' : 'update'} override.` 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (ov: any) => {
        setModalMode('edit');
        setCurrentOverrideId(ov._id || ov.id);
        setFormData({
            specialist_id: selectedSpecialist?.userId || '',
            date: ov.date || new Date().toISOString().split('T')[0],
            dayOfWeek: ov.dayOfWeek !== undefined ? ov.dayOfWeek : null,
            startTime: ov.startTime,
            endTime: ov.endTime,
            reason: ov.description || ov.reason || 'Shift Override'
        });
        setIsModalOpen(true);
    };

    const handleDeleteOverride = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this schedule override?')) return;
        try {
            await ScheduleService.deleteOverride(id);
            setMessage({ type: 'success', text: 'Override deleted.' });
            if (selectedSpecialist) fetchOverrides(selectedSpecialist.userId);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Failed to delete override.' });
        }
    };

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl pb-32">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-muted opacity-80 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Command
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <CalendarIcon size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-main tracking-tight">Schedule Control</h1>
                            <p className="text-muted font-medium italic">Advanced Clinical Overrides & Bandwidth Management.</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="secondary"
                        leftIcon={<RefreshCw size={18} className={isLoadingDirectory ? 'animate-spin' : ''} />}
                        onClick={fetchDirectory}
                        className="rounded-2xl"
                    >
                        Sync Directory
                    </Button>
                    {selectedSpecialist && (
                        <Button
                            variant="primary"
                            leftIcon={<Plus size={18} />}
                            onClick={() => {
                                setModalMode('create');
                                setIsModalOpen(true);
                            }}
                            className="rounded-2xl shadow-xl shadow-sm"
                        >
                            Force Shift
                        </Button>
                    )}
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Specialist Listing */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="card-premium p-6 border-border-card/50">
                        <h3 className="text-[11px] font-black text-muted opacity-80 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Search size={14} /> Specialist Directory
                        </h3>
                        <div className="relative mb-6">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-80" />
                            <input
                                type="text"
                                placeholder="Search by name or role..."
                                className="w-full bg-page border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto no-scrollbar">
                            {isLoadingDirectory ? (
                                <div className="py-20 text-center opacity-30"><RefreshCw className="animate-spin mx-auto" size={32} /></div>
                            ) : filteredSpecialists.map(s => (
                                <button
                                    key={s.userId}
                                    onClick={() => setSelectedSpecialist(s)}
                                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all border-2 text-left ${
                                        selectedSpecialist?.userId === s.userId 
                                            ? 'border-indigo-600 bg-indigo-500/10' 
                                            : 'border-transparent hover:bg-page'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${
                                        selectedSpecialist?.userId === s.userId ? 'bg-indigo-600 text-white' : 'bg-page text-muted opacity-80'
                                    }`}>
                                        {s.firstName[0]}{s.lastName[0]}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-main">{s.firstName} {s.lastName}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{s.role}</span>
                                            {s.nextAvailableSlot && (
                                                <span className="text-[9px] font-black text-emerald-600 uppercase">Available Soon</span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedSpecialist?.userId === s.userId && <UserCheck size={18} className="text-indigo-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Overrides Manager */}
                <div className="lg:col-span-8 space-y-8">
                    {selectedSpecialist ? (
                        <div className="animate-fade-in-up space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                                <div className="flex items-center gap-4">
                                    <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                                    <div>
                                        <h2 className="text-2xl font-black text-main tracking-tight">
                                            {selectedSpecialist.firstName}'s Clinical Timeline
                                        </h2>
                                        <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mt-0.5">
                                            Viewing availability and bandwidth for {selectedDate.toDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-page p-1.5 rounded-2xl border border-border-card">
                                    <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))} className="p-2 hover:bg-card hover:shadow-sm rounded-xl transition-all"><ChevronLeft size={16} /></button>
                                    <span className="px-4 text-[10px] font-black uppercase tracking-widest text-muted opacity-80">
                                        {viewDate.toLocaleString('default', { month: 'long' })} {viewDate.getFullYear()}
                                    </span>
                                    <button onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))} className="p-2 hover:bg-card hover:shadow-sm rounded-xl transition-all"><ChevronRight size={16} /></button>
                                </div>
                            </div>

                            {/* Mini Calendar Strip */}
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2 items-center snap-x">
                                {monthDays.map((d: Date) => (
                                    <button
                                        key={d.toISOString()}
                                        onClick={() => setSelectedDate(d)}
                                        className={`flex-shrink-0 min-w-[100px] p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 transition-all border-2 snap-center ${
                                            d.toDateString() === selectedDate.toDateString()
                                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-xl glow-primary scale-105 z-10'
                                            : 'bg-card border-border-card text-muted opacity-80 font-bold hover:border-indigo-200 hover:scale-105'
                                        }`}
                                    >
                                        <span className="text-[10px] uppercase font-black tracking-widest opacity-60">
                                            {d.toLocaleDateString('default', { weekday: 'short' })}
                                        </span>
                                        <span className="text-xl font-black tracking-tighter">{d.getDate()}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="grid lg:grid-cols-2 gap-10">
                                {/* Daily Timeline */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-muted opacity-80 uppercase tracking-widest px-2">Focus Day View</h3>
                                    {isLoadingSlots ? (
                                        <div className="py-20 text-center opacity-30"><RefreshCw className="animate-spin mx-auto" size={32} /></div>
                                    ) : mainAvailableSlots.length > 0 ? (
                                        <div className="space-y-4">
                                            {mainAvailableSlots.map((slot, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => !slot.available && handleEditClick(slot)}
                                                    className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all group ${
                                                        !slot.available 
                                                            ? 'bg-indigo-500/10 border-indigo-500/20 cursor-pointer hover:border-indigo-500/40' 
                                                            : 'bg-card border-border-card border-dashed opacity-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-2xl ${!slot.available ? 'bg-indigo-100 text-indigo-600' : 'bg-page text-muted opacity-40'}`}>
                                                            <Clock size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-main">{slot.startTime} - {slot.endTime}</p>
                                                            <p className={`text-[9px] font-black uppercase tracking-widest ${!slot.available ? 'text-indigo-500' : 'text-muted opacity-80'}`}>
                                                                {slot.available ? 'Open Availability' : slot.reason || 'Blocked / Overridden'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {slot.available ? (
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFormData({
                                                                        ...formData,
                                                                        startTime: slot.startTime,
                                                                        endTime: slot.endTime,
                                                                        date: selectedDate.toISOString().split('T')[0]
                                                                    });
                                                                    setModalMode('create');
                                                                    setIsModalOpen(true);
                                                                }}
                                                                className="text-[10px] font-black text-indigo-600 uppercase hover:bg-indigo-500/10 px-3 py-2 rounded-xl"
                                                            >
                                                                Override
                                                            </button>
                                                        ) : (
                                                            <Edit2 size={16} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-10 text-center bg-page rounded-[2rem] border border-border-card">
                                            <p className="text-xs font-bold text-muted opacity-80 italic">No slot configurations found for this date.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Active Rules Context */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xs font-black text-muted opacity-80 uppercase tracking-widest">Active Overrides</h3>
                                        {overrides.length > 0 && <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg">{overrides.length} Total</span>}
                                    </div>
                                    
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pb-10">
                                        {isLoadingOverrides ? (
                                            <div className="py-20 text-center opacity-30"><RefreshCw className="animate-spin mx-auto" size={32} /></div>
                                        ) : overrides.length > 0 ? (
                                            overrides.map(ov => (
                                                <div key={ov.id} className="card-premium p-5 border-border-card flex items-center justify-between group hover:border-indigo-200 transition-all">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-main flex items-center gap-2">
                                                            {ov.dayOfWeek !== null && ov.dayOfWeek !== undefined 
                                                                ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][ov.dayOfWeek]
                                                                : ov.date 
                                                                    ? new Date(ov.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                                    : 'Manual Slot'}
                                                            <span className="text-[8px] px-1.5 py-0.5 bg-page text-muted opacity-80 rounded">
                                                                {ov.startTime} - {ov.endTime}
                                                            </span>
                                                        </p>
                                                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest opacity-60">
                                                            {ov.dayOfWeek !== null && ov.dayOfWeek !== undefined ? 'Recurring' : 'One-Time Override'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button 
                                                            onClick={() => handleEditClick(ov)}
                                                            className="p-2 text-muted opacity-40 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteOverride(ov.id!)}
                                                            className="p-2 text-muted opacity-40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-10 text-center bg-card/50 rounded-3xl border border-dashed border-border-card">
                                                <p className="text-[10px] font-bold text-muted opacity-80 italic">No manual rules set.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 opacity-20 text-muted opacity-80 text-center space-y-6">
                            <UserCheck size={80} />
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-widest">Awaiting Selection</h3>
                                <p className="font-medium">Select a practitioner from the directory to control their clinical timeline.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Shift Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-card rounded-[3rem] p-10 max-w-xl w-full shadow-2xl relative border border-border-card"
                        >
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="absolute top-8 right-8 p-3 text-muted opacity-40 hover:text-main hover:bg-page rounded-2xl transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-3xl font-black text-main tracking-tight">Force Shift Override</h3>
                                    <p className="text-muted opacity-80 font-medium">Manually override availability for {selectedSpecialist?.firstName}.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex p-1 bg-page rounded-2xl border border-border-card">
                                            <button 
                                                onClick={() => setFormData({ ...formData, dayOfWeek: null })}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.dayOfWeek === null ? 'bg-card text-indigo-600 shadow-sm' : 'text-muted opacity-80 hover:text-muted'}`}
                                            >
                                                Specific Date
                                            </button>
                                            <button 
                                                onClick={() => setFormData({ ...formData, dayOfWeek: 1 })}
                                                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${formData.dayOfWeek !== null ? 'bg-card text-indigo-600 shadow-sm' : 'text-muted opacity-80 hover:text-muted'}`}
                                            >
                                                Recurring Day
                                            </button>
                                        </div>

                                        {formData.dayOfWeek === null ? (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest px-1">Effective Date</label>
                                                <InputField 
                                                    type="date" 
                                                    value={formData.date} 
                                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                                    leftIcon={<CalendarIcon size={18} />}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest px-1">Select Day</label>
                                                <select 
                                                    value={formData.dayOfWeek}
                                                    onChange={e => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                                                    className="w-full bg-page border border-border-card rounded-2xl py-3 px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                                                >
                                                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                                                        <option key={idx} value={idx}>{day}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest px-1">Start Time</label>
                                            <InputField 
                                                type="time" 
                                                value={formData.startTime} 
                                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                                leftIcon={<Clock size={18} />}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest px-1">End Time</label>
                                            <InputField 
                                                type="time" 
                                                value={formData.endTime} 
                                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                                leftIcon={<Clock size={18} />}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest px-1">Admin Reason</label>
                                        <InputField 
                                            placeholder="e.g., Emergency Triage Duty" 
                                            value={formData.reason} 
                                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-page rounded-[2rem] border border-border-card flex items-start gap-4">
                                    <div className="p-2 bg-warning/10 text-warning rounded-xl"><AlertTriangle size={20} /></div>
                                    <p className="text-xs font-semibold text-muted leading-relaxed">
                                        <span className="font-black text-main block mb-1">Impact Warning</span>
                                        Overrides set here will supersede the specialist's standard weekly rules. This action will be captured in the global audit trail.
                                    </p>
                                </div>

                                <Button 
                                    variant="primary" 
                                    className="w-full h-14 rounded-2xl shadow-xl shadow-sm font-black uppercase tracking-widest"
                                    onClick={handleSubmit}
                                    isLoading={isSubmitting}
                                >
                                    {modalMode === 'create' ? 'Confirm Shift Change' : 'Save Adjustments'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Notification Drawer */}
            <AnimatePresence>
                {message && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: 50 }} 
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200]"
                    >
                        <div className={`px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${
                            message.type === 'success' ? 'bg-emerald-600/90 text-white border-white/20' : 'bg-red-600/90 text-white border-white/20'
                        }`}>
                            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                            <span className="text-xs font-bold">{message.text}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ScheduleControlPage;
