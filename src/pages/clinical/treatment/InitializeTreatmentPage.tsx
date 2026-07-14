import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Activity, 
    ChevronLeft, 
    Plus, 
    CheckCircle2, 
    AlertCircle,
    User as UserIcon,
    Brain,
    Pill,
    ClipboardList
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { TreatmentService } from '../../../api/services/treatment.service';
import { UserService } from '../../../api/services/user.service';
import { AssessmentService } from '../../../api/services/assessment.service';
import type { Patient } from '../../../types/user.types';

const InitializeTreatmentPage = () => {
    const { patientId: userId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const consultId = searchParams.get('consultId');

    const [plan, setPlan] = useState('');
    const [medications, setMedications] = useState('');
    const [nextSteps, setNextSteps] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [patient, setPatient] = useState<Patient | null>(null);
    const [isLoadingPatient, setIsLoadingPatient] = useState(false);

    const recommendations = [
        "Increase SSRI dosage by 5mg",
        "Introduce Mindfulness (5m/day)",
        "Schedule follow-up in 14 days",
        "Refer to support group",
        "Blood work (Thyroid, B12)",
        "CBT-i for insomnia"
    ];

    const addRecommendation = (text: string) => {
        setNextSteps((prev) => prev + (prev ? '\n' : '') + '• ' + text);
    };

    useEffect(() => {
        // Pre-warm the backend server while the user is typing the form
        TreatmentService.getTreatmentHistory(userId || '').catch(() => {});
        
        const fetchPatient = async () => {
            if (!userId) return;
            setIsLoadingPatient(true);
            try {
                // Tier 1: Direct lookup
                try {
                    const data = await UserService.getUserById(userId);
                    if (data) setPatient(data as Patient);
                } catch {
                    // Tier 2: List search fallback
                    const { users } = await UserService.listUsers({ role: 'patient', search: userId });
                    const match = users.find(u => String(u._id) === userId || String(u.id) === userId || String(u.userId) === userId);
                    if (match) {
                        setPatient(match as Patient);
                    } else {
                        // Tier 3: Patient metadata fallback (Mobile Parity)
                        const pData = await AssessmentService.getProfessionalQuestions(userId).catch(() => null);
                        if (pData?.data?.patient) {
                            setPatient({
                                ...pData.data.patient,
                                id: String(pData.data.patient.userId),
                                _id: userId,
                                role: 'patient'
                            } as any);
                        }
                    }
                }
            } catch (err) {
                console.warn('[Treatment] Resolution failed');
            } finally {
                setIsLoadingPatient(false);
            }
        };
        fetchPatient();
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plan.trim() && !medications.trim() && !nextSteps.trim()) {
            setError('Please provide at least one treatment detail.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // High-Fidelity Identity Sync (Clinical Parity)
            const numericId = patient?.userId || userId || '';
            const hexId = patient?._id || userId || '';
            const candidates = Array.from(new Set([numericId, hexId])).filter(Boolean);
            
            let successResult = null;
            let lastErr = null;

            for (const targetId of candidates) {
                try {
                    const payload = {
                        patientId: String(targetId),
                        consultId: consultId ? Number(consultId) : undefined,
                        plan: plan.trim(),
                        medications: medications.trim(),
                        next_steps: nextSteps.trim()
                    };
                    console.log(`[Clinical Treatment] Attempting plan creation with ID: ${targetId}`);
                    // Add a timeout of 15 seconds to avoid endless loading if API hangs
                    const timeout = new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('Treatment plan creation timed out')), 15000)
                    );
                    successResult = await Promise.race([
                        TreatmentService.createTreatmentPlan(payload),
                        timeout
                    ]);
                    if (successResult) break;
                } catch (err: any) {
                    lastErr = err;
                    if (err.response?.status === 404) continue;
                    // Ensure loading state is cleared on any error
                    setIsSubmitting(false);
                    throw err;
                }
            }

            if (!successResult && lastErr) throw lastErr;

            // Ensure loading indicator is cleared before showing success UI
            setIsSubmitting(false);
            setSuccess(true);
            setTimeout(() => {
                navigate(`/patients/${userId}/treatment`);
            }, 2000);
        } catch (err: any) {
            console.error('Failed to save treatment plan:', err);
            setError(err.response?.data?.message || 'Failed to finalize treatment plan.');
            setIsSubmitting(false);
        }
    };

    if (isLoadingPatient) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Activity className="animate-spin text-indigo-600" size={40} />
                <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest italic">Syncing Clinical Context...</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 animate-fade-in text-center p-8">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-emerald-100/50 mb-4">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-main tracking-tight">Protocol Finalized</h2>
                <p className="text-muted font-medium max-w-xs uppercase text-[10px] tracking-widest">Synchronizing records with patient dashboard...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in pb-24">
            <header className="mb-12">
                <button
                    onClick={() => navigate(`/patients/${userId}/treatment`)}
                    className="flex items-center gap-2 text-[10px] font-black text-muted opacity-80 hover:text-indigo-600 transition-all uppercase tracking-[0.2em] mb-6"
                >
                    <ChevronLeft size={16} /> Back to Session History
                </button>
                <div className="flex items-start gap-6">
                    <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-500/10">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black text-main tracking-tighter leading-none">Initialize Plan</h1>
                        <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-[0.3em] mt-2 opacity-60">Mobile Parity: Dynamic Clinical Synthesis</p>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-12">
                {/* Left: Patient Reference */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="p-10 bg-slate-900 dark:bg-slate-950 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/10">
                        <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                        
                        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-10">Patient Context</h3>
                        <div className="flex items-center gap-6 mb-12">
                            <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-3xl font-black shadow-2xl shadow-indigo-500/30 ring-4 ring-white/10">
                                {patient?.firstName?.charAt(0) || 'P'}
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-2xl truncate tracking-tight">{patient?.firstName} {patient?.lastName}</p>
                                <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mt-1 opacity-90">ID: {patient?.userId || 'TEMP-ID'}</p>
                            </div>
                        </div>

                        <div className="space-y-6 pt-10 border-t border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 opacity-60">
                                    <UserIcon size={14} className="text-muted opacity-80" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Metadata</span>
                                </div>
                                <span className="text-[11px] font-black text-indigo-300 uppercase tracking-tighter">{patient?.gender || 'Unspecified'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-8 bg-indigo-500/5 rounded-[2.5rem] border border-indigo-500/10 flex items-start gap-4 shadow-sm">
                        <div className="p-3 bg-card text-indigo-500 rounded-xl shadow-sm border border-border-card"><Brain size={18} /></div>
                        <p className="text-[11px] font-bold text-main/70 uppercase tracking-tight leading-relaxed">
                            Synthesized clinical impressions are automatically indexed for longitudinal tracking.
                        </p>
                    </div>
                </div>

                {/* Right: The High-Density Form */}
                <div className="lg:col-span-8">
                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="bg-card p-12 rounded-[3.5rem] border border-border-card shadow-xl shadow-slate-200/5 space-y-12">
                            
                            {/* Section: Imp */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-[1.25rem]"><Brain size={22} /></div>
                                    <label className="text-xs font-black text-main uppercase tracking-[0.2em]">Clinical Impression</label>
                                </div>
                                <textarea
                                    value={plan}
                                    onChange={(e) => setPlan(e.target.value)}
                                    placeholder="Summarize the core clinical findings and session synthesis..."
                                    className="w-full bg-card/50 border border-border-card rounded-[2rem] py-8 px-8 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 text-main transition-all min-h-[160px] resize-none placeholder:text-muted shadow-inner leading-relaxed"
                                />
                            </div>

                            {/* Section: Meds */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-[1.25rem]"><Pill size={22} /></div>
                                    <label className="text-xs font-black text-main uppercase tracking-[0.2em]">Medication Regimen</label>
                                </div>
                                <textarea
                                    value={medications}
                                    onChange={(e) => setMedications(e.target.value)}
                                    placeholder="Detail any titrations or new prescriptions..."
                                    className="w-full bg-card/50 border border-border-card rounded-[2rem] py-8 px-8 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-rose-500/5 text-main transition-all min-h-[110px] resize-none placeholder:text-muted shadow-inner"
                                />
                            </div>

                            {/* Section: Steps */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-[1.25rem]"><ClipboardList size={22} /></div>
                                    <label className="text-xs font-black text-main uppercase tracking-[0.2em]">Recommendations & Journey Steps</label>
                                </div>
                                <textarea
                                    value={nextSteps}
                                    onChange={(e) => setNextSteps(e.target.value)}
                                    placeholder="Define actionable milestones for the patient journey..."
                                    className="w-full bg-card/50 border border-border-card rounded-[2rem] py-8 px-8 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 text-main transition-all min-h-[160px] resize-none placeholder:text-muted shadow-inner"
                                />

                                <div className="space-y-4 pt-4">
                                    <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-[0.25em] ml-2">Quick Protocol Integration</p>
                                    <div className="flex flex-wrap gap-3">
                                        {recommendations.map((rec, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => addRecommendation(rec)}
                                                className="px-6 py-3 bg-card border border-border-card rounded-2xl text-[10px] font-black text-muted uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex items-center gap-3 group"
                                            >
                                                <Plus size={14} className="text-muted opacity-40 group-hover:text-indigo-600 transition-colors" />
                                                {rec}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-center gap-4 text-rose-600 text-[11px] font-black uppercase tracking-widest animate-pulse">
                                <AlertCircle size={20} />
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8">
                            <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-[0.2em] max-w-sm leading-loose">
                                Finalizing this plan will synchronize all data with the mobile application's treatment history and progress tracker.
                            </p>
                            <Button
                                variant="primary"
                                type="submit"
                                isLoading={isSubmitting}
                                className="rounded-[2rem] px-16 py-6 h-auto text-xs shadow-2xl shadow-indigo-600/20 uppercase tracking-[0.3em] font-black hover:scale-[1.02] transition-transform"
                            >
                                Finalize Record
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default InitializeTreatmentPage;
