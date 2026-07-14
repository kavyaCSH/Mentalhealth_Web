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
    Edit3,
    Filter,
    Search,
    Calendar,
    RotateCcw
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ROSService } from '../../../api/services/ros.service';
import { UserService } from '../../../api/services/user.service';
import type { ROSResponse, ROSFilters } from '../../../types/ros.types';
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

    // Filters State
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [filters, setFilters] = useState<ROSFilters>({});
    const [tempFilters, setTempFilters] = useState<ROSFilters>({});

    useEffect(() => {
        if (userId) {
            fetchData();
        }
    }, [userId, filters]);

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

            const queryData = await ROSService.getROSByPatient(hexId, filters);

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

    const toggleFilters = () => setIsFilterExpanded(!isFilterExpanded);

    const applyFilters = () => {
        setFilters(tempFilters);
        setIsFilterExpanded(false);
    };

    const resetFilters = () => {
        setTempFilters({});
        setFilters({});
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
                    className="p-3 bg-card hover:bg-page border border-border-card rounded-2xl text-muted transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-main tracking-tight">
                        Review of Systems
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest">Patient Identity:</span>
                        <span className="text-xs font-bold text-indigo-600">
                            {patient ? `${patient.firstName} ${patient.lastName || ''}` : `Patient #${userId}`}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleFilters}
                        className={`p-3 rounded-2xl border transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isFilterExpanded || Object.keys(filters).length > 0
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                            : 'bg-card text-muted border-border-card hover:bg-page'
                            }`}
                    >
                        <Filter size={18} />
                        {Object.keys(filters).length > 0 && <span>({Object.keys(filters).length})</span>}
                        <span>Filter</span>
                    </button>
                    {!isPatient && (
                        <Button
                            variant="primary"
                            className="rounded-2xl px-8 shadow-lg shadow-indigo-100 font-black uppercase tracking-widest text-xs"
                            onClick={() => navigate(`/patients/${userId}/ros/new`)}
                            leftIcon={<Plus size={18} />}
                        >
                            Add Review
                        </Button>
                    )}
                </div>
            </header>

            {/* Premium Filter Section */}
            {isFilterExpanded && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-premium p-8 bg-card/70 backdrop-blur-xl border-indigo-100/50 shadow-2xl shadow-indigo-100/20 space-y-8"
                >
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Red Flag Search */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest flex items-center gap-2">
                                <Search size={14} /> Organic Red Flags
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search red flags (e.g. Thyroid)"
                                    value={tempFilters.red_flag || ''}
                                    onChange={(e) => setTempFilters({ ...tempFilters, red_flag: e.target.value })}
                                    className="w-full bg-card/50 border border-border-card rounded-xl py-3 px-4 text-sm font-bold text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Substance Probability */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={14} /> Substance Probability
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {['High', 'Moderate', 'Low', 'None'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setTempFilters({
                                            ...tempFilters,
                                            substance_induced_probability: tempFilters.substance_induced_probability === level ? undefined : level as any
                                        })}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${tempFilters.substance_induced_probability === level
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-page text-muted border-border-card hover:border-indigo-200'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest flex items-center gap-2">
                                <Calendar size={14} /> Clinical Period
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={tempFilters.startDate || ''}
                                    onChange={(e) => setTempFilters({ ...tempFilters, startDate: e.target.value })}
                                    className="flex-1 bg-card/50 border border-border-card rounded-xl py-2 px-3 text-[10px] font-bold text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                                <span className="text-[10px] font-black text-muted opacity-40">TO</span>
                                <input
                                    type="date"
                                    value={tempFilters.endDate || ''}
                                    onChange={(e) => setTempFilters({ ...tempFilters, endDate: e.target.value })}
                                    className="flex-1 bg-card/50 border border-border-card rounded-xl py-2 px-3 text-[10px] font-bold text-main focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-border-card">
                        <button
                            onClick={resetFilters}
                            className="flex items-center gap-2 text-[10px] font-black text-muted opacity-80 uppercase tracking-widest hover:text-rose-500 transition-colors"
                        >
                            <RotateCcw size={14} /> Reset
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleFilters}
                                className="px-6 py-2.5 text-[10px] font-black text-muted uppercase tracking-widest hover:bg-page rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <Button
                                onClick={applyFilters}
                                variant="primary"
                                className="px-8 py-2.5 rounded-xl shadow-lg shadow-indigo-100 font-black uppercase tracking-widest text-[10px]"
                            >
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}

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
                                className="card-premium p-8 bg-card border-border-card hover:border-indigo-200 cursor-pointer transition-all group flex flex-col gap-4 relative"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Stethoscope size={16} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {!isPatient && (
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
                                        )}
                                        <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest ml-2">
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
                                        <p className="text-main font-bold leading-relaxed line-clamp-4">
                                            {(item as any).ai_notes}
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {Object.keys(item).filter(k => !['id', '_id', 'patient_id', 'consult_id', 'createdAt', 'updatedAt', '__v', 'ai_notes'].includes(k) && typeof (item as any)[k] === 'object').slice(0, 3).map(section => (
                                                <div key={section} className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                    <span className="text-xs font-bold text-muted uppercase tracking-tight">{section}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-border-card flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {item.organic_red_flags && item.organic_red_flags.length > 0 && (
                                            <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-rose-100">
                                                {item.organic_red_flags.length} Red Flag{item.organic_red_flags.length !== 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {item.substance_induced_probability && item.substance_induced_probability !== 'None' && (
                                            <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-lg border border-amber-100">
                                                {item.substance_induced_probability} risk
                                            </span>
                                        )}
                                    </div>
                                    <ChevronLeft size={14} className="rotate-180 text-muted opacity-40 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </motion.div>
                        )
                    })
                ) : (
                    <div className="col-span-full card-premium p-20 text-center border-dashed border-border-card bg-card/50">
                        <Stethoscope size={48} className="mx-auto text-muted opacity-40 mb-6 opacity-50" />
                        <h3 className="text-xl font-black text-main mb-2">No Records Found</h3>
                        <p className="text-sm font-bold text-muted opacity-80 max-w-xs mx-auto italic mb-8">
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
