import React, { useState, useEffect } from 'react';
import { SymptomService } from '../../api/services/symptom.service';
import type { SymptomRecord } from '../../api/services/symptom.service';
import Button from '../ui/Button';
import { Activity, History, Edit3, Smile, Zap, Moon, Utensils, Battery, Brain } from 'lucide-react';

interface ConsultSymptomsProps {
    patientId: string | number;
    consultId?: number | string;
    onSave?: (data: any) => void;
    initialTab?: 'new' | 'history';
}

const symptomsData = [
    { key: 'mood', label: 'Mood', icon: Smile, low: 'Depressed', high: 'Elevated', color: '#FF7043' },
    { key: 'anxiety', label: 'Anxiety', icon: Zap, low: 'None', high: 'Panic', color: '#9575CD' },
    { key: 'sleep', label: 'Sleep Quality', icon: Moon, low: 'Poor', high: 'Restful', color: '#4FC3F7' },
    { key: 'appetite', label: 'Appetite', icon: Utensils, low: 'Reduced', high: 'Increased', color: '#81C784' },
    { key: 'energy', label: 'Energy', icon: Battery, low: 'Fatigued', high: 'Hyper', color: '#FDD835' },
    { key: 'concentration', label: 'Concentration', icon: Brain, low: 'Distracted', high: 'Focused', color: '#4DB6AC' }
];

const NumericPicker = ({ value, onValueChange, accentColor }: { value: number; onValueChange: (v: number) => void; accentColor: string }) => {
    return (
        <div className="flex gap-1 mt-3">
            {Array.from({ length: 11 }, (_, i) => {
                const isSelected = value === i;
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onValueChange(i)}
                        className="flex-1 h-10 relative group transition-all"
                    >
                        {/* Selected Layer - Using direct style for maximum stability */}
                        {isSelected && (
                            <div
                                style={{ backgroundColor: accentColor }}
                                className="absolute inset-0 rounded-lg shadow-lg scale-110 z-10 flex items-center justify-center border-none"
                            >
                                <span className="text-[11px] font-black text-white">{i}</span>
                            </div>
                        )}

                        {/* Unselected Layer */}
                        {!isSelected && (
                            <div className="absolute inset-0 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-100">
                                <span className="text-[11px] font-black text-slate-400">{i}</span>
                            </div>
                        )}

                        <div className="opacity-0 h-full w-full">{i}</div>
                    </button>
                );
            })}
        </div>
    );
};

export const ConsultSymptoms: React.FC<ConsultSymptomsProps> = ({ patientId, consultId, onSave, initialTab = 'new' }) => {
    const [activeTab, setActiveTab] = useState<'new' | 'history'>(initialTab);
    const [scores, setScores] = useState<Record<string, number>>({
        mood: 5, anxiety: 3, sleep: 6, appetite: 5, energy: 4, concentration: 5
    });
    const [notes, setNotes] = useState('');
    const [history, setHistory] = useState<SymptomRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const res = await SymptomService.getPatientSymptomHistory(patientId);
            if (res.code === 200 || res.success) {
                setHistory(res.data?.symptoms || []);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!patientId) return;
        setSaving(true);
        try {
            const payload = { 
                patientId: !isNaN(Number(patientId)) ? Number(patientId) : patientId, 
                consultId: consultId && !isNaN(Number(consultId)) ? Number(consultId) : consultId,
                consult_id: consultId && !isNaN(Number(consultId)) ? Number(consultId) : consultId,
                scores, 
                notes 
            };
            const res = await SymptomService.saveSymptomScores(payload);
            if (res.code === 201 || res.success) {
                setNotes('');
                setActiveTab('history');
                if (onSave) onSave(res.data);
            } else {
                alert(res.message || 'Failed to save scores');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving symptom scores.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto scrollbar-hide">
            <div className="mb-8">
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-white text-indigo-600 shadow-lg shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Record
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-lg shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        History
                    </button>
                </div>
            </div>

            {activeTab === 'new' ? (
                <div className="space-y-6 pb-20 animate-fade-in">
                    <div className="space-y-3">
                        {symptomsData.map((s) => (
                            <div key={s.key} className="bg-white p-4 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all group shadow-sm">
                                <div className="flex items-center justify-between mb-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <s.icon size={14} style={{ color: s.color }} />
                                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{s.label}</span>
                                    </div>
                                    <span className="text-[14px] font-black text-indigo-600 tabular-nums">{scores[s.key] || 0}</span>
                                </div>
                                <NumericPicker
                                    value={scores[s.key]}
                                    onValueChange={(v) => setScores(p => ({ ...p, [s.key]: v }))}
                                    accentColor={s.color}
                                />
                                <div className="flex justify-between mt-2 px-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.low}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.high}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-slate-100 mt-6 shadow-sm">
                        <label className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            <Edit3 size={10} /> Clinical Meta Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Describe patient's physiological state..."
                            className="w-full h-20 bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all resize-none shadow-inner"
                        />
                    </div>

                    <Button
                        variant="primary"
                        className="w-full h-14 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200/50 mt-4"
                        isLoading={saving}
                        onClick={handleSave}
                    >
                        Record Symptom Snapshot
                    </Button>
                </div>
            ) : (
                <div className="space-y-4 pb-20 animate-fade-in">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Activity className="animate-spin text-indigo-500" size={32} />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-16 border-2 border-dashed border-white/5 rounded-3xl">
                            <History size={32} className="mx-auto text-slate-700 mb-4" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No symptom history found.</p>
                        </div>
                    ) : (
                        history.map((record, i) => (
                            <div key={record.symptomId || record.id || i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                        {new Date(record.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                    <div
                                        className="h-2 w-10 rounded-full shadow-sm"
                                        style={{ backgroundColor: record.color_code || '#6366f1' }}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {Object.entries(record.scores || {}).map(([key, score]) => {
                                        const symptom = symptomsData.find(s => s.key === key);
                                        const Icon = symptom?.icon || Activity;
                                        return (
                                            <div key={key} className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Icon size={10} style={{ color: symptom?.color || '#cbd5e1' }} />
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest break-all">{symptom?.label || key}</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-800 tabular-nums">{score as number}/10</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {record.notes && (
                                    <p className="text-[10px] text-slate-600 font-bold italic leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        "{record.notes}"
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
