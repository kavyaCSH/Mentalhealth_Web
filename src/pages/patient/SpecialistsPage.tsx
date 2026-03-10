import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Users,
    Video,
    MapPin,
    Star,
    Calendar,
    Sparkles,
    ShieldCheck,
    ArrowUpRight
} from 'lucide-react';
import { SpecialistService } from '../../api/services/specialist.service';
import Button from '../../components/ui/Button';
import type { User } from '../../types/user.types';

const ROLES = [
    { label: 'All Specialists', value: 'all' },
    { label: 'Psychiatrists', value: 'psychiatrist' },
    { label: 'Psychologists', value: 'psychologist' },
    { label: 'Counselors', value: 'counselor' },
    { label: 'Therapists', value: 'therapist' },
];

const SpecialistsPage = () => {
    const navigate = useNavigate();
    const [specialists, setSpecialists] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeRole, setActiveRole] = useState('all');

    const fetchDirectory = async () => {
        try {
            setLoading(true);
            // Fallback to getSpecialists if Directory is empty for demo/robustness
            const data = await SpecialistService.getDirectory();
            const list = Array.isArray(data) ? data :
                Array.isArray(data?.data) ? data.data :
                    Array.isArray(data?.data?.masters) ? data.data.masters :
                        Array.isArray(data?.masters) ? data.masters : [];

            if (list.length === 0) {
                const altData = await SpecialistService.getSpecialists();
                const altList = Array.isArray(altData) ? altData : (altData as any)?.data || (altData as any)?.masters || [];
                setSpecialists(altList);
            } else {
                setSpecialists(list);
            }
        } catch (err) {
            console.error('Failed to fetch specialist directory', err);
            // Final fallback
            try {
                const fallback = await SpecialistService.getSpecialists();
                setSpecialists(Array.isArray(fallback) ? fallback : (fallback as any)?.data || []);
            } catch {
                setSpecialists([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDirectory();
    }, []);

    const filteredSpecialists = specialists.filter(s => {
        const matchesSearch = (s.name || `${s.firstName || ''} ${s.lastName || ''}`)
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
            (s.email || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = activeRole === 'all' || (s.role || '').toLowerCase() === activeRole.toLowerCase();

        return matchesSearch && matchesRole;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-indigo-600 mb-2">
                        <ShieldCheck size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Verified Clinical Directory</span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                        Clinical <span className="text-indigo-600">Specialists</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-2xl">
                        Connect with licensed mental health professionals tailored to your therapeutic requirements.
                    </p>
                </div>

                <div className="bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-100/50 border border-slate-50 flex items-center gap-2 group">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-[1.5rem] border border-slate-100 transition-all group-focus-within:border-indigo-200 group-focus-within:bg-white min-w-[300px]">
                        <Search size={18} className="text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, expertise..."
                            className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 w-full placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {/* Filters Row */}
            <section className="flex flex-wrap items-center gap-3">
                {ROLES.map((role) => (
                    <button
                        key={role.value}
                        onClick={() => setActiveRole(role.value)}
                        className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
                            ${activeRole === role.value
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105'
                                : 'bg-white border border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 shadow-sm'}`}
                    >
                        {role.label}
                    </button>
                ))}
            </section>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6 shadow-xl"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Syncing Directory Matrix...</p>
                </div>
            ) : filteredSpecialists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredSpecialists.map((specialist, i) => (
                            <motion.div
                                key={specialist.id || specialist._id || i}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="group glass-card p-8 hover:border-indigo-200 transition-all cursor-default relative overflow-hidden"
                            >
                                {/* Subtle Background Pattern */}
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50/30 rounded-full blur-3xl group-hover:bg-indigo-100/50 transition-colors duration-700"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="relative">
                                            <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                                <img
                                                    src={`https://i.pravatar.cc/150?u=${specialist.id || i}`}
                                                    alt={specialist.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                                <Star size={12} className="text-amber-500 fill-amber-500" />
                                                <span className="text-[10px] font-black text-amber-700">4.9</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                250+ Sessions
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-8 flex-1">
                                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {specialist.firstName} {specialist.lastName || specialist.name}
                                        </h3>
                                        <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.15em] flex items-center gap-2">
                                            {specialist.role || 'Clinical Professional'}
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            {specialist.specialization || 'Clinical Psychology'}
                                        </p>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-2 mt-4">
                                            Specializing in neural resilience and behavioral cognitive therapy with over 8 years of clinical residency.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-8">
                                        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <Video size={16} className="text-indigo-400" />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Virtual</span>
                                        </div>
                                        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <MapPin size={16} className="text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Clinic</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        className="w-full py-5 rounded-2xl group/btn overflow-hidden"
                                        onClick={() => navigate(`/schedule?professionalId=${specialist.id || specialist._id}`)}
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                            <Calendar size={18} />
                                            <span className="uppercase tracking-[0.2em] font-black">Schedule Session</span>
                                            <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        </div>
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-indigo-500 opacity-0 group-hover/btn:opacity-100 transition-opacity"
                                        />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <section className="py-40 flex flex-col items-center justify-center glass-card border-dashed">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-100 shadow-inner">
                        <Users size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No Matching Specialists</h3>
                    <p className="text-slate-500 font-medium max-w-sm text-center">
                        Try adjusting your search criteria or role filters to find clinical practitioners in your region.
                    </p>
                    <button
                        onClick={() => { setSearchQuery(''); setActiveRole('all'); }}
                        className="mt-8 text-indigo-600 font-black text-xs uppercase tracking-widest hover:text-indigo-700 underline underline-offset-8"
                    >
                        Reset All Filters
                    </button>
                </section>
            )}

            {/* Daily Insight Section */}
            <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-indigo-500/20 transition-colors duration-1000"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                                <Sparkles size={28} className="text-orange-300" />
                            </div>
                            <h2 className="text-3xl font-black leading-tight">Can't decide on a <br />clinical path?</h2>
                        </div>
                        <p className="text-indigo-100/70 font-medium max-w-xl text-lg italic">
                            "Our intelligent routing algorithm can analyze your assessment history to suggest the most compatible specialist for your cognitive baseline."
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                        <button className="px-10 py-5 bg-white text-indigo-900 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all shadow-xl active:scale-95">
                            Take Matching Quiz
                        </button>
                        <button className="px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white/20 transition-all shadow-xl active:scale-95">
                            Speak to Support
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SpecialistsPage;
