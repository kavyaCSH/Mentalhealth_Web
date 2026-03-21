import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Filter,
    Users,
    Activity,
    Phone,
    Plus,
    MoreHorizontal,
    HeartPulse
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { UserService } from '../../api/services/user.service';
import type { Patient } from '../../types/user.types';

const PatientDirectory = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchPatients = async () => {
            setIsLoading(true);
            try {
                // Fetch users with role 'patient', passing pagination info
                const { users, total } = await UserService.listUsers({ 
                    role: 'patient',
                    page: currentPage,
                    limit: itemsPerPage
                });
                
                setPatients(users as Patient[]);
                setTotalUsers(total || users.length);
            } catch (error) {
                console.error('Failed to fetch patients:', error);
                setPatients([]);
                setTotalUsers(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatients();
    }, [currentPage]);

    const filteredPatients = patients.filter(p =>
        p.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(totalUsers / itemsPerPage) || 1;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const getRiskColor = (risk: string) => {
        switch (risk?.toLowerCase()) {
            case 'high': return 'text-red-600 bg-red-50 border-red-100';
            case 'medium': return 'text-orange-600 bg-orange-50 border-orange-100';
            case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
            default: return 'text-slate-600 bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="p-8 max-w-7xl  space-y-8 animate-fade-in pb-20">
            {/* Search and Filters */}
            <div className="flex justify-between items-center p-2">
                <div className="flex gap-4">
                    <Button
                        variant="primary"
                        leftIcon={<Plus size={18} />}
                        className="rounded-2xl px-6 py-2 shadow-indigo-100 shadow-lg hover:shadow-indigo-200"
                    >
                        Add Patient
                    </Button>
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

            {/* Table List */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Activity className="animate-spin text-indigo-600" size={40} />
                </div>
            ) : filteredPatients.length > 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-visible">
                    <div className="overflow-x-visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] first:rounded-tl-[2.5rem]">Patient</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Risk Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recent Activity</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right last:rounded-tr-[2.5rem]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredPatients.map((patient, index) => {
                                    const patientId = patient.id || patient._id || `patient-${index}`;
                                    const isMenuOpen = openMenuId === patientId;
                                    
                                    return (
                                    <motion.tr
                                        key={patientId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className={`group transition-all cursor-pointer relative ${isMenuOpen ? 'z-50 bg-indigo-50/50 shadow-sm' : 'hover:bg-indigo-50/30 z-0'}`}
                                        onClick={() => navigate(`/patients/${patient.userId || patient.id || patient._id}`)}
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors tracking-tight text-base">
                                                        {patient.firstName} {patient.lastName}
                                                    </p>
                                                    <p className="text-[11px] font-bold text-slate-400 mt-1">{patient.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getRiskColor(patient.riskLevel || 'Low')}`}>
                                                {patient.riskLevel || 'Low'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-sm font-semibold text-slate-600">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-2 tracking-tight">
                                                    <Phone size={12} className="text-slate-300" /> {patient.phone || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="max-w-[200px]">
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider truncate border-b border-transparent group-hover:border-indigo-100 transition-all inline-block">
                                                    {patient.diagnosis || 'Standard Checkup'}
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-500 mt-1">Last: {patient.lastSession || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end">
                                                <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${patient.isActive !== false
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-slate-100 text-slate-400 border-slate-200'
                                                    }`}>
                                                    {patient.isActive !== false ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right relative">
                                            <div className="flex items-center justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(isMenuOpen ? null : patientId);
                                                    }}
                                                    className={`p-2 rounded-xl transition-all ${isMenuOpen ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                                                >
                                                    <MoreHorizontal size={20} />
                                                </button>

                                                <motion.div className="relative">
                                                    <AnimatePresence>
                                                        {isMenuOpen && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-[60]"
                                                                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                                                                />
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                    className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[70] py-2 overflow-hidden shadow-indigo-100/50"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <button
                                                                        onClick={() => {
                                                                            setOpenMenuId(null);
                                                                            navigate(`/patients/${patient.userId || patient.id || patient._id}/health`);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 transition-colors group/item"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all flex items-center justify-center">
                                                                            <Activity size={16} />
                                                                        </div>
                                                                        <p className="text-xs font-black text-slate-700">Health Overview</p>
                                                                    </button>

                                                                    <button
                                                                        onClick={() => {
                                                                            setOpenMenuId(null);
                                                                            navigate(`/patients/${patient.userId || patient.id || patient._id}`);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors group/item"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 group-hover/item:bg-slate-900 group-hover/item:text-white transition-all flex items-center justify-center">
                                                                            <Users size={16} />
                                                                        </div>
                                                                        <p className="text-xs font-black text-slate-700">View Profile</p>
                                                                    </button>
                                                                </motion.div>
                                                            </>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            </div>
                                        </td>
                                    </motion.tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                    <Pagination 
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalUsers}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
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
