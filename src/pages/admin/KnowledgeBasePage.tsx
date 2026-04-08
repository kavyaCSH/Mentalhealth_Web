import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BookOpen, 
    Plus, 
    Search, 
    Filter, 
    ChevronRight, 
    MoreVertical,
    FileText,
    Users,
    Stethoscope,
    AlertCircle,
    CheckCircle2,
    Calendar,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import InputField from '../../components/ui/InputField';
import { KnowledgeBaseService } from '../../api/services/knowledge.service';
import type { AssessmentQuestion } from '../../types/assessment.types';

const KnowledgeBasePage = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state for new question
    const [newQuestion, setNewQuestion] = useState<Partial<AssessmentQuestion>>({
        text: '',
        patientText: '',
        professionalText: '',
        category: 'general_health',
        type: 'scale',
        minAge: 0,
        maxAge: 120,
        gender: 'all',
        options: [
            { _id: '1', text: 'Never', score: 0 },
            { _id: '2', text: 'Occasionally', score: 1 },
            { _id: '3', text: 'Often', score: 2 },
            { _id: '4', text: 'Always', score: 3 },
        ]
    });

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        setIsLoading(true);
        try {
            const data = await KnowledgeBaseService.listQuestions();
            setQuestions(data);
        } catch (error) {
            console.error('Failed to load clinical repository:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateQuestion = async () => {
        if (!newQuestion.text || !newQuestion.category) return;
        setIsSaving(true);
        try {
            await KnowledgeBaseService.createQuestion(newQuestion);
            await loadQuestions();
            setShowCreateModal(false);
            setNewQuestion({
                text: '',
                patientText: '',
                professionalText: '',
                category: 'general_health',
                type: 'scale',
                minAge: 0,
                maxAge: 120,
                gender: 'all',
                options: [
                    { _id: '1', text: 'Never', score: 0 },
                    { _id: '2', text: 'Occasionally', score: 1 },
                    { _id: '3', text: 'Often', score: 2 },
                    { _id: '4', text: 'Always', score: 3 },
                ]
            });
        } catch (error) {
            console.error('Failed to augment clinical repository:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const categories = ['all', ...new Set(questions.map(q => q.category))];

    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             q.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || q.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="p-8 space-y-10 animate-fade-in max-w-7xl  pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-xs font-black text-muted uppercase tracking-widest hover:text-indigo-500 transition-colors mb-4"
                    >
                        <ArrowLeft size={14} /> System Command
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl glow-primary">
                            <BookOpen size={30} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-main tracking-tight">Clinical Knowledge Base</h1>
                            <p className="text-muted font-medium">Platform-wide medical repository for structured clinical assessments.</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button 
                        variant="primary" 
                        size="lg" 
                        leftIcon={<Plus size={20} />}
                        onClick={() => setShowCreateModal(true)}
                        className="shadow-xl shadow-indigo-500/10"
                    >
                        New Clinical Question
                    </Button>
                </div>
            </header>

            {/* Repository Stats */}
            <div className="grid gap-6 md:grid-cols-4">
                {[
                    { label: 'Total Base', value: questions.length, icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                    { label: 'Active Categories', value: categories.length - 1, icon: Filter, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Clinical Aspects', value: '7', icon: Stethoscope, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                    { label: 'Audited Writes', value: 'Active', icon: CheckCircle2, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 glass-card group flex items-center gap-5"
                    >
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <stat.icon size={26} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                            <h3 className="text-2xl font-black text-main leading-none">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-page/50 p-6 rounded-[2.5rem] border border-border-card backdrop-blur-xl">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                activeCategory === cat 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10' 
                                : 'bg-card text-muted border border-border-card hover:border-indigo-500/40'
                            }`}
                        >
                            {cat.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input
                        type="text"
                        placeholder="Search clinical text..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card border border-border-card rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-main"
                    />
                </div>
            </div>

            {/* Knowledge Table */}
            <div className="card-premium overflow-hidden border-border-card shadow-sm bg-card">
                <table className="w-full text-left">
                    <thead className="bg-page border-b border-border-card">
                        <tr className="text-[10px] font-black text-muted uppercase tracking-widest">
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5">Clinical Domain</th>
                            <th className="px-8 py-5">Primary Observation Question</th>
                            <th className="px-8 py-5">Demographics</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-card">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                </td>
                            </tr>
                        ) : filteredQuestions.length > 0 ? (
                            filteredQuestions.map((q, i) => (
                                <motion.tr 
                                    key={q._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="group hover:bg-indigo-500/5 transition-colors"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Audited</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                                            {q.category.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 max-w-md">
                                        <p className="text-sm font-black text-main leading-snug">{q.text}</p>
                                        <div className="flex gap-4 mt-2">
                                            {q.patientText && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted">
                                                    <Users size={12} /> Patient Context: Active
                                                </div>
                                            )}
                                            {q.professionalText && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted">
                                                    <Stethoscope size={12} /> Specialist Context: Active
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-muted">
                                                <Calendar size={12} className="text-muted/30" />
                                                <span>Ages: {q.minAge || 0} - {q.maxAge || 120}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-muted">
                                                <Users size={12} className="text-muted/30" />
                                                <span className="uppercase">{q.gender || 'Universal'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 text-muted/40 hover:text-indigo-500 hover:bg-page rounded-xl transition-all shadow-sm hover:shadow-md">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <div className="max-w-xs mx-auto space-y-4">
                                        <AlertCircle size={48} className="mx-auto text-muted/20" />
                                        <p className="text-muted font-bold">No clinical questions matching your criteria were found in the secure repository.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Question Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-page/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative p-12 border border-border-card"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
                            <header className="mb-10 text-center">
                                <h2 className="text-4xl font-black text-main tracking-tight mb-2">New Clinical Question</h2>
                                <p className="text-muted font-medium">The platform will automatically record a WRITE audit event for this action.</p>
                            </header>

                            <div className="grid gap-8 md:grid-cols-2">
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest pb-2 border-b border-indigo-50">Linguistic Contexts</h3>
                                    <InputField 
                                        label="Primary clinical text" 
                                        placeholder="Enter the main question text..."
                                        value={newQuestion.text}
                                        onChange={(e) => setNewQuestion({...newQuestion, text: e.target.value})}
                                    />
                                    <InputField 
                                        label="Patient-Friendly version" 
                                        placeholder="Simplified language for self-assessments..."
                                        value={newQuestion.patientText}
                                        onChange={(e) => setNewQuestion({...newQuestion, patientText: e.target.value})}
                                    />
                                    <InputField 
                                        label="Specialist Version" 
                                        placeholder="Professional terminology for specialists..."
                                        value={newQuestion.professionalText}
                                        onChange={(e) => setNewQuestion({...newQuestion, professionalText: e.target.value})}
                                    />
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest pb-2 border-b border-indigo-500/10">Clinical Demographics</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField 
                                            label="Clinical Category" 
                                            value={newQuestion.category}
                                            onChange={(e) => setNewQuestion({...newQuestion, category: e.target.value})}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Question Type</label>
                                            <select 
                                                className="w-full bg-page border border-border-card rounded-xl px-4 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-main"
                                                value={newQuestion.type}
                                                onChange={(e: any) => setNewQuestion({...newQuestion, type: e.target.value})}
                                            >
                                                <option value="scale">Rating Scale (0-3)</option>
                                                <option value="boolean">Boolean (Yes/No)</option>
                                                <option value="choice">Multiple Choice</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4">
                                        <InputField 
                                            label="Min Age" 
                                            type="number"
                                            value={newQuestion.minAge}
                                            onChange={(e) => setNewQuestion({...newQuestion, minAge: Number(e.target.value)})}
                                        />
                                        <InputField 
                                            label="Max Age" 
                                            type="number"
                                            value={newQuestion.maxAge}
                                            onChange={(e) => setNewQuestion({...newQuestion, maxAge: Number(e.target.value)})}
                                        />
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Gender Target</label>
                                            <select 
                                                className="w-full bg-page border border-border-card rounded-xl px-4 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-main"
                                                value={newQuestion.gender}
                                                onChange={(e: any) => setNewQuestion({...newQuestion, gender: e.target.value})}
                                            >
                                                <option value="all">Universal</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-page rounded-[2rem] border border-border-card">
                                        <div className="flex items-center justify-between mb-4 px-2">
                                            <h4 className="text-[10px] font-black text-muted uppercase tracking-widest">Scale Calibration</h4>
                                            <span className="text-[10px] font-bold text-indigo-500">Weighted Scoring</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {newQuestion.options?.map((opt, idx) => (
                                                <div key={idx} className="bg-card p-3 rounded-xl border border-border-card flex items-center gap-3">
                                                    <span className="w-6 h-6 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center text-[10px] font-black">{opt.score}</span>
                                                    <span className="text-[10px] font-bold text-muted">{opt.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-12 border-t border-slate-50 pt-10">
                                <Button variant="outline" size="lg" className="flex-1 rounded-2xl" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    className="flex-1 rounded-2xl shadow-xl shadow-indigo-500/10"
                                    onClick={handleCreateQuestion}
                                    isLoading={isSaving}
                                    leftIcon={<CheckCircle2 size={18} />}
                                >
                                    Push to Clinical Repo
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KnowledgeBasePage;
