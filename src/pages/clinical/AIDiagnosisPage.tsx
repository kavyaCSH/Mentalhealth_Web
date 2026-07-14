import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { ArrowLeft, Activity, Plus, History } from 'lucide-react';
import AIDiagnosisPanel from '../../components/clinical/AIDiagnosisPanel';
import AIDiagnosisHistory from '../../components/clinical/AIDiagnosisHistory';
import { UserService } from '../../api/services/user.service';

const AIDiagnosisPage = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state: RootState) => state.auth);

    const isPatient =
        user?.role === 'patient' ||
        (user as any)?.role === 'PATIENT' ||
        (user as any)?.group === 'PATIENT';

    const [patientName, setPatientName] = useState<string>('');
    const [resolvedId, setResolvedId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if back navigation specified returning to the history tab
    const [activeTab, setActiveTab] = useState<'new' | 'history'>(
        location.state?.activeTab || (isPatient ? 'history' : 'new')
    );

    useEffect(() => {
        const fetchUser = async () => {
            if (!patientId) return;
            try {
                const userProfile = await UserService.getUserById(patientId);
                if (userProfile) {
                    const name = [userProfile.firstName, userProfile.lastName].filter(Boolean).join(' ');
                    if (name) setPatientName(name);
                    setResolvedId(Number(patientId));
                } else {
                    setResolvedId(Number(patientId));
                }
            } catch (err) {
                console.error('Failed to fetch user:', err);
                setResolvedId(Number(patientId));
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [patientId]);

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in pb-16">
            <button
                onClick={() => navigate(isPatient ? '/records' : `/patients/${patientId}/health`)}
                className="flex items-center gap-2 text-sm font-bold text-muted hover:text-indigo-600 mb-8 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Health Overview
            </button>

            <header className="mb-10 flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black text-main tracking-tight flex items-center gap-3">
                        <Activity className="text-violet-600" size={32} />
                        {isPatient ? 'My Diagnosis History' : 'AI Clinical Diagnosis'}
                    </h1>
                    <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mt-2 ml-11">
                        {isPatient ? 'Your past AI clinical assessments' : 'Advanced clinical decision support'}
                    </p>
                </div>

                {/* Tabs — only shown to clinicians */}
                {!isPatient && (
                    <div className="flex bg-page p-1 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === 'new' ? 'bg-card text-indigo-600 shadow-sm' : 'text-muted hover:text-main'
                            }`}
                        >
                            <Plus size={14} /> New Analysis
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === 'history' ? 'bg-card text-indigo-600 shadow-sm' : 'text-muted hover:text-main'
                            }`}
                        >
                            <History size={14} /> History
                        </button>
                    </div>
                )}
            </header>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Activity className="animate-spin text-violet-600" size={32} />
                </div>
            ) : resolvedId ? (
                // Patients always see history only; clinicians see the active tab
                isPatient || activeTab === 'history' ? (
                    <AIDiagnosisHistory patientId={resolvedId} />
                ) : (
                    <AIDiagnosisPanel patientId={resolvedId} patientName={patientName || undefined} />
                )
            ) : null}
        </div>
    );
};

export default AIDiagnosisPage;
