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
    Clock,
    Trash2,
    Edit3
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { ChiefComplaintService } from '../../../api/services/chiefComplaint.service';
import { UserService } from '../../../api/services/user.service';
import type { ChiefComplaintResponse } from '../../../api/services/chiefComplaint.service';
import type { User, Patient } from '../../../types/user.types';

const ChiefComplaint = () => {
    const { patientId: userId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = currentUser?.role === 'patient' || (currentUser as any)?.role === 'PATIENT' ||
        (currentUser as any)?.group === 'PATIENT' || (currentUser as any)?.group === 'patient';

    // For patients accessing via /records/chief-complaint, userId param may be undefined;
    // resolve to their own session ID
    const effectiveUserId = userId || currentUser?._id || currentUser?.id || '';

    // State
    const [patient, setPatient] = useState<User | Patient | null>(null);
    const [history, setHistory] = useState<ChiefComplaintResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async (ccId: string | number) => {
        if (!window.confirm('Are you sure you want to delete this clinical record? This action cannot be undone.')) {
            return;
        }

        try {
            let hexId = userId;
            if (patient && (patient as any)._id) {
                hexId = (patient as any)._id;
            } else if (isPatient && (currentUser?._id || currentUser?.id)) {
                hexId = currentUser?._id || currentUser?.id || userId;
            }

            console.log(`[ChiefComplaint] Deleting record ${ccId} for identity: ${hexId}`);

            if (isPatient && hexId) {
                await ChiefComplaintService.deletePatientComplaint(hexId as string, ccId);
            } else {
                await ChiefComplaintService.deleteComplaint(ccId, hexId as string);
            }

            setHistory(prev => prev.filter(item => (item.chiefComplaintId || item.id || item._id) !== ccId));
        } catch (err) {
            console.error('Failed to delete complaint:', err);
            alert('Failed to delete the record. Please try again.');
        }
    };

    useEffect(() => {
        if (effectiveUserId) {
            fetchData();
        }
    }, [effectiveUserId]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!effectiveUserId || effectiveUserId === 'undefined') {
                setIsLoading(false);
                return;
            }

            console.log(`[ChiefComplaint] Loading history for identity: ${effectiveUserId}`);

            // 1. Resolve hex ID from user profile
            let hexId = userId;

            // Optimization: Bypass unauthorized lookup if patient is viewing self
            const isSelf = isPatient && (
                String(currentUser?.id) === String(userId) ||
                String((currentUser as any)?._id) === String(userId) ||
                String((currentUser as any)?.userId) === String(userId) ||
                !userId
            );

            if (isSelf) {
                hexId = (currentUser as any)?._id || currentUser?.id || hexId;
                console.log(`[ChiefComplaint] Using session identity: ${hexId}`);
                if (currentUser) {
                    setPatient(currentUser as any);
                }
            } else if (userId) {
                try {
                    const userProfile = await UserService.getUserById(userId as string);
                    if (userProfile) {
                        hexId = userProfile._id || userProfile.id || hexId;
                        console.log(`[ChiefComplaint] Resolved Hex ID: ${hexId}`);
                        setPatient(userProfile);
                    }
                } catch (profileError) {
                    console.warn('[ChiefComplaint] Profile fetch failed, using parameter ID:', profileError);
                }
            }

            // 2. Fetch using appropriate endpoint based on role
            let complaintsArray: ChiefComplaintResponse[] = [];

            if (isPatient && hexId) {
                // Use patient-scoped endpoint — backend authorizes this for patient role
                console.log(`[ChiefComplaint] Patient: using /patients/${hexId}/chief-complaints`);
                const queryData = await ChiefComplaintService.listPatientComplaints(hexId as string);
                const complaints = queryData?.data || queryData || [];
                complaintsArray = Array.isArray(complaints) ? complaints : [complaints].filter(Boolean);
            } else {
                const queryData = await ChiefComplaintService.listComplaints({
                    patient: hexId,
                    patientId: hexId,
                    patient_id: hexId
                });
                const complaints = queryData?.data || queryData || [];
                complaintsArray = Array.isArray(complaints) ? complaints : [complaints].filter(Boolean);
            }

            setHistory(complaintsArray);
            if (complaintsArray.length > 0 && (complaintsArray[0] as any).patient && !patient) {
                setPatient((complaintsArray[0] as any).patient);
            }
        } catch (err: any) {
            console.error('[ChiefComplaint] All fetch attempts failed:', err);

            // Graceful 403 handling for patients
            if (isPatient && err.response?.status === 403) {
                console.log('[ChiefComplaint] Patient role hit authorization limit, showing empty state.');
                setHistory([]);
                return;
            }

            setError('Could not load clinical records. Please check API connectivity.');
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
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        Chief Complaints
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
                    onClick={() => navigate(isPatient ? `/records/chief-complaint/new` : `/patients/${userId}/chief-complaint/new`)}
                    leftIcon={<Plus size={18} />}
                >
                    Add Complaint
                </Button>
            </header>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {history.length > 0 ? (
                    history.map((item, idx) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={item.chiefComplaintId || item.id || item._id}
                            onClick={() => navigate(isPatient
                                ? `/records/chief-complaint/${item.chiefComplaintId || item.id || item._id}`
                                : `/patients/${effectiveUserId}/chief-complaint/${item.chiefComplaintId || item.id || item._id}`)}
                            className="card-premium p-8 bg-white border-slate-100 hover:border-indigo-200 cursor-pointer transition-all group flex flex-col gap-4 relative"
                        >
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Clock size={16} />
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : 'Recently'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-slate-700 font-bold leading-relaxed line-clamp-4 flex-1">
                                {item.narrative}
                            </p>
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">View AI ANALYSIS</span>
                                <div className="flex items-center gap-2">
                                    {!isPatient && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/patients/${effectiveUserId}/chief-complaint/edit/${(item.chiefComplaintId || item.id || item._id) as string | number}`);
                                                }}
                                                className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                title="Edit Record"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete((item.chiefComplaintId || item.id || item._id) as string | number);
                                                }}
                                                className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                                title="Delete Record"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                    <ChevronLeft size={14} className="rotate-180 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full card-premium p-20 text-center border-dashed border-slate-200 bg-slate-50/50">
                        <Stethoscope size={48} className="mx-auto text-slate-300 mb-6 opacity-50" />
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Records Found</h3>
                        <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto italic mb-8">
                            There are no previous chief complaints recorded for this patient identity.
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

export default ChiefComplaint;
