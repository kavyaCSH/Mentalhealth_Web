import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Calendar,
    Clock,
    User as UserIcon,
    Activity,
    Building,
    ChevronLeft,
    CheckCircle2,
    CalendarPlus,
    Stethoscope
} from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import type { User } from '../../types/user.types';
import { UserService } from '../../api/services/user.service';
import { ConsultService } from '../../api/services/consult.service';

const CreateConsultation = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Fetching related data
    const [professionals, setProfessionals] = useState<User[]>([]);
    const [patients, setPatients] = useState<User[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [formData, setFormData] = useState({
        professionalId: '',
        patientId: '',
        date: '',
        time: '',
        type: 'virtual',
        notes: ''
    });

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoadingData(true);
            try {
                const proRes = await UserService.listUsers({ role: 'psychiatrist,psychologist,counselor' });
                const patRes = await UserService.listUsers({ role: 'patient' });

                setProfessionals(proRes.users);
                setPatients(patRes.users);
            } catch (error) {
                console.error('Failed to fetch user lists:', error);
                setProfessionals([]);
                setPatients([]);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchUsers();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await ConsultService.createConsultationAdmin({
                professional_id: formData.professionalId,
                patient_id: formData.patientId,
                scheduled_at: `${formData.date}T${formData.time}:00Z`,
                consult_type: formData.type as 'virtual' | 'in_person',
                reason: 'Administrative Booking',
                notes: formData.notes
            } as any);

            setSuccess(true);
            setTimeout(() => {
                navigate('/admin/users'); // Or back to admin dashboard
            }, 3000);
        } catch (err: unknown) {
            console.error('Booking failed:', err);
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
                <h1 className="text-4xl font-black text-main tracking-tight mb-4">Consultation Scheduled!</h1>
                <p className="text-muted font-medium">The session has been successfully booked on behalf of the patient. Notifications have been dispatched to both parties.</p>
                <div className="pt-8">
                    <Activity className="animate-spin text-indigo-500 mx-auto" size={24} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted opacity-80 mt-4">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl  space-y-8 animate-fade-in pb-20">
            <header className="flex items-center gap-6 pb-6 border-b border-border-card">
                <button onClick={() => navigate(-1)} className="p-2.5 bg-page hover:bg-page rounded-xl text-muted transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-main tracking-tight">Create Consultation</h1>
                    <p className="text-muted font-medium mt-2">Administratively book a session for a patient and practitioner.</p>
                </div>
            </header>

            {isLoadingData ? (
                <div className="flex flex-col items-center py-20">
                    <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                    <p className="text-xs font-black uppercase tracking-widest text-muted opacity-80">Loading platform entities...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Participants */}
                    <div className="card-premium p-8">
                        <h2 className="text-sm font-black text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                            <UserIcon className="text-indigo-600" size={18} /> Participants
                        </h2>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-muted opacity-80 uppercase tracking-widest px-1">
                                    Clinical Professional
                                </label>
                                <div className="relative group">
                                    <Stethoscope size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-80" />
                                    <select
                                        name="professionalId"
                                        value={formData.professionalId}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-page border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:border-indigo-500 focus:bg-card outline-none transition-all appearance-none"
                                    >
                                        <option value="" disabled>Select Practitioner...</option>
                                        {professionals.map(pro => (
                                            <option key={pro.id} value={pro.id}>
                                                Dr. {pro.firstName} {pro.lastName} ({pro.role || 'Practitioner'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-muted opacity-80 uppercase tracking-widest px-1">
                                    Patient Record
                                </label>
                                <div className="relative group">
                                    <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-80" />
                                    <select
                                        name="patientId"
                                        value={formData.patientId}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-page border-2 border-transparent rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:border-indigo-500 focus:bg-card outline-none transition-all appearance-none"
                                    >
                                        <option value="" disabled>Select Patient...</option>
                                        {patients.map(pat => (
                                            <option key={pat.id} value={pat.id}>
                                                {pat.firstName} {pat.lastName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="card-premium p-8">
                        <h2 className="text-sm font-black text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Calendar className="text-indigo-600" size={18} /> Schedule
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            <InputField
                                label="Date"
                                name="date"
                                type="date"
                                leftIcon={<Calendar size={16} />}
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                            <InputField
                                label="Time"
                                name="time"
                                type="time"
                                leftIcon={<Clock size={16} />}
                                value={formData.time}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="card-premium p-8">
                        <h2 className="text-sm font-black text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Building className="text-indigo-600" size={18} /> Encounter Details
                        </h2>

                        <div className="space-y-6">
                            <div className="space-y-4">
                                <label className="text-xs font-black text-muted opacity-80 uppercase tracking-widest">Consultation Format</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'virtual' })}
                                        className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.type === 'virtual' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-border-card text-muted hover:border-indigo-300'}`}
                                    >
                                        <span className="text-xs font-bold">Teleconsultation (Video)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'in_person' })}
                                        className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${formData.type === 'in_person' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-border-card text-muted hover:border-indigo-300'}`}
                                    >
                                        <span className="text-xs font-bold">In-Person (Facility)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-muted opacity-80 uppercase tracking-widest px-1">
                                    Administrative Notes (Optional)
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Enter any preliminary notes regarding this consultation..."
                                    className="w-full bg-page border-2 border-transparent rounded-2xl p-4 text-sm font-medium focus:border-indigo-500 focus:bg-card outline-none transition-all min-h-[120px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<CalendarPlus size={18} />}>
                            Schedule Consultation
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreateConsultation;
