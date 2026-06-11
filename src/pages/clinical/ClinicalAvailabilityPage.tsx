import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    Clock,
    X,
    Activity,
    Settings,
    Trash,
    Edit3,
    CalendarRange,
    AlertCircle,
    ArrowLeft,
    Plus,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { SpecialistService } from '../../api/services/specialist.service';
import type { RootState } from '../../store';
import Button from '../../components/ui/Button';

const ClinicalAvailabilityPage = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    
    // Availability Management State
    const [availabilityBlocks, setAvailabilityBlocks] = useState<any[]>([]);
    const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<any | null>(null);
    const [isSavingAvailability, setIsSavingAvailability] = useState(false);
    const [availabilityError, setAvailabilityError] = useState('');

    // Form states
    const [formType, setFormType] = useState<'availability' | 'unavailability'>('availability');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [isRecurring, setIsRecurring] = useState(true);
    const [selectedDays, setSelectedDays] = useState<number[]>([1]); // 1 = Monday
    const [slotDuration, setSlotDuration] = useState('30');
    const [bufferTime, setBufferTime] = useState('5');
    const [maxAppointments, setMaxAppointments] = useState('10');
    const [specificDate, setSpecificDate] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);

    const fetchAvailability = useCallback(async () => {
        try {
            setIsAvailabilityLoading(true);
            const res = await SpecialistService.getMySchedule();
            setAvailabilityBlocks(res.data?.schedules || res.data || []);
        } catch (err) {
            console.error('Error fetching availability:', err);
        } finally {
            setIsAvailabilityLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    const resetAvailabilityForm = () => {
        setFormType('availability');
        setStartTime('09:00');
        setEndTime('17:00');
        setIsRecurring(true);
        setSelectedDays([1]);
        setSlotDuration('30');
        setBufferTime('5');
        setMaxAppointments('10');
        setSpecificDate('');
        setDescription('');
        setIsActive(true);
        setEditingBlock(null);
        setAvailabilityError('');
    };

    const handleOpenModal = (block?: any) => {
        if (block) {
            setEditingBlock(block);
            setFormType(block.type);
            setStartTime(block.startTime?.substring(0, 5) || '09:00');
            setEndTime(block.endTime?.substring(0, 5) || '17:00');
            setIsRecurring(block.isRecurring !== false);
            setSelectedDays(block.dayOfWeek != null ? [block.dayOfWeek] : [1]);
            setSlotDuration(String(block.slotDuration || 30));
            setBufferTime(String(block.bufferTime || 5));
            setMaxAppointments(String(block.maxAppointments || 10));
            setSpecificDate(block.specificDate || '');
            setDescription(block.description || '');
            setIsActive(block.isActive !== false);
        } else {
            resetAvailabilityForm();
        }
        setIsModalOpen(true);
    };

    const handleSaveAvailability = async () => {
        setIsSavingAvailability(true);
        setAvailabilityError('');
        try {
            const payload: any = {
                type: formType,
                startTime: startTime.substring(0, 5),
                endTime: endTime.substring(0, 5),
                isActive,
                description
            };

            if (formType === 'availability') {
                payload.isRecurring = isRecurring;
                payload.slotDuration = parseInt(slotDuration);
                payload.bufferTime = parseInt(bufferTime);
                payload.maxAppointments = parseInt(maxAppointments);
                payload.locationTypes = ['virtual'];
            }

            if (isRecurring && formType === 'availability') {
                if (selectedDays.length === 0) throw new Error('Select at least one day');
                
                if (editingBlock && selectedDays.length === 1) {
                    await SpecialistService.updateScheduleBlock(editingBlock.id || editingBlock.scheduleId, { ...payload, dayOfWeek: selectedDays[0] });
                } else {
                    const bulkData = selectedDays.map(day => ({ ...payload, dayOfWeek: day }));
                    await SpecialistService.upsertWeeklySchedule(bulkData);
                }
            } else {
                if (!isRecurring && !specificDate && formType === 'availability') throw new Error('Please select a date');
                payload.specificDate = specificDate || undefined;
                if (editingBlock) {
                    await SpecialistService.updateScheduleBlock(editingBlock.id || editingBlock.scheduleId, payload);
                } else {
                    await SpecialistService.createScheduleBlock(payload);
                }
            }

            setIsModalOpen(false);
            fetchAvailability();
        } catch (err: any) {
            setAvailabilityError(err.response?.data?.message || err.message || 'Error saving availability');
        } finally {
            setIsSavingAvailability(false);
        }
    };

    const handleDeleteAvailability = async (id: string | number) => {
        if (!window.confirm('Are you sure you want to delete this block?')) return;
        try {
            await SpecialistService.deleteScheduleBlock(id);
            fetchAvailability();
        } catch (err) {
            console.error('Error deleting availability:', err);
        }
    };

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="p-8 max-w-7xl animate-fade-in pb-20 space-y-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <ArrowLeft size={20} className="cursor-pointer hover:text-indigo-800 transition-colors" onClick={() => navigate(-1)} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Resources • Availability</span>
                    </div>
                    <h1 className="text-4xl font-black text-main tracking-tight text-gradient-primary">Clinical Availability</h1>
                    <p className="text-muted font-semibold text-sm">Review your active work shifts and time-off schedule blocks.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="primary" leftIcon={<Plus size={20} />} onClick={() => handleOpenModal()} className="rounded-2xl shadow-xl shadow-indigo-100 py-3.5">
                        New Schedule Block
                    </Button>
                </div>
            </header>

            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                        <div>
                            <h2 className="text-2xl font-black text-main tracking-tight uppercase">Active Pipeline</h2>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-0.5">
                                {availabilityBlocks.length} Configured Schedule Blocks
                            </p>
                        </div>
                    </div>
                </div>

                {isAvailabilityLoading ? (
                    <div className="flex justify-center py-20 opacity-30">
                        <Activity size={32} className="animate-spin text-indigo-600" />
                    </div>
                ) : availabilityBlocks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availabilityBlocks.map((block, idx) => {
                            const isAvail = block.type === 'availability';
                            return (
                                <motion.div 
                                    key={block.id || block.scheduleId || idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 rounded-[2.5rem] border border-border-card bg-card hover:border-indigo-500/30 hover:shadow-lg transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${isAvail ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-error/10 text-error border border-error/20'}`}>
                                            {isAvail ? 'Work Shift' : 'Time Off'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleOpenModal(block)} className="p-2.5 text-muted hover:text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDeleteAvailability(block.id || block.scheduleId)} className="p-2.5 text-muted hover:text-error hover:bg-error/10 rounded-xl transition-all"><Trash size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-page rounded-xl flex items-center justify-center text-muted group-hover:text-indigo-500 transition-colors"><Clock size={18} /></div>
                                            <div>
                                                <p className="text-[9px] font-black text-muted uppercase tracking-widest">Time Slot</p>
                                                <p className="text-base font-black text-main">{block.startTime?.substring(0, 5)} - {block.endTime?.substring(0, 5)}</p>
                                            </div>
                                        </div>
                                        {isAvail && block.isRecurring ? (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-page rounded-xl flex items-center justify-center text-muted group-hover:text-indigo-500 transition-colors"><CalendarIcon size={18} /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest">Recurrence</p>
                                                    <p className="text-sm font-bold text-main/80">Every {days[block.dayOfWeek || 0]}</p>
                                                </div>
                                            </div>
                                        ) : block.specificDate && (
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-page rounded-xl flex items-center justify-center text-muted group-hover:text-indigo-500 transition-colors"><CalendarRange size={18} /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest">Date</p>
                                                    <p className="text-sm font-bold text-main/80">{new Date(block.specificDate).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        )}
                                        {isAvail && (
                                            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border-card">
                                                <p className="text-[10px] font-black text-muted uppercase">{block.slotDuration}m Slots</p>
                                                <p className="text-[10px] font-black text-muted uppercase">{block.maxAppointments} Appts</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-20 text-center bg-page rounded-[3rem] border border-dashed border-border-card flex flex-col items-center">
                        <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-6 shadow-sm"><CalendarIcon size={32} className="text-muted/50" /></div>
                        <h4 className="text-lg font-black text-main uppercase">No Blocks Found</h4>
                        <p className="text-xs font-bold text-muted mt-2 max-w-[250px]">Start by configuring your first work shift or time-off period.</p>
                        <Button variant="outline" className="mt-8 rounded-xl px-10 border-border-card text-main hover:bg-card" onClick={() => handleOpenModal()}>Add Availability</Button>
                    </div>
                )}
            </section>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            className="bg-card rounded-[3rem] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-sm relative border border-border-card"
                        >
                            <div className="sticky top-0 bg-card/80 backdrop-blur-md z-10 px-10 py-8 border-b border-border-card flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center"><Settings size={24} /></div>
                                    <div>
                                        <h3 className="font-black text-main text-lg uppercase tracking-tight">{editingBlock ? 'Edit Block' : 'New Configuration'}</h3>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-tighter">Define session generation rules</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-page hover:bg-page/80 rounded-xl transition-colors"><X size={20} className="text-muted" /></button>
                            </div>

                            <div className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-4 p-1.5 bg-page rounded-2xl">
                                    <button onClick={() => setFormType('availability')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formType === 'availability' ? 'bg-card text-indigo-500 shadow-sm' : 'text-muted'}`}>Work Shift</button>
                                    <button onClick={() => setFormType('unavailability')} className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formType === 'unavailability' ? 'bg-card text-error shadow-sm' : 'text-muted'}`}>Time Off</button>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Start Time</label>
                                        <div className="relative"><Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" /><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-page text-main rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-500/50" /></div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">End Time</label>
                                        <div className="relative"><Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" /><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-page text-main rounded-xl py-3 pl-11 pr-4 text-xs font-bold outline-none border-2 border-transparent focus:border-indigo-500/50" /></div>
                                    </div>
                                </div>

                                {formType === 'availability' && (
                                    <>
                                        <div className="flex items-center justify-between p-6 bg-page rounded-[2rem] border border-border-card">
                                            <div><h5 className="text-[10px] font-black text-main uppercase">Recurring weekly</h5><p className="text-[8px] font-bold text-muted uppercase mt-0.5 tracking-tighter">Apply to work week</p></div>
                                            <button onClick={() => setIsRecurring(!isRecurring)} className={`w-12 h-6 rounded-full relative transition-colors ${isRecurring ? 'bg-indigo-500' : 'bg-muted/30'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isRecurring ? 'left-7' : 'left-1'}`} /></button>
                                        </div>
                                        {isRecurring ? (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Days</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                                                        <button key={i} onClick={() => setSelectedDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])} className={`w-10 h-10 rounded-xl text-xs font-black transition-all border-2 ${selectedDays.includes(i) ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-card border-border-card text-muted'}`}>{day}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Date</label>
                                                <input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)} className="w-full bg-page text-main rounded-xl py-3 px-4 text-xs font-bold outline-none" min={new Date().toISOString().split('T')[0]} />
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3"><label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Slot Duration</label><div className="flex bg-page rounded-xl px-4 py-3"><input type="number" value={slotDuration} onChange={e => setSlotDuration(e.target.value)} className="w-full bg-transparent text-main text-xs font-bold outline-none" /><span className="text-[8px] font-black text-muted uppercase">Min</span></div></div>
                                            <div className="space-y-3"><label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Buffer Time</label><div className="flex bg-page rounded-xl px-4 py-3"><input type="number" value={bufferTime} onChange={e => setBufferTime(e.target.value)} className="w-full bg-transparent text-main text-xs font-bold outline-none" /><span className="text-[8px] font-black text-muted uppercase">Min</span></div></div>
                                        </div>
                                        <div className="space-y-3"><label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Max Appointments</label><div className="flex bg-page rounded-xl px-4 py-3"><input type="number" value={maxAppointments} onChange={e => setMaxAppointments(e.target.value)} className="w-full bg-transparent text-main text-xs font-bold outline-none" /><span className="text-[8px] font-black text-muted uppercase">Slots</span></div></div>
                                    </>
                                )}

                                {(!isRecurring || formType === 'unavailability') && (
                                    <div className="space-y-3"><label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Notes</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-page text-main rounded-xl py-4 px-6 text-xs font-bold outline-none resize-none" placeholder="Description..." /></div>
                                )}

                                {availabilityError && <div className="p-4 bg-error/10 text-error text-[10px] font-black uppercase rounded-2xl border border-error/20 flex items-center gap-3"><AlertCircle size={14} />{availabilityError}</div>}

                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" className="flex-1 py-4" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button variant="primary" className="flex-1 py-4 shadow-xl shadow-indigo-100" onClick={handleSaveAvailability} disabled={isSavingAvailability}>{isSavingAvailability ? <Activity className="animate-spin" size={18} /> : (editingBlock ? 'Update' : 'Commit Block')}</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClinicalAvailabilityPage;
