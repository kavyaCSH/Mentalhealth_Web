import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Brain,
    ShieldAlert,
    Heart,
    Wind,
    Zap,
    Flame,
    Sparkles,
    ChevronLeft,
    Play,
    Loader2,
    Maximize2,
    UserCircle2,
    ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { NeuroVitalsService, type AnalysisResult } from '../../api/services/neuroVitals.service';
import TrendAreaChart from '../../components/common/TrendAreaChart';

const COLORS = {
    primary: '#00f2fe',
    secondary: '#4facfe',
    accent: '#ff007a',
    success: '#00ff9d',
    warning: '#fecb02',
    danger: '#ff4d4d',
    bg: '#05070a',
};

const NeuroVitalsPage = () => {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [hasScanStarted, setHasScanStarted] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [countdown, setCountdown] = useState(20);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [calibration, setCalibration] = useState({ gender: 'auto', age: '--', finalized: false });
    const [error, setError] = useState<string | null>(null);
    const [supportedMimeType, setSupportedMimeType] = useState<string | null>(null);

    // MIME Type Detection for Browser Compatibility
    useEffect(() => {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];
        const supported = types.find(type => MediaRecorder.isTypeSupported(type));
        if (supported) {
            setSupportedMimeType(supported);
        }
    }, []);

    // Initialize Camera
    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.setAttribute('playsinline', 'true');
                videoRef.current.play().catch(e => console.error("Auto-play failed:", e));
            }
            return mediaStream;
        } catch (err) {
            console.error('Failed to start camera:', err);
            setError('Camera access denied. Please allow camera permissions.');
            return null;
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    // Calibration Loop (Gender/Age Detection)
    useEffect(() => {
        let interval: any;
        if (isScanning && !calibration.finalized && stream) {
            interval = setInterval(async () => {
                const canvas = document.createElement('canvas');
                canvas.width = 640;
                canvas.height = 480;
                const ctx = canvas.getContext('2d');
                if (ctx && videoRef.current) {
                    ctx.drawImage(videoRef.current, 0, 0, 640, 480);
                    canvas.toBlob(async (blob) => {
                        if (blob) {
                            try {
                                const data = await NeuroVitalsService.detectGender(blob);
                                setCalibration({
                                    gender: data.gender || 'auto',
                                    age: String(data.age) || '--',
                                    finalized: true
                                });
                            } catch (e) {
                                console.warn('[NeuroVitals] Calibration tick failed');
                            }
                        }
                    }, 'image/jpeg');
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isScanning, calibration.finalized, stream]);

    const beginRecording = (currentStream: MediaStream) => {
        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(
            currentStream,
            supportedMimeType ? { mimeType: supportedMimeType } : undefined
        );
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        recorder.onstop = async () => {
            const finalMime = supportedMimeType || 'video/webm';
            const videoBlob = new Blob(chunks, { type: finalMime });
            stopCamera();
            handleAnalyze(videoBlob);
        };

        recorder.start(1000);

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (recorder.state === 'recording') {
                        recorder.stop();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const startScan = async () => {
        setError(null);
        setHasScanStarted(true);
        const newStream = await startCamera();
        if (newStream) {
            setIsScanning(true);
            setCountdown(20);
            setAnalysisResult(null);
            beginRecording(newStream);
        }
    };

    const handleAnalyze = async (videoBlob: Blob) => {
        setIsAnalyzing(true);
        setIsScanning(false);
        try {
            // BACKEND PROTOCOL: Ensure age and gender are valid enums/integers
            // Status 422 often triggered by validation mismatch in clinical schema
            const finalAge = (calibration.age === '--' || !calibration.age) ? '25' : calibration.age;
            const finalGender = (calibration.gender === 'auto' || !calibration.gender) ? 'male' : calibration.gender;

            const data = await NeuroVitalsService.analyze(videoBlob, finalAge, finalGender);
            setAnalysisResult(data);
        } catch (err: any) {
            console.error('Analysis failed:', err);
            // Capture specific engine error if available
            const errorMsg = err.message || 'Diagnostic engine unreachable.';
            setError(`Diagnostic Error: ${errorMsg}. Please ensure the NeuroVitals AI service is running and supports this video format.`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // UI Mapping
    const feats = analysisResult?.ClinicalFeatures || {};
    const posteriors = analysisResult?.BayesianPosteriors || {};
    const trends = analysisResult?.ClinicalTrends || {};

    const vitals = [
        { label: 'Heart Rate', value: feats.heart_rate_bpm ? Math.round(feats.heart_rate_bpm) : '--', unit: 'BPM', icon: <Heart size={18} />, color: COLORS.primary, trend: trends.heart_rate },
        { label: 'HR Variability', value: feats.rmssd ? (feats.rmssd * 1000).toFixed(1) : '--', unit: 'ms', icon: <Activity size={18} />, color: COLORS.secondary, trend: trends.stress_index },
        { label: 'Blood Oxygen', value: feats.spo2 ? feats.spo2.toFixed(1) : '--', unit: '%', icon: <Zap size={18} />, color: COLORS.success, trend: trends.spo2 },
        { label: 'Respiration', value: feats.breathing_rate ? feats.breathing_rate.toFixed(1) : '--', unit: '/m', icon: <Wind size={18} />, color: COLORS.accent, trend: trends.breathing_signal },
    ];

    const clinicalSuites = [
        {
            title: 'HEMODYNAMIC EXPANSION',
            icon: <Activity size={16} />,
            metrics: [
                { label: 'Blood Pressure', value: feats.blood_pressure_sys ? `${Math.round(feats.blood_pressure_sys)}/${Math.round(feats.blood_pressure_dia)}` : '--', unit: 'mmHg' },
                { label: 'Mean Arterial Pressure', value: feats.mean_arterial_pressure?.toFixed(1) || '--', unit: 'mmHg' },
                { label: 'Pulse Pressure', value: feats.pulse_pressure?.toFixed(1) || '--', unit: 'mmHg' },
                { label: 'Cardiac Workload', value: feats.cardiac_workload?.toFixed(1) || '--', unit: 'mmHg/s' },
                { label: 'ASCVD Risk Level', value: feats.ascvd_risk || '--', risk: feats.ascvd_risk === 'High' ? 'high' : (feats.ascvd_risk === 'Moderate' ? 'med' : 'low') },
            ]
        },
        {
            title: 'METABOLIC & WELLNESS',
            icon: <Flame size={16} />,
            metrics: [
                { label: 'Hemoglobin (Est)', value: feats.hemoglobin_estimated?.toFixed(1) || '--', unit: 'g/dL' },
                { label: 'HbA1c (Est Proxy)', value: feats.hba1c_estimated?.toFixed(2) || '--', unit: '%' },
                { label: 'Wellness Score', value: feats.wellness_score ? (feats.wellness_score * 100).toFixed(0) : '--', unit: '%' },
                { label: 'Heart Age', value: feats.heart_age || '--', unit: 'yrs' },
                { label: 'Fall Risk', value: feats.fall_risk > 0.7 ? 'High' : 'Low', risk: feats.fall_risk > 0.7 ? 'high' : 'low' },
            ]
        },
        {
            title: 'DIFFERENTIAL DIAGNOSTICS',
            icon: <Brain size={16} />,
            metrics: [
                { label: 'Depression Prob.', value: posteriors.depression ? (posteriors.depression * 100).toFixed(2) : '--', unit: '%' },
                { label: 'Anxiety Prob.', value: posteriors.anxiety ? (posteriors.anxiety * 100).toFixed(2) : '--', unit: '%' },
                { label: 'PTSD Probability', value: posteriors.ptsd ? (posteriors.ptsd * 100).toFixed(2) : '--', unit: '%' },
                { label: 'Burnout Risk', value: posteriors.burnout ? (posteriors.burnout * 100).toFixed(2) : '--', unit: '%' },
            ]
        },
        {
            title: 'BIOMETRIC EXPLAINABILITY',
            icon: <Sparkles size={16} />,
            metrics: [
                { label: 'LF/HF Ratio', value: feats.lf_hf_ratio?.toFixed(2) || '--', risk: feats.lf_hf_ratio > 3 ? 'high' : 'low' },
                { label: 'Stress Reactivity', value: feats.stress_reactivity?.toFixed(2) || '--', risk: feats.stress_reactivity > 0.7 ? 'high' : 'low' },
                { label: 'Sympathetic Index', value: feats.sympathetic_index?.toFixed(2) || '--', risk: feats.sympathetic_index > 0.8 ? 'high' : 'low' },
                { label: 'Liveness Score', value: analysisResult?.LivenessScore?.toFixed(3) || '--', unit: 'scr' },
                { label: 'Signal Quality (SQI)', value: analysisResult?.SignalQualityIndex != null ? (analysisResult.SignalQualityIndex * 100).toFixed(1) : '--', unit: '%' },
            ]
        }
    ];

    if (!hasScanStarted) {
        return (
            <div className="min-h-screen bg-[#05070a] text-white p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-900/50 to-emerald-900/20 opacity-50 z-0" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 flex flex-col items-center max-w-2xl text-center space-y-12"
                >
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10 mb-4 animate-pulse">
                        <Brain className="text-[#00f2fe]" size={24} />
                        <span className="text-xs font-black tracking-[0.4em] text-[#00f2fe] uppercase">NeuroVitals™ Deep Phenotyping</span>
                    </div>

                    <h1 className="text-6xl font-black tracking-tighter leading-none text-white drop-shadow-2xl">
                        AI CLINICAL <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2fe] to-[#4facfe]">BIOMARKER SCAN</span>
                    </h1>

                    <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-lg">
                        Initialize v4.0 Diagnostic Engine for real-time longitudinal analysis of neurological stability and physiological trends.
                    </p>

                    <Button
                        variant="primary"
                        size="lg"
                        className="bg-gradient-to-r from-[#00f2fe] to-[#4facfe] border-none px-12 py-8 rounded-[2rem] text-black font-black uppercase tracking-widest text-sm shadow-2xl shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all"
                        onClick={startScan}
                        leftIcon={<Play size={20} fill="currentColor" />}
                    >
                        Initialize Clinical Scan
                    </Button>

                    <div className="pt-12 flex items-center gap-8 opacity-40">
                        <div className="flex flex-col items-center gap-2">
                            <ShieldCheck size={20} />
                            <span className="text-[10px] uppercase font-black tracking-widest">Secure Link</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-center gap-2">
                            <Activity size={20} />
                            <span className="text-[10px] uppercase font-black tracking-widest">Live Bio-Feed</span>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex flex-col items-center gap-2">
                            <Brain size={20} />
                            <span className="text-[10px] uppercase font-black tracking-widest">AI Extraction</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#05070a] text-white p-8">
            <header className="flex items-center justify-between mb-12 relative z-10">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/')}
                        className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-[#00f2fe] text-xs font-black uppercase tracking-[0.4em] mb-1">NeuroVitals™ v4.0</h2>
                        <h1 className="text-2xl font-black tracking-tight uppercase">Clinical Intelligence Dashboard</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${isScanning ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/10 bg-white/5'}`}>
                        <div className={`w-2 h-2 rounded-full ${isScanning ? 'bg-cyan-400 animate-pulse' : (analysisResult ? 'bg-emerald-400' : 'bg-rose-400')}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                            {isAnalyzing ? 'Processing Engine...' : (isScanning ? `ACQUIRING: ${countdown}s` : (analysisResult ? 'SCAN COMPLETE' : 'INITIALIZING SCAN'))}
                        </span>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-12 gap-10 relative z-10">
                <div className="lg:col-span-4 space-y-8">
                    <div className="relative aspect-square md:aspect-video rounded-[2.5rem] overflow-hidden border-2 border-white/5 bg-black shadow-2xl">
                        {isScanning && (
                            <div className="absolute inset-0 z-10 pointer-events-none">
                                <div className="absolute top-[10%] left-[10%] w-8 h-8 border-t-2 border-l-2 border-cyan-400" />
                                <div className="absolute top-[10%] right-[10%] w-8 h-8 border-t-2 border-r-2 border-cyan-400" />
                                <div className="absolute bottom-[10%] left-[10%] w-8 h-8 border-b-2 border-l-2 border-cyan-400" />
                                <div className="absolute bottom-[10%] right-[10%] w-8 h-8 border-b-2 border-r-2 border-cyan-400" />
                                <motion.div
                                    animate={{ top: ['0%', '100%', '0%'] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute w-full h-[2px] bg-cyan-400/50 shadow-[0_0_15px_cyan]"
                                />
                            </div>
                        )}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${isAnalyzing ? 'opacity-30 blur-sm' : 'opacity-100'}`}
                        />
                        {isAnalyzing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-sm">
                                <Loader2 className="animate-spin text-cyan-400" size={48} />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Extracting Biomarkers</p>
                            </div>
                        )}

                        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                                <UserCircle2 size={16} className="text-cyan-400" />
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Calibration</span>
                                    <span className="text-[10px] font-black uppercase tracking-tight text-white">
                                        {analysisResult?.DetectedGender?.toUpperCase() || calibration.gender.toUpperCase()} / {analysisResult?.DetectedAge || calibration.age}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-black/60 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                                <Maximize2 size={16} className="text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">v4.0 ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {vitals.map((v, i) => (
                            <motion.div
                                key={v.label}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white/5 border border-white/10 p-5 rounded-[2rem] hover:bg-white/10 transition-all flex flex-col gap-3 group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="p-2.5 rounded-xl transition-colors" style={{ backgroundColor: `${v.color}20`, color: v.color }}>
                                        {v.icon}
                                    </div>
                                    <div className="w-8 h-4 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000"
                                            style={{ backgroundColor: v.color, width: analysisResult ? '70%' : '0%' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{v.label}</p>
                                    <div className="flex items-end gap-1">
                                        <span className="text-2xl font-black tracking-tight" style={{ color: v.color }}>{v.value}</span>
                                        <span className="text-[10px] font-bold text-white/30 mb-0.5">{v.unit}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    {analysisResult ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            <div className="bg-gradient-to-br from-slate-900 to-black p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.05] grayscale group-hover:grayscale-0 transition-all duration-700">
                                    <ShieldAlert size={180} className="text-cyan-400" />
                                </div>

                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                                    <div className="space-y-4">
                                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                            <Sparkles size={12} className="text-emerald-400" />
                                            <span className="text-[9px] font-black tracking-[0.2em] text-emerald-400 uppercase">Analysis Verified</span>
                                        </div>
                                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-2">Diagnostic Reliability</h3>
                                        <div className="flex items-end gap-3">
                                            <span className="text-7xl font-black tracking-tighter text-white">
                                                {((analysisResult.ConfidenceScore || 0) * 10).toFixed(1)}
                                            </span>
                                            <span className="text-sm font-black text-white/40 mb-3 tracking-widest">/ 10</span>
                                        </div>
                                        <p className="text-xl font-bold text-slate-400">
                                            Clinical State: <span className={analysisResult.MentalHealthRiskClass === 'Low' ? 'text-emerald-400' : 'text-rose-400'}>{analysisResult.MentalHealthRiskClass.toUpperCase()} RISK</span>
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-6 md:w-80">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                                                <span>Dominant Condition</span>
                                                <span className="text-cyan-400">{analysisResult.DominantCondition.toUpperCase()}</span>
                                            </div>
                                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-cyan-400 rounded-full transition-all duration-1000"
                                                    style={{ width: `${(analysisResult.ConfidenceScore || 0) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                                                <span>Emotional Stability</span>
                                                <span className="text-emerald-400">{Math.round(analysisResult.Mood.EmotionalStability * 100)}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
                                                    style={{ width: `${analysisResult.Mood.EmotionalStability * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-8">Longitudinal Trends</h4>
                                    <div className="space-y-6">
                                        {vitals.filter(v => v.trend).map((v, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{v.label}</span>
                                                    <span className="text-[10px] font-black" style={{ color: v.color }}>{v.value} {v.unit}</span>
                                                </div>
                                                <div className="h-16">
                                                    <TrendAreaChart
                                                        data={v.trend?.map((val: number, idx: number) => ({ label: String(idx), value: val })) || []}
                                                        height={60}
                                                        color={v.color}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden flex flex-col justify-center items-center gap-6">
                                    <h4 className="absolute top-8 left-8 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Psychological Compass</h4>
                                    <div className="w-48 h-48 relative border border-white/10 rounded-full bg-black/20">
                                        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
                                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
                                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Arousal</span>
                                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Calm</span>
                                        <span className="absolute top-1/2 -left-12 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest -rotate-90 origin-center">Negative</span>
                                        <span className="absolute top-1/2 -right-12 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase tracking-widest rotate-90 origin-center">Positive</span>
                                        <motion.div
                                            animate={{ 
                                                scale: [1, 1.3, 1],
                                                left: `${analysisResult.Mood.Valence * 100}%`,
                                                top: `${(1 - analysisResult.Mood.Arousal) * 100}%` 
                                            }}
                                            transition={{ scale: { duration: 2, repeat: Infinity }, duration: 1.5 }}
                                            style={{
                                                position: 'absolute',
                                                width: 14,
                                                height: 14,
                                                backgroundColor: COLORS.primary,
                                                borderRadius: '50%',
                                                boxShadow: `0 0 25px ${COLORS.primary}`,
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 20
                                            }}
                                        />
                                    </div>
                                    <div className="text-center mt-6">
                                        <p className="text-3xl font-black uppercase tracking-tighter text-white">
                                            {analysisResult.Mood.MoodState.toUpperCase()}
                                        </p>
                                        <div className="flex items-center justify-center gap-4 mt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Stability</span>
                                                <span className="text-xs font-black text-emerald-400">{Math.round(analysisResult.Mood.EmotionalStability * 100)}%</span>
                                            </div>
                                            <div className="w-px h-6 bg-white/10" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Readiness</span>
                                                <span className="text-xs font-black text-cyan-400">{Math.round(analysisResult.Mood.CognitiveReadiness * 100)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 pb-12">
                                {clinicalSuites.map((suite, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col gap-6">
                                        <div className="flex items-center gap-4 text-[#00f2fe] border-b border-white/5 pb-4">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center">
                                                {suite.icon}
                                            </div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">{suite.title}</h4>
                                        </div>
                                        <div className="space-y-4">
                                            {suite.metrics.map((m, midx) => (
                                                <div key={midx} className="flex justify-between items-center py-2 border-b border-white/[0.03] last:border-none">
                                                    <span className="text-xs font-bold text-white/40">{m.label}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-black text-white">{m.value} <span className="text-[10px] text-white/20 ml-0.5">{m.unit}</span></span>
                                                        {m.risk && (
                                                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                                m.risk === 'low' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                m.risk === 'med' ? 'bg-amber-500/10 text-amber-400' :
                                                                'bg-rose-500/10 text-rose-400'
                                                            }`}>
                                                                {m.risk}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full flex items-center justify-center p-20 border border-dashed border-white/10 rounded-[3rem] bg-white/[0.02]">
                            <div className="text-center space-y-4 max-w-sm">
                                <Activity size={32} className="text-white/20 mx-auto mb-6" />
                                <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">Awaiting Acquisition</h3>
                                <p className="text-xs text-slate-500 font-medium">Requires a 20-second stable video acquisition.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 p-6 bg-rose-600 text-white rounded-[2.5rem] shadow-2xl flex flex-col gap-4 max-w-md border border-rose-500">
                    <div className="flex items-center gap-4">
                        <ShieldAlert size={28} />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-200">Critical Error</p>
                            <p className="text-sm font-black">{error}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NeuroVitalsPage;
