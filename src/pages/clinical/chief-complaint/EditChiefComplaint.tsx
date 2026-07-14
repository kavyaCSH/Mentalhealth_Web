import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ChevronLeft, 
    Stethoscope, 
    AlertCircle, 
    Mic, 
    MicOff, 
    Save,
    Loader2,
    Brain,
    ShieldAlert,
    Activity,
    ChevronRight,
    Edit2
} from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import Button from '../../../components/ui/Button';
import { ChiefComplaintService } from '../../../api/services/chiefComplaint.service';

const EditChiefComplaint = () => {
    const { patientId: userId, ccId } = useParams<{ patientId: string; ccId: string }>();
    const navigate = useNavigate();
    
    // State
    const [narrative, setNarrative] = useState('');
    const [step, setStep] = useState(0); // 0: Edit, 1: AI Review
    const [extractionData, setExtractionData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const recognitionRef = useRef<any>(null);

    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = (currentUser as any)?.role === 'patient' || 
                      (currentUser as any)?.role === 'PATIENT' || 
                      (currentUser as any)?.group === 'PATIENT' ||
                      (currentUser as any)?.group === 'patient';

    useEffect(() => {
        if (ccId) {
            fetchInitialData();
        }
    }, [ccId]);

    const fetchInitialData = async () => {
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
            if (data) {
                setNarrative(data.narrative || '');
                setExtractionData(data);
            }
        } catch (err) {
            console.error('Failed to fetch complaint data:', err);
            setError('Could not load the existing clinical record.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setNarrative(prev => prev.trim() + ' ' + event.results[i][0].transcript);
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                setError(`Voice recognition error: ${event.error}`);
                setIsRecording(false);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleToggleRecording = () => {
        if (!recognitionRef.current) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            setError(null);
            try {
                recognitionRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error('Failed to start recording:', err);
                setIsRecording(false);
            }
        }
    };

    const handleAIReview = async () => {
        if (!narrative.trim() || narrative.length < 10) {
            setError('Please provide a more detailed narrative for AI analysis (min 10 chars).');
            return;
        }

        setIsExtracting(true);
        setError(null);
        try {
            const hexId = userId || currentUser?._id || currentUser?.id;
            const res = await ChiefComplaintService.extractChiefComplaint({
                patient_id: hexId as string,
                narrative: narrative.trim()
            });

            const data = res.data || res;
            setExtractionData(data);
            setStep(1); // Move to Review
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            console.error('AI Extraction failed:', err);
            setError('AI extraction failed. You can still save manually, but structured insights might be stale.');
            setStep(1); // Still move to review but with stale/existing data or partial data
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSave = async () => {
        if (!narrative.trim()) {
            setError('Please provide a narrative for the complaint.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Resolve hex ID for authorization
            let hexId: string = userId || '';
            if (isPatient && (currentUser?._id || currentUser?.id)) {
                hexId = (currentUser?._id || currentUser?.id || userId || '') as string;
            }

            console.log(`[EditChiefComplaint] Finalizing Override for record ${ccId} for identity: ${hexId}`);

            // Sanitize payload
            const payload = JSON.parse(JSON.stringify(extractionData || {}));
            
            // Critical: Remove non-updatable fields and nested objects that confuse Mongoose/Backend
            delete payload.id;
            delete payload._id;
            delete payload.chiefComplaintId;
            delete payload.patient; // Don't send the full patient object back
            delete payload.createdAt;
            delete payload.updatedAt;
            delete payload.__v;

            payload.narrative = narrative.trim();
            payload.patient_id = hexId; // Ensure patient_id is set at root

            await ChiefComplaintService.updateComplaint(ccId!, payload, hexId);
            
            alert('Chief complaint finalized successfully!');
            if (isPatient) {
                navigate(`/records/chief-complaint/${ccId}`);
            } else {
                navigate(`/patients/${userId}/chief-complaint/${ccId}`);
            }
        } catch (err: any) {
            console.error('Failed to update complaint:', err);
            setError(err.response?.data?.message || 'Failed to finalize the record. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-muted opacity-80 font-black uppercase tracking-widest text-[10px]">Retrieving Clinical Record...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl  space-y-10 animate-fade-in pb-24">
            <header className="flex items-center gap-6">
                <button
                    onClick={() => navigate(isPatient ? '/records/chief-complaint' : `/patients/${userId}/chief-complaint`)}
                    className="p-3 bg-card hover:bg-page border border-border-card rounded-2xl text-muted transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-main tracking-tight">
                        Edit Chief Complaint
                    </h1>
                    <p className="text-xs font-bold text-muted opacity-80 uppercase tracking-widest mt-1">Refine clinical narrative & insights</p>
                </div>
            </header>

            {step === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-premium p-10 bg-card border-border-card space-y-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <Stethoscope size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-main">Override Narrative</h2>
                                <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Adjust captured symptoms</p>
                            </div>
                        </div>

                        <button
                            onClick={handleToggleRecording}
                            className={`p-4 rounded-2xl transition-all flex items-center gap-3 active:scale-95 border-2 ${
                                isRecording 
                                ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200 animate-pulse' 
                                : 'bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-200'
                            }`}
                        >
                            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                            <span className="text-xs font-black uppercase tracking-widest">
                                {isRecording ? 'Stop Recording' : 'Add via Voice'}
                            </span>
                        </button>
                    </div>

                    <div className="relative group">
                        <textarea
                            value={narrative}
                            onChange={(e) => setNarrative(e.target.value)}
                            placeholder="Refine the patient's symptoms..."
                            className="w-full min-h-[300px] p-8 bg-card/50 border-2 border-border-card rounded-[2.5rem] text-lg font-semibold text-main placeholder:text-muted opacity-40 focus:outline-none focus:border-indigo-500 focus:bg-card transition-all resize-none leading-relaxed"
                        />
                        {isRecording && (
                            <div className="absolute bottom-6 right-6 flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest">
                                <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                                Listening...
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4">
                        <Button
                            variant="primary"
                            size="lg"
                            className="px-14 rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-xs"
                            onClick={handleAIReview}
                            isLoading={isExtracting}
                            rightIcon={<ChevronRight size={18} />}
                        >
                            Review AI Analysis
                        </Button>
                    </div>
                </motion.div>
            ) : (
                <div className="space-y-8 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 text-white rounded-xl">
                                <Brain size={20} />
                            </div>
                            <h2 className="text-xl font-black text-main tracking-tight">AI Clinical Insight Preview</h2>
                        </div>
                        <Button variant="outline" size="sm" leftIcon={<Edit2 size={16} />} onClick={() => setStep(0)}>Back To Edit</Button>
                    </div>

                    {extractionData?.risk_markers?.risk_level === 'High' && (
                        <div className="p-6 bg-rose-600 text-white rounded-[2rem] shadow-xl shadow-rose-200 flex items-center gap-6 border-b-4 border-rose-800">
                            <div className="w-14 h-14 bg-card/20 rounded-2xl flex items-center justify-center animate-pulse">
                                <ShieldAlert size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight">Critical Risk Marker Detected</h3>
                                <p className="text-xs font-bold text-rose-100">AI has flagged potential self-harm or acute psychotic features.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            <div className="card-premium p-8 bg-indigo-50 border-indigo-100 space-y-4">
                                <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em] border-b border-indigo-200 pb-4">Clinical Abstract</h3>
                                <p className="text-sm font-semibold text-indigo-900 leading-relaxed italic">
                                    "{extractionData?.ai_summary || extractionData?.narrative || narrative}"
                                </p>
                            </div>

                            <div className="card-premium p-8 bg-card border-border-card space-y-6">
                                <h3 className="text-[10px] font-black text-muted opacity-80 uppercase tracking-[0.2em] border-b border-border-card pb-4">Mental Status Findings</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(extractionData?.structured?.mse_observations || {}).map(([key, value]) => (
                                        <div key={key}>
                                            <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-tighter mb-1">{key.replace('_', ' ')}</p>
                                            <p className="text-xs font-bold text-main">{String(value) || 'Stable'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="card-premium p-8 bg-card border-border-card space-y-6">
                                <h3 className="text-[10px] font-black text-muted opacity-80 uppercase tracking-[0.2em] border-b border-border-card pb-4">Risk Profiling</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-page p-3 rounded-xl">
                                        <span className="text-xs font-bold text-muted">Self Harm detected</span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${extractionData?.risk_markers?.self_harm_detected ? 'bg-rose-600 text-white' : 'bg-border-card text-muted'}`}>
                                            {extractionData?.risk_markers?.self_harm_detected ? 'Detected' : 'Negative'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center bg-page p-3 rounded-xl">
                                        <span className="text-xs font-bold text-muted">Violence risk</span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${extractionData?.risk_markers?.violence_detected ? 'bg-rose-600 text-white' : 'bg-border-card text-muted'}`}>
                                            {extractionData?.risk_markers?.violence_detected ? 'Detected' : 'Negative'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="card-premium p-8 bg-emerald-50 border-emerald-100 flex flex-col gap-4">
                                <h3 className="text-xs font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={16} /> Impression Preview
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-muted">Severity:</span>
                                        <span className="text-xs font-bold text-indigo-600 uppercase">{extractionData?.structured?.severity || 'Mild'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-10">
                        <Button
                            variant="outline"
                            size="lg"
                            className="px-10 rounded-2xl"
                            onClick={() => setStep(0)}
                        >
                            Back To Edit
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            className="px-16 rounded-2xl shadow-xl shadow-indigo-200 font-black uppercase tracking-widest text-xs"
                            onClick={handleSave}
                            isLoading={isSaving}
                            leftIcon={<Save size={18} />}
                        >
                            Finalize Override
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditChiefComplaint;
