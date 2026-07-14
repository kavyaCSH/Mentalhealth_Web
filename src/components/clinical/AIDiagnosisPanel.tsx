import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Sparkles, AlertTriangle, Loader2, RotateCcw, Mic, MicOff, Trash2
} from 'lucide-react';
import { DiagnosisService } from '../../api/services/diagnosis.service';
import type { AIDiagnosisData } from '../../types/diagnosis.types';



// ─── Waveform bars (animated while recording) ─────────────────────────────────
const Waveform = () => (
    <div className="flex items-center gap-[3px] h-5">
        {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 1].map((scale, i) => (
            <motion.div
                key={i}
                className="w-[3px] rounded-full bg-rose-500"
                animate={{ scaleY: [scale, scale * 0.3, scale] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.06, ease: 'easeInOut' }}
                style={{ height: '100%', originY: '50%' }}
            />
        ))}
    </div>
);



// ─── Main Panel ───────────────────────────────────────────────────────────────
interface AIDiagnosisPanelProps {
    patientId: number;
    patientName?: string;
}

const AIDiagnosisPanel = ({ patientId, patientName }: AIDiagnosisPanelProps) => {
    const navigate = useNavigate();
    const [narrative, setNarrative] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Voice-to-text state ──────────────────────────────────────────────────
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [voiceSupported, setVoiceSupported] = useState(true);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const narrativeRef = useRef(narrative); // keep a ref for use inside recognition callbacks
    useEffect(() => { narrativeRef.current = narrative; }, [narrative]);

    // Check browser support
    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) setVoiceSupported(false);
    }, []);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        recognitionRef.current = null;
        setIsListening(false);
        setInterimText('');
    }, []);

    const startListening = useCallback(() => {
        if (!voiceSupported) return;
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;

        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                // Append final sentences directly to the main narrative state
                setNarrative(prev => {
                    const separator = prev && !prev.endsWith(' ') ? ' ' : '';
                    return prev + separator + finalTranscript;
                });
            }
            setInterimText(interimTranscript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
                stopListening();
                setError(`Microphone error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            setInterimText('');
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [voiceSupported, stopListening]);

    const toggleListening = () => {
        if (isListening) stopListening();
        else startListening();
    };

    // Auto-stop when unmounting
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleGenerate = async () => {
        if (!narrative.trim() || narrative.length < 20) {
            setError('Please provide a more detailed clinical narrative (min 20 chars).');
            return;
        }

        if (isListening) stopListening();

        setIsLoading(true);
        setError(null);

        try {
            const data = await DiagnosisService.generateAIDiagnosis({
                user_id: patientId,
                narrative: narrative.trim(),
            });

            // Handle standard wrappers
            const parsedData = (data?.data ?? data) as AIDiagnosisData;
            // Provide narrative to the result state if not returned by API
            if (!parsedData.narrative) parsedData.narrative = narrative.trim();
            if (!parsedData.generated_at) parsedData.generated_at = new Date().toISOString();
            
            navigate(`/patients/${patientId}/ai-diagnosis/result`, { state: { result: parsedData } });
        } catch (err: any) {
            console.error('[AIDiagnosisPanel] API Error:', err);
            const msg = err?.response?.data?.message || err?.message || 'Failed to generate AI diagnosis. Please try again.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        if (isListening) stopListening();
        setError(null);
        setNarrative('');
    };

    return (
        <div className="card-premium overflow-hidden">
            {/* ── Header ── */}
            <div className="p-6 border-b border-border-card flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-main flex items-center gap-2.5">
                        <Brain className="text-violet-600" size={24} />
                        AI Diagnosis Assistant
                        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-[9px] font-black tracking-widest uppercase ml-1">Beta</span>
                    </h2>
                    <p className="text-sm font-medium text-muted mt-1">
                        Synthesize clinical narratives into structured DSM/ICD assessments
                        {patientName && <span className="text-indigo-500 font-bold ml-1">for {patientName}</span>}
                    </p>
                </div>
                <button onClick={handleReset} className="p-2 text-muted opacity-80 hover:text-muted hover:bg-page rounded-xl transition-colors">
                    <RotateCcw size={18} />
                </button>
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="input"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted opacity-80 ml-1">Clinical Narrative</label>
                            <div className="relative group">
                                <textarea
                                    value={narrative}
                                    onChange={(e) => setNarrative(e.target.value)}
                                    placeholder="Dictate or type patient symptoms, history of present illness, clinical observations, duration, and any stressors..."
                                    className="w-full h-40 p-5 bg-page rounded-2xl border border-border-card text-sm font-medium text-main placeholder:text-muted opacity-80 focus:bg-card focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all resize-none shadow-inner pr-12"
                                    disabled={isLoading}
                                />
                                {/* Clear Text button */}
                                {narrative.length > 0 && !isLoading && (
                                    <button
                                        onClick={() => {
                                            setNarrative('');
                                            if (isListening) stopListening();
                                        }}
                                        className="absolute top-3 right-3 p-2 text-muted opacity-40 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        title="Clear text"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                {/* Real-time speech interim text overlay */}
                                {isListening && interimText && (
                                    <div className="absolute bottom-5 left-5 right-16 pointer-events-none">
                                        <p className="text-sm font-medium text-muted opacity-80 italic bg-card/80 backdrop-blur px-2 py-1 rounded inline-block">
                                            {interimText}
                                        </p>
                                    </div>
                                )}
                                {/* Mic button */}
                                {voiceSupported && (
                                    <button
                                        onClick={toggleListening}
                                        disabled={isLoading}
                                        className={`absolute bottom-4 right-4 w-12 h-12 flex items-center justify-center rounded-xl shadow-sm transition-all duration-300 ${
                                            isListening 
                                                ? 'bg-rose-50 text-rose-500 border border-rose-200' 
                                                : 'bg-card text-muted opacity-80 border border-border-card hover:bg-page hover:text-indigo-500 hover:border-indigo-200'
                                        }`}
                                    >
                                        <AnimatePresence mode="wait">
                                            {isListening ? (
                                                <motion.div
                                                    key="listening"
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.5, opacity: 0 }}
                                                    className="flex items-center justify-center w-full h-full"
                                                >
                                                    <Waveform />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="idle"
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    exit={{ scale: 0.5, opacity: 0 }}
                                                >
                                                    <Mic size={20} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        {/* Pulsing ring while recording */}
                                        {isListening && (
                                            <motion.span
                                                className="absolute inset-0 rounded-xl border-2 border-rose-400"
                                                animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                                                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                                            />
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-medium text-muted opacity-80">
                                    {narrative.length} chars · Min. 20 required
                                </p>
                                {voiceSupported ? (
                                    <p className="text-[10px] font-medium text-muted opacity-80 flex items-center gap-1">
                                        <Mic size={10} />
                                        Dictation supported
                                    </p>
                                ) : (
                                    <p className="text-[10px] font-medium text-orange-400 flex items-center gap-1">
                                        <MicOff size={10} />
                                        Browser doesn't support dictation
                                    </p>
                                )}
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 text-red-700">
                                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                                <p className="text-sm font-bold">{error}</p>
                            </motion.div>
                        )}

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || narrative.length < 20}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-indigo-600 group shadow-md shadow-indigo-600/20"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Synthesizing Diagnosis...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} className="group-hover:scale-110 transition-transform" />
                                    Generate AI Assessment
                                </>
                            )}
                        </button>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AIDiagnosisPanel;
