import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CreditCard,
    ArrowLeft,
    Search,
    Download,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    XCircle,
    Calendar,
    Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import api from '../../api/client';
import type { Consultation } from '../../types/common.types';

const Transactions = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Consultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled

    useEffect(() => {
        const fetchTransactions = async () => {
            setIsLoading(true);
            try {
                // Fetching from consults as they represent the primary financial activity
                const res = await api.get('resource/consults');
                setTransactions(Array.isArray(res.data.data) ? res.data.data : []);
            } catch (error) {
                console.error('Failed to fetch transactions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    }, []);

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'confirmed':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'scheduled':
            case 'pending':
                return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'cancelled':
                return 'bg-red-50 text-red-600 border-red-100';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
            case 'confirmed':
                return <CheckCircle2 size={12} />;
            case 'scheduled':
            case 'pending':
                return <Clock size={12} />;
            case 'cancelled':
                return <XCircle size={12} />;
            default:
                return null;
        }
    };

    const totalSpent = transactions.reduce((acc, tx) => acc + (Number(tx.totalPrice) || 0), 0);
    const upcomingPayments = transactions.filter(tx => tx.status?.toLowerCase() === 'pending' || tx.status?.toLowerCase() === 'scheduled');

    return (
        <div className="p-8 max-w-7xl  space-y-10 animate-fade-in pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Dashboard
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <CreditCard size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Transaction History</h1>
                            <p className="text-slate-500 font-medium">Digital ledger of your healthcare activities and associated costs.</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" leftIcon={<Download size={18} />}>
                        Download Statement
                    </Button>
                </div>
            </header>

            <div className="grid gap-8 lg:grid-cols-4">
                {/* Stats Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card-premium p-8 bg-indigo-900 text-white border-0 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-800 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Expenditure</p>
                            <h2 className="text-4xl font-black">₹{totalSpent.toLocaleString('en-IN')}</h2>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] font-bold opacity-60">
                                <span>Recent: {transactions.length > 0 ? new Date(transactions[0].createdAt || '').toLocaleDateString() : 'None'}</span>
                                <span className="text-emerald-400">Live Data</span>
                            </div>
                        </div>
                    </div>

                    <div className="card-premium p-6 space-y-4">
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Upcoming Payments</h3>
                        <div className="space-y-3">
                            {upcomingPayments.length > 0 ? upcomingPayments.slice(0, 3).map((tx: Consultation) => (
                                <div key={tx.id || tx._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-indigo-600" />
                                        <span className="text-xs font-bold text-slate-700">{new Date(tx.scheduled_at || tx.createdAt || '').toLocaleDateString()}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900">₹{tx.totalPrice || '0.00'}</span>
                                </div>
                            )) : (
                                <p className="text-[10px] text-slate-400 italic">No upcoming payments.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                            {['all', 'upcoming', 'completed'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="text"
                                placeholder="Search records..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="card-premium overflow-hidden border-slate-100">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-8 py-5">Transaction ID</th>
                                    <th className="px-8 py-5">Service / Provider</th>
                                    <th className="px-8 py-5 text-center">Amount</th>
                                    <th className="px-8 py-5 text-center">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : transactions.length > 0 ? (
                                    transactions.map((tx: Consultation, i: number) => {
                                        const practitioner = tx.participants?.find(p => p.participant_type?.code === 'professional');
                                        return (
                                            <motion.tr
                                                key={tx.id || tx._id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                className="group hover:bg-slate-50/30 transition-colors"
                                            >
                                                <td className="px-8 py-6">
                                                    <p className="text-xs font-black text-slate-400 tracking-widest">#{String(tx.id || tx._id).substring(0, 8).toUpperCase()}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 mt-1">{new Date(tx.createdAt || '').toLocaleDateString()}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-xs">
                                                            {practitioner?.name?.charAt(0) || 'C'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{tx.reason || 'Teleconsultation'}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{practitioner?.name || 'Assigned Professional'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <p className="text-sm font-black text-slate-900">₹{tx.totalPrice || '150.00'}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 ${getStatusStyles(tx.status)}`}>
                                                            {getStatusIcon(tx.status)}
                                                            {tx.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                                                        <ArrowUpRight size={18} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="space-y-4">
                                                <Wallet size={48} className="mx-auto text-slate-100" />
                                                <p className="text-slate-400 font-bold text-sm">No transaction records detected.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
