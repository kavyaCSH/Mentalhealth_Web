import React, { useState, useEffect, useRef } from 'react';
import {
    Brain,
    Clock,
    ChevronRight,
    Activity,
    CheckCircle2,
    FileText,
    Target,
    ChevronLeft
} from 'lucide-react';
import { MSEService } from '../../api/services/mse.service';
import Button from '../ui/Button';

interface ConsultMSEProps {
    patientId: string | number;
    consultId?: string | number;
    initialTab?: 'new' | 'history';
    onSave?: (data: any) => void;
}

export const ConsultMSE: React.FC<ConsultMSEProps> = ({
    patientId,
    consultId,
    onSave,
    initialTab = 'history'
}) => {
    const [activeTab, setActiveTab] = useState<'new' | 'history'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [history, setHistory] = useState<any[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    // Form State
    const [sections, setSections] = useState<any[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'history' && patientId) {
            fetchHistory();
        } else if (activeTab === 'new' && sections.length === 0) {
            fetchQuestionnaire();
        }
    }, [activeTab, patientId]);



    const fetchQuestionnaire = async () => {
        try {
            setLoading(true);
            const res = await MSEService.getQuestions();
            const data = (res as any).data || res;
            if (Array.isArray(data)) setSections(data);
        } catch (err) {
            console.error('[ConsultMSE] Failed to load MSE components:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        if (!patientId) return;
        try {
            setLoading(true);
            const res = await MSEService.listMSEByPatient(String(patientId));
            const data = (res as any).data || res;
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[ConsultMSE] Fetch history failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (section: string, key: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [section]: { ...(prev[section] || {}), [key]: value }
        }));
    };

    const handleMultiselectToggle = (section: string, key: string, option: string) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentArr = Array.isArray(currentSection[key]) ? [...currentSection[key]] : [];
            const newArr = currentArr.includes(option) ? currentArr.filter((o: string) => o !== option) : [...currentArr, option];
            return { ...prev, [section]: { ...currentSection, [key]: newArr } };
        });
    };



    const handleSave = async () => {
        const submissionData: any = { 
            patient_id: String(patientId), 
            consult_id: consultId ? Number(consultId) : 1,
            status: 'completed'
        };
        
        let hasData = false;
        sections.forEach(s => {
            const sectionData = responses[s.section];
            if (sectionData && Object.keys(sectionData).length > 0) {
                submissionData[s.section] = sectionData;
                hasData = true;
            }
        });

        if (!hasData) return;

        setSaving(true);
        try {
            const res = await MSEService.createMSE(submissionData);
            if (res) {
                if (onSave) onSave(res);
                setResponses({});
                setActiveTab('history');
                fetchHistory();
            }
        } catch (error) {
            console.error('[ConsultMSE] Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const renderQuestion = (section: string, q: any) => {
        const val = responses[section]?.[q.key];
        switch (q.type) {
            case 'select':
            case 'multiselect':
                return (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {q.options?.map((opt: string) => {
                            const isSel = q.type === 'select' ? val === opt : (Array.isArray(val) && val.includes(opt));
                            return (
                                <button key={opt} onClick={() => q.type === 'select' ? handleValueChange(section, q.key, opt) : handleMultiselectToggle(section, q.key, opt)}
                                    className={`p-3 rounded-xl border text-left transition-all ${isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-tight">{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            case 'boolean':
                return (
                    <div className="flex gap-2 mt-2">
                        {[true, false].map(v => (
                            <button key={v ? 'y' : 'n'} onClick={() => handleValueChange(section, q.key, v)}
                                className={`flex-1 p-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${val === v ? (v ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-800 border-slate-800 text-white') : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                {v ? 'Normal' : 'Atypical'}
                            </button>
                        ))}
                    </div>
                );
            case 'text':
                return <textarea value={val || ''} onChange={e => handleValueChange(section, q.key, e.target.value)} className="w-full h-24 bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[10px] font-bold mt-2 outline-none focus:bg-white transition-all resize-none" />;
            default: return null;
        }
    };

    const currentSection = sections[currentStep];

    const renderHistory = () => (
        <div className="space-y-4 pt-2">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Activity className="animate-spin text-slate-400 mb-4" size={24} />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Synchronizing Archives...</p>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-white">
                    <Brain size={28} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No mental status logs detected</p>
                    <Button
                        variant="primary"
                        size="sm"
                        className="mt-6 rounded-lg text-[9px] font-black uppercase tracking-widest px-6"
                        onClick={() => setActiveTab('new')}
                    >
                        Initialize Exam
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((record, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedRecord(record)}
                            className="w-full text-left bg-white p-4 rounded-xl border-2 border-slate-200 hover:border-violet-600 transition-all group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={10} />
                                    {new Date(record.createdAt).toLocaleDateString()}
                                </span>
                                <div className="p-1 rounded bg-slate-50 text-slate-300 group-hover:text-violet-600 transition-colors">
                                    <ChevronRight size={14} />
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-slate-600 leading-relaxed line-clamp-2">
                                {record.narrative ? `"${record.narrative}"` : 'Mental status documentation available.'}
                            </p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderNew = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-20 pt-1">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Mental State Exam</h3>
             </div>


                <div className="space-y-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {sections.map((s, idx) => (
                             <button key={s.section} onClick={() => setCurrentStep(idx)} className={`px-4 py-3 rounded-xl border-2 whitespace-nowrap text-[9px] font-black uppercase tracking-widest transition-all ${idx === currentStep ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'}`}>{s.title}</button>
                        ))}
                    </div>

                    {currentSection && (
                        <div className="card-premium p-6 bg-white border-slate-100 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                             <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1 h-5 bg-indigo-600 rounded-full" /> {currentSection.title}
                             </h4>
                             <div className="space-y-8">
                                {currentSection.questions.map((q: any) => (
                                    <div key={q.key} className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-1">{q.label}</label>
                                        {renderQuestion(currentSection.section, q)}
                                    </div>
                                ))}
                             </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-6">
                        {currentStep > 0 && <Button variant="outline" className="flex-1 h-14 rounded-xl font-black uppercase text-[10px]" onClick={() => setCurrentStep(prev => prev - 1)}>Back</Button>}
                        {currentStep < sections.length - 1 ? (
                            <Button variant="primary" className="flex-1 h-14 rounded-xl bg-indigo-600 border-none font-black uppercase text-[10px]" onClick={() => setCurrentStep(prev => prev + 1)}>Next domain</Button>
                        ) : (
                            <Button variant="primary" className="flex-1 h-14 rounded-xl bg-slate-900 border-none font-black uppercase text-[10px]" onClick={handleSave} isLoading={saving}>Finalize Exam</Button>
                        )}
                    </div>
                </div>


        </div>
    );

    const renderDetail = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pt-2">
            <button
                onClick={() => setSelectedRecord(null)}
                className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] uppercase tracking-widest mb-2 hover:text-indigo-600 transition-colors"
            >
                <ChevronLeft size={14} />
                Back to clinical Archive
            </button>

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                        <FileText size={16} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Clinical Synthesis</h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(selectedRecord.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic">
                    "{selectedRecord.narrative || 'Mental status documentation summary'}"
                </p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white px-2">
            {!selectedRecord && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button
                            onClick={() => { setActiveTab('history'); setSelectedRecord(null); }}
                            className={`px-6 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-violet-600 shadow-sm border border-slate-200' : 'text-slate-400'}`}
                        >
                            History
                        </button>
                        <button
                            onClick={() => { setActiveTab('new'); setSelectedRecord(null); }}
                            className={`px-6 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-white text-violet-600 shadow-sm border border-slate-200' : 'text-slate-400'}`}
                        >
                            New Exam
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {selectedRecord ? renderDetail() : (activeTab === 'history' ? renderHistory() : renderNew())}
            </div>
        </div>
    );
};
