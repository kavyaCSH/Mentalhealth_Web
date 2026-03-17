import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Activity, 
    ChevronLeft, 
    Plus, 
    X, 
    CheckCircle2, 
    AlertCircle,
    Target,
    User as UserIcon
} from 'lucide-react';
import { AssessmentService } from '../../../api/services/assessment.service';
import Button from '../../../components/ui/Button';
import { TreatmentService } from '../../../api/services/treatment.service';
import { UserService } from '../../../api/services/user.service';
import type { Patient } from '../../../types/user.types';

const InitializeTreatmentPage = () => {
    const { patientId: userId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();

    const [diagnosis, setDiagnosis] = useState('');
    const [goalInput, setGoalInput] = useState('');
    const [goals, setGoals] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const addGoal = () => {
        if (goalInput.trim() && !goals.includes(goalInput.trim())) {
            setGoals([...goals, goalInput.trim()]);
            setGoalInput('');
        }
    };

    const removeGoal = (index: number) => {
        setGoals(goals.filter((_, i) => i !== index));
    };

    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState(false);

    useEffect(() => {
        const fetchPatient = async () => {
        setIsLoadingPatient(true);
        try {
            console.log(`[InitializeTreatment] Resolving identity for: ${userId}`);
            
            // Try primary user lookup
            try {
                const data = await UserService.getUserById(userId || '');
                setPatient(data as Patient);
                console.log(`[InitializeTreatment] Resolved via UserService: ${data.firstName}`);
            } catch (userError) {
                console.warn('[InitializeTreatment] UserService lookup failed, trying clinical fallback...');
                
                // 2. Try clinical fallback - AssessmentService often returns profile info
                try {
                    const assessmentData = await AssessmentService.getQuestions(userId);
                    if (assessmentData.profile?.userId) {
                        const resolvedProfile = {
                            id: String(userId),
                            userId: assessmentData.profile.userId,
                            firstName: assessmentData.profile.firstName || 'Patient',
                            gender: assessmentData.profile.gender,
                            role: 'patient' as const,
                            email: ''
                        };
                        setPatient(resolvedProfile as Patient);
                        console.log(`[InitializeTreatment] Resolved via clinical fallback: ${resolvedProfile.firstName}, userId: ${resolvedProfile.userId}`);
                        return;
                    }
                } catch (e) {
                    console.warn('[InitializeTreatment] Clinical fallback failed:', e);
                }

                // 3. Try searching for the hex ID in the user list
                try {
                    const { users } = await UserService.listUsers({ role: 'patient', search: userId });
                    const match = users.find(u => String(u._id) === userId || String(u.id) === userId);
                    if (match) {
                        setPatient(match as Patient);
                        console.log(`[InitializeTreatment] Resolved via list search: ${match.firstName}, id: ${match.id}`);
                        return;
                    }
                } catch (e) {
                    console.warn('[InitializeTreatment] List search fallback failed:', e);
                }

                throw userError; // Re-throw if all fallbacks fail
            }
        } catch (error) {
            console.error('[InitializeTreatment] Major resolution failure:', error);
        } finally {
            setIsLoadingPatient(false);
        }
    };
        fetchPatient();
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-add goal if input is not empty but user hasn't clicked "Add"
        let currentGoals = [...goals];
        if (goalInput.trim() && !currentGoals.includes(goalInput.trim())) {
            currentGoals.push(goalInput.trim());
            setGoals(currentGoals);
            setGoalInput('');
        }

        if (!diagnosis.trim() || currentGoals.length === 0) {
            setError('Please provide a diagnosis and at least one goal.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            // Numeric ID resolution
            const resolvedNumericId = patient?.userId || (patient?.id && !isNaN(Number(patient.id)) ? Number(patient.id) : null);

            // Construct payload with multiple potential identifier keys
            const payload: any = {
                diagnosis: diagnosis.trim(),
                goals: currentGoals
            };

            // Postman pattern: patientId is mandatory and usually numeric
            // Also, standardized on numeric for userId based on "user id wrongly sended" feedback
            if (resolvedNumericId) {
                payload.patientId = resolvedNumericId;
                payload.patient_id = resolvedNumericId;
                payload.userId = resolvedNumericId;
                payload.patientUserId = resolvedNumericId;
            } else {
                payload.patientId = userId;
                payload.patient_id = userId;
                payload.userId = userId;
            }
            
            payload.patient = userId; // Keep hex for the 'patient' property as it usually refers to ObjectId
            
            console.log('[InitializeTreatment] Submitting payload:', payload);

            await TreatmentService.initializeTreatment(payload);
            setSuccess(true);
            setTimeout(() => {
                navigate(`/patients/${userId}/treatment`);
            }, 2000);
        } catch (err: any) {
            console.error('Failed to initialize treatment:', err);
            setError(err.response?.data?.message || 'Failed to initialize treatment plan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingPatient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Activity className="animate-spin text-indigo-600" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest italic">Authenticating Clinical Context...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-100">
                    <CheckCircle2 size={40} />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-900">Protocol Initialized</h2>
                    <p className="text-slate-500 font-medium mt-2">The treatment plan has been successfully created.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl animate-fade-in pb-20">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm mb-4"
                    >
                        <ChevronLeft size={18} /> Back
                    </button>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Target size={24} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                Initialize Treatment
                            </h1>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Establish Primary Therapeutic Framework</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Patient Summary Card */}
                <div className="lg:col-span-1">
                    {patient ? (
                        <div className="card-premium p-6 bg-slate-900 text-white border-none sticky top-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Patient Profile</h3>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-500/20">
                                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-lg truncate leading-tight">{patient.firstName} {patient.lastName}</p>
                                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-1">Patient ID: {patient.userId || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-xs">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
                                        <UserIcon size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Gender</p>
                                        <p className="font-bold text-slate-200">{patient.gender || 'Not Specified'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card-premium p-6 bg-slate-50 border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-60">
                            <AlertCircle className="text-slate-300 mb-2" size={24} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Details Loading...</p>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="glass-card p-8 space-y-6">
                            {/* Diagnosis */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={12} className="text-indigo-500" />
                                    Primary Diagnosis
                                </label>
                                <input
                                    type="text"
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    placeholder="e.g., Generalized Anxiety Disorder"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    required
                                />
                            </div>

                            {/* Goals */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Target size={12} className="text-emerald-500" />
                                    Therapeutic Goals
                                </label>
                                
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={goalInput}
                                        onChange={(e) => setGoalInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                                        placeholder="Add a clinical goal..."
                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={addGoal}
                                        className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {goals.map((goal, index) => (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            key={index}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 text-xs font-bold"
                                        >
                                            <span>{goal}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeGoal(index)}
                                                className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </motion.div>
                                    ))}
                                    {goals.length === 0 && !goalInput.trim() && (
                                        <p className="text-[10px] font-bold text-slate-400 italic py-2 px-1">At least one goal is required to proceed...</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold"
                            >
                                <AlertCircle size={18} />
                                {error}
                            </motion.div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button
                                variant="primary"
                                type="submit"
                                isLoading={isSubmitting}
                                disabled={!diagnosis.trim() || (goals.length === 0 && !goalInput.trim())}
                                className="rounded-2xl px-12 py-4 h-auto text-base shadow-xl shadow-indigo-100 uppercase tracking-widest font-black"
                            >
                                Initialize Treatment
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InitializeTreatmentPage;
