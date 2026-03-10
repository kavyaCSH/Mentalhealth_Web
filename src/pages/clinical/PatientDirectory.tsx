import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Users,
    Activity,
    ChevronRight,
    Phone,
    Mail,
    Plus
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { UserService } from '../../api/services/user.service';
import type { Patient } from '../../types/user.types';

const PatientDirectory = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'my_patients' | 'all'>('my_patients');

    useEffect(() => {
        const fetchPatients = async () => {
            setIsLoading(true);
            try {
                // Using the users list endpoint from Postman to get patients
                const data = activeTab === 'my_patients'
                    ? await UserService.getMySubordinates()
                    : await UserService.listUsers({ role: 'patient' });

                setPatients(Array.isArray(data) ? (data as Patient[]) : []);
            } catch (error) {
                console.error('Failed to fetch patients:', error);
                setPatients([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatients();
    }, [activeTab]);

    const filteredPatients = patients.filter(p =>
        p.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getRiskColor = (risk: string) => {
        switch (risk?.toLowerCase()) {
            case 'high': return 'text-red-600 bg-red-50 border-red-100';
            case 'medium': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Patient Directory</h1>
                    <p className="text-slate-500 font-medium mt-2">Manage and monitor your assigned clinical patients.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="primary" leftIcon={<Plus size={18} />}>
                        Enroll Patient
                    </Button>
                </div>
            </header>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row gap-6 p-2 items-center justify-between">
                <div className="flex p-1 bg-slate-100/80 rounded-2xl w-full lg:w-auto">
                    <button
                        onClick={() => setActiveTab('my_patients')}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'my_patients' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        My Patients
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        Facility List
                    </button>
                </div>

                <div className="flex gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-80">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                    <Button variant="outline" className="shrink-0 aspect-square p-0 w-12 h-12 flex items-center justify-center">
                        <Filter size={18} className="text-slate-500" />
                    </Button>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Activity className="animate-spin text-indigo-600" size={40} />
                </div>
            ) : filteredPatients.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredPatients.map((patient, index) => (
                            <motion.div
                                key={patient.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(`/patients/${patient.id}`)}
                                className="card-premium p-6 group cursor-pointer hover:border-indigo-300 transition-all relative overflow-hidden flex flex-col"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 text-indigo-700 rounded-[1.25rem] flex items-center justify-center font-black text-xl border border-indigo-100 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                                                {patient.firstName} {patient.lastName}
                                            </h3>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {String(patient.id).substring(0, 8)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6 flex-1">
                                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                        <Activity size={16} className="text-indigo-400" />
                                        <span className="truncate">{patient.diagnosis || 'No diagnosis recorded'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Phone size={14} className="text-slate-400 shrink-0" />
                                        <span>{patient.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Mail size={14} className="text-slate-400 shrink-0" />
                                        <span className="truncate">{patient.email}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRiskColor(patient.riskLevel || 'Low')}`}>
                                        {patient.riskLevel || 'Low'} Risk
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 tooltip-trigger relative group/tooltip">
                                        <span>Seen: {patient.lastSession}</span>
                                        <ChevronRight size={16} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="text-center py-24 glass-card">
                    <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                        <Users size={40} className="text-slate-300" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">No Patients Found</h3>
                    <p className="text-slate-500 font-medium">No records match your search criteria.</p>
                </div>
            )}
        </div>
    );
};

export default PatientDirectory;
