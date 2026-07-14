import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { 
    ChevronLeft, 
    AlertCircle, 
    Activity,
    Brain,
    ShieldAlert,
    FileText,
    Loader2,
    Sparkles,
    Bot,
    Edit3,
    Trash2
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ChiefComplaintService } from '../../../api/services/chiefComplaint.service';

const ChiefComplaintDetail = () => {
    const { patientId: userId, ccId } = useParams<{ patientId: string; ccId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isNew = searchParams.get('new') === 'true';
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = (currentUser as any)?.role === 'patient' || 
                      (currentUser as any)?.role === 'PATIENT' || 
                      (currentUser as any)?.group === 'PATIENT' ||
                      (currentUser as any)?.group === 'patient';
    
    const [complaint, setComplaint] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (ccId) {
            fetchDetail();
        }
    }, [ccId]);

    const fetchDetail = async () => {
        setIsLoading(true);
        try {
            let response;
            if (isPatient) {
                const hexId = currentUser?._id || currentUser?.id || userId;
                response = await ChiefComplaintService.getPatientComplaintById(hexId as string, ccId!);
            } else {
                response = await ChiefComplaintService.getById(ccId!, userId);
            }
            const data = response.data || response;
            setComplaint(data);
        } catch (err: any) {
            console.error('Failed to fetch complaint detail:', err);
            
            // Suppress 403 for patients
            if (isPatient && err.response?.status === 403) {
                setError('Clinical details are restricted to authorized providers.');
            } else {
                setError('Could not load the clinical record details.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this clinical record? This action cannot be undone.')) {
            return;
        }

        try {
            const hexId = currentUser?._id || currentUser?.id || userId;
            await ChiefComplaintService.deleteComplaint(ccId!, hexId as string);
            navigate(`/patients/${userId}/chief-complaint`);
        } catch (err) {
            console.error('Failed to delete complaint:', err);
            alert('Failed to delete the record. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-muted opacity-80 font-black uppercase tracking-widest text-[10px]">Retrieving AI Analysis...</p>
            </div>
        );
    }

    if (error || !complaint) {
        return (
            <div className="p-8 max-w-4xl  space-y-10 animate-fade-in pb-24">
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold mt-8">
                    <AlertCircle size={18} />
                    {error || 'Clinical record not found.'}
                </div>
                <Button variant="outline" onClick={() => navigate(isPatient ? '/records/chief-complaint' : `/patients/${userId}/chief-complaint`)}>
                    Go Back
                </Button>
            </div>
        );
    }

    const { structured, risk_markers, ai_summary, narrative } = complaint;

    return (
        <div className="p-8 max-w-5xl  space-y-10 animate-fade-in pb-24">
            <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative">
                <div className="flex items-start gap-6">
                    <button
                        onClick={() => navigate(isPatient ? '/records' : `/patients/${userId}/chief-complaint`)}
                        className="p-3 mt-1 bg-card hover:bg-page border border-border-card rounded-2xl text-muted transition-all hover:shadow-md active:scale-95 group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <Bot size={16} className="text-indigo-600" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                Automated Clinical Insight
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-main tracking-tight leading-none mb-1">
                            Insight Summary
                        </h1>
                        <p className="text-xs font-bold text-muted opacity-80 uppercase tracking-widest">Structured Review of Clinical Findings</p>
                    </div>
                </div>

                {!isPatient && (
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => navigate(`/patients/${userId}/chief-complaint/edit/${ccId}`)}
                            leftIcon={<Edit3 size={18} />}
                            className="rounded-2xl px-6 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all font-black uppercase text-xs shadow-sm"
                        >
                            Override Analysis
                        </Button>
                        <button
                            onClick={handleDelete}
                            className="p-4 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all border border-rose-200 shadow-sm"
                            title="Delete Record"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}

                {isNew && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-emerald-500 text-white px-8 py-5 rounded-[2rem] shadow-xl shadow-emerald-100 flex items-center gap-4 border-b-4 border-emerald-700"
                    >
                        <div className="w-10 h-10 bg-card/20 rounded-xl flex items-center justify-center animate-bounce">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Sync Complete</p>
                            <h3 className="text-sm font-black whitespace-nowrap">Generation Success</h3>
                        </div>
                    </motion.div>
                )}
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Main Narrative & Summary */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card-premium p-8 bg-card border-border-card flex flex-col gap-4 relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 opacity-50" />
                        <div className="flex items-center gap-3 border-b border-border-card pb-4">
                            <FileText size={18} className="text-indigo-500" />
                            <h2 className="text-sm font-black text-main uppercase tracking-widest">Complaint</h2>
                        </div>
                        <p className="text-main font-semibold leading-relaxed pt-2">
                            "{narrative}"
                        </p>
                    </motion.div>

                    {ai_summary && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="card-premium p-8 bg-indigo-50 border-indigo-100 flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-3 border-b border-indigo-200 pb-4">
                                <Brain size={18} className="text-indigo-600" />
                                <h2 className="text-sm font-black text-indigo-900 uppercase tracking-widest">AI Clinical Summary</h2>
                            </div>
                            <p className="font-semibold text-main leading-relaxed pt-2">
                                {ai_summary}
                            </p>
                        </motion.div>
                    )}

                    {structured?.mse_observations && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card-premium p-8 bg-card border-border-card flex flex-col gap-6"
                        >
                            <div className="flex items-center gap-3 border-b border-border-card pb-4">
                                <Activity size={18} className="text-indigo-500" />
                                <h2 className="text-sm font-black text-main uppercase tracking-widest">Mental Status Exam (MSE)</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {Object.entries(structured.mse_observations).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                        <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">
                                            {key.replace('_', ' ')}
                                        </p>
                                        <p className="text-sm font-bold text-main bg-page px-3 py-2 rounded-xl">
                                            {String(value) || 'Not Provided'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {structured?.associated_symptoms && structured.associated_symptoms.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="card-premium p-8 bg-card border-border-card flex flex-col gap-4"
                        >
                            <h2 className="text-sm font-black text-main uppercase tracking-widest border-b border-border-card pb-4">Associated Symptoms</h2>
                            <div className="flex flex-wrap gap-2">
                                {structured.associated_symptoms.map((sym: string) => (
                                    <span key={sym} className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                        {sym}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {(structured?.clinical_impression || structured?.functional_impairment) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="card-premium p-8 bg-card border-border-card grid md:grid-cols-2 gap-8"
                        >
                            {structured.clinical_impression && (
                                <div className="space-y-2">
                                    <h2 className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Clinical Impression</h2>
                                    <p className="text-sm font-semibold text-main leading-relaxed bg-page p-4 rounded-2xl h-full line-clamp-4">
                                        {structured.clinical_impression}
                                    </p>
                                </div>
                            )}
                            {structured.functional_impairment && (
                                <div className="space-y-2">
                                    <h2 className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Functional Impairment</h2>
                                    <p className="text-sm font-semibold text-main leading-relaxed bg-page p-4 rounded-2xl h-full line-clamp-4">
                                        {structured.functional_impairment}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {complaint.previous_episodes && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                            className="card-premium p-8 bg-card border-border-card flex flex-col gap-4"
                        >
                            <h2 className="text-sm font-black text-main uppercase tracking-widest border-b border-border-card pb-4">Previous History</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Occurred Before</p>
                                    <p className="text-sm font-bold text-main">{complaint.previous_episodes.has_occurred_before ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Hospitalized</p>
                                    <p className="text-sm font-bold text-main">{complaint.previous_episodes.hospitalized_before ? 'Yes' : 'No'}</p>
                                </div>
                                {complaint.previous_episodes.last_episode_date && (
                                    <div className="col-span-2 text-right">
                                        <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Last Episode</p>
                                        <p className="text-sm font-bold text-main">{complaint.previous_episodes.last_episode_date}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Column - Risks & Metadata */}
                <div className="space-y-8">
                    {risk_markers && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className={`card-premium p-8 border-2 ${
                                risk_markers.risk_level === 'None' 
                                ? 'bg-emerald-50 border-emerald-100' 
                                : 'bg-rose-50 border-rose-100 shadow-lg shadow-rose-100'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldAlert size={20} className={risk_markers.risk_level === 'None' ? 'text-emerald-500' : 'text-rose-600'} />
                                <h2 className={`text-sm font-black uppercase tracking-widest ${
                                    risk_markers.risk_level === 'None' ? 'text-emerald-800' : 'text-rose-900'
                                }`}>
                                    Risk Assessment
                                </h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between pb-4 border-b border-white/40">
                                    <span className="text-xs font-bold text-muted">Overall Level</span>
                                    <span className={`text-xs font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                                        risk_markers.risk_level === 'None' ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-600 text-white'
                                    }`}>
                                        {risk_markers.risk_level}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-xs font-bold text-main">
                                        <span>Self Harm:</span>
                                        <span>{risk_markers.self_harm_detected ? '⚠️ Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-main">
                                        <span>Violence:</span>
                                        <span>{risk_markers.violence_detected ? '⚠️ Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-main">
                                        <span>Psychosis:</span>
                                        <span>{risk_markers.psychosis_detected ? '⚠️ Yes' : 'No'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {structured?.recommendations && structured.recommendations.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="card-premium p-8 bg-amber-50 border-amber-100"
                        >
                            <h2 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-4">Recommended Actions</h2>
                            <ul className="space-y-3">
                                {structured.recommendations.map((rec: string, i: number) => (
                                    <li key={i} className="flex gap-3 text-sm font-bold text-amber-800">
                                        <span className="text-amber-500 mt-0.5">•</span>
                                        <span className="leading-snug">{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {structured?.affected_domains && Object.values(structured.affected_domains).some(Boolean) && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 }}
                            className="card-premium p-8 bg-indigo-50 border-indigo-100"
                        >
                            <h2 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4">Affected Domains</h2>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(structured.affected_domains)
                                    .filter(([_, isActive]) => isActive)
                                    .map(([domain]) => (
                                        <span key={domain} className="text-[10px] font-black uppercase text-white bg-indigo-500 px-3 py-1.5 rounded-lg shadow-md shadow-indigo-200">
                                            {domain.replace('_', ' ')}
                                        </span>
                                    ))
                                }
                            </div>
                        </motion.div>
                    )}

                    {structured && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="card-premium p-8 bg-card border-border-card"
                        >
                            <h2 className="text-sm font-black text-main uppercase tracking-widest mb-6 border-b border-border-card pb-4">Clinical Profile</h2>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Calculated Severity</p>
                                    <p className="text-sm font-bold text-main">{structured.severity || 'Unspecified'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Duration</p>
                                    <p className="text-sm font-bold text-main">{structured.duration || 'Not stated'}</p>
                                </div>
                                <div className="pt-2 border-t border-border-card">
                                    <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mb-2">Potential Diagnoses</p>
                                    <div className="flex flex-wrap gap-2">
                                        {structured.potential_diagnoses?.length > 0 ? (
                                            structured.potential_diagnoses.map((dx: string) => (
                                                <span key={dx} className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md">
                                                    {dx}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs font-bold text-muted opacity-80 italic">None identified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChiefComplaintDetail;
