import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Settings, Save, AlertCircle, RefreshCcw, 
    ChevronLeft, Shield, CheckCircle2, Loader2,
    Monitor, Globe, History
} from 'lucide-react';
import { SystemService } from '../../api/services/system.service';

const GlobalSettingsPage = () => {
    const navigate = useNavigate();
    const [webVersion, setWebVersion] = useState('');
    const [originalVersion, setOriginalVersion] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const v = await SystemService.getWebVersion();
                setWebVersion(v);
                setOriginalVersion(v);
            } catch (err) {
                console.error('Failed to load system settings:', err);
                setMessage({ type: 'error', text: 'Critical: System parameters could not be retrieved from the cloud.' });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleUpdateVersion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (webVersion === originalVersion) return;
        
        setSaving(true);
        setMessage(null);

        try {
            const res = await SystemService.updateWebVersion(webVersion);
            if (res.code === 200 || res.code === 201) {
                setMessage({ type: 'success', text: 'Web version updated successfully across all production environments.' });
                setOriginalVersion(webVersion);
                // Prompt user to reload browser after a short delay
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch (err) {
            console.error('Failed to update web version:', err);
            setMessage({ type: 'error', text: 'Update Failed: Ensure you have Super Admin privileges for this operation.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F9FBFA]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-indigo-600 animate-spin" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing System Governance...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FBFA] pb-24">
            {/* Admin Header */}
            <div className="bg-slate-900 sticky top-0 z-40 border-b border-white/5">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-11 h-11 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>
                        <div>
                            <h1 className="text-lg font-black text-white leading-none tracking-tight">System Configuration</h1>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1.5 opacity-80">Global Core Infrastructure</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                            <Shield size={12} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.1em]">Super Admin Access Granted</span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left Column: Settings Form */}
                <div className="lg:col-span-12">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                    <Monitor size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Platform Versioning</h2>
                                    <p className="text-xs font-medium text-slate-500">Manage the current production build identifier.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400">
                                <History size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Last change: Today</span>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateVersion} className="p-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Web Production Version</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                        <input 
                                            type="text"
                                            value={webVersion}
                                            onChange={(e) => setWebVersion(e.target.value)}
                                            placeholder="e.g. 2.4.1"
                                            className="w-full bg-slate-50 border border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl py-5 pl-14 pr-6 outline-none transition-all font-black text-xl text-slate-900 placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="mt-6 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                        <div className="flex items-start gap-4">
                                            <AlertCircle size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                                            <p className="text-xs font-semibold text-indigo-900 leading-relaxed">
                                                Modifying the web version string will update the Troubleshooting Footer across all user interfaces. This build identifier should correspond to the latest CI/CD deployment tag.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Current Stable Version</p>
                                            <p className="text-2xl font-black text-slate-900">{originalVersion || '...'}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-slate-100">
                                            <CheckCircle2 size={24} />
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 rounded-3xl p-8 flex items-center justify-between text-white">
                                        <div>
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5">Staging/Next Release</p>
                                            <p className="text-2xl font-black text-white">{webVersion || '...'}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                                            <RefreshCcw size={24} className={saving ? 'animate-spin' : ''} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {message && (
                                <div className={`p-5 rounded-2xl flex items-center gap-4 border transition-all ${
                                    message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                                } animate-in fade-in slide-in-from-top-2`}>
                                    {message.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                                    <p className="text-sm font-black uppercase tracking-tight">{message.text}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-end pt-6 border-t border-slate-50 gap-4">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                                >
                                    Cancel Changes
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || webVersion === originalVersion}
                                    className="bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-indigo-200/50 flex items-center gap-3"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Synchronizing Database...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Update System Version
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default GlobalSettingsPage;
