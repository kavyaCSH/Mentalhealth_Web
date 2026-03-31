import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import {
    ChevronLeft,
    AlertCircle,
    Activity,
    Brain,
    ClipboardList,
    Sparkles,
    Zap,
    FileText,
    Stethoscope,
    Edit3
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ROSService } from '../../../api/services/ros.service';
import type { ROSResponse } from '../../../types/ros.types';

const THEMES: Record<string, any> = {
    indigo: {
        active: 'bg-indigo-600 border-indigo-600 text-white',
        done: 'bg-indigo-50 border-indigo-100 text-indigo-700',
        iconActive: 'text-white',
        iconDone: 'text-indigo-600',
        dot: 'bg-indigo-500',
        bgSoft: 'bg-indigo-50',
        textSoft: 'text-indigo-600',
        borderSoft: 'border-indigo-100',
        borderFocus: 'focus:border-indigo-500',
        hoverBorder: 'hover:border-indigo-200',
        shadow: 'ring-indigo-400/20'
    },
    rose: {
        active: 'bg-rose-600 border-rose-600 text-white',
        done: 'bg-rose-50 border-rose-100 text-rose-700',
        iconActive: 'text-white',
        iconDone: 'text-rose-600',
        dot: 'bg-rose-500',
        bgSoft: 'bg-rose-50',
        textSoft: 'text-rose-600',
        borderSoft: 'border-rose-100',
        borderFocus: 'focus:border-rose-500',
        hoverBorder: 'hover:border-rose-200',
        shadow: 'ring-rose-400/20'
    }
};

const getTheme = (section: string) => {
    switch (section?.toLowerCase()) {
        case 'psychiatric': return THEMES.indigo;
        case 'medical': return THEMES.rose;
        default: return THEMES.indigo;
    }
};

const getSectionIcon = (section: string) => {
    switch (section?.toLowerCase()) {
        case 'psychiatric': return <Brain size={18} />;
        case 'medical': return <Activity size={18} />;
        default: return <Stethoscope size={18} />;
    }
};

