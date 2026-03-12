import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ChevronLeft, 
    Stethoscope, 
    AlertCircle, 
    Mic, 
    MicOff, 
    Save 
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ChiefComplaintService } from '../../../api/services/chiefComplaint.service';

const AddChiefComplaint = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    
    const [narrative, setNarrative] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const recognitionRef = useRef<any>(null);

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
                        setNarrative(prev => prev + ' ' + event.results[i][0].transcript);
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
        if (!narrative.trim()) {
            setError('Please provide a narrative for the complaint.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const formData = new FormData();
            
            // Check if userId is a valid number string
            const isNumericId = userId && /^\d+$/.test(userId);

            if (isNumericId) {
                // It's a purely numeric ID, send as patient_id
                formData.append('patient_id', userId);
            } else if (userId) {
                // It's likely a MongoDB ObjectId string, send as patient
                formData.append('patient', userId);
                // Also append patient_id just in case the backend expects both or one specific field
                formData.append('patient_id', userId);
            }

            formData.append('narrative', narrative.trim());
            
            console.log(`[AddChiefComplaint] Submitting: patient/patient_id=${userId}, narrative_length=${narrative.length}`);
            
            const response = await ChiefComplaintService.createComplaint(formData); 
            
            const createdData = response?.data || response;
            const newId = (createdData as any)?.chiefComplaintId || (createdData as any)?.id || (createdData as any)?._id;
            
            alert('Chief complaint saved successfully!');
            if (newId) {
                navigate(`/patients/${userId}/chief-complaint/${newId}`);
            } else {
                navigate(`/patients/${userId}/chief-complaint`);
            }
        } catch (err: any) {
            console.error('Failed to save complaint:', err);
            setError(err.response?.data?.message || 'Failed to save the chief complaint. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl  space-y-10 animate-fade-in pb-24">
            <header className="flex items-center gap-6">
                <button
                    onClick={() => navigate(`/patients/${userId}/chief-complaint`)}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        New Chief Complaint
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Capture clinical narrative</p>
                </div>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium p-10 bg-white border-slate-100 space-y-8"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Patient Complaint</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capture present symptoms</p>
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
                            {isRecording ? 'Stop Recording' : 'ADD VIA VOICE'}
                        </span>
                    </button>
                </div>

                <div className="relative group">
                    <textarea
                        value={narrative}
                        onChange={(e) => setNarrative(e.target.value)}
                        placeholder="Describe the patient's primary symptoms and duration..."
                        className="w-full min-h-[300px] p-8 bg-slate-50/50 border-2 border-slate-100 rounded-[2.5rem] text-lg font-semibold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none leading-relaxed"
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
                        variant="outline"
                        size="lg"
                        className="px-10 rounded-2xl border-slate-200 text-slate-500 font-black uppercase tracking-widest text-xs"
                        onClick={() => {
                            setNarrative('');
                            if (isRecording) {
                                recognitionRef.current?.stop();
                                setIsRecording(false);
                            }
                        }}
                    >
                        Clear
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        className="px-14 rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase tracking-widest text-xs"
                        onClick={handleSave}
                        isLoading={isSaving}
                        leftIcon={<Save size={18} />}
                    >
                        Save Complaint
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default AddChiefComplaint;
