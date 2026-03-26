import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    User as UserIcon,
    Phone,
    Mail,
    Calendar,
    Activity,
    FileText,
    ChevronLeft,
    ClipboardList,
    Plus,
    Video,
    Send,
    HeartPulse
} from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { getStatusColor, type StatusType } from '../../utils/statusMapping';
import { UserService } from '../../api/services/user.service';
import { AssessmentService } from '../../api/services/assessment.service';
import type { AssessmentResult } from '../../types/assessment.types';
import type { Patient, ClinicalNote } from '../../types/user.types';

const PatientRecord = () => {
    const { patientId: id } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isFocused = searchParams.get('view') === 'focused';

    const [patient, setPatient] = useState<Patient | null>(null);
    const [history, setHistory] = useState<AssessmentResult[]>([]);
    const [notes, setNotes] = useState<ClinicalNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [newNote, setNewNote] = useState('');
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);

    useEffect(() => {
        const fetchPatientData = async () => {
            setIsLoading(true);
            try {
                console.log(`[PatientRecord] Resolving profile for: ${id}`);
                let patientData: Patient | null = null;
                let assessmentHistory: AssessmentResult[] = [];

                // 1. Try primary lookup
                try {
                    [patientData, assessmentHistory] = await Promise.all([
                        UserService.getUserById(id || ''),
                        AssessmentService.getPatientHistory(id || '')
                    ]);
                    console.log(`[PatientRecord] Profile resolved directly: ${patientData?.firstName}`);
                } catch (primaryError: unknown) {
                    const error = primaryError as { response?: { status?: number } };
                    if (error.response?.status === 404) {
                        console.warn('[PatientRecord] Primary lookup failed, trying clinical fallback resolution...');
                        try {
                            const assessmentData = await AssessmentService.getQuestions(id);
                            if (assessmentData.profile?.userId) {
                                const resolvedId = String(assessmentData.profile.userId);
                                console.log(`[PatientRecord] Identity resolved via fallback: ${resolvedId}`);

                                [patientData, assessmentHistory] = await Promise.all([
                                    UserService.getUserById(resolvedId),
                                    AssessmentService.getPatientHistory(resolvedId)
                                ]);

                                // Merge hex ID back to patient object as 'id' or '_id' to ensure link compatibility
                                if (patientData) {
                                    patientData._id = id;
                                }
                            } else {
                                throw primaryError; // No fallback profile found
                            }
                        } catch (fallbackError) {
                            console.error('[PatientRecord] Both lookup attempts failed:', fallbackError);
                            throw fallbackError;
                        }
                    } else {
                        throw primaryError;
                    }
                }

                setPatient((patientData as Patient) || null);
                setHistory((assessmentHistory.length > 0 ? assessmentHistory : []) as AssessmentResult[]);
                setNotes([]); // Notes integration pending MessagingService/Resource integration
            } catch (error) {
                console.error('Failed to fetch patient data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchPatientData();
    }, [id]);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setIsSubmittingNote(true);
        try {
            // In a real scenario, we'd POST to /notes or /resource/messages
            const noteObj: ClinicalNote = {
                id: Date.now().toString(),
                content: newNote,
                createdAt: new Date().toISOString(),
                author: 'Clinical Provider'
            };
            setNotes(prev => [noteObj, ...prev]);
            setNewNote('');
        } catch (error) {
            console.error('Failed to add note:', error);
        } finally {
            setIsSubmittingNote(false);
        }
    };

    const handleRequestAssessment = () => {
        if (!patient) return;
        navigate(`/clinical/assessments?patientId=${patient.userId || id}&patientName=${patient.firstName} ${patient.lastName || ''}`);
    };

    const getRiskColor = (risk: string) => {
        switch (risk?.toLowerCase()) {
            case 'high': return 'text-red-600 bg-red-50 border-red-100';
            case 'medium': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Patient Record...</p>
            </div>
        );
    }

    if (!patient) return <div className="p-8 text-center text-slate-500">Patient not found</div>;

    return (
        <div className="p-8 max-w-7xl  space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100">
                <div className="flex items-start gap-6">
                    <button onClick={() => navigate('/patients')} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors mt-2">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                {patient.firstName} {patient.lastName}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRiskColor(patient.riskLevel || 'Low')}`}>
                                {patient.riskLevel || 'Low'} Risk
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                            ID: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{patient.id}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {!isFocused && (
                        <>
                            <Button variant="outline" leftIcon={<HeartPulse size={18} />} onClick={() => navigate(`/patients/${patient.userId || id}/health`)}>Health</Button>
                            <Button variant="outline" leftIcon={<ClipboardList size={18} />} onClick={() => navigate(`/patients/${patient.userId || id}/clinical-hub`)}>Clinical Hub</Button>
                            <Button variant="outline" leftIcon={<Video size={18} />} onClick={() => navigate(`/clinical-schedule?patientId=${patient.userId || id}`)}>Teleconsult</Button>
                            <Button variant="primary" leftIcon={<Plus size={18} />} onClick={handleRequestAssessment}>Request Assessment</Button>
                        </>
                    )}
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Col: Demographics & Quick Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card-premium p-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Patient Demographics</h3>

                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <Phone size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                    <p className="text-sm font-bold text-slate-900">{patient.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <Mail size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                    <p className="text-sm font-bold text-slate-900 truncate">{patient.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <Calendar size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</p>
                                    <p className="text-sm font-bold text-slate-900">{patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                    <UserIcon size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                                    <p className="text-sm font-bold text-slate-900">{patient.gender || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isFocused && (
                        <div className="card-premium p-6 bg-indigo-600 border-none text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Activity size={100} />
                            </div>
                            <h3 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-6 relative z-10">Clinical Profile</h3>

                            <div className="space-y-4 relative z-10">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Primary Diagnosis</p>
                                    <p className="font-bold">{patient.diagnosis}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">Treatment Plan</p>
                                    <p className="text-sm text-indigo-100 font-medium leading-relaxed">{patient.plan}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Col: Clinical Tools (Notes & History) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Clinical Notes */}
                    {!isFocused && (
                        <div className="card-premium p-6 flex flex-col h-[500px]">
                            <div className="flex items-center justify-between mb-6 shrink-0">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <FileText className="text-indigo-600" size={20} /> Clinical Notes
                                </h2>
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar mb-4">
                                {notes.length > 0 ? notes.map((note) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={note.id}
                                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100"
                                    >
                                        <p className="text-slate-700 font-medium leading-relaxed mb-3 text-sm">{note.content}</p>
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                                            <span className="uppercase tracking-wider">{note.author}</span>
                                            <span>{new Date(note.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <FileText size={40} className="mb-2 opacity-20" />
                                        <p className="text-sm font-bold">No clinical notes recorded yet.</p>
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0 flex gap-3 pt-4 border-t border-slate-100">
                                <InputField
                                    placeholder="Add a new clinical note..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    containerClassName="flex-1"
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote() }}
                                />
                                <Button
                                    variant="primary"
                                    className="mt-2 h-[56px] w-[56px] p-0 flex items-center justify-center shrink-0"
                                    onClick={handleAddNote}
                                    isLoading={isSubmittingNote}
                                    disabled={!newNote.trim()}
                                >
                                    <Send size={18} className="translate-x-0.5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Assessment History */}
                    <div className="card-premium p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <ClipboardList className="text-indigo-600" size={20} /> Assessment History
                            </h2>
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/patients/${patient.userId || id}/assessments`)}>View All</Button>
                        </div>

                        <div className="space-y-3">
                            {history.length > 0 ? history.map((record) => (
                                <div key={record.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getStatusColor(record.status as StatusType).bg} ${getStatusColor(record.status as StatusType).text} font-black`}>
                                            {record.score}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{record.category}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                {new Date(record.date || '').toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${getStatusColor(record.status as StatusType).bg} ${getStatusColor(record.status as StatusType).text} border ${getStatusColor(record.status as StatusType).border}`}>
                                            {record.interpretation}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm font-medium text-slate-500 text-center py-4">No assessments completed.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientRecord;
