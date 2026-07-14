import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Percent,
    Plus,
    Trash2,
    Edit2,
    Search,
    ArrowLeft,
    ShieldCheck,
    RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { FinancialsService } from '../../api/services/financials.service';
import type { TaxCode } from '../../types/common.types';

const TaxCodeManagement = () => {
    const navigate = useNavigate();
    const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCode, setEditingCode] = useState<TaxCode | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        percentage: '',
        description: ''
    });

    const fetchTaxCodes = async () => {
        setIsLoading(true);
        try {
            const data = await FinancialsService.listTaxCodes();
            setTaxCodes(data);
        } catch (error) {
            console.error('Failed to fetch tax codes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTaxCodes();
    }, []);

    const handleOpenModal = (code: TaxCode | null = null) => {
        if (code) {
            setEditingCode(code);
            setFormData({
                name: code.name,
                code: code.code,
                percentage: (code.rate || 0).toString(),
                description: code.description || ''
            });
        } else {
            setEditingCode(null);
            setFormData({
                name: '',
                code: '',
                percentage: '',
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                name: formData.name,
                code: formData.code,
                rate: parseFloat(formData.percentage),
                description: formData.description
            };

            if (editingCode) {
                await FinancialsService.updateTaxCode((editingCode.id || editingCode._id)!, payload);
            } else {
                await FinancialsService.createTaxCode(payload);
            }

            fetchTaxCodes();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Failed to save tax code:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this tax code?')) return;
        try {
            await FinancialsService.deleteTaxCode(id);
            fetchTaxCodes();
        } catch (error) {
            console.error('Failed to delete tax code:', error);
        }
    };

    const filteredCodes = taxCodes.filter(c => {
        const name = (c.name || '').toLowerCase();
        const code = (c.code || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return name.includes(query) || code.includes(query);
    });

    return (
        <div className="p-8 max-w-6xl  space-y-10 animate-fade-in pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs font-black text-muted opacity-80 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Back to Finance
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-100">
                            <Percent size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-main tracking-tight">Tax Schemes</h1>
                            <p className="text-muted font-medium">Manage facility tax codes and percentage distributions.</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" size="lg" onClick={fetchTaxCodes} leftIcon={<RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />}>
                        Sync
                    </Button>
                    <Button variant="primary" size="lg" onClick={() => handleOpenModal()} leftIcon={<Plus size={18} />}>
                        New Tax Code
                    </Button>
                </div>
            </header>

            <div className="relative max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-80" />
                <input
                    type="text"
                    placeholder="Search tax codes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card border border-border-card rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                />
            </div>

            {isLoading ? (
                <div className="py-24 text-center">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted opacity-80 font-black text-xs uppercase tracking-widest">Loading Analytics...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredCodes.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <AnimatePresence>
                                {filteredCodes.map((code, i) => (
                                    <motion.div
                                        key={code.id || code._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="card-premium p-8 group hover:shadow-2xl hover:shadow-emerald-100/30 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 font-black text-xl">
                                                {code.rate}%
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleOpenModal(code)} className="p-2 text-muted opacity-40 hover:text-indigo-600 transition-colors">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete((code.id || code._id)!)} className="p-2 text-muted opacity-40 hover:text-red-500 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <h3 className="text-xl font-black text-main leading-tight">{code.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest whitespace-nowrap">Code: {code.code}</span>
                                                    <span className="w-1 h-1 bg-border-card rounded-full" />
                                                    <span className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest whitespace-nowrap">
                                                        {code.createdAt ? new Date(code.createdAt).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        }) : 'Recently Added'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted font-medium line-clamp-3">{code.description || 'No description provided for this fiscal entry.'}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="py-24 text-center card-premium bg-card/50 border-dashed border-2">
                            <Percent size={48} className="mx-auto mb-4 text-slate-100" />
                            <p className="text-main font-black text-sm uppercase tracking-widest mb-1">No Tax Schemes Found</p>
                            <p className="text-muted opacity-80 font-medium text-sm">Create your first tax configuration to get started.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-card rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl shadow-slate-900/20"
                        >
                            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-main tracking-tight">{editingCode ? 'Edit Fiscal Code' : 'New Fiscal Entry'}</h2>
                                        <p className="text-xs font-bold text-muted opacity-80 uppercase tracking-widest">Define percentage based tax distribution</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                                    <InputField
                                        label="Display Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Sales Tax"
                                        required
                                    />
                                    <InputField
                                        label="System Code"
                                        value={formData.code}
                                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                                        placeholder="STAX-01"
                                        required
                                    />
                                    <InputField
                                        label="Percentage Value (%)"
                                        type="number"
                                        value={formData.percentage}
                                        onChange={(e) => setFormData(prev => ({ ...prev, percentage: e.target.value }))}
                                        placeholder="0.00"
                                        required
                                    />
                                    <div className="hidden md:block" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest ml-1">Notes / Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        placeholder="Optional fiscal notes..."
                                        className="w-full bg-page border border-border-card rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" size="lg" className="flex-1" onClick={() => setIsModalOpen(false)} type="button">
                                        Cancel
                                    </Button>
                                    <Button variant="primary" size="lg" className="flex-1 bg-emerald-600 hover:bg-emerald-700" type="submit" isLoading={isSaving}>
                                        {editingCode ? 'Update Entry' : 'Authorize Entry'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaxCodeManagement;
