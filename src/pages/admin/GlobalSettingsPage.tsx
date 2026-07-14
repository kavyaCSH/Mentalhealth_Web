import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Settings, 
    Save, 
    AlertCircle, 
    ChevronLeft, 
    Shield, 
    CheckCircle2, 
    Loader2,
    Globe, 
    Plus,
    Search,
    Filter,
    ArrowLeft,
    Database,
    Zap,
    Lock,
    Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemService } from '../../api/services/system.service';
import type { SystemSetting } from '../../types/system.types';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';

const GlobalSettingsPage = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<SystemSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form state for new/edit setting
    const [editingSetting, setEditingSetting] = useState<Partial<SystemSetting> | null>(null);

    const categories = ['all', 'general', 'clinical', 'communication', 'maintenance'];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await SystemService.listAllSettings();
            setSettings(data);
        } catch (err) {
            console.error('Failed to load system settings:', err);
            setMessage({ type: 'error', text: 'Critical: System parameters could not be retrieved.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSetting = async () => {
        if (!editingSetting?.key || !editingSetting?.value) return;
        setSaving(true);
        setMessage(null);
        try {
            await SystemService.updateSystemSetting(editingSetting);
            await fetchSettings();
            setShowCreateModal(false);
            setEditingSetting(null);
            setMessage({ type: 'success', text: `Setting '${editingSetting.key}' synchronized across the cluster.` });
        } catch (err) {
            setMessage({ type: 'error', text: 'Synchronization Failed: Verify Super Admin clearance.' });
        } finally {
            setSaving(false);
        }
    };

    const filteredSettings = settings.filter(s => {
        const matchesSearch = s.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || s.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-page">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-indigo-600 animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted opacity-80">Decrypting Infrastructure Variables...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl  pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-muted opacity-80 uppercase tracking-widest hover:text-indigo-600 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> System Command
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <Settings size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-main tracking-tight text-main">Infrastructure Config</h1>
                            <p className="text-muted font-medium">Global platform variables and core operational parameters.</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                        <Shield size={18} className="text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Surveillance: Active</span>
                    </div>
                    <Button 
                        variant="primary" 
                        leftIcon={<Plus size={20} />}
                        onClick={() => {
                            setEditingSetting({ key: '', value: '', category: 'general', description: '' });
                            setShowCreateModal(true);
                        }}
                        className="shadow-xl shadow-indigo-100"
                    >
                        New Variable
                    </Button>
                </div>
            </header>

            {/* Quick Status Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Database size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mb-1.5 leading-none">Deployment</p>
                        <h3 className="text-2xl font-black text-main leading-none">v{settings.find(s => s.key === 'web_version')?.value || '1.0.0'}</h3>
                    </div>
                </div>
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mb-1.5 leading-none">Maintenance</p>
                        <h3 className="text-2xl font-black text-main leading-none">Offline</h3>
                    </div>
                </div>
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Lock size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mb-1.5 leading-none">ACL Integrity</p>
                        <h3 className="text-2xl font-black text-main leading-none">Locked</h3>
                    </div>
                </div>
                <div className="p-6 glass-card group flex items-center gap-5">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Globe size={26} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest mb-1.5 leading-none">Env Mode</p>
                        <h3 className="text-2xl font-black text-main leading-none uppercase">Production</h3>
                    </div>
                </div>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-3xl border flex items-center gap-4 ${
                        message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                    }`}
                >
                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                    <p className="font-bold text-sm">{message.text}</p>
                </motion.div>
            )}

            {/* Filter Hub */}
            <div className="card-premium p-6 flex flex-col md:flex-row gap-6 items-center justify-between border-border-card/50">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                activeCategory === cat 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                : 'bg-page text-muted border border-border-card hover:border-indigo-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-40" size={18} />
                    <input
                        type="text"
                        placeholder="Search infrastructure keys..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-page border border-border-card rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Settings Registry */}
            <div className="card-premium overflow-hidden border-border-card/50">
                <table className="w-full text-left">
                    <thead className="bg-page border-b border-border-card">
                        <tr className="text-[11px] font-black text-muted uppercase tracking-widest">
                            <th className="px-8 py-5">Platform Key</th>
                            <th className="px-8 py-5">Current Global Value</th>
                            <th className="px-8 py-5">Category</th>
                            <th className="px-8 py-5">Last Synchronized</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredSettings.length > 0 ? (
                            filteredSettings.map((setting) => (
                                <motion.tr 
                                    key={setting.key}
                                    layout
                                    className="group hover:bg-page transition-colors cursor-pointer"
                                    onClick={() => {
                                        setEditingSetting(setting);
                                        setShowCreateModal(true);
                                    }}
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-black text-main font-mono tracking-tight">{setting.key}</span>
                                            <span className="text-[11px] font-bold text-muted">{setting.description || 'No specific description provided.'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="min-w-[120px]">
                                            <code className="px-3 py-1.5 bg-page text-indigo-700 rounded-lg text-[11px] font-black border border-border-card">
                                                {setting.value}
                                            </code>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                            setting.category === 'maintenance' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                            setting.category === 'clinical' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                            'bg-page text-muted border-border-card'
                                        }`}>
                                            {setting.category || 'general'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="text-[11px] font-black text-muted uppercase tracking-widest">
                                            {setting.updatedAt ? new Date(setting.updatedAt).toLocaleString() : 'Legacy Sync'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2.5 bg-card text-muted opacity-80 hover:text-indigo-600 rounded-xl border border-border-card hover:shadow-lg transition-all">
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="max-w-xs mx-auto space-y-4">
                                        <Settings size={48} className="mx-auto text-muted opacity-40" />
                                        <p className="text-muted opacity-80 font-bold uppercase text-[10px] tracking-widest">Registry Clear for Query</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showCreateModal && editingSetting && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card w-full max-w-xl rounded-[3rem] shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                            <div className="p-10 space-y-8">
                                <header className="text-center space-y-2">
                                    <h2 className="text-3xl font-black text-main tracking-tight">System Variable</h2>
                                    <p className="text-muted text-sm font-medium italic">All modifications are written to the cloud registry instantly.</p>
                                </header>

                                <div className="space-y-6">
                                    <InputField 
                                        label="Configuration Key (Unique)" 
                                        placeholder="e.g. maintenance_mode"
                                        value={editingSetting.key}
                                        onChange={(e) => setEditingSetting({...editingSetting, key: e.target.value})}
                                        disabled={!!editingSetting._id || !!settings.find(s => s.key === editingSetting.key)}
                                    />
                                    <InputField 
                                        label="Variable Value" 
                                        placeholder="e.g. true / v2.0.4"
                                        value={editingSetting.value}
                                        onChange={(e) => setEditingSetting({...editingSetting, value: e.target.value})}
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest px-1">Functional Category</label>
                                        <select 
                                            className="w-full bg-page border border-border-card rounded-2xl px-5 py-4 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                                            value={editingSetting.category}
                                            onChange={(e) => setEditingSetting({...editingSetting, category: e.target.value as any})}
                                        >
                                            <option value="general">General Platform</option>
                                            <option value="clinical">Clinical Infrastructure</option>
                                            <option value="communication">Communication Layer</option>
                                            <option value="maintenance">Maintenance & Safety</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-muted opacity-80 uppercase tracking-widest px-1">Internal Description</label>
                                        <textarea 
                                            rows={2}
                                            className="w-full bg-page border border-border-card rounded-2xl p-5 text-xs font-bold text-main outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            placeholder="What does this variable control?"
                                            value={editingSetting.description}
                                            onChange={(e) => setEditingSetting({...editingSetting, description: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => setShowCreateModal(false)}>Discard</Button>
                                    <Button 
                                        variant="primary" 
                                        className="flex-1 rounded-2xl shadow-xl shadow-indigo-100"
                                        onClick={handleSaveSetting}
                                        isLoading={saving}
                                        leftIcon={<Save size={18} />}
                                    >
                                        Sync Variable
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

export default GlobalSettingsPage;
