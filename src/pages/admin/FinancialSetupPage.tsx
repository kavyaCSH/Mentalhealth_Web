import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Receipt, 
    Plus, 
    Search, 
    Trash2, 
    Edit3, 
    CheckCircle2, 
    AlertCircle, 
    IndianRupee, 
    Percent, 
    User as UserIcon,
    ChevronRight,
    Briefcase
} from 'lucide-react';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { FinancialsService } from '../../api/services/financials.service';
import { UserService } from '../../api/services/user.service';
import type { TaxCode, ChargeCode } from '../../types/common.types';
import type { User } from '../../types/user.types';

const FinancialSetupPage = () => {
    const [activeTab, setActiveTab] = useState<'taxes' | 'charges'>('taxes');
    const [taxes, setTaxes] = useState<TaxCode[]>([]);
    const [charges, setCharges] = useState<ChargeCode[]>([]);
    const [specialists, setSpecialists] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | number | null>(null);
    
    // Form state
    const [taxForm, setTaxForm] = useState<Partial<TaxCode>>({ code: '', name: '', rate: 0 });
    const [chargeForm, setChargeForm] = useState<Partial<ChargeCode>>({ 
        code: '', 
        name: '', 
        amount: 0, 
        specialist_id: '', 
        tax_codes: [],
        is_active: true 
    });

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [taxList, chargeList, userList] = await Promise.all([
                    FinancialsService.listTaxCodes(),
                    FinancialsService.listChargeCodes(),
                    UserService.listUsers({ role: 'psychiatrist,psychologist,nurse,counselor,social_worker' })
                ]);
                setTaxes(taxList);
                setCharges(chargeList);
                setSpecialists(userList.users);
            } catch (error) {
                console.error('Failed to load financial data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleCreateTax = async () => {
        if (!taxForm.code || !taxForm.name) return;
        setIsSaving(true);
        try {
            if (editingId !== null) {
                const updatedTax = await FinancialsService.updateTaxCode(editingId, taxForm);
                setTaxes(taxes.map(t => (t.id || t._id) === editingId ? updatedTax : t));
            } else {
                const newTax = await FinancialsService.createTaxCode(taxForm);
                setTaxes([...taxes, newTax]);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save tax code:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateCharge = async () => {
        if (!chargeForm.code || !chargeForm.name || !chargeForm.specialist_id || !chargeForm.tax_codes?.length) {
            alert('Please link at least one Tax Code and select a Professional.');
            return;
        }
        setIsSaving(true);
        try {
            if (editingId !== null) {
                const updatedCharge = await FinancialsService.updateChargeCode(editingId, chargeForm);
                setCharges(charges.map(c => (c.id || c._id) === editingId ? updatedCharge : c));
            } else {
                const newCharge = await FinancialsService.createChargeCode(chargeForm);
                setCharges([...charges, newCharge]);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save charge code:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (item: any) => {
        const id = item.id || item._id;
        setEditingId(id);
        if (activeTab === 'taxes') {
            setTaxForm({ code: item.code, name: item.name, rate: item.rate });
        } else {
            setChargeForm({ 
                code: item.code, 
                name: item.name, 
                amount: item.amount, 
                specialist_id: item.specialist_id, 
                tax_codes: item.tax_codes || [],
                is_active: item.is_active 
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setTaxForm({ code: '', name: '', rate: 0 });
        setChargeForm({ code: '', name: '', amount: 0, specialist_id: '', tax_codes: [], is_active: true });
    };

    const handleDeleteTax = async (id: string | number) => {
        if (!confirm('Are you sure you want to delete this tax code?')) return;
        try {
            await FinancialsService.deleteTaxCode(id);
            setTaxes(taxes.filter(t => (t.id || t._id) !== id));
        } catch (error) {
            alert('Cannot delete tax code. It might be linked to active charge codes.');
        }
    };

    const handleDeleteCharge = async (id: string | number) => {
        if (!confirm('Are you sure you want to delete this charge code?')) return;
        try {
            await FinancialsService.deleteChargeCode(id);
            setCharges(charges.filter(c => (c.id || c._id) !== id));
        } catch (error) {
            console.error('Failed to delete charge code:', error);
        }
    };

    return (
        <div className="p-8 max-w-7xl  space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-main tracking-tight">Financial Master</h1>
                    <p className="text-muted font-medium mt-2">Manage the platform's tax regulations and clinical service price lists.</p>
                </div>
                <Button 
                    variant="primary" 
                    size="lg" 
                    leftIcon={<Plus size={20} />}
                    onClick={() => {
                        setEditingId(null);
                        setShowModal(true);
                    }}
                >
                    Add {activeTab === 'taxes' ? 'Tax Rule' : 'Charge Code'}
                </Button>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm border border-emerald-500/20">
                        <Percent size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-muted uppercase tracking-widest">Active Tax Rules</p>
                        <h3 className="text-2xl font-black text-main">{taxes.length}</h3>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center shadow-sm border border-indigo-500/20">
                        <IndianRupee size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-muted uppercase tracking-widest">Revenue Matrix Items</p>
                        <h3 className="text-2xl font-black text-main">{charges.length}</h3>
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center gap-5">
                    <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center shadow-sm border border-orange-500/20">
                        <Briefcase size={28} />
                    </div>
                    <div>
                        <p className="text-xs font-black text-muted uppercase tracking-widest">Linked Specialists</p>
                        <h3 className="text-2xl font-black text-main">{new Set(charges.map(c => c.specialist_id)).size}</h3>
                    </div>
                </div>
            </div>

            {/* Tabs & Content */}
            <div className="card-premium overflow-hidden border-border-card shadow-xl shadow-indigo-200/10">
                <div className="flex border-b border-border-card bg-page/30 p-2 backdrop-blur-sm">
                    <button 
                        onClick={() => setActiveTab('taxes')}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'taxes' ? 'bg-card text-emerald-500 shadow-sm border border-border-card' : 'text-muted hover:text-main'
                        }`}
                    >
                        <Percent size={14} /> Tax Master
                    </button>
                    <button 
                        onClick={() => setActiveTab('charges')}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === 'charges' ? 'bg-card text-indigo-600 shadow-sm border border-border-card' : 'text-muted hover:text-main'
                        }`}
                    >
                        <Receipt size={14} /> Charge Matrix
                    </button>
                </div>

                <div className="p-0">
                    <table className="w-full text-left">
                        <thead className="bg-page/50 border-b border-border-card">
                            <tr>
                                <th className="p-5 pl-8 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Identification</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Definition</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">{activeTab === 'taxes' ? 'Rate (%)' : 'Amount'}</th>
                                <th className="p-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">{activeTab === 'taxes' ? 'Status' : 'Specialist'}</th>
                                <th className="p-5 pr-8 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <tr key="loading">
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-10 h-10 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin" />
                                                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Querying Core Financials...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (activeTab === 'taxes' ? taxes : charges).length > 0 ? (
                                    (activeTab === 'taxes' ? taxes : charges).map((item, idx) => (
                                        <motion.tr 
                                            key={item.id || (item as any)._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="border-b border-border-card hover:bg-page/40 transition-colors group"
                                        >
                                            <td className="p-5 pl-8">
                                                <span className="px-3 py-1 bg-page text-muted rounded-lg text-[10px] font-mono font-black uppercase tracking-widest group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors border border-border-card">
                                                    {item.code}
                                                </span>
                                            </td>
                                            <td className="p-5">
                                                <p className="font-bold text-main">{item.name}</p>
                                                {activeTab === 'charges' && (
                                                    <div className="flex gap-1 mt-1.5 overflow-x-auto no-scrollbar">
                                                        {(item as ChargeCode).tax_codes?.map(tcId => {
                                                            const tax = taxes.find(t => (t.id || t._id) === tcId.toString());
                                                            return tax ? (
                                                                <span key={tcId} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-md text-[8px] font-black uppercase tracking-tighter whitespace-nowrap border border-emerald-500/20">
                                                                    {tax.code} ({tax.rate}%)
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-5">
                                                <p className="text-lg font-black text-main tracking-tight">
                                                    {activeTab === 'taxes' ? `${(item as TaxCode).rate}%` : `₹${(item as ChargeCode).amount}`}
                                                </p>
                                            </td>
                                            <td className="p-5">
                                                {activeTab === 'taxes' ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                                        <CheckCircle2 size={12} /> Active
                                                    </span>
                                                ) : (
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center font-black text-xs border border-indigo-500/20 shadow-sm">
                                                            {specialists.find(s => s.id === (item as ChargeCode).specialist_id)?.firstName?.charAt(0) || 'S'}
                                                        </div>
                                                        <p className="text-sm font-bold text-main">
                                                            {specialists.find(s => s.id === (item as ChargeCode).specialist_id)?.firstName || 'Specialist'}
                                                        </p>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-5 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 text-muted hover:text-indigo-500 hover:bg-page rounded-lg transition-all border border-transparent hover:border-border-card"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => activeTab === 'taxes' ? handleDeleteTax(item.id || (item as any)._id) : handleDeleteCharge(item.id || (item as any)._id)}
                                                        className="p-2 text-muted hover:text-red-500 hover:bg-page rounded-lg transition-all border border-transparent hover:border-border-card"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <tr key="empty">
                                        <td colSpan={5} className="p-20 text-center">
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                                <AlertCircle size={48} className="mx-auto mb-4 text-muted opacity-20" />
                                                <p className="font-black text-main mb-1 uppercase tracking-widest">No Financial Rules Found</p>
                                                <p className="text-sm text-muted max-w-xs mx-auto">Click the button above to begin configuring your platform's financial master.</p>
                                            </motion.div>
                                        </td>
                                    </tr>
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal - Simplified for now */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-fade-in">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card rounded-3xl p-10 max-w-xl w-full shadow-2xl relative overflow-hidden border border-border-card"
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
                        <h2 className="text-3xl font-black text-main tracking-tight mb-2">
                            {editingId ? 'Update' : 'Create'} {activeTab === 'taxes' ? 'Tax Rule' : 'Charge Code'}
                        </h2>
                        <p className="text-muted font-medium mb-8">
                            {activeTab === 'taxes' 
                                ? 'Define a new tax rate to be applied across services.' 
                                : 'Establish service pricing for a specific clinical professional.'}
                        </p>

                        <div className="space-y-6">
                            {activeTab === 'taxes' ? (
                                <>
                                    <InputField label="Tax Code (e.g. VAT_15)" value={taxForm.code} onChange={e => setTaxForm({...taxForm, code: e.target.value})} />
                                    <InputField label="Formal Name" value={taxForm.name} onChange={e => setTaxForm({...taxForm, name: e.target.value})} />
                                    <InputField label="Rate Percentage (%)" type="number" value={taxForm.rate?.toString()} onChange={e => setTaxForm({...taxForm, rate: Number(e.target.value)})} />
                                </>
                            ) : (
                                <>
                                    <InputField label="Charge Code (e.g. CONSULT_01)" value={chargeForm.code} onChange={e => setChargeForm({...chargeForm, code: e.target.value})} />
                                    <InputField label="Service Description" value={chargeForm.name} onChange={e => setChargeForm({...chargeForm, name: e.target.value})} />
                                    <InputField label="Amount (INR)" type="number" value={chargeForm.amount?.toString()} onChange={e => setChargeForm({...chargeForm, amount: Number(e.target.value)})} />
                                    
                                     <div className="space-y-2">
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Assign Specialist</p>
                                        <select 
                                            className="w-full bg-page border border-border-card rounded-2xl py-4 px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm text-main"
                                            value={chargeForm.specialist_id}
                                            onChange={e => setChargeForm({...chargeForm, specialist_id: e.target.value})}
                                        >
                                            <option value="">Select a Professional...</option>
                                            {specialists.map(s => (
                                                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</option>
                                            ))}
                                        </select>
                                    </div>

                                     <div className="space-y-3">
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Select Applicable Taxes</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {taxes.map(tax => (
                                                <label key={tax.id || (tax as any)._id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                                                    chargeForm.tax_codes?.includes(tax.id || (tax as any)._id) 
                                                        ? 'bg-emerald-500/10 border-emerald-500/20' 
                                                        : 'hover:bg-page border-border-card'
                                                }`}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 rounded-lg border-border-card text-emerald-600 focus:ring-emerald-500 transition-all opacity-0 absolute"
                                                        checked={chargeForm.tax_codes?.includes(tax.id || (tax as any)._id) || false}
                                                        onChange={(e) => {
                                                            const id = tax.id || (tax as any)._id;
                                                            const current = chargeForm.tax_codes || [];
                                                            if (e.target.checked) setChargeForm({...chargeForm, tax_codes: [...current, id]});
                                                            else setChargeForm({...chargeForm, tax_codes: current.filter(cid => cid !== id)});
                                                        }}
                                                    />
                                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                        chargeForm.tax_codes?.includes(tax.id || (tax as any)._id) 
                                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                                                            : 'border-border-card bg-page'
                                                    }`}>
                                                        {chargeForm.tax_codes?.includes(tax.id || (tax as any)._id) && <CheckCircle2 size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-main leading-none">{tax.code}</p>
                                                        <p className="text-[9px] font-bold text-muted mt-1 uppercase tracking-widest">{tax.rate}% Rate</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-4 mt-12">
                            <Button variant="outline" size="lg" className="flex-1" onClick={handleCloseModal}>Cancel</Button>
                            <Button 
                                variant="primary" 
                                size="lg" 
                                className="flex-1" 
                                isLoading={isSaving}
                                onClick={activeTab === 'taxes' ? handleCreateTax : handleCreateCharge}
                            >
                                {editingId ? 'Confirm Update' : 'Confirm Save'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default FinancialSetupPage;
