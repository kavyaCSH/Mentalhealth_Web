import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ChevronLeft,
    ClipboardList,
    Clock,
    Play,
    Search,
    User,
    AlertCircle,
    Activity
} from 'lucide-react';
import { AssessmentService } from '../../api/services/assessment.service';
import Button from '../../components/ui/Button';
import type { AssessmentMaster } from '../../types/assessment.types';

interface UIMaster extends AssessmentMaster {
    title: string;
}

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
                master_type_slug: 'mental_health'
            });

            // AssessmentService.getMastersList natively returns an array
            const categoriesArray = Array.isArray(response) ? response : [];

            const mapped: UIMaster[] = categoriesArray.map((item: AssessmentMaster) => ({
                id: item.slug || item.id || item._id || '',
                title: item.name || item.text || item.title || 'Unknown Assessment',
                slug: item.slug || '',
                duration: item.duration || '5-10 mins',
                description: item.description || 'Clinical evaluation tool for mental health markers.',
            }));
            setAssessments(mapped);
        } catch (error) {
            console.error('Error fetching assessments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredAssessments = assessments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleStartAssessment = (slug: string) => {
        const url = `/assessments/${slug}${targetPatientId ? `?patientId=${targetPatientId}` : ''}`;
        navigate(url);
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
                        <p className="text-slate-500 font-medium">Select a standardized clinical tool to evaluate patient mental health markers.</p>
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

            <div className="relative max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search clinical tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredAssessments.length > 0 ? (
                    filteredAssessments.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="card-premium group p-6 flex flex-col justify-between"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform duration-500">
                                        <ClipboardList size={24} />
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <Clock size={12} /> {item.duration}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-50">
                                <Button
                                    variant="primary"
                                    className="w-full h-12 rounded-xl text-xs uppercase tracking-widest font-black gap-2"
                                    onClick={() => handleStartAssessment(item.slug || '')}
                                    leftIcon={<Play size={14} fill="currentColor" />}
                                >
                                    {targetPatientId ? 'Start Evaluation' : 'Explore Tool'}
                                </Button>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center card-premium bg-slate-50/50 border-dashed border-2">
                        <AlertCircle size={48} className="mx-auto mb-4 text-slate-200" />
                        <p className="font-black text-slate-900 mb-1 uppercase tracking-widest text-sm">No Assessment Tools Found</p>
                        <p className="text-slate-400 font-medium text-sm">Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClinicalAssessmentCenter;
