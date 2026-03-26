import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Wallet,
    ArrowLeft,
    CreditCard,
    TrendingUp,
    PieChart,
    Plus,
    Download,
    Search,
    Filter,
    Calendar,
    ChevronRight,
    Activity,
    DollarSign
} from 'lucide-react';
import Button from '../../components/ui/Button';

const BillingCentral = () => {
    const navigate = useNavigate();

    const stats = [
        { label: 'Revenue YTD', value: '$428,500', icon: Wallet, trend: '+12.4%', color: 'from-indigo-600 to-indigo-900', light: 'bg-indigo-50 text-indigo-600' },
        { label: 'Pending Claims', value: '124', icon: CreditCard, trend: '8 Pending', color: 'from-slate-800 to-slate-900', light: 'bg-slate-50 text-slate-900' },
        { label: 'Collection Rate', value: '98.2%', icon: PieChart, trend: 'Stable', color: 'from-emerald-600 to-emerald-900', light: 'bg-emerald-50 text-emerald-600' },
    ];

    const recentInvoices = [
        { patient: 'Alexander Wright', amount: '$1,240.00', date: 'Oct 24, 2023', status: 'Paid', method: 'Insurance' },
        { patient: 'Sarah Mitchell', amount: '$850.00', date: 'Oct 23, 2023', status: 'Pending', method: 'Direct' },
        { patient: 'Marcus Chen', amount: '$2,100.00', date: 'Oct 22, 2023', status: 'Paid', method: 'Insurance' },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in pb-20">
            {/* Split Header */}
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/')}
                        className="group flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] hover:text-indigo-600 transition-all"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Operations
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-4">
                            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Billing Central</h1>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 mt-1">
                                Ledger Active
                            </span>
                        </div>
                        <p className="text-slate-500 font-medium italic">"Financial transparency is the foundation of sustainable healthcare."</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                DB
                            </div>
                        ))}
                    </div>
                    <div className="h-10 w-[1px] bg-slate-200 mx-2" />
                    <Button variant="primary" size="lg" className="px-8 shadow-xl shadow-indigo-100" leftIcon={<Plus size={18} />}>
                        Generate Invoice
                    </Button>
                </div>
            </header>

            {/* Financial Intelligence Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-8 rounded-[2.5rem] bg-gradient-to-br ${stat.color} text-white shadow-2xl relative overflow-hidden group border-0`}
                    >
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                            <div className="flex justify-between items-start">
                                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                                    <stat.icon size={24} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{stat.label}</span>
                                    <div className="flex items-center gap-2 px-2 py-0.5 bg-white/10 rounded-lg text-[10px] font-bold">
                                        <TrendingUp size={12} className="text-emerald-400" />
                                        {stat.trend}
                                    </div>
                                </div>
                            </div>
                            <h3 className="text-4xl font-black tracking-tight">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-4">
                {/* Ledger View */}
                <section className="lg:col-span-3 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Ledger</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search invoices..." 
                                    className="pl-11 pr-6 py-2.5 bg-slate-50 border-0 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all w-64"
                                />
                            </div>
                            <button className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="card-premium overflow-hidden bg-white border-slate-100">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase tracking-widest border-b border-slate-100">Patient / Entity</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase tracking-widest border-b border-slate-100">Date</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase tracking-widest border-b border-slate-100">Amount</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase tracking-widest border-b border-slate-100">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase tracking-widest border-b border-slate-100">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentInvoices.map((inv, i) => (
                                        <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-6 border-b border-slate-50">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        {inv.patient.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 leading-tight">{inv.patient}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{inv.method}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 border-b border-slate-50">
                                                <span className="text-xs font-bold text-slate-500">{inv.date}</span>
                                            </td>
                                            <td className="px-8 py-6 border-b border-slate-50">
                                                <span className="text-sm font-black text-slate-900">{inv.amount}</span>
                                            </td>
                                            <td className="px-8 py-6 border-b border-slate-50">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 border-b border-slate-50 text-right">
                                                <button className="p-2 hover:bg-white rounded-lg text-slate-400 transition-all hover:shadow-sm">
                                                    <Download size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-slate-50/50 text-center border-t border-slate-100">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Consolidating additional records...</p>
                        </div>
                    </div>
                </section>

                {/* Side Actions & Insights */}
                <aside className="space-y-8">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Insights</h2>
                    </div>

                    <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] space-y-8 shadow-sm">
                        <div className="space-y-6">
                            {[
                                { label: 'Average Ticket', value: '$124.50', icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'Billing Efficiency', value: '94%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
                                        <item.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                        <p className="text-lg font-black text-slate-900">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 border-t border-slate-50">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Tasks</h4>
                            <div className="space-y-3">
                                <button className="w-full p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-indigo-100 transition-all text-left flex items-center justify-between group">
                                    <span className="text-[11px] font-bold text-slate-700">Review Rejected Claims</span>
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
                                </button>
                                <button className="w-full p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-indigo-100 transition-all text-left flex items-center justify-between group">
                                    <span className="text-[11px] font-bold text-slate-700">Insurance Batch Sync</span>
                                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Premium Upgrade/Upsell Card or Info Card */}
                    <div className="p-8 bg-indigo-900 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
                         <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                         <div className="relative z-10 space-y-6">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md w-fit">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black leading-tight">Monthly Close-out</h3>
                                <p className="text-xs text-indigo-200 mt-2 font-medium">Automatic reconciliation is scheduled for 11:59PM tonight.</p>
                            </div>
                            <Button variant="white" className="w-full text-indigo-900 font-black uppercase tracking-widest text-[10px] py-4">
                                Download Pre-Report
                            </Button>
                         </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default BillingCentral;

