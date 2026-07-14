import React, { useState, useEffect } from 'react';
import {
    Activity,
    AlertCircle,
    History as HistoryIcon
} from 'lucide-react';
import { ROSService } from '../../api/services/ros.service';
import Button from '../ui/Button';
import type { ROSSection } from '../../types/ros.types';

interface ConsultROSProps {
    patientId: string | number;
    consultId?: string | number;
    initialTab?: 'new' | 'history';
    onSave?: (data: any) => void;
}

export const ConsultROS: React.FC<ConsultROSProps> = ({
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

    // Evaluation State
    const [sections, setSections] = useState<ROSSection[]>([]);
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
            const res = await ROSService.getQuestions();
            const data = res.data || res;
            if (Array.isArray(data)) setSections(data);
        } catch (err) {
            console.error('[ConsultROS] Failed to load ROS components:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        if (!patientId) return;
        try {
            setLoading(true);
            const res = await ROSService.getROSByPatient(String(patientId));
            const data = (res as any).data || res;
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[ConsultROS] Fetch history failed:', error);
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

        if (!hasData) {
            setError('Please provide clinical findings.');
            return;
        }

        setSaving(true);
        try {
            const res = await ROSService.createROS(submissionData);
            if (res) {
                if (onSave) onSave(res);
                setResponses({});
                setActiveTab('history');
                fetchHistory();
            }
        } catch (error: any) {
            setError(error.message || 'Save failed.');
        } finally {
            setSaving(false);
        }
    };

    const currentSection = sections[currentStep];

    const renderQuestion = (section: string, question: any) => {
        const value = responses[section]?.[question.key];
        switch (question.type) {
            case 'select':
            case 'multiselect':
                return (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {question.options?.map((opt: string) => {
                            const isSel = question.type === 'select' ? value === opt : (Array.isArray(value) && value.includes(opt));
                            return (
                                <button key={opt} onClick={() => question.type === 'select' ? handleValueChange(section, question.key, opt) : handleMultiselectToggle(section, question.key, opt)}
                                    className={`p-3 rounded-xl border text-left transition-all ${isSel ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-page border-border-card text-muted hover:bg-page'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-tight">{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            case 'boolean':
                return (
                    <div className="space-y-3 mt-2">
                        <div className="flex gap-2">
                            {[true, false].map(v => (
                                <button key={v ? 'y' : 'n'} onClick={() => handleValueChange(section, question.key, v)}
                                    className={`flex-1 p-3 rounded-xl border transition-all text-[10px] font-black uppercase tracking-widest ${value === v ? (v ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-800 border-slate-800 text-white') : 'bg-page border-border-card text-muted opacity-80'}`}>
                                    {v ? 'Positive' : 'Denied'}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-card px-2">
            {!selectedRecord && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex bg-page p-1 rounded-lg border border-border-card shadow-inner">
                        <button onClick={() => setActiveTab('history')} className={`px-6 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-card text-indigo-600 shadow-sm border border-border-card' : 'text-muted opacity-80'}`}>Archive</button>
                        <button onClick={() => setActiveTab('new')} className={`px-6 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-card text-indigo-600 shadow-sm border border-border-card' : 'text-muted opacity-80'}`}>Evaluate</button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {activeTab === 'history' ? (
                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12"><Activity className="animate-spin text-muted opacity-80" size={24} /></div>
                        ) : history.length === 0 ? (
                            <div className="text-center py-10 border-2 border-dashed border-border-card rounded-2xl"><HistoryIcon size={24} className="mx-auto text-muted opacity-40 mb-2" /><p className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">No systemic records found</p></div>
                        ) : (
                            history.map((record, i) => (
                                <button key={i} onClick={() => setSelectedRecord(record)} className="w-full text-left bg-card p-4 rounded-xl border-2 border-border-card hover:border-indigo-600 transition-all">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] font-black text-muted opacity-80 uppercase tracking-widest">{new Date(record.createdAt).toLocaleDateString()}</span>
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[7px] font-black">SYSTEMIC</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-muted line-clamp-2 italic">"{record.ai_notes || 'ROS capture completed.'}"</p>
                                </button>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 pb-20 pt-1">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black text-main uppercase tracking-widest">Review of Systems</h3>
                        </div>


                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {sections.map((s, i) => (
                                        <button key={s.section} onClick={() => setCurrentStep(i)} className={`px-4 py-3 rounded-xl border-2 whitespace-nowrap text-[9px] font-black uppercase tracking-widest transition-all ${i === currentStep ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-card border-border-card text-muted opacity-80 hover:border-indigo-100'}`}>{s.title}</button>
                                    ))}
                                </div>
                                
                                {currentSection && (
                                    <div className="card-premium p-6 bg-card border-border-card space-y-6">
                                        <h4 className="text-[11px] font-black text-main uppercase tracking-widest flex items-center gap-2"><div className="w-1 h-5 bg-indigo-600 rounded-full" /> {currentSection.title}</h4>
                                        <div className="space-y-8">
                                            {currentSection.questions.map(q => (
                                                <div key={q.key} className="space-y-2">
                                                    <label className="text-[10px] font-bold text-muted uppercase tracking-tight">{q.label}</label>
                                                    {renderQuestion(currentSection.section, q)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4">
                                    {currentStep > 0 && <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setCurrentStep(prev => prev - 1)}>Back</Button>}
                                    {currentStep < sections.length - 1 ? (
                                        <Button variant="primary" className="flex-1 rounded-xl bg-indigo-600 border-indigo-600" onClick={() => setCurrentStep(prev => prev + 1)}>Next System</Button>
                                    ) : (
                                        <Button variant="primary" className="flex-1 rounded-xl bg-slate-900 border-slate-900" onClick={handleSave} isLoading={saving}>Finalize Review</Button>
                                    )}
                                </div>
                            </div>


                    </div>
                )}
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold flex items-center gap-2 mb-4 animate-shake"><AlertCircle size={14} />{error}</div>}
        </div>
    );
};
