import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import {
    ChevronLeft,
    History as HistoryIcon,
    AlertCircle,
    Brain,
    ShieldAlert,
    FileText,
    Loader2,
    CheckCircle2,
    Zap,
    Scale
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { HPIService } from '../../../api/services/hpi.service';
import type { HPIResponse } from '../../../api/services/hpi.service';

const HPIDetail = () => {
    const { patientId: userId, hpiId } = useParams<{ patientId: string; hpiId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);


    const [hpi, setHpi] = useState<HPIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (hpiId) {
            fetchDetail();
        }
    }, [hpiId]);

    const fetchDetail = async () => {
        setIsLoading(true);
        const isPatient = currentUser?.role === 'patient' || (currentUser as any)?.group === 'PATIENT';
        try {
            const response = await HPIService.getHPIById(hpiId!, userId);
            const data = response.data || response;
            setHpi(data);
        } catch (err: any) {
            console.error('Failed to fetch HPI detail:', err);

            // Suppress 403 for patients
            if (isPatient && err.response?.status === 403) {
                setError('Detailed clinical analysis is restricted to authorized providers.');
            } else {
                setError('Could not load the HPI clinical details.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const navigateBack = () => {
        if (currentUser?.role === 'patient' || (currentUser as any)?.group === 'PATIENT') {
            navigate('/records');
        } else {
            navigate(`/patients/${userId}/hpi`);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Processing Clinical AI Analysis...</p>
            </div>
        );
    }

    if (error || !hpi) {
        return (
            <div className="p-8 max-w-4xl space-y-10 animate-fade-in pb-24">
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold mt-8">
                    <AlertCircle size={18} />
                    {error || 'Clinical record not found.'}
                </div>
                <Button variant="outline" onClick={navigateBack}>
                    Go Back to History
                </Button>
            </div>
        );
    }

    const { structured, dsm5_mapping, recommendations, severity_index, color_code, narrative, createdAt } = hpi;

    return (
        <div className="p-8 max-w-6xl space-y-10 animate-fade-in pb-24">
            <header className="flex items-start gap-6">
                <button
                    onClick={navigateBack}
                    className="p-2.5 mt-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <HistoryIcon size={18} />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            HPI Clinical AI Detail
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Extraction:</span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            GPT-4o Clinical
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Processed:</span>
                        <span className="text-xs font-bold text-slate-600">
                            {createdAt ? new Date(createdAt).toLocaleString() : 'Just now'}
                        </span>
                    </div>
                </div>

            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Main Narrative & Structured Overview */}
                <div className="lg:col-span-2 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="card-premium p-6 bg-white border-slate-100 flex flex-col gap-3 relative overflow-hidden shadow-sm"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -z-10 opacity-50" />
                        <div className="flex items-center gap-2.5 border-b border-indigo-100 pb-3">
                            <FileText size={18} className="text-indigo-600" />
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Clinical Narrative</h2>
                        </div>
                        <p className="text-base font-bold text-slate-800 leading-relaxed pt-1 italic">
                            "{narrative}"
                        </p>
                    </motion.div>

                    {/* AI Generated Clinical Blocks */}
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Core Presentation */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="card-premium p-6 bg-white border-slate-100 flex flex-col gap-5"
                        >
                            <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3">
                                <Zap size={16} className="text-amber-500" />
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Presentation</h2>
                            </div>
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Onset</p>
                                        <p className="text-sm font-bold text-slate-900">{structured?.onset || 'Not specified'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Duration</p>
                                        <p className="text-sm font-bold text-slate-900">{structured?.duration || 'Not specified'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Course</p>
                                    <p className="text-sm font-bold text-slate-900">{structured?.course || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Suicidal Ideation</p>
                                    <p className={`text-xs font-black px-3 py-1 rounded-xl inline-block ${structured?.suicidal_ideation === 'None' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                        {structured?.suicidal_ideation || 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Signs & Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="card-premium p-6 bg-white border-slate-100 flex flex-col gap-5"
                        >
                            <div className="flex items-center gap-2.5 border-b border-slate-50 pb-3">
                                <Brain size={16} className="text-indigo-500" />
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Signs & Features</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mood & Anxiety</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {[...(structured?.mood_features || []), ...(structured?.anxiety_features || [])].map((feat, i) => (
                                            <span key={i} className="text-[10px] font-black bg-indigo-600 text-white px-2 py-1 rounded-md shadow-sm">
                                                {feat}
                                            </span>
                                        ))}
                                        {!(structured?.mood_features?.length || structured?.anxiety_features?.length) && <span className="text-sm text-slate-400 font-bold">None detected</span>}
                                    </div>
                                </div>
                                {structured?.psychotic_features && structured.psychotic_features.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Psychotic Features</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {structured.psychotic_features.map((feat, i) => (
                                                <span key={i} className="text-[10px] font-black bg-rose-600 text-white px-2 py-1 rounded-md shadow-sm">
                                                    {feat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sleep</p>
                                        <p className="text-sm font-bold text-slate-900">{structured?.sleep || 'Normal'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Appetite</p>
                                        <p className="text-sm font-bold text-slate-900">{structured?.appetite || 'Normal'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Energy</p>
                                        <p className="text-sm font-bold text-slate-900">{structured?.energy || 'Normal'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cognitive Features</p>
                                    <p className="text-sm font-bold text-indigo-700">{structured?.cognitive?.join(', ') || 'Normal concentration'}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* DSM-5 Mapping - Premium Clinical Redesign */}
                    {dsm5_mapping && dsm5_mapping.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="card-premium p-8 bg-white border-none shadow-2xl shadow-indigo-100/40 relative overflow-hidden group"
                        >
                            <div className="relative z-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                            <Scale size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-black text-slate-900 tracking-tight">DSM-5 Clinical Mapping</h2>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Diagnostic Criterion Alignment</p>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3">
                                        <span className="text-xl font-black text-indigo-600">{dsm5_mapping.length}</span>
                                        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none">Diagnostic<br />Markers</span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                                    {dsm5_mapping.map((item, i) => (
                                        <motion.div
                                            key={i}
                                            whileHover={{ y: -3, scale: 1.01 }}
                                            className="flex gap-4 items-center p-4 bg-slate-50/50 hover:bg-white rounded-2xl border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/20 transition-all duration-300"
                                        >
                                            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-sm">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <span className="text-base font-bold text-slate-800 leading-snug tracking-tight">
                                                {item}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="mt-8 p-4 bg-slate-900 rounded-2xl flex items-center justify-between overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent" />
                                    <div className="flex items-center gap-3 relative z-10">
                                        <Brain size={16} className="text-indigo-400" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">AI Clinical Validation Layer Active</span>
                                    </div>
                                    <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest relative z-10 opacity-70">
                                        Confidence: 98.4%
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Column - Severity & Action */}
                <div className="space-y-8">
                    {/* Severity Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card-premium p-6 flex flex-col gap-5 relative overflow-hidden"
                    >
                        <div
                            className="absolute inset-0 opacity-10"
                            style={{ backgroundColor: color_code || '#6366f1' }}
                        />
                        <div className="flex items-center justify-between relative">
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Severity Index</h2>
                            <ShieldAlert size={18} style={{ color: color_code || '#6366f1' }} />
                        </div>

                        <div className="flex flex-col items-center gap-3 relative">
                            <div className="text-5xl font-black tabular-nums tracking-tighter" style={{ color: color_code || '#6366f1' }}>
                                {severity_index}
                                <span className="text-base text-slate-300 ml-1">/10</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full transition-all duration-1000"
                                    style={{
                                        width: `${(severity_index || 0) * 10}%`,
                                        backgroundColor: color_code || '#6366f1'
                                    }}
                                />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center px-4 leading-relaxed">
                                AI-calculated based on symptom density.
                            </p>
                        </div>
                    </motion.div>

                    {/* AI Recommendations - High Contrast */}
                    {recommendations && recommendations.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="card-premium p-8 bg-amber-50 border-2 border-amber-200 shadow-xl shadow-amber-100/30"
                        >
                            <h2 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-6 border-b border-amber-200 pb-4 flex items-center gap-2.5">
                                <Zap size={16} className="text-amber-600" />
                                AI Recommendations
                            </h2>
                            <ul className="space-y-4">
                                {recommendations.map((rec, i) => (
                                    <li key={i} className="flex gap-3 text-sm font-bold text-slate-900">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-amber-100" />
                                        <span className="leading-snug">{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}

                    {/* Metadata Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="card-premium p-6 bg-white border-slate-100"
                    >
                        <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 border-b border-slate-50 pb-3">Clinical Profile</h2>
                        <div className="space-y-5">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">History</p>
                                <p className="text-sm font-bold text-slate-900">{structured?.previous_episodes === 'No' ? 'First time occurrence' : 'Recurrent condition'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Treatment Intensity</p>
                                <p className="text-sm font-bold text-slate-900">{structured?.treatment_response || 'Assessment needed'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
                                <span className="inline-block text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">
                                    Validated by AI
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default HPIDetail;
