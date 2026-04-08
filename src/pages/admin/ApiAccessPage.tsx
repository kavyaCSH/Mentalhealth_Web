import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, 
    Plus, 
    Search, 
    Filter, 
    MoreVertical,
    Lock,
    Unlock,
    Users,
    Layers,
    CheckCircle2,
    Trash2,
    AlertCircle,
    ArrowLeft,
    ShieldAlert,
    Database,
    Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { SecurityService } from '../../api/services/security.service';
import type { ApiAccessRule } from '../../types/system.types';

const ApiAccessPage = () => {
    const navigate = useNavigate();
    const [rules, setRules] = useState<ApiAccessRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form state for new rule
    const [newRule, setNewRule] = useState<Partial<ApiAccessRule>>({
        role_code: '',
        resource: '',
        permissions: ['read']
    });

    useEffect(() => {
        loadRules();
    }, []);

    const loadRules = async () => {
        setIsLoading(true);
        try {
            const data = await SecurityService.listAccessRules();
            setRules(data);
        } catch (error) {
            console.error('Failed to load security registry:', error);
            setMessage({ type: 'error', text: 'Critical: Security registry is currently unreachable.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRule = async () => {
        if (!newRule.role_code || !newRule.resource) return;
        setIsSaving(true);
        try {
            await SecurityService.createAccessRule(newRule);
            await loadRules();
            setShowCreateModal(false);
            setNewRule({ role_code: '', resource: '', permissions: ['read'] });
            setMessage({ type: 'success', text: 'New access rule successfully registered in the platform ACL.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to synchronize rule. Verify Super Admin clearance.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (!window.confirm('Revoking this access rule may disconnect automated services. Proceed?')) return;
        try {
            await SecurityService.deleteAccessRule(id);
            await loadRules();
            setMessage({ type: 'success', text: 'Access rule revoked and removed from governance registry.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Revocation failed. ACL is currently locked.' });
        }
    };

    const togglePermission = (perm: 'create' | 'read' | 'update' | 'delete') => {
        const current = newRule.permissions || [];
        if (current.includes(perm)) {
            setNewRule({ ...newRule, permissions: current.filter(p => p !== perm) });
        } else {
            setNewRule({ ...newRule, permissions: [...current, perm] });
        }
    };

    const filteredRules = rules.filter(r => 
        r.role_code.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.resource.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const roles = ['all', 'patient', 'psychiatrist', 'psychologist', 'nurse', 'social_worker', 'intern_specialist', 'hospital', 'admin'];
    const resources = ['ClinicalRecords', 'Billing', 'UserManagement', 'Appointments', 'SystemSettings', 'AuditLogs', 'Consultations'];

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl  pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> Security Console
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <ShieldCheck size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight text-main">API Access Governance</h1>
                            <p className="text-muted font-medium">Granular Role-Based Access Control (RBAC) and clinical resource sovereignty.</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="px-5 py-2.5 bg-slate-900 border border-slate-700 rounded-2xl flex items-center gap-3 text-white shadow-lg shadow-slate-100">
                        <ShieldAlert size={18} className="text-rose-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Auth Integrity: Verified</span>
                    </div>
                    <Button 
                        variant="primary" 
                        size="lg" 
                        leftIcon={<Plus size={20} />}
                        onClick={() => setShowCreateModal(true)}
                        className="shadow-xl shadow-indigo-100"
                    >
                        Define Access Rule
                    </Button>
                </div>
            </header>

            {/* Platform Security Metrics */}
            <div className="grid gap-6 md:grid-cols-4">
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Layers size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Resource Registry</p>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">{resources.length} Protected</h3>
                    </div>
                </div>
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Defined Roles</p>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">{roles.length} Audited</h3>
                    </div>
                </div>
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Global Lock</p>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">Inactive</h3>
                    </div>
                </div>
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                        <Database size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Registry sync</p>
                        <h3 className="text-2xl font-black text-slate-900 leading-none">Real-time</h3>
                    </div>
                </div>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-6 rounded-3xl border flex items-center gap-4 ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}
                >
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <p className="font-bold text-sm tracking-tight">{message.text}</p>
                </motion.div>
            )}

            {/* Filter Hub */}
            <div className="card-premium p-6 flex flex-col md:flex-row gap-6 items-center justify-between border-slate-100/50">
                <div className="flex items-center gap-3">
                    <Filter className="text-slate-300" size={20} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-6 mr-2">Global ACL Filters</span>
                    <button className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Live Registry</button>
                    <button className="px-5 py-2 bg-white text-slate-400 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50">Locked Categories</button>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search roles or resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                </div>
            </div>

            {/* ACL Registry Matrix */}
            <div className="grid gap-6">
                {isLoading ? (
                    <div className="p-32 text-center bg-white rounded-[4rem] border border-slate-100">
                        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Decrypting Security Registry...</p>
                    </div>
                ) : filteredRules.length > 0 ? (
                    filteredRules.map((rule, i) => (
                        <motion.div
                            key={rule._id || rule.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="card-premium p-8 group relative hover:border-indigo-200 transition-all cursor-pointer overflow-hidden border-slate-100/50"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="flex items-center gap-8 flex-1">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all shrink-0">
                                        <Lock size={28} />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-xl">
                                                Role: {rule.role_code.replace(/_/g, ' ')}
                                            </span>
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                                Resource: {rule.resource}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['create', 'read', 'update', 'delete'].map((perm) => {
                                                const hasPerm = rule.permissions.includes(perm as any);
                                                return (
                                                    <div 
                                                        key={perm}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                            hasPerm 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                            : 'bg-white text-slate-200 border-slate-50'
                                                        }`}
                                                    >
                                                        {hasPerm ? <CheckCircle2 size={12} /> : <Unlock size={12} />}
                                                        {perm}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 self-end md:self-center">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteRule(rule.id || rule._id || '');
                                        }}
                                        className="p-4 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                                        title="Revoke Permission"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                    <button className="p-4 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="p-32 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-100">
                        <Lock size={64} className="mx-auto text-slate-200 mb-6" />
                        <h3 className="text-xl font-black text-slate-900 mb-2">No Access Rules Matrix</h3>
                        <p className="text-sm font-medium text-slate-400 italic">No role-to-resource mappings have been registered in the security governance layer.</p>
                    </div>
                )}
            </div>

            {/* Create Rule Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 space-y-10">
                                <header className="text-center space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Security Registry Build</h2>
                                    <p className="text-slate-500 text-sm font-medium italic">Configure resource-specific permissions for the specified group.</p>
                                </header>

                                <div className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Target Role</label>
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                                                value={newRule.role_code}
                                                onChange={(e) => setNewRule({...newRule, role_code: e.target.value})}
                                            >
                                                <option value="">Select Role Code</option>
                                                {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cloud Resource</label>
                                            <select 
                                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                                                value={newRule.resource}
                                                onChange={(e) => setNewRule({...newRule, resource: e.target.value})}
                                            >
                                                <option value="">Select Resource</option>
                                                {resources.map(res => <option key={res} value={res}>{res}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Authorized Actions</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                            {['create', 'read', 'update', 'delete'].map((perm) => {
                                                const isActive = newRule.permissions?.includes(perm as any);
                                                return (
                                                    <button
                                                        key={perm}
                                                        onClick={() => togglePermission(perm as any)}
                                                        className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-3 ${
                                                            isActive 
                                                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 border-transparent scale-105' 
                                                            : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        {isActive ? <CheckCircle2 size={20} /> : <Unlock size={20} />}
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{perm}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-start gap-4">
                                        <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                                        <p className="text-[11px] font-bold text-rose-900 leading-relaxed">
                                            Immediate Platform Impact: Registering this access rule will override existing permissions for the selected role globally. Ensure you have clinical sign-off before committing.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <Button variant="outline" className="flex-1 rounded-2xl h-16" onClick={() => setShowCreateModal(false)}>Cancel Build</Button>
                                    <Button 
                                        variant="primary" 
                                        className="flex-1 rounded-2xl shadow-xl shadow-indigo-100 h-16 font-black uppercase tracking-widest text-xs"
                                        onClick={handleCreateRule}
                                        isLoading={isSaving}
                                        leftIcon={<ShieldCheck size={18} />}
                                    >
                                        Commit Access Rule
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ApiAccessPage;
