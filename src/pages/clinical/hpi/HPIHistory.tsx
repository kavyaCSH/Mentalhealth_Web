import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    ChevronLeft, 
    History as HistoryIcon, 
    AlertCircle, 
    Plus, 
    Clock
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { HPIService } from '../../../api/services/hpi.service';
import type { HPIResponse } from '../../../api/services/hpi.service';

const HPIHistory = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    
    // State
    const [history, setHistory] = useState<HPIResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            fetchData();
        }
    }, [userId]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            const response = await HPIService.getHPIList({ patient_id: userId });
            const records = response?.data || response || [];
            const historyArray = Array.isArray(records) ? records : [records];
            
            setHistory(historyArray);
        } catch (err) {
            console.error('[HPIHistory] Fetch failed:', err);
            setError('Could not load HPI history. Please check API connectivity.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl  space-y-10 animate-fade-in pb-24">
            {/* Header */}
            <header className="flex items-center gap-6">
                <button
                    onClick={() => navigate(`/patients/${userId}/health`)}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        HPI history
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Identity:</span>
                        <span className="text-xs font-bold text-indigo-600">
                            Patient #{userId}
                        </span>
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="rounded-2xl px-8 shadow-lg shadow-indigo-100 font-black uppercase tracking-widest text-xs"
                    onClick={() => navigate(`/patients/${userId}/hpi/new`)}
                    leftIcon={<Plus size={18} />}
                >
                    Add HPI
                </Button>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {history.length > 0 ? (
                    history.map((item, idx) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={item.id || item._id}
                            onClick={() => navigate(`/patients/${userId}/hpi/${item.id || item._id || item.hpiId}`)}
                            className="card-premium p-8 bg-white border-slate-100 hover:border-indigo-200 cursor-pointer transition-all group flex flex-col gap-4 relative"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Clock size={16} />
                                    </div>
                                    {item.severity_index !== undefined && (
                                        <span 
                                            className="text-[10px] font-black px-2 py-0.5 rounded-md text-white"
                                            style={{ backgroundColor: item.color_code || '#6366f1' }}
                                        >
                                            Severity: {item.severity_index}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    }) : 'Recently'}
                                </span>
                            </div>
                            <p className="text-slate-700 font-bold leading-relaxed line-clamp-6 flex-1 italic">
                                "{item.narrative || (item as any).content || 'No clinical narrative available.'}"
                            </p>
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">View AI Analysis</span>
                                <ChevronLeft size={14} className="rotate-180 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full card-premium p-20 text-center border-dashed border-slate-200 bg-slate-50/50">
                        <HistoryIcon size={48} className="mx-auto text-slate-300 mb-6 opacity-50" />
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Records Found</h3>
                        <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto italic mb-8">
                            There are no previous HPI history records for this patient.
                        </p>
                    </div>
                )}
            </div>
            
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold mt-8">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}
        </div>
    );
};

export default HPIHistory;
