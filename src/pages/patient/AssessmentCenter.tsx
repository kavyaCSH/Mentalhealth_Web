import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import type { RootState } from '../../store';
import { useNavigate } from 'react-router-dom';
import {
    Brain,
    Heart,
    Activity,
    Moon,
    Coffee,
    ChevronRight,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    Zap,
    Shield,
    Flame,
    Eye,
    Bug,
    Pill,
    Baby,
    Frown,
    Dice1,
    PersonStanding,
    Crosshair,
    Sparkles,
    HeartCrack
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { AssessmentService } from '../../api/services/assessment.service';
import type { AssessmentMaster } from '../../types/assessment.types';

interface UICard {
    id: string;
    masterId: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
}

// ─── Slug → icon + color mapping ─────────────────────────────────────────────
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

const defaultStyle = { icon: 'Brain', color: 'indigo', description: 'Complete this clinical assessment questionnaire.' };

const AssessmentCenter = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<UICard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [fetchError, setFetchError] = useState<string | null>(null);

    const { user } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        const fetchMasters = async () => {
            setFetchError(null);
            try {
                const response = await AssessmentService.getMasters(user?.id, {
                    page: 1, limit: 100, is_active: 1, master_type_slug: 'mental_health'
                });
                const data = response?.data?.data || response?.data || response;
                const masters = data?.masters || (Array.isArray(data) ? data : []);

                const cards: UICard[] = (masters as AssessmentMaster[]).map((m: AssessmentMaster) => {
                    const style = (m.slug ? slugStyleMap[m.slug] : null) || defaultStyle;
                    return {
                        id: m.slug || m.id || Math.random().toString(),
                        masterId: m.id || '',
                        name: m.name || m.title || 'Untitled Assessment',
                        slug: m.slug || '',
                        description: style.description,
                        icon: style.icon,
                        color: style.color,
                    };
                });

                setCategories(cards);
            } catch (err: unknown) {
                console.error('Failed to load assessments:', err);
                setCategories([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMasters();
    }, [user?.id]);

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
            case 'Bug': return <Bug {...props} />;
            case 'Pill': return <Pill {...props} />;
            case 'Baby': return <Baby {...props} />;
            case 'Frown': return <Frown {...props} />;
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
            indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:border-indigo-300',
            emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:border-emerald-300',
            pink: 'bg-pink-50 border-pink-100 text-pink-600 hover:border-pink-300',
            orange: 'bg-orange-50 border-orange-100 text-orange-600 hover:border-orange-300',
            red: 'bg-red-50 border-red-100 text-red-600 hover:border-red-300',
            purple: 'bg-purple-50 border-purple-100 text-purple-600 hover:border-purple-300',
            teal: 'bg-teal-50 border-teal-100 text-teal-600 hover:border-teal-300',
            slate: 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-400',
        };
        return map[color] || map.indigo;
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl  space-y-10 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Assessment Center</h1>
                    <p className="text-slate-500 font-medium mt-2">Discover insights about your mental health through clinically validated questionnaires.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/history')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                    >
                        <Clock size={14} /> History 
                    </button>
                </div>
            </header>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-card p-4">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search assessments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {filteredCategories.length} Assessment{filteredCategories.length !== 1 ? 's' : ''} Available
                </div>
            </div>

            {/* Assessment Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Activity className="animate-spin text-indigo-600" size={40} />
                </div>
            ) : filteredCategories.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCategories.map((category, index) => {
                        const colorClasses = getColorClasses(category.color || 'indigo');
                        return (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                className="card-premium p-8 group flex flex-col h-full"
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[2]}`}>
                                        {getIcon(category.icon || 'Brain', category.color || 'indigo')}
                                    </div>
                                    {index === 0 && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                            <CheckCircle2 size={12} /> Recommended
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-2">{category.name}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed flex-1 mb-8">
                                    {category.description}
                                </p>

                                <div className="flex gap-3 mt-auto">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 py-3"
                                        onClick={() => navigate(`/history?category=${category.slug}`)}
                                        leftIcon={<Clock size={16} />}
                                    >
                                        History
                                    </Button>
                                    <Button
                                        variant="primary"
                                        className="flex-[1.5] rounded-2xl py-3"
                                        onClick={() => navigate(`/assessments/${category.slug}`)}
                                        rightIcon={<ChevronRight size={18} />}
                                    >
                                        Start
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        {fetchError ? <AlertCircle size={32} className="text-red-400" /> : <Search size={32} className="text-slate-400" />}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">
                        {fetchError ? 'Unable to Load Assessments' : 'No Assessments Found'}
                    </h3>
                    <p className="text-slate-500">
                        {fetchError || 'No assessment questionnaires are available at this time.'}
                    </p>
                    {fetchError && (
                        <Button className="mt-6" onClick={() => window.location.reload()}>Retry</Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default AssessmentCenter;
