import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { 
    ChevronLeft, 
    History as HistoryIcon, 
    AlertCircle, 
    Plus, 
    Clock,
    Trash2,
    Edit3
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { HPIService } from '../../../api/services/hpi.service';
import { UserService } from '../../../api/services/user.service';
import type { HPIResponse } from '../../../api/services/hpi.service';

const HPIHistory = () => {
    const { patientId: userId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = currentUser?.role === 'patient' || (currentUser as any)?.role === 'PATIENT';
    
    // State
    const [history, setHistory] = useState<HPIResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async (id: string | number) => {
        if (!window.confirm('Are you sure you want to delete this clinical record? This action cannot be undone.')) {
            return;
        }

        try {
            await HPIService.deleteHPI(id);
            setHistory(prev => prev.filter(item => (item.id || item._id || item.hpiId) !== id));
        } catch (err) {
            console.error('Failed to delete HPI:', err);
            alert('Failed to delete the record. Please try again.');
        }
    };

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

            // 1. Resolve hex ID from user profile
            let hexId = userId;
            
            // Optimization: Bypass unauthorized lookup if patient is viewing self
            if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                hexId = currentUser?._id || currentUser?.id || hexId;
                console.log(`[HPIHistory] Using session identity: ${hexId}`);
            } else {
                try {
                    const userProfile = await UserService.getUserById(userId);
                    if (userProfile) {
                        hexId = userProfile._id || userProfile.id || hexId;
                        console.log(`[HPIHistory] Resolved Hex ID: ${hexId}`);
                    }
                } catch (profileError) {
                    console.warn('[HPIHistory] Profile fetch failed, using parameter ID:', profileError);
                }
            }

            // 2. Fetch using hex ID
            const response = await HPIService.getHPIList({ patient_id: hexId });
            const records = response?.data || response || [];
            const historyArray = Array.isArray(records) ? records : [records];
            
            setHistory(historyArray);
        } catch (err: any) {
            console.error('[HPIHistory] Fetch failed:', err);

            // Graceful 403 handling for patients
            if (isPatient && err.response?.status === 403) {
                console.log('[HPIHistory] Patient role hit authorization limit, showing empty state.');
                setHistory([]);
                return;
            }

            setError('Could not load HPI history. Please check API connectivity.');
        } finally {
            setIsLoading(false);
        }
    };

    const navigateBack = () => {
        if (currentUser?.role === 'patient' || (currentUser as any)?.group === 'PATIENT') {
            navigate('/records');
        } else {
            navigate(`/patients/${userId}/health`);
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
                    onClick={navigateBack}
                    className="p-3 bg-card hover:bg-page border border-border-card rounded-2xl text-muted transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-main tracking-tight">
                        HPI history
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Patient Identity:</span>
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
                            className="card-premium p-8 bg-card border-border-card hover:border-indigo-200 cursor-pointer transition-all group flex flex-col gap-4 relative"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/patients/${userId}/hpi/edit/${item.hpiId || item.id || item._id}`);
                                        }}
                                        className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl shadow-sm transition-all"
                                        title="Edit Record"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete((item.hpiId || item.id || item._id)!);
                                        }}
                                        className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl shadow-sm transition-all"
                                        title="Delete Record"
                                    >
                                        <Trash2 size={16} />
                                    </button>
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
                                <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest ml-2">
                                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    }) : 'Recently'}
                                </span>
                            </div>
                            <p className="text-main font-bold leading-relaxed line-clamp-6 flex-1 italic">
                                "{item.narrative || (item as any).content || 'No clinical narrative available.'}"
                            </p>
                            <div className="pt-4 border-t border-border-card flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">View AI Analysis</span>
                                <ChevronLeft size={14} className="rotate-180 text-muted opacity-40 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full card-premium p-20 text-center border-dashed border-border-card bg-card/50">
                        <HistoryIcon size={48} className="mx-auto text-muted opacity-40 mb-6 opacity-50" />
                        <h3 className="text-xl font-black text-main mb-2">No Records Found</h3>
                        <p className="text-sm font-bold text-muted opacity-80 max-w-xs mx-auto italic mb-8">
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
