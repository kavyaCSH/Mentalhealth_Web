import { useNavigate } from 'react-router-dom';
import {
    Wallet,
    ArrowLeft,
    CreditCard,
    TrendingUp,
    FileText,
    PieChart,
    Plus,
    Download
} from 'lucide-react';
import Button from '../../components/ui/Button';

const BillingCentral = () => {
    const navigate = useNavigate();

    return (
        <div className="p-8 max-w-7xl  space-y-10 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Ops
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Billing Central</h1>
                    <p className="text-slate-500 font-medium italic">"Financial transparency is the foundation of sustainable healthcare."</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" leftIcon={<Download size={18} />}>
                        Export Financials
                    </Button>
                    <Button variant="primary" size="lg" leftIcon={<Plus size={18} />}>
                        Create Invoice
                    </Button>
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="card-premium p-8 bg-gradient-to-br from-slate-900 to-indigo-900 text-white border-0">
                    <div className="flex justify-between items-start mb-10">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                            <Wallet size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Revenue YTD</span>
                    </div>
                    <div>
                        <p className="text-3xl font-black">$428,500.00</p>
                        <p className="text-xs font-medium opacity-60 mt-1 flex items-center gap-2">
                            <TrendingUp size={14} className="text-emerald-400" />
                            +12.4% from last quarter
                        </p>
                    </div>
                </div>

                <div className="card-premium p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Pending Claims</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-900">124</p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 w-3/4" />
                    </div>
                </div>

                <div className="card-premium p-8 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                            <PieChart size={20} />
                        </div>
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Collection Rate</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-900">98.2%</p>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[98%]" />
                    </div>
                </div>
            </div>

            <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Recent Invoices</h2>
                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All Billing</button>
                </div>

                <div className="card-premium overflow-hidden">
                    <div className="p-12 text-center space-y-4">
                        <FileText size={48} className="mx-auto text-slate-100" />
                        <p className="text-slate-400 font-medium">The ledger is being updated. Recent transactions will appear here shortly.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default BillingCentral;
