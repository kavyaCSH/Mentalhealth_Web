import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
    Activity,
    Brain,
    Shield,
    CheckCircle2,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Download
} from 'lucide-react';
import { AssessmentService } from '../../api/services/assessment.service';
import { UserService } from '../../api/services/user.service';
import { useAuth } from '../../hooks/useAuth';
import type { AssessmentResult } from '../../types/assessment.types';
import Button from '../../components/ui/Button';

// ─── Severity styling ────────────────────────────────────────────────────────
const getSeverityStyle = (severity?: string, interpretation?: string) => {
    const key = String(severity || interpretation || '').toLowerCase();
    if (key.includes('severe') || key.includes('high') || key.includes('extreme'))
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', fill: 'bg-red-500', icon: AlertCircle };
    if (key.includes('moderate') || key.includes('medium'))
        return { color: 'text-main opacity-90', bg: 'bg-orange-50', border: 'border-orange-100', fill: 'bg-orange-500', icon: TrendingUp };
    if (key.includes('mild') || key.includes('low'))
        return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', fill: 'bg-amber-500', icon: Shield };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', fill: 'bg-emerald-500', icon: CheckCircle2 };
};

const ProfessionalHistoryPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { patientId: routePatientId } = useParams<{ patientId: string }>();
    const [searchParams] = useSearchParams();
    const urlPatientId = searchParams.get('patientId');
    const isPatient = String(user?.role).toUpperCase() === 'PATIENT';
    const patientId = routePatientId || urlPatientId || (isPatient ? (user?.userId || user?.id || user?._id) : null);
    const categoryParam = searchParams.get('category') || searchParams.get('topic');

    const [history, setHistory] = useState<AssessmentResult[]>([]);
    const [patientInfo, setPatientInfo] = useState<{ name: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Filters
    const [categoryFilter] = useState(categoryParam || 'all');
    const [searchQuery] = useState('');

    const loadHistory = useCallback(async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            if (patientId) {
                let assessments: AssessmentResult[] = [];
                
                if (isPatient) {
                    // For patients, fetch their combined history and filter for clinical entries
                    // This mirrors mobile AssessmentHistoryScreen logic (fetch both & filter)
                    const res = await AssessmentService.getSelfAssessmentHistory({ limit: 50 });
                    assessments = (res.assessments || []).filter(item => 
                        item.isProfessional || 
                        item.tScore != null || 
                        item.clinicalResults || 
                        item.clinicianId != null ||
                        item.assessment_type === 'professional'
                    );

                    // Also try to fetch specific professional results if the numeric userId is available
                    if (user?.userId) {
                        try {
                            const profHistory = await AssessmentService.getPatientProfessionalHistory(user.userId);
                            if (profHistory && profHistory.length > 0) {
                                // Merge and deduplicate
                                const existingIds = new Set(assessments.map(a => a.id));
                                profHistory.forEach(a => {
                                    if (!existingIds.has(a.id)) assessments.push(a);
                                });
                            }
                        } catch (pErr) {
                            console.warn('[History] Patient professional sub-fetch failed:', pErr);
                        }
                    }
                } else {
                    // Specialist view
                    assessments = await AssessmentService.getPatientProfessionalHistory(patientId);
                    
                    try {
                        const profile = await UserService.getUserById(String(patientId));
                        if (profile) setPatientInfo({ name: `${profile.firstName} ${profile.lastName}` });
                    } catch (err) {
                        console.warn('Failed to load patient name:', err);
                    }
                }
                
                setHistory(assessments || []);
            } else {
                // Global/Admin view
                const assessments = await AssessmentService.getAllAdmin();
                setHistory(assessments || []);
            }
        } catch (err: any) {
            console.error('Failed to load professional history:', err);
            setFetchError('Failed to synchronize clinical reports archive.');
        } finally {
            setIsLoading(false);
        }
    }, [patientId, isPatient, user?.userId]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const filteredHistory = history.filter(item => {
        // Robust check for professional-grade reports
        const isActuallyProf = 
            (item as any).isProfessional || 
            item.tScore != null || 
            item.clinicalResults || 
            item.clinicianId != null ||
            item.assessment_type === 'professional';

        const matchesCategory = categoryFilter === 'all' || 
            (item.category || '').toLowerCase() === categoryFilter.toLowerCase() ||
            (item.slug || '').toLowerCase() === categoryFilter.toLowerCase();

        const matchesSearch = 
            (item.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

        return isActuallyProf && matchesCategory && matchesSearch;
    });


    return (
        <div className="p-8 max-w-6xl  space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    {isPatient ? (
                        <button
                            onClick={() => navigate('/records')}
                            className="flex items-center gap-2 text-xs font-black text-muted opacity-80 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-2"
                        >
                            <ChevronLeft size={14} /> Back to Health Overview
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate(patientId ? `/patients/${patientId}/clinical-hub` : '/')}
                            className="flex items-center gap-2 text-xs font-black text-muted opacity-80 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-2"
                        >
                            <ChevronLeft size={14} /> {patientId ? 'Back to Patient Hub' : 'Back to Dashboard'}
                        </button>
                    )}
                    <h1 className="text-4xl font-black text-main tracking-tight flex items-center gap-4">
                        <Shield className="text-indigo-600" size={32} />
                        {isPatient ? 'Your Professional Reports' : (patientInfo ? `${patientInfo.name}'s History` : 'Clinical Archive')}
                    </h1>
                    <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mt-2">
                        {isPatient ? 'Authorized Clinician Evaluations & Diagnostic Outcomes' : `Longitudinal Clinical Synthesis & Verified Outcomes for ${patientInfo?.name || 'Authorized Recipient'}`}
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button
                        variant="ghost"
                        onClick={loadHistory}
                        disabled={isLoading}
                        className="rounded-2xl text-muted opacity-80 hover:text-indigo-600"
                    >
                        <Activity className={isLoading ? 'animate-spin' : ''} size={18} />
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-2xl border-border-card text-muted hover:bg-page"
                        onClick={() => {}} // TODO: Export
                    >
                        <Download size={18} />
                    </Button>
                </div>
            </header>

            {/* List */}
            <div className="space-y-3">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <Activity className="animate-spin mx-auto text-indigo-400 mb-4" size={32} />
                        <p className="text-sm font-bold text-muted opacity-80 uppercase tracking-widest">Synchronizing Archive...</p>
                    </div>
                ) : filteredHistory.length > 0 ? (
                    filteredHistory.map((item, index) => {
                        const style = getSeverityStyle(item.severity, item.interpretation);
                        const SeverityIcon = style.icon;
                        return (
                            <motion.div
                                key={item.id || index}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04 }}
                                onClick={() => navigate(`/history/${item.id}${patientId ? `?patientId=${patientId}` : ''}`)}
                                className="bg-card rounded-2xl border border-border-card shadow-sm transition-all overflow-hidden group mb-2.5 cursor-pointer hover:shadow-lg hover:border-indigo-200 active:scale-[0.98]"
                            >
                                {/* Card Header - Navigation Style */}
                                <div className="p-3.5 border-b border-border-card flex items-center justify-between group-hover:bg-page/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bg} ${style.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                            <Brain size={16} />
                                        </div>
                                        <div className="space-y-0 text-left">
                                            <p className="text-[8px] font-black text-muted opacity-80 uppercase tracking-widest leading-none">{item.date}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <span className={`px-1 py-0.5 rounded-[4px] text-[6px] font-black uppercase tracking-widest ${item.isProfessional ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'}`}>
                                                    {item.isProfessional ? 'Clinical' : 'Self'}
                                                </span>
                                                <span className={`px-1 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest border flex items-center gap-1 ${style.bg} ${style.color} ${style.border}`}>
                                                    <SeverityIcon size={6} />
                                                    {item.severity || 'Normal'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="hidden sm:block text-right mr-2 border-r border-border-card pr-2">
                                            <p className="text-[7px] font-black text-muted opacity-80 uppercase tracking-widest italic opacity-60">ID</p>
                                            <p className="text-[9px] font-bold text-main tracking-tight leading-none">#{item.id?.slice(-4).toUpperCase()}</p>
                                        </div>
                                        <div className="p-1 px-1.5 bg-page rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body - Synthesis Preview */}
                                <div className="p-4 pb-3 space-y-2">
                                    <h3 className="text-base font-black text-main tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                                        {item.category || 'General Assessment'}
                                    </h3>
                                    <div className="space-y-1.5 text-left">
                                        <p className="text-[11px] text-muted font-medium leading-relaxed italic line-clamp-1 opacity-80">
                                            {item.interpretation || 'No additional synthesis recorded.'}
                                        </p>
                                        {item.notes && (
                                            <div className="p-2.5 bg-amber-50/40 rounded-xl border border-amber-100/50 group-hover:bg-amber-50 transition-colors">
                                                <p className="text-[10px] font-semibold text-amber-900 leading-tight line-clamp-2">
                                                    <span className="font-black text-amber-600 uppercase text-[8px] mr-1">Clinician Note:</span>
                                                    "{item.notes}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="py-32 text-center bg-card rounded-[3rem] border border-dashed border-border-card">
                        {fetchError ? (
                            <AlertCircle className="mx-auto text-muted mb-4" size={48} />
                        ) : (
                            <Shield className="mx-auto text-muted opacity-80 mb-4" size={48} />
                        )}
                        <h3 className="text-xl font-black text-main uppercase">
                            {fetchError ? 'Sync Failure' : 'No Assessment Records'}
                        </h3>
                        <p className="text-muted opacity-80 font-medium mt-2">
                            {fetchError || 'There are no professional assessments recorded for this profile yet.'}
                        </p>
                        {fetchError && (
                            <Button
                                variant="outline"
                                className="mt-8 rounded-2xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                onClick={loadHistory}
                            >
                                Retry Sync
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessionalHistoryPage;
