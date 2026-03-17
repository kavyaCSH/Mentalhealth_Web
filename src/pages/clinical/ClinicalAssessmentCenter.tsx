import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    Clock,
    Search,
    User,
    AlertCircle,
    Activity,
    Brain,
    Heart,
    Moon,
    Coffee,
    Zap,
    Flame,
    Eye,
    Pill,
    Baby,
    PersonStanding,
    Sparkles,
    HeartCrack,
    Crosshair,
    Dice1,
    Shield,
    ChevronRight
} from 'lucide-react';
import { AssessmentService } from '../../api/services/assessment.service';
import Button from '../../components/ui/Button';
import type { AssessmentMaster } from '../../types/assessment.types';

interface UIMaster extends AssessmentMaster {
    title: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
}

// ─── Slug → icon + color mapping (Sync'd with Patient Side) ──────────────────
const slugStyleMap: Record<string, { icon: string; color: string; description: string }> = {
    depression: { icon: 'Heart', color: 'emerald', description: 'Assess depressive symptoms, mood patterns, and emotional well-being.' },
    anxiety: { icon: 'Activity', color: 'indigo', description: 'Evaluate anxiety levels, worry patterns, and their impact on daily life.' },
    sleep: { icon: 'Moon', color: 'pink', description: 'Analyze sleep quality, disturbance patterns, and restfulness.' },
    mania: { icon: 'Zap', color: 'orange', description: 'Screen for manic episodes, elevated mood, and high-energy patterns.' },
    bipolar: { icon: 'Zap', color: 'orange', description: 'Screen for bipolar mood fluctuations between depressive and manic episodes.' },
    anger: { icon: 'Flame', color: 'red', description: 'Evaluate anger triggers, emotional distress, and coping mechanisms.' },
    anger_pediatric: { icon: 'Flame', color: 'red', description: 'Assess anger and emotional regulation in children and adolescents.' },
    substance_use: { icon: 'Pill', color: 'slate', description: 'Screen for substance use behaviors and addiction risk factors.' },
    postpartum: { icon: 'Baby', color: 'pink', description: 'Evaluate postpartum depression symptoms in new mothers.' },
    somatic: { icon: 'PersonStanding', color: 'teal', description: 'Assess physical symptoms linked to psychological distress.' },
    anxiety_pediatric: { icon: 'Activity', color: 'indigo', description: 'Evaluate anxiety levels and worry patterns in children.' },
    repetitive_thoughts: { icon: 'Brain', color: 'purple', description: 'Assess repetitive thoughts, compulsions, and obsessive behavioral patterns.' },
    repetitive_thoughts_pediatric: { icon: 'Brain', color: 'purple', description: 'Screen for repetitive thoughts and behaviors in children.' },
    separation_anxiety: { icon: 'HeartCrack', color: 'pink', description: 'Evaluate separation anxiety symptoms and attachment concerns.' },
    odd: { icon: 'Shield', color: 'orange', description: 'Screen for oppositional defiant disorder patterns in children.' },
    social_anxiety: { icon: 'Eye', color: 'indigo', description: 'Assess social anxiety, avoidance behaviors, and performance fears.' },
    agoraphobia: { icon: 'Shield', color: 'slate', description: 'Evaluate fears related to open or crowded spaces and avoidance.' },
    panic_disorder: { icon: 'Zap', color: 'red', description: 'Screen for recurrent panic attacks and related avoidance.' },
    adhd: { icon: 'Sparkles', color: 'orange', description: 'Assess attention deficit, hyperactivity, and impulsivity.' },
    ocd: { icon: 'Crosshair', color: 'purple', description: 'Evaluate obsessive-compulsive thoughts and ritual behaviors.' },
    psychosis: { icon: 'Eye', color: 'slate', description: 'Screen for psychotic symptoms including hallucinations and delusions.' },
    gambling: { icon: 'Dice1', color: 'orange', description: 'Assess gambling frequency, urges, and addiction risk factors.' },
    eating_disorder: { icon: 'Coffee', color: 'emerald', description: 'Screen for disordered eating patterns and body image concerns.' },
    pmdd: { icon: 'HeartCrack', color: 'pink', description: 'Evaluate premenstrual dysphoric disorder symptoms.' },
    autism_spectrum: { icon: 'Sparkles', color: 'indigo', description: 'Screen for autism spectrum characteristics and social communication.' },
    ptsd_pediatric: { icon: 'Shield', color: 'red', description: 'Screen for trauma and PTSD symptoms in children and adolescents.' },
    acute_stress: { icon: 'Flame', color: 'orange', description: 'Assess acute stress reactions following a traumatic event.' },
    dissociative_symptoms: { icon: 'Eye', color: 'purple', description: 'Evaluate dissociative experiences and detachment symptoms.' },
    personality_inventory: { icon: 'Brain', color: 'indigo', description: 'Comprehensive personality traits and behavioral pattern assessment.' },
    irritability: { icon: 'Flame', color: 'orange', description: 'Assess levels of irritability, frustration, and emotional reactivity.' },
};

const defaultStyle = { icon: 'Brain', color: 'indigo', description: 'Select a standardized clinical tool to evaluate patient mental health markers.' };

