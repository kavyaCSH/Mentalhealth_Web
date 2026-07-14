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
    Loader2
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { HPIService } from '../../../api/services/hpi.service';

const EditHPI = () => {
    const { patientId: userId, hpiId } = useParams<{ patientId: string; hpiId: string }>();
    const navigate = useNavigate();
    
    const [narrative, setNarrative] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const recognitionRef = useRef<any>(null);
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = currentUser?.role === 'patient' || (currentUser as any)?.role === 'PATIENT';

    useEffect(() => {
        if (hpiId) {
            fetchInitialData();
        }
    }, [hpiId]);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            // HPIService.getHPIById handles falling back to list if direct fetch fails
            const response = await HPIService.getHPIById(hpiId!, userId);
            const data = response.data || response;
            if (data && data.narrative) {
                setNarrative(data.narrative);
            }
        } catch (err) {
            console.error('Failed to fetch HPI data:', err);
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

    const handleSave = async () => {
        if (!narrative.trim()) {
            setError('Please provide a narrative for the record.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await HPIService.updateHPI(hpiId!, {
                narrative: narrative.trim()
            });
            
            alert('HPI record updated successfully!');
            navigate(`/patients/${userId}/hpi/${hpiId}`);
        } catch (err: any) {
            console.error('Failed to update HPI:', err);
            setError(err.response?.data?.message || 'Failed to update the record. Please try again.');
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
                    onClick={() => isPatient ? navigate('/records') : navigate(-1)}
                    className="p-3 bg-card hover:bg-page border border-border-card rounded-2xl text-muted transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-main tracking-tight">
                        Edit HPI Record
                    </h1>
                    <p className="text-xs font-bold text-muted opacity-80 uppercase tracking-widest mt-1">Refine history of present illness</p>
                </div>
            </header>

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
                            <h2 className="text-xl font-black text-main">Update Narrative</h2>
                            <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Adjust clinical context</p>
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
                        placeholder="Refine the clinical narrative..."
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
                        variant="outline"
                        size="lg"
                        className="px-10 rounded-2xl border-border-card text-muted font-black uppercase tracking-widest text-xs"
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
                        Update Record
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default EditHPI;
