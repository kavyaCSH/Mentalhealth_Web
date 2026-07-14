import { useNavigate } from 'react-router-dom';
import {
    ClipboardList,
    ArrowLeft,
    Activity,
    Lock,
    Download
} from 'lucide-react';
import Button from '../../components/ui/Button';

const HealthRecords = () => {
    const navigate = useNavigate();

    return (
        <div className="p-8 max-w-7xl  space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-muted opacity-80 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <h1 className="text-4xl font-black text-main tracking-tight">Health Records</h1>
                    <p className="text-muted font-medium">Global access to clinical history and diagnostic reports.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" leftIcon={<Download size={18} />}>
                        Request Archives
                    </Button>
                    <Button variant="primary" size="lg" leftIcon={<Lock size={18} />}>
                        Secure Audit Log
                    </Button>
                </div>
            </header>

            <div className="flex gap-4 p-1 bg-page/80 rounded-2xl w-fit">
                <button className="px-6 py-2.5 bg-card text-indigo-700 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">Active Records</button>
                <button className="px-6 py-2.5 text-muted rounded-xl text-xs font-black uppercase tracking-widest hover:text-main">Archived Case Files</button>
            </div>

            <div className="grid gap-8 lg:grid-cols-4">
                <div className="lg:col-span-3 space-y-6">
                    <div className="card-premium p-12 text-center space-y-6 bg-card/50 border-dashed border-2">
                        <div className="w-16 h-16 bg-card rounded-2xl flex items-center justify-center text-muted opacity-40 mx-auto border border-border-card">
                            <ClipboardList size={32} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-main">No Records Selected</h3>
                            <p className="text-sm text-muted max-w-sm mx-auto">Select a patient from the directory to view their complete clinical history, lab results, and diagnostic imaging.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card-premium p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Activity size={18} />
                            </div>
                            <h4 className="font-black text-main uppercase tracking-widest text-[10px]">Data Integrity</h4>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">All records are end-to-end encrypted and signed with clinical-grade certificates.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HealthRecords;
