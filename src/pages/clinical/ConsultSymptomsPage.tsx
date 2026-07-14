import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ConsultSymptoms } from '../../components/clinical/ConsultSymptoms';
import { ChevronLeft, Activity } from 'lucide-react';

const ConsultSymptomsPage = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'new';

    return (
        <div className="min-h-screen bg-page p-6 md:p-12 pb-32">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex items-start gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-card rounded-2xl shadow-sm border border-border-card text-muted hover:text-indigo-600 transition-all hover:scale-110"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-main tracking-tighter flex items-center gap-3">
                            <Activity className="text-indigo-600" size={32} />
                            Symptom Tracker
                        </h1>
                        <p className="text-muted font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">Record and monitor physiological state snapshots</p>
                    </div>
                </header>

                <div className="bg-card rounded-[3rem] border border-border-card shadow-2xl shadow-indigo-100/20 overflow-hidden min-h-[600px] flex flex-col p-8 md:p-12">
                    {patientId ? (
                        <ConsultSymptoms
                            patientId={patientId}
                            initialTab={initialTab}
                            onSave={() => {
                                // Additional logic if needed after save
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted py-20">
                            <Activity size={48} className="opacity-10 mb-4" />
                            <p className="font-bold uppercase tracking-widest text-xs">Patient identification required</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsultSymptomsPage;
