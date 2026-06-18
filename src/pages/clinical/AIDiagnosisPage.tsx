import { useParams, useNavigate } from 'react-router-dom';
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
    const { user } = useSelector((state: RootState) => state.auth);

    const isPatient =
        user?.role === 'patient' ||
        (user as any)?.role === 'PATIENT' ||
        (user as any)?.group === 'PATIENT';

    const [patientName, setPatientName] = useState<string>('');
    const [resolvedId, setResolvedId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Patients always land on history; clinicians start on 'new'
    const [activeTab, setActiveTab] = useState<'new' | 'history'>(
        isPatient ? 'history' : 'new'
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
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 mb-8 transition-colors"
            >
                <ArrowLeft size={16} /> Back to Health Overview
            </button>

            <header className="mb-10 flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Activity className="text-violet-600" size={32} />
                        {isPatient ? 'My Diagnosis History' : 'AI Clinical Diagnosis'}
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-11">
                        {isPatient ? 'Your past AI clinical assessments' : 'Advanced clinical decision support'}
                    </p>
                </div>

                {/* Tabs — only shown to clinicians */}
                {!isPatient && (
                    <div className="flex bg-slate-100 p-1 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Plus size={14} /> New Analysis
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
