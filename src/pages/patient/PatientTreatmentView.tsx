import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { 
    Activity, 
    ChevronLeft, 
    CheckCircle2, 
    Clock, 
    Play, 
    Pause,
    BarChart3,
    ClipboardCheck,
    AlertCircle
} from 'lucide-react';
import { TreatmentService } from '../../api/services/treatment.service';
import { AssessmentService } from '../../api/services/assessment.service';
import { UserService } from '../../api/services/user.service';
import type { TreatmentProgress, TreatmentStage } from '../../types/treatment.types';

const StatusBadge = ({ status }: { status: TreatmentStage['status'] }) => {
    const styles = {
        pending: 'bg-slate-100 text-slate-600 border-slate-200',
        in_progress: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        on_hold: 'bg-orange-50 text-orange-600 border-orange-100'
    };

    const icons = {
        pending: <Clock size={12} />,
        in_progress: <Play size={12} />,
        completed: <CheckCircle2 size={12} />,
        on_hold: <Pause size={12} />
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
            {icons[status]}
            {status.replace('_', ' ')}
        </span>
    );
};

const PatientTreatmentView = () => {
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);
    const userId = user?.id;

    const [progress, setProgress] = useState<TreatmentProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProgress = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Prioritize Hex ID (user.id) for patient portal requests
            const hexId = user?._id || user?.id || '';
            const numericId = user?.userId || '';
            
            console.log('[PatientTreatment] Starting fetch. Hex:', hexId, 'Numeric:', numericId);
            // Prioritize Numeric ID (userId) which is what the treatment service typically expects
            let resolvedId: string | number = numericId || hexId || userId || '';
            
            try {
                const rawData = await TreatmentService.getPatientProgress(resolvedId);
                let data = rawData as { 
                    data?: { 
                        id?: string; 
                        _id?: string; 
                        stage?: string; 
                        title?: string; 
                        status?: string; 
                        notes?: string; 
                        description?: string; 
                        createdAt?: string 
                    }[]; 
                    diagnosis?: string; 
                    stages?: { 
                        id: string; 
                        title: string; 
                        status: "pending" | "in_progress" | "completed" | "on_hold"; 
                        notes?: string; 
                        description?: string; 
                        createdAt?: string 
                    }[]; 
                    overall_progress?: number; 
                    patientId?: string 
                };

                // Handle API response mapping if nested in 'data' field
                if (data && data.data && Array.isArray(data.data)) {
                    const stageArray = data.data;
                    data = {
                        stages: stageArray.map((s: { id?: string; _id?: string; stage?: string; title?: string; status?: string; notes?: string; description?: string; createdAt?: string }) => ({
                            id: (s.id || s._id) as string,
                            title: (s.title || s.stage || 'Clinical Milestone') as string,
                            status: (s.status || 'pending') as "pending" | "in_progress" | "completed" | "on_hold",
                            notes: s.notes,
                            description: s.description,
                            createdAt: s.createdAt
                        })),
                        overall_progress: Math.round((stageArray.filter((s: { status?: string }) => s.status === 'completed').length / (stageArray.length || 1)) * 100),
                        diagnosis: data.diagnosis || 'Therapeutic Framework',
                        patientId: String(resolvedId)
                    };
                }

                if (data && !Array.isArray(data) && data.stages) {
                    setProgress(data as unknown as TreatmentProgress);
                } else {
                    setProgress(null);
                }
            } catch (treatmentError: unknown) {
                // 2. Fallback resolution if first attempt fails
                const terror = treatmentError as { response?: { status: number } };
                if (terror.response?.status === 404 || !resolvedId) {
                    console.warn('[PatientTreatment] First attempt failed, trying fallback ID resolution...');
                    
                    // If we tried hex and failed, try numeric
                    if (resolvedId === hexId && numericId && numericId !== hexId) {
                        resolvedId = numericId;
                    } else if (userId && userId !== String(resolvedId)) {
                        resolvedId = userId;
                    } else {
                        // Resolve via AssessmentService as last resort
                        try {
                            const assessmentData = await AssessmentService.getQuestions(userId || '');
                            if (assessmentData.profile?.userId) {
                                resolvedId = Number(assessmentData.profile.userId);
                            } else {
                                const { users } = await UserService.listUsers({ role: 'patient', search: userId });
                                const match = users.find((u: { _id?: string; id?: string; userId?: string | number }) => String(u._id) === userId || String(u.id) === userId);
                                if (match) resolvedId = match.userId ? Number(match.userId) : String(match.id);
                            }
                        } catch (e) {
                            console.warn('[PatientTreatment] Resolution fallback failed:', e);
                        }
                    }

                    if (resolvedId) {
                        console.log(`[PatientTreatment] Retrying with resolved ID: ${resolvedId}`);
                        const fallbackData = await TreatmentService.getPatientProgress(resolvedId);
                        setProgress(fallbackData as TreatmentProgress);
                    } else {
                        console.warn('[PatientTreatment] No further fallback options, ID remained constant');
                        throw treatmentError;
                    }
                } else {
                    throw treatmentError;
                }
            }
        } catch (err: unknown) {
            const terror = err as { message?: string };
            console.error('[PatientTreatment] Protocol hydration failed:', terror);
            setError(terror.message || 'We were unable to load your treatment journey. If this persists, please contact support.');
        } finally {
            setIsLoading(false);
        }
    }, [userId, user?._id, user?.id, user?.userId]);

    useEffect(() => {
        if (userId) {
            fetchProgress();
        }
    }, [userId, fetchProgress]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Treatment Journey...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center py-20 flex flex-col items-center">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={32} className="text-rose-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Sync Interrupted</h2>
                <p className="text-slate-500 font-medium mb-8">
                    {error}
                </p>
                <button 
                    onClick={fetchProgress}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!progress) {
        return (
            <div className="p-8 max-w-2xl mx-auto text-center py-20 flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                    <Activity size={32} className="text-slate-300" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Treatment Not Initialized</h2>
                <p className="text-slate-500 font-medium mb-8">
                    Your therapeutic protocol hasn't been established by your clinical team yet.
                </p>
                <button 
                    onClick={() => navigate('/records')}
                    className="text-indigo-600 font-black uppercase text-xs tracking-widest hover:underline"
                >
                    Back to Health Records
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl animate-fade-in pb-20">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <button
                        onClick={() => navigate('/records')}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-bold text-sm mb-4"
                    >
                        <ChevronLeft size={18} /> Back to Records
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ClipboardCheck className="text-emerald-600" size={32} />
                        My Treatment Plan
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-11">Your Guided Path to Recovery</p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-4xl font-black text-emerald-600">{progress.overall_progress}%</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Summary Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card-premium p-6 space-y-4 bg-white border-slate-100 shadow-sm">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Focus</p>
                            <h2 className="text-lg font-black text-slate-800">{progress.diagnosis}</h2>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-50">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <BarChart3 size={12} className="text-indigo-500" />
                                Protocol Summary
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-semibold">
                                    <span className="text-slate-500">Milestones</span>
                                    <span className="text-slate-900">{progress.stages.length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-semibold">
                                    <span className="text-slate-500">Achieved</span>
                                    <span className="text-emerald-600">{progress.stages.filter(s => s.status === 'completed').length}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-semibold">
                                    <span className="text-slate-500">Active</span>
                                    <span className="text-indigo-600">{progress.stages.filter(s => s.status === 'in_progress').length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 mt-6">
                            <p className="text-[10px] font-bold text-indigo-600 leading-relaxed italic">
                                "This plan is curated by your clinical team. Please consult with your provider for any adjustments."
                            </p>
                        </div>
                    </div>
                </div>

                {/* Timeline Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Your Milestones</h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-wider">Patient View</span>
                    </div>

                    <div className="space-y-4 relative">
                        {/* Vertical line connector */}
                        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-100 -z-10" />

                        {progress.stages.map((stage, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={stage.id}
                                className={`card-premium p-6 flex gap-6 bg-white border-slate-100 transition-all ${
                                    stage.status === 'in_progress' ? 'ring-2 ring-indigo-500/20 bg-indigo-50/30' : ''
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                                    stage.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    stage.status === 'in_progress' ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-100' :
                                    'bg-slate-50 text-slate-400 border-slate-100'
                                }`}>
                                    {stage.status === 'completed' ? <CheckCircle2 size={24} /> : <span className="text-sm font-black">0{index + 1}</span>}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-extrabold text-slate-900 truncate">{stage.title || stage.stage}</h4>
                                        <StatusBadge status={stage.status} />
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-3 line-clamp-2">
                                        {stage.description || 'Working towards key milestones for this phase of therapy.'}
                                    </p>
                                    
                                    {stage.notes && (
                                        <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 text-xs font-semibold text-slate-600 italic">
                                            "{stage.notes}"
                                        </div>
                                    )}

                                    {stage.status === 'completed' && stage.createdAt && (
                                        <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                            Completed on {new Date(stage.createdAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientTreatmentView;
