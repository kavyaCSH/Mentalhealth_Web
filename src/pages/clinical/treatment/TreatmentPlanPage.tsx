import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    ChevronLeft, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    Play,
    Pause,
    Plus,
    BarChart3,
    ArrowRight,
    FileText,
    Pill,
    MessageSquare,
    ChevronDown,
    RefreshCw
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { TreatmentService } from '../../../api/services/treatment.service';
import { AssessmentService } from '../../../api/services/assessment.service';
import { UserService } from '../../../api/services/user.service';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import type { TreatmentProgress, TreatmentStage, UpdateStageStatusPayload } from '../../../types/treatment.types';

const StatusBadge = ({ status }: { status: TreatmentStage['status'] }) => {
    const styles: Record<TreatmentStage['status'], string> = {
        pending: 'bg-slate-50 text-slate-500 border-slate-200',
        in_progress: 'bg-amber-50 text-amber-600 border-amber-200',
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        on_hold: 'bg-rose-50 text-rose-600 border-rose-200',
        skipped: 'bg-slate-100 text-slate-400 border-slate-300'
    };

    const icons: Record<TreatmentStage['status'], React.ReactNode> = {
        pending: <RefreshCw size={12} />,
        in_progress: <Activity size={12} />,
        completed: <CheckCircle2 size={12} />,
        on_hold: <AlertCircle size={12} />,
        skipped: <RefreshCw size={12} className="opacity-50" />
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
            {icons[status]}
            {status.replace('_', ' ')}
        </span>
    );
};

