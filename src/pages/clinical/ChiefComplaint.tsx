import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Stethoscope, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

const ChiefComplaint = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <header className="flex items-center gap-6 pb-6 border-b border-border-card">
                <button
                    onClick={() => navigate(`/patients/${id}/health`)}
                    className="p-3 bg-card hover:bg-page border border-border-card rounded-2xl text-muted transition-all hover:shadow-md active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-main tracking-tight">Chief Complaint</h1>
                    <p className="text-muted opacity-80 font-bold uppercase tracking-widest text-[10px] mt-1">Detailed Clinical Assessment</p>
                </div>
            </header>

            {/* Main Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-premium p-12 bg-card border-border-card flex flex-col items-center justify-center text-center min-h-[400px]"
            >
                <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center mb-8 ring-8 ring-rose-50/50">
                    <Stethoscope size={48} />
                </div>

                <h2 className="text-3xl font-black text-main mb-4">Clinical Detail View</h2>
                <div className="max-w-md mx-auto p-6 bg-page rounded-3xl border border-border-card mb-8">
                    <p className="text-lg font-bold text-muted leading-relaxed">
                        This is Chief Complaint Page
                    </p>
                </div>

                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/patients/${id}/health`)}
                        leftIcon={<ChevronLeft size={18} />}
                    >
                        Back to Health
                    </Button>
                    <Button
                        variant="primary"
                        leftIcon={<AlertCircle size={18} />}
                    >
                        Log New Complaint
                    </Button>
                </div>
            </motion.div>

            {/* Placeholder Sections */}
            <div className="grid md:grid-cols-2 gap-8 opacity-50 grayscale pointer-events-none">
                <div className="card-premium p-8 border-border-card">
                    <div className="h-4 w-24 bg-border-card rounded-full mb-4" />
                    <div className="space-y-3">
                        <div className="h-3 w-full bg-page rounded-full" />
                        <div className="h-3 w-5/6 bg-page rounded-full" />
                    </div>
                </div>
                <div className="card-premium p-8 border-border-card">
                    <div className="h-4 w-24 bg-border-card rounded-full mb-4" />
                    <div className="space-y-3">
                        <div className="h-3 w-full bg-page rounded-full" />
                        <div className="h-3 w-5/6 bg-page rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChiefComplaint;