const ROSDetail = () => {
    const { patientId: userId, rosId } = useParams<{ patientId: string; rosId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = (currentUser as any)?.role === 'patient' ||
        (currentUser as any)?.role === 'PATIENT' ||
        (currentUser as any)?.group === 'PATIENT' ||
        (currentUser as any)?.group === 'patient';

    const [result, setResult] = useState<ROSResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (rosId) {
            fetchDetail();
        }
    }, [rosId]);

    const fetchDetail = async () => {
        setIsLoading(true);
        try {
            const response = await ROSService.getROSById(rosId!, userId);
            const data = response.data || response;
            setResult(data as ROSResponse);
        } catch (err: any) {
            console.error('Failed to fetch ROS detail:', err);

            // Suppress 403 for patients
            if (isPatient && (err.response?.status === 403 || err.status === 403)) {
                setError('Review of Systems analysis is restricted to authorized providers.');
            } else {
                setError('Could not load Review of Systems details.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const navigateBack = () => {
        if (currentUser?.role === 'patient' || (currentUser as any)?.group === 'PATIENT') {
            navigate('/records');
        } else {
            navigate(`/patients/${userId}/ros`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Hydrating Clinical Details...</p>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="p-8 max-w-4xl space-y-10 animate-fade-in pb-24">
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold mt-8">
                    <AlertCircle size={18} />
                    {error || 'Clinical record not found.'}
                </div>
                <Button variant="outline" onClick={navigateBack}>
                    Go Back
                </Button>
            </div>
        );
    }

    const sections = ['psychiatric', 'medical', 'neurological', 'cardiovascular', 'respiratory', 'gastrointestinal', 'musculoskeletal', 'endocrine'];

    return (
        <div className="p-8 max-w-6xl animate-fade-in pb-24 space-y-12">
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            onClick={navigateBack}
                            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-slate-500 transition-all hover:shadow-md active:scale-95 mr-2"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-indigo-100">
                            Review Complete
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">
                            ID: {userId?.slice(-8).toUpperCase()} • {result.createdAt ? new Date(result.createdAt).toLocaleDateString() : 'Date Unknown'}
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 mt-4">
                        <Stethoscope className="text-indigo-600" size={32} />
                        Review of Systems Detail
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {!isPatient && (
                        <Button
                            variant="secondary"
                            onClick={() => navigate(`/patients/${userId}/ros/edit/${rosId}`)}
                            className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100 shadow-lg shadow-emerald-50 hover:bg-emerald-600 hover:text-white transition-all mr-4"
                            leftIcon={<Edit3 size={16} />}
                        >
                            Edit Review
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        onClick={navigateBack}
                        className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest bg-slate-900 border-none shadow-xl shadow-slate-200"
                    >
                        Return to List
                    </Button>
                </div>
            </header>

            <div className="grid gap-10">
                <section className="card-premium p-12 bg-white border-slate-100 relative overflow-hidden shadow-2xl shadow-indigo-50/50 ring-1 ring-slate-100">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
                        <Sparkles size={240} />
                    </div>

                    <div className="relative space-y-12">
                        <header className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-50 pb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                    <Activity size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">AI Systemic Correlation</h2>
                                    <p className="text-xl font-black text-slate-900 tracking-tight">Systemic Findings & Organic R/O</p>
                                </div>
                            </div>
                            {result.substance_induced_probability && (
                                <div className="flex gap-2">
                                    <span className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-tight border border-rose-100 italic">
                                        Substance Induced: {result.substance_induced_probability}
                                    </span>
                                </div>
                            )}
                        </header>

                        <div className="grid lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-12 space-y-10">
                                {result.ai_notes && (
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={14} />
                                            Clinical Review Notes
                                        </h3>
                                        <p className="text-xl font-black text-slate-800 leading-relaxed tracking-tight">
                                            "{result.ai_notes}"
                                        </p>
                                    </div>
                                )}

                                {result.extra_notes && (
                                    <div className="space-y-4 pt-8 border-t border-slate-50">
                                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <ClipboardList size={14} />
                                            Provider Clinical Observations
                                        </h3>
                                        <p className="text-sm font-bold text-slate-600 leading-relaxed">
                                            {result.extra_notes}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                            <AlertCircle size={14} />
                                            Organic Red Flags
                                        </h3>
                                        <div className="space-y-2">
                                            {result.organic_red_flags?.map((item, idx) => (
                                                <p key={idx} className="text-xs font-bold text-slate-700 uppercase tracking-tight">• {item}</p>
                                            ))}
                                            {(!result.organic_red_flags || result.organic_red_flags.length === 0) && (
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">No systemic red flags detected.</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={14} />
                                            Medication Risk
                                        </h3>
                                        <div className="space-y-2">
                                            {result.medication_induced_risk?.map((item, idx) => (
                                                <p key={idx} className="text-xs font-bold text-slate-700 uppercase tracking-tight">• {item}</p>
                                            ))}
                                            {(!result.medication_induced_risk || result.medication_induced_risk.length === 0) && (
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Low medication-induced risk.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="grid lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-12 space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Detailed Systemic Findings</h2>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sections.map(sectionName => {
                                const sectionData = (result as any)[sectionName];
                                if (!sectionData) return null;

                                const findings = Object.entries(sectionData)
                                    .filter(([_, value]) => {
                                        if (value === null || value === undefined || value === '') return false;
                                        if (Array.isArray(value) && value.length === 0) return false;
                                        return true;
                                    });

                                if (findings.length === 0) return null;

                                return (
                                    <div key={sectionName} className="card-premium p-8 bg-white border-slate-100 group transition-all">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                                            <div className={`p-2 rounded-lg ${getTheme(sectionName).bgSoft} ${getTheme(sectionName).textSoft}`}>
                                                {getSectionIcon(sectionName)}
                                            </div>
                                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{sectionName}</h3>
                                        </div>
                                        <div className="space-y-1">
                                            {findings.map(([key, value]) => {
                                                const label = key.replace(/_/g, ' ');
                                                let displayValue = '';

                                                if (typeof value === 'boolean') {
                                                    displayValue = value ? 'YES / PRESENT' : 'NO / DENIED';
                                                } else if (Array.isArray(value)) {
                                                    displayValue = value.join(', ');
                                                } else {
                                                    displayValue = String(value);
                                                }

                                                const isPositive = value === true || (typeof value === 'string' && value.length > 0 && value !== 'None' && !key.includes('duration'));

                                                return (
                                                    <div key={key} className="flex justify-between items-start py-3 border-b border-slate-50 last:border-none">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                                                        <span className={`text-xs font-bold uppercase tracking-tight text-right max-w-[60%] ${isPositive ? 'text-indigo-600' : 'text-slate-700'}`}>{displayValue}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ROSDetail;
