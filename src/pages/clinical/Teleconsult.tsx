import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    Save,
    X,
    Activity,
    Brain,
    Lock as LockIcon,
    ClipboardCheck,
    Menu,
    History,
    FileText,
    CheckCircle2,
    ChevronLeft as BackIcon
} from 'lucide-react';
import { TeleConsultService } from '../../api/services/teleconsult.service';
import Button from '../../components/ui/Button';
import TeleconsultWebView from '../../components/shared/TeleconsultWebView';
import { ConsultPastHistory } from '../../components/clinical/ConsultPastHistory';
import { ConsultPatientRecord } from '../../components/clinical/ConsultPatientRecord';
import { ConsultTreatment } from '../../components/clinical/ConsultTreatment';
import type { Consultation, Participant } from '../../types/common.types';

// Clinical Hub Content Components
import { ConsultSymptoms } from '../../components/clinical/ConsultSymptoms';
import { ConsultAssessments } from '../../components/clinical/ConsultAssessments';
import { ConsultQuestionnaire } from '../../components/clinical/ConsultQuestionnaire';
import { ConsultMSE } from '../../components/clinical/ConsultMSE';
import { ConsultClinicalIntake } from '../../components/clinical/ConsultClinicalIntake';

const Teleconsult = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // State management
    const [liveAppointment, setLiveAppointment] = useState<Consultation | null>(
        (location.state as { appointment?: Consultation })?.appointment || null
    );
    const [token, setToken] = useState<string | null>(
        (location.state as { token?: string })?.token || null
    );
    const [isValidating, setIsValidating] = useState(true);
    const [isIframeLoading, setIsIframeLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTool, setActiveTool] = useState<'notes' | 'symptoms' | 'assessments' | 'treatment' | 'past_history' | 'patient_record' | 'mse' | 'clinical_intake' | null>(null);
    const [notes, setNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState<any>(null);

    const isProfessional = user?.role ? user.role !== 'patient' : false;

    // 1. Session Recovery & Validation
    useEffect(() => {
        const validateSession = async () => {
            if (!id || !user) return;

            setIsValidating(true);
            try {
                let currentAppt = liveAppointment;
                if (!currentAppt) {
                    const res = await TeleConsultService.getConsultationDetail(id);
                    currentAppt = res.data || res;
                    setLiveAppointment(currentAppt);
                }

                if (!token && currentAppt) {
                    const targetRole = isProfessional ? 'publisher' : 'subscriber';
                    const currentUserId = String(user?.userId || user?.id || '');

                    const me = currentAppt.participants?.find((p: Participant) =>
                        (p.ref_number && String(p.ref_number) === currentUserId) ||
                        p.role === targetRole ||
                        (isProfessional
                            ? (p.participant_type?.code === 'professional' || p.participant_type?.code === 'publisher')
                            : (p.participant_type?.code === 'patient' || p.participant_type?.code === 'subscriber')
                        )
                    );

                    // Full Resolution Protocol
                    const roleSpecificToken = isProfessional
                        ? (currentAppt.publisher_token || (currentAppt as any).publisherToken)
                        : (currentAppt.subscriber_token || (currentAppt as any).subscriberToken);

                    const resolvedToken = me?.token || roleSpecificToken || currentAppt.token || (currentAppt as any).session_token;

                    console.log('[Teleconsult] Final Resolution Check:', {
                        role: isProfessional ? 'Professional' : 'Patient',
                        meFound: !!me,
                        isTokenValid: !!resolvedToken
                    });

                    if (resolvedToken) setToken(resolvedToken);
                }
            } catch (err) {
                console.error('[Teleconsult] Session validation failed', err);
            } finally {
                setIsValidating(false);
            }
        };

        validateSession();
    }, [id, isProfessional, liveAppointment, token, user?.id]);

    // 2. Timer/Status Sync
    useEffect(() => {
        const handleIframeMessage = (event: MessageEvent) => {
            if (event.data === 'call-ended' || event.data?.type === 'call-ended') {
                handleEndSession(true);
            }
        };
        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, []);



    const handleEndSession = async (silent = false) => {
        if (!silent && !window.confirm('End consultation session?')) return;

        try {
            if (id && isProfessional) {
                await TeleConsultService.updateConsultationStatus(id, 'completed', notes);
            }
        } catch (err) {
            console.error('Exit update failed:', err);
        } finally {
            navigate(isProfessional ? '/clinical-schedule' : '/schedule');
        }
    };

    const handleSaveNotes = async () => {
        // Favoring the numeric consult_id for backend parity (keyed by CONSULT-ID)
        const targetId = liveAppointment?.consult_id || id;
        if (!notes.trim() || !targetId) return;

        setIsSavingNotes(true);
        setSaveSuccess(false);
        try {
            // Using dedicated notes endpoint with numeric identifier
            await TeleConsultService.addClinicalNotes(targetId, { notes: notes });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setIsSavingNotes(false);
        }
    };

    // UI Resolvers
    const consult_url = isProfessional
        ? (import.meta.env.VITE_TELECONSULT_PUBLISHER_URL || 'https://teleconsult.a2zhealth.in/teleconsult-v3/')
        : (import.meta.env.VITE_TELECONSULT_SUBSCRIBER_URL || 'https://teleconsult.a2zhealth.in/consult/');


    const participants = liveAppointment?.participants || [];
    const patientParticipant = participants.find(p => p.role === 'subscriber' || p.participant_type?.code === 'patient');
    const patientId = patientParticipant?.ref_number || liveAppointment?.patient_id;

    if (isValidating) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
                <Activity className="animate-spin text-indigo-500 mb-6" size={48} />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Session Container...</p>
            </div>
        );
    }

    if (!token && !isValidating) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-8 border border-rose-500/20">
                    <LockIcon size={32} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Access Control Violation</h3>
                <p className="text-slate-400 font-medium mb-8">Unauthorized clinical session attempt or expired token.</p>
                <Button variant="primary" onClick={() => navigate(isProfessional ? '/clinical-schedule' : '/schedule')}>Return to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black overflow-hidden selection:bg-indigo-500/30">
            <main className="flex-1 relative bg-[#0a0a0a]">
                <TeleconsultWebView
                    token={token || ''}
                    baseUrl={consult_url}
                    onLoad={() => setIsIframeLoading(false)}
                    hideMenu={true}
                />

                {isProfessional && !isSidebarOpen && (
                    <div className="fixed top-8 left-8 z-[200]">
                        <button
                            onClick={() => {
                                setActiveTool(null);
                                setIsSidebarOpen(true);
                            }}
                            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-500 shadow-[0_15px_30px_rgba(0,0,0,0.4)] border bg-slate-900/90 backdrop-blur-xl border-white/10 text-indigo-400 hover:scale-110 hover:border-indigo-500/50"
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                )}

                {!isIframeLoading && (
                    <div className="absolute top-6 right-6 pointer-events-none z-10">
                        <div className="bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Session Recording Active</span>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {isProfessional && isSidebarOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsSidebarOpen(false)}
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                            />

                            <motion.aside
                                initial={{ x: '-100%', opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: '-100%', opacity: 0 }}
                                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
                                className="fixed top-4 left-4 bottom-4 w-[380px] bg-slate-50/95 backdrop-blur-xl border-2 border-slate-200/80 rounded-3xl flex flex-col z-[160] shadow-[0_30px_80px_rgba(15,23,42,0.1)] overflow-hidden"
                            >
                                <div className="p-6 pb-2 border-b border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {activeTool && (
                                                <button
                                                    onClick={() => setActiveTool(null)}
                                                    className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-white hover:text-indigo-600 transition-all"
                                                >
                                                    <BackIcon size={16} />
                                                </button>
                                            )}
                                            <div>
                                                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                                                    {activeTool === 'notes' ? 'Session Notes' :
                                                        activeTool === 'symptoms' ? 'Symptoms' :
                                                            activeTool === 'assessments' ? 'Assessments' :
                                                                activeTool === 'treatment' ? 'Treatment' :
                                                                    activeTool === 'past_history' ? 'History' :
                                                                        activeTool === 'patient_record' ? 'Record' : 'Clinical Hub'}
                                                </h2>
                                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.1em] mt-0.5">Focus Workspace</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsSidebarOpen(false)}
                                            className="w-9 h-9 rounded-lg bg-slate-50 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all text-slate-400 border border-slate-100"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                                    {!activeTool ? (
                                        <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-500">
                                            {[
                                                { id: 'clinical_intake', icon: FileText, label: 'Intake (HPI/ROS)', color: 'text-emerald-500' },
                                                { id: 'mse', icon: Activity, label: 'MSE Exam', color: 'text-violet-600' },
                                                { id: 'assessments', icon: Brain, label: 'DSM-5 Assess', color: 'text-indigo-600' },
                                                { id: 'treatment', icon: ClipboardCheck, label: 'Treatment Plan', color: 'text-teal-600' },
                                                { id: 'past_history', icon: History, label: 'Past History', color: 'text-purple-500' },
                                                { id: 'notes', icon: MessageSquare, label: 'Session Notes', color: 'text-slate-800' }
                                            ].map((tool) => (
                                                <button
                                                    key={tool.id}
                                                    onClick={() => setActiveTool(tool.id as any)}
                                                    className="group relative h-24 bg-white border-2 border-slate-200 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-indigo-500 flex flex-col items-center justify-center gap-2.5 p-3 shadow-sm"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center transition-colors group-hover:bg-indigo-50 ${tool.color}`}>
                                                        <tool.icon size={16} />
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${tool.color} transition-colors whitespace-nowrap`}>{tool.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                            {activeTool === 'clinical_intake' && (
                                                <ConsultClinicalIntake
                                                    patientId={patientId || ''}
                                                    consultId={liveAppointment?.consult_id || id}
                                                    onSave={() => setActiveTool(null)}
                                                />
                                            )}

                                            {activeTool === 'mse' && (
                                                <ConsultMSE
                                                    patientId={patientId || ''}
                                                    consultId={liveAppointment?.consult_id || id}
                                                    initialTab="new"
                                                    onSave={() => setActiveTool(null)}
                                                />
                                            )}

                                            {activeTool === 'notes' && (
                                                <div className="space-y-6">
                                                    <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm">
                                                        <textarea
                                                            value={notes}
                                                            onChange={(e) => setNotes(e.target.value)}
                                                            placeholder="Clinical synthesis..."
                                                            className="w-full h-[400px] bg-transparent text-slate-700 font-medium text-sm focus:outline-none resize-none leading-relaxed placeholder:text-slate-300"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between px-1">
                                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Encrypted Data Uplink Active</span>
                                                        <Button
                                                            variant={saveSuccess ? "secondary" : "primary"}
                                                            size="sm"
                                                            className={`px-8 py-3.5 rounded-xl shadow-lg font-black text-[10px] uppercase tracking-widest transition-all ${saveSuccess ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'shadow-indigo-600/20'}`}
                                                            isLoading={isSavingNotes}
                                                            leftIcon={saveSuccess ? <CheckCircle2 size={14} /> : <Save size={14} />}
                                                            onClick={handleSaveNotes}
                                                        >
                                                            {saveSuccess ? 'Notes Synced' : 'Sync Notes'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTool === 'symptoms' && (
                                                <ConsultSymptoms patientId={patientId || ''} />
                                            )}

                                            {activeTool === 'assessments' && !selectedAssessment && (
                                                <ConsultAssessments
                                                    patientId={patientId || ''}
                                                    onSelectAssessment={(item: any) => setSelectedAssessment(item)}
                                                />
                                            )}

                                            {activeTool === 'assessments' && selectedAssessment && (
                                                <ConsultQuestionnaire
                                                    patientId={patientId || ''}
                                                    categoryId={selectedAssessment.slug}
                                                    title={selectedAssessment.title}
                                                    consultId={liveAppointment?.consult_id || id}
                                                    initialQuestions={selectedAssessment.questions}
                                                    onSave={() => {
                                                        setSelectedAssessment(null);
                                                    }}
                                                    onCancel={() => setSelectedAssessment(null)}
                                                />
                                            )}

                                            {activeTool === 'past_history' && (
                                                <ConsultPastHistory
                                                    patientId={patientId || ''}
                                                    consultId={liveAppointment?.consult_id || id}
                                                    initialTab="history"
                                                    onSave={() => setActiveTool(null)}
                                                />
                                            )}

                                            {activeTool === 'patient_record' && (
                                                <ConsultPatientRecord
                                                    patientId={patientId || ''}
                                                />
                                            )}

                                            {activeTool === 'treatment' && (
                                                <ConsultTreatment
                                                    patientId={patientId || ''}
                                                    consultId={liveAppointment?.consult_id || id}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Teleconsult;
