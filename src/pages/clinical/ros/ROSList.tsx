import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import {
    ChevronLeft,
    Stethoscope,
    AlertCircle,
    Plus,
    Edit3
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ROSService } from '../../../api/services/ros.service';
import { UserService } from '../../../api/services/user.service';
import type { ROSResponse } from '../../../types/ros.types';
import type { User, Patient } from '../../../types/user.types';

const ROSList = () => {
    const { patientId: userId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = (currentUser as any)?.role === 'patient' ||
        (currentUser as any)?.role === 'PATIENT' ||
        (currentUser as any)?.group === 'PATIENT' ||
        (currentUser as any)?.group === 'patient';

    // State
    const [patient, setPatient] = useState<User | Patient | null>(null);
    const [history, setHistory] = useState<ROSResponse[]>([]);
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
            if (!userId || userId === 'undefined') {
                setIsLoading(false);
                return;
            }

            let hexId = userId;

            // Optimization: Bypass unauthorized lookup if patient is viewing self
            if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                hexId = currentUser?._id || currentUser?.id || hexId;
                console.log(`[ROSList] Using session identity: ${hexId}`);
                if (currentUser) {
                    setPatient(currentUser as any);
                }
            } else {
                try {
                    const userProfile = await UserService.getUserById(userId);
                    if (userProfile) {
                        hexId = userProfile._id || userProfile.id || hexId;
                        setPatient(userProfile);
                    }
                } catch (profileError) {
                    console.warn('[ROSList] Profile fetch failed, using parameter ID:', profileError);
                }
            }

            const queryData = await ROSService.getROSByPatient(hexId);

            const rosRecords = queryData?.data || queryData || [];
            const rosArray = Array.isArray(rosRecords) ? rosRecords : [rosRecords];

            // Sort by createdAt descending
            rosArray.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            setHistory(rosArray);

            if (rosArray.length > 0 && (rosArray[0] as any).patient_data && !patient) {
                setPatient((rosArray[0] as any).patient_data);
            }
        } catch (err: any) {
            console.error('[ROSList] Fetch failed:', err);

            // Graceful 403 handling for patients
            if (isPatient && err.response?.status === 403) {
                console.log('[ROSList] Patient role hit authorization limit, showing empty state.');
                setHistory([]);
                return;
            }

            setError('Could not load Review of Systems records. Please check API connectivity.');
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
        <div className="p-8 max-w-6xl space-y-10 animate-fade-in pb-24">
            <header className="flex items-center gap-6">
                <button
                    onClick={navigateBack}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Review of Systems
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Identity:</span>
                        <span className="text-xs font-bold text-indigo-600">
                            {patient ? `${patient.firstName} ${patient.lastName || ''}` : `Patient #${userId}`}
                        </span>
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="rounded-2xl px-8 shadow-lg shadow-indigo-100 font-black uppercase tracking-widest text-xs"
                    onClick={() => navigate(`/patients/${userId}/ros/new`)}
                    leftIcon={<Plus size={18} />}
                >
                    Add Review
                </Button>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {history.length > 0 ? (
                    history.map((item, idx) => {
                        const rosId = (item as any).id || (item as any)._id;
                        return (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={rosId}
                                onClick={() => navigate(`/patients/${userId}/ros/${rosId}`)}
                                className="card-premium p-8 bg-white border-slate-100 hover:border-indigo-200 cursor-pointer transition-all group flex flex-col gap-4 relative"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Stethoscope size={16} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/patients/${userId}/ros/edit/${rosId}`);
                                            }}
                                            className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl shadow-sm transition-all"
                                            title="Edit Review"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            }) : 'Recently'}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-2 flex-1">
                                    {(item as any).ai_notes ? (
                                        <p className="text-slate-700 font-bold leading-relaxed line-clamp-4">
                                            {(item as any).ai_notes}
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {Object.keys(item).filter(k => !['id', '_id', 'patient_id', 'consult_id', 'createdAt', 'updatedAt', '__v', 'ai_notes'].includes(k) && typeof (item as any)[k] === 'object').slice(0, 3).map(section => (
                                                <div key={section} className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{section}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">View Details</span>
                                    <ChevronLeft size={14} className="rotate-180 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </motion.div>
                        )
                    })
                ) : (
                    <div className="col-span-full card-premium p-20 text-center border-dashed border-slate-200 bg-slate-50/50">
                        <Stethoscope size={48} className="mx-auto text-slate-300 mb-6 opacity-50" />
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Records Found</h3>
                        <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto italic mb-8">
                            There are no previous Review of Systems recorded for this patient identity.
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

export default ROSList;
