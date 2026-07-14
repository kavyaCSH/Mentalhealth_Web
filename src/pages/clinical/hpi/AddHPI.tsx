import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import {
    ChevronLeft,
    History as HistoryIcon,
    AlertCircle,
    Mic,
    MicOff,
    Save,
    Brain,
    ShieldAlert,
    Activity,
    ChevronRight,
    Edit2,
    CheckCircle2
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { HPIService } from '../../../api/services/hpi.service';
import { UserService } from '../../../api/services/user.service';

const AddHPI = () => {
    const { patientId: userId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();

    const [content, setContent] = useState('');
    const [step, setStep] = useState(0); // 0: Input, 1: AI Review
    const [extractionData, setExtractionData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = currentUser?.role === 'patient' || (currentUser as any)?.role === 'PATIENT';

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setContent(prev => prev + ' ' + event.results[i][0].transcript);
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
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

    const handleAIReview = async () => {
        if (!content.trim() || content.length < 20) {
            setError('Please provide a more detailed narrative for longitudinal analysis (min 20 chars).');
            return;
        }

        setIsThinking(true);
        setError(null);
        try {
            // Resolve identity for session safety
            let hexId = userId || '';
            if (isPatient && (currentUser?._id || currentUser?.id)) {
                hexId = currentUser?._id || currentUser?.id || hexId;
            } else if (userId) {
                try {
                    const userProfile = await UserService.getUserById(userId);
                    if (userProfile) hexId = userProfile._id || userProfile.id || hexId;
                } catch (e) {
                    console.warn('[AddHPI] Identity resolution failed:', e);
                }
            }

            const res = await HPIService.extractHPI({
                patient_id: hexId,
                narrative: content.trim()
            });
            const data = res.data || res;
            setExtractionData(data);
            setStep(1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
            console.error('HPI Extraction failed:', err);
            setError('Clinical analysis engine timeout. You can proceed with manual save.');
        } finally {
            setIsThinking(false);
        }
    };

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

    const handleSave = async () => {
        if (!content.trim()) {
            setError('Please provide content for the HPI history.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Resolve identity for session safety
            let hexId = userId || '';
            if (isPatient && (currentUser?._id || currentUser?.id)) {
                hexId = currentUser?._id || currentUser?.id || hexId;
            } else if (userId) {
                try {
                    const userProfile = await UserService.getUserById(userId);
                    if (userProfile) hexId = userProfile._id || userProfile.id || hexId;
                } catch (e) {
                    console.warn('[AddHPI] Save identity resolution failed:', e);
                }
            }

            if (!hexId) throw new Error('User ID is missing');

            // Sanitize extraction data to prevent ID collisions and satisfy backend validations
            const sanitizedExtracted = JSON.parse(JSON.stringify(extractionData || {}));

            // PURGE ALL POTENTIAL STALE IDs FROM ANALYSIS SOURCE
            delete sanitizedExtracted.id;
            delete sanitizedExtracted._id;
            delete sanitizedExtracted.hpiId;
            delete sanitizedExtracted.historyOfIllnessId;

            // If we have extraction data, save the structured clinical record
            // Otherwise, fallback to the legacy simple narrative save
            const payload = {
                ...sanitizedExtracted,
                patient_id: hexId,
                narrative: content.trim(),
                consult_id: Number(sanitizedExtracted.consult_id) || 1
            };

            const response = extractionData
                ? await HPIService.submitHPI(payload)
                : await HPIService.createHPI({
                    patient_id: hexId,
                    narrative: content.trim(),
                    consultId: '1' // Fallback for simple creation
                });

            const createdData = response?.data || response;
            const hpiId = (createdData as any)?.historyOfIllnessId || (createdData as any)?.hpiId || (createdData as any)?.id || (createdData as any)?._id;

            alert('HPI history saved successfully!');

            if (hpiId) {
                // Determine the correct detail path based on the response format
                const recordPath = `/patients/${userId}/hpi/${hpiId}`;
                navigate(recordPath);
            } else {
                navigate(isPatient ? '/records' : `/patients/${userId}/hpi`);
            }
        } catch (err: any) {
            console.error('Failed to save HPI:', err);
            setError(err.response?.data?.message || 'Failed to save the HPI history. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl  space-y-10 animate-fade-in pb-24">
            <header className="flex items-center gap-6">
                <button
                    onClick={() => navigate(isPatient ? '/records' : `/patients/${userId}/health`)}
                    className="p-3 bg-card hover:bg-page border border-border-card rounded-2xl text-muted transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-main tracking-tight">
                        New HPI history
                    </h1>
                    <p className="text-xs font-bold text-muted opacity-80 uppercase tracking-widest mt-1">Capture history of present illness</p>
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
                                <HistoryIcon size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-main">Clinical History</h2>
                                <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Detail the progression of symptoms</p>
                            </div>
                        </div>

                        <button
                            onClick={handleToggleRecording}
                            className={`p-4 rounded-2xl transition-all flex items-center gap-3 active:scale-95 border-2 ${isRecording
                                ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200 animate-pulse'
                                : 'bg-indigo-50/50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-200'
                                }`}
                        >
                            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                            <span className="text-xs font-black uppercase tracking-widest">
                                {isRecording ? 'Stop Recording' : 'ADD VIA VOICE'}
                            </span>
                        </button>
                    </div>

                    <div className="relative group">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Describe the progression of the patient's symptoms, onset, and any relevant clinical history..."
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
                            isLoading={isThinking}
                            rightIcon={<ChevronRight size={18} />}
                        >
                            Generate AI Insights
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
                            <div>
                                <h2 className="text-xl font-black text-main tracking-tight">Clinical Intelligence</h2>
                                <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">AI-structured historical data</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" leftIcon={<Edit2 size={16} />} onClick={() => setStep(0)}>Edit Input</Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            {/* Summary Card */}
                            <div className="card-premium p-8 bg-indigo-50 border-indigo-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-bl-full -z-0" />
                                <div className="relative z-10 space-y-4">
                                    <h3 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Clinical Narrative Abstract</h3>
                                    <p className="text-sm font-semibold text-indigo-900 leading-relaxed italic">
                                        "{extractionData?.ai_summary || extractionData?.narrative}"
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Findings Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="card-premium p-6 bg-card border-border-card">
                                    <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest mb-3">Duration</p>
                                    <p className="text-xs font-bold text-main">{extractionData?.structured?.duration || 'Not specified'}</p>
                                </div>
                                <div className="card-premium p-6 bg-card border-border-card">
                                    <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest mb-3">Onset</p>
                                    <p className="text-xs font-bold text-main">{extractionData?.structured?.onset || 'Not specified'}</p>
                                </div>
                                <div className="card-premium p-6 bg-card border-border-card">
                                    <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest mb-3">Course</p>
                                    <p className="text-xs font-bold text-main">{extractionData?.structured?.course || 'Not specified'}</p>
                                </div>
                                <div className="card-premium p-6 bg-card border-border-card">
                                    <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest mb-3">Energy Level</p>
                                    <p className="text-xs font-bold text-main">{extractionData?.structured?.energy || 'Stable'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="card-premium p-6 bg-card border-border-card">
                                    <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest mb-3">Mood Features</p>
                                    <div className="flex flex-wrap gap-2">
                                        {extractionData?.structured?.mood_features?.map((f: string) => (
                                            <span key={f} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-100">{f}</span>
                                        )) || <span className="text-xs text-muted opacity-40 italic font-medium">None detected</span>}
                                    </div>
                                </div>
                                <div className="card-premium p-6 bg-card border-border-card">
                                    <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest mb-3">Psychotic Features</p>
                                    <div className="flex flex-wrap gap-2">
                                        {extractionData?.structured?.psychotic_features?.map((f: string) => (
                                            <span key={f} className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded border border-rose-100">{f}</span>
                                        )) || <span className="text-xs text-muted opacity-40 italic font-medium">None detected</span>}
                                    </div>
                                </div>
                                <div className="card-premium p-6 bg-card border-border-card">
                                    <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest mb-3">Sleep Pattern</p>
                                    <p className="text-xs font-bold text-main">{extractionData?.structured?.sleep || 'Not mentioned'}</p>
                                </div>
                                <div className="card-premium p-6 bg-card border-border-card">
                                    <p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest mb-3">Appetite</p>
                                    <p className="text-xs font-bold text-main">{extractionData?.structured?.appetite || 'Not mentioned'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Risks & Indicators */}
                            <div className="card-premium p-8 bg-slate-900 text-white shadow-xl shadow-indigo-100">
                                <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <ShieldAlert size={14} className="text-rose-400" /> System Indicators
                                </h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[9px] font-black text-white/40 uppercase mb-2">Suicidal Ideation</p>
                                        <div className={`p-3 rounded-xl border flex items-center justify-between ${extractionData?.structured?.suicidal_ideation !== 'None' ? 'bg-rose-500/20 border-rose-500/50' : 'bg-emerald-500/20 border-emerald-500/50'}`}>
                                            <span className="text-xs font-black">{extractionData?.structured?.suicidal_ideation || 'None'}</span>
                                            {extractionData?.structured?.suicidal_ideation !== 'None' ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white/40 uppercase mb-2">Calculated Severity</p>
                                        <div className="h-2 bg-card/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-1000"
                                                style={{
                                                    width: `${(extractionData?.severity_index || 0) * 10}%`,
                                                    backgroundColor: extractionData?.color_code || '#6366f1'
                                                }}
                                            />
                                        </div>
                                        <p className="text-right text-[10px] font-black mt-1 text-indigo-300">Level: {extractionData?.severity_index || 0}/10</p>
                                    </div>
                                </div>
                            </div>

                            {/* DSM mapping */}
                            <div className="card-premium p-8 bg-card border-border-card">
                                <h3 className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mb-4">DSM-5 Potential Mapping</h3>
                                <div className="flex flex-wrap gap-2">
                                    {extractionData?.dsm5_mapping?.map((code: string) => (
                                        <span key={code} className="text-[9px] font-black px-2 py-1 bg-page text-muted rounded uppercase">{code}</span>
                                    )) || <span className="text-[10px] text-muted opacity-40 italic">No direct mapping identified</span>}
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
                            Save to History
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddHPI;