const TreatmentPlanPage = () => {
    const { patientId: userId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = currentUser?.role === 'patient' || 
                      (currentUser as any)?.role === 'PATIENT';

    const [progress, setProgress] = useState<TreatmentProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updatingStage, setUpdatingStage] = useState<TreatmentStage | null>(null);
    const [updateForm, setUpdateForm] = useState<UpdateStageStatusPayload>({ status: 'completed', notes: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchProgress();
    }, [userId]);

    const fetchProgress = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log(`[TreatmentPlan] Resolving plan for: ${userId}`);
            let resolvedId: string | number = userId || '';
            
            // If patient is viewing self, prioritize their session identity
            if (isPatient && (currentUser?.userId || currentUser?.id)) {
                resolvedId = currentUser.userId || currentUser._id || currentUser.id || resolvedId;
                console.log(`[TreatmentPlan] Patient self-view resolved to: ${resolvedId}`);
            }
            
            try {
                // 1. Try direct lookup first
                const rawData = await TreatmentService.getPatientProgress(resolvedId);
                let data: any = rawData;

                // Handle API response where stages are in a 'data' array (as per user JSON)
                if (data && data.data && Array.isArray(data.data)) {
                    const stageArray = data.data;
                    data = {
                        stages: stageArray.map((s: any) => ({
                            id: s.id || s._id,
                            title: s.title || s.stage || 'Clinical Milestone',
                            status: s.status || 'pending',
                            notes: s.notes,
                            description: s.description,
                            createdAt: s.createdAt
                        })),
                        overall_progress: Math.round((stageArray.filter((s: any) => s.status === 'completed').length / (stageArray.length || 1)) * 100),
                        diagnosis: data.diagnosis || 'Therapeutic Framework',
                        patientId: String(resolvedId)
                    };
                }

                if (data && !Array.isArray(data) && data.stages) {
                    setProgress(data);
                } else {
                    console.warn('[TreatmentPlan] Received empty or invalid protocol data:', data);
                    setProgress(null);
                }
            } catch (treatmentError: any) {
                if (treatmentError.response?.status === 404) {
                    console.warn('[TreatmentPlan] Direct lookup failed, trying clinical fallback resolution...');
                    // Resolve numeric ID
                    const assessmentData = await AssessmentService.getQuestions(userId || '');
                    if (assessmentData.profile?.userId) {
                        resolvedId = Number(assessmentData.profile.userId);
                    } else {
                        const { users } = await UserService.listUsers({ role: 'patient', search: userId });
                        const match = users.find((u: any) => String(u._id) === userId || String(u.id) === userId);
                        if (match) resolvedId = match.userId ? Number(match.userId) : String(match.id);
                    }

                    if (resolvedId && resolvedId !== userId) {
                        console.log(`[TreatmentPlan] Identity resolved via fallback: ${resolvedId} (${typeof resolvedId})`);
                        const fallbackData = await TreatmentService.getPatientProgress(resolvedId);
                        setProgress(fallbackData);
                    } else {
                        throw treatmentError;
                    }
                } else {
                    throw treatmentError;
                }
            }
        } catch (err: any) {
            console.error('[TreatmentPlan] Fetch failed:', err);
            setError('No active treatment plan found or failed to load.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!updatingStage) return;
        setIsUpdating(true);
        try {
            await TreatmentService.updateStageStatus(updatingStage.id, updateForm);
            setUpdatingStage(null);
            await fetchProgress(); // Refresh data
        } catch (err: any) {
            console.error('Failed to update stage status:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Hydrating Treatment Framework...</p>
            </div>
        );
    }

    if (error || !progress) {
        return (
            <div className="p-8 max-w-3xl text-center py-20 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={32} className="text-slate-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">No Active Protocol</h2>
                <p className="text-slate-500 font-medium mb-8 max-w-md">
                    This patient does not have a therapeutic framework initialized yet. 
                    Establish a clinical strategy to Begin tracking progress.
                </p>
                {!isPatient && (
                    <Button 
                        variant="primary" 
                        onClick={() => navigate(`/patients/${userId}/treatment/new`)}
                        leftIcon={<Plus size={18} />}
                        className="px-10"
                    >
                        Initialize Protocol
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl animate-fade-in pb-20">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate(isPatient ? '/records' : `/patients/${userId}/health`)}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm mb-4"
                    >
                        <ChevronLeft size={18} /> Back to {isPatient ? 'Records' : 'Health Overview'}
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Activity className="text-indigo-600" size={32} />
                        Treatment Progress
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-11">Therapeutic Journey & Clinical Milestones</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-4xl font-black text-indigo-600">{progress.overall_progress}%</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Completion</span>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Summary & Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnosis</p>
                            <h2 className="text-lg font-black text-slate-800">{progress.diagnosis}</h2>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <BarChart3 size={12} className="text-indigo-500" />
                                Protocol Metrics
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Total Stages</span>
                                    <span className="font-bold text-slate-900">{progress.stages.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Completed</span>
                                    <span className="font-bold text-emerald-600">{progress.stages.filter(s => s.status === 'completed').length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">In Progress</span>
                                    <span className="font-bold text-indigo-600">{progress.stages.filter(s => s.status === 'in_progress').length}</span>
                                </div>
                            </div>
                        </div>

                        {!isPatient && (
                            <div className="pt-6">
                                <Button 
                                    variant="outline" 
                                    className="w-full text-[11px]"
                                    onClick={() => navigate(`/patients/${userId}/treatment/new`)}
                                >
                                    Re-initialize Protocol
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Stages Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Clinical Milestones</h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider">Sequential Path</span>
                    </div>

                    <div className="space-y-4 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-100 -z-10" />

                        {progress.stages.length > 0 ? progress.stages.map((stage, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={stage.id}
                                className={`glass-card p-5 flex gap-5 group transition-all ${stage.status === 'in_progress' ? 'ring-2 ring-indigo-500/20 bg-indigo-50/10' : ''}`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                                    stage.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    stage.status === 'in_progress' ? 'bg-indigo-600 text-white border-indigo-700' :
                                    'bg-white text-slate-400 border-slate-100'
                                }`}>
                                    {stage.status === 'completed' ? <CheckCircle2 size={24} /> : <span className="text-sm font-black">0{index + 1}</span>}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-extrabold text-slate-900 truncate">{stage.title || stage.stage}</h4>
                                        <StatusBadge status={stage.status} />
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <p className="text-xs text-slate-500 font-medium line-clamp-1 flex-1">
                                            {stage.description || 'Proceeding through established therapeutic interventions for this stage of recovery.'}
                                        </p>
                                        {stage.createdAt && (
                                            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(stage.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {stage.notes && (
                                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] font-medium text-slate-500 italic mb-3">
                                            "{stage.notes}"
                                        </div>
                                    )}

                                    {!isPatient && (
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => {
                                                    setUpdatingStage(stage);
                                                    setUpdateForm({ status: stage.status, notes: stage.notes || '' });
                                                }}
                                                className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] hover:text-indigo-700 flex items-center gap-1 group/btn"
                                            >
                                                Update Status <ArrowRight size={10} className="transition-transform group-hover/btn:translate-x-1" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )) : (
                            <div className="glass-card p-10 text-center text-slate-400 italic text-sm">
                                No clinical stages defined for this initial framework.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Update Status Modal */}
            <AnimatePresence>
                {updatingStage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => !isUpdating && setUpdatingStage(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl relative z-10 space-y-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Update Milestone</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{updatingStage.title}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Status</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['pending', 'in_progress', 'completed', 'on_hold'] as const).map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => setUpdateForm({ ...updateForm, status })}
                                                className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    updateForm.status === status 
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100' 
                                                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                                                }`}
                                            >
                                                {status.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Notes</label>
                                    <textarea
                                        value={updateForm.notes}
                                        onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                                        placeholder="Add clinical observations or milestone details..."
                                        rows={4}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setUpdatingStage(null)}
                                    disabled={isUpdating}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex-1"
                                    onClick={handleUpdateStatus}
                                    isLoading={isUpdating}
                                >
                                    Save Progress
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TreatmentPlanPage;