const ClinicalAssessmentCenter = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const targetPatientId = searchParams.get('patientId');
    const targetPatientName = searchParams.get('patientName');

    const [assessments, setAssessments] = useState<UIMaster[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            setIsLoading(true);
            const response = await AssessmentService.getMastersList({
                is_active: 1,
                master_type_slug: 'mental_health',
                limit: 100,
                page: 1,
            });

            const categoriesArray = Array.isArray(response) ? response : [];

            const mapped: UIMaster[] = categoriesArray.map((item: AssessmentMaster) => {
                const style = (item.slug ? slugStyleMap[item.slug] : null) || defaultStyle;
                return {
                    id: item.slug || item.id || item._id || '',
                    title: item.name || item.text || item.title || 'Unknown Assessment',
                    slug: item.slug || '',
                    duration: item.duration || '5-10 mins',
                    description: item.description || style.description,
                    icon: style.icon,
                    color: style.color,
                };
            });
            setAssessments(mapped);
        } catch (error) {
            console.error('Error fetching assessments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getIcon = (iconName: string, color: string) => {
        const cls = `text-${color}-600`;
        const props = { size: 28, className: cls };
        switch (iconName) {
            case 'Brain': return <Brain {...props} />;
            case 'Heart': return <Heart {...props} />;
            case 'Activity': return <Activity {...props} />;
            case 'Moon': return <Moon {...props} />;
            case 'Coffee': return <Coffee {...props} />;
            case 'Zap': return <Zap {...props} />;
            case 'Shield': return <Shield {...props} />;
            case 'Flame': return <Flame {...props} />;
            case 'Eye': return <Eye {...props} />;
            case 'Pill': return <Pill {...props} />;
            case 'Baby': return <Baby {...props} />;
            case 'Dice1': return <Dice1 {...props} />;
            case 'PersonStanding': return <PersonStanding {...props} />;
            case 'Crosshair': return <Crosshair {...props} />;
            case 'Sparkles': return <Sparkles {...props} />;
            case 'HeartCrack': return <HeartCrack {...props} />;
            default: return <Brain {...props} />;
        }
    };

    const getColorClasses = (color: string) => {
        const map: Record<string, string> = {
            indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
            emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
            pink: 'bg-pink-50 border-pink-100 text-pink-600',
            orange: 'bg-orange-50 border-orange-100 text-orange-600',
            red: 'bg-red-50 border-red-100 text-red-600',
            purple: 'bg-purple-50 border-purple-100 text-purple-600',
            teal: 'bg-teal-50 border-teal-100 text-teal-600',
            slate: 'bg-slate-100 border-slate-200 text-slate-600',
        };
        return map[color] || map.indigo;
    };

    const filteredAssessments = assessments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStartAssessment = (slug: string) => {
        const url = `/assessments/${slug}${targetPatientId ? `?patientId=${targetPatientId}` : ''}`;
        navigate(url);
    };

    const handleViewHistory = (slug: string) => {
        if (targetPatientId) {
            navigate(`/patients/${targetPatientId}/history?category=${slug}`);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Activity className="animate-spin text-indigo-600 mb-4" size={40} />
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Loading Clinical Masters...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl  space-y-10 animate-fade-in pb-20">
            <header className="space-y-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                    <ChevronLeft size={14} /> Back
                </button>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Assessment Center</h1>
                        <p className="text-slate-500 font-medium lowercase">SELECT A STANDARDIZED CLINICAL TOOL TO EVALUATE PATIENT MENTAL HEALTH MARKERS.</p>
                    </div>
                    {targetPatientId && (
                        <div className="flex items-center gap-3 px-5 py-3 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-50/50">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Assigning To</p>
                                <p className="text-sm font-bold text-indigo-900">{targetPatientName || `Patient #${targetPatientId}`}</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search clinical tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    />
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {filteredAssessments.length} TOOL{filteredAssessments.length !== 1 ? 'S' : ''} READY
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAssessments.length > 0 ? (
                    filteredAssessments.map((item, i) => {
                        const colorClass = getColorClasses(item.color);
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="card-premium group p-8 flex flex-col justify-between"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClass.split(' ')[0]} ${colorClass.split(' ')[2]} group-hover:scale-110 transition-transform duration-500`}>
                                            {getIcon(item.icon, item.color)}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Clock size={12} /> {item.duration}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{item.title}</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-8 mt-8 border-t border-slate-50">
                                    {targetPatientId && (
                                        <Button
                                            variant="outline"
                                            className="flex-1 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 py-3 text-[11px] font-black uppercase tracking-widest"
                                            onClick={() => handleViewHistory(item.slug || '')}
                                            leftIcon={<Clock size={16} />}
                                        >
                                            History
                                        </Button>
                                    )}
                                    <Button
                                        variant="primary"
                                        className={`${targetPatientId ? 'flex-[1.5]' : 'w-full'} rounded-2xl py-3 text-[11px] font-black uppercase tracking-widest`}
                                        onClick={() => handleStartAssessment(item.slug || '')}
                                        rightIcon={<ChevronRight size={18} />}
                                    >
                                        {targetPatientId ? 'Start' : 'Explore'}
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-24 text-center card-premium bg-slate-50/50 border-dashed border-2">
                        <AlertCircle size={48} className="mx-auto mb-4 text-slate-200" />
                        <p className="font-black text-slate-900 mb-1 uppercase tracking-widest text-sm">No Assessment Tools Found</p>
                        <p className="text-slate-400 font-medium text-sm">Try adjusting your search query.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicalAssessmentCenter;
