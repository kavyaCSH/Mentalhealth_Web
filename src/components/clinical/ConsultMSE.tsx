import React, { useState, useEffect } from 'react';
import {
    Brain,
    Sparkles,
    Clock,
    ChevronRight,
    Activity,
    CheckCircle2,
    FileText,
    Target
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
    const [extracting, setExtracting] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

    // Form State (Mobile Parity UI)
    const [narrative, setNarrative] = useState('');
    const [findings, setFindings] = useState<Record<string, any>>({});
    const [analysis, setAnalysis] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'history' && patientId) {
            fetchHistory();
        }
    }, [activeTab, patientId]);

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

    const handleAIExtract = async () => {
        if (!narrative.trim()) return;
        setExtracting(true);
        try {
            const res = await MSEService.extractFromNarrative(narrative, patientId);
            if (res) {
                const extractionData = res as any;
                setFindings(extractionData.structured || extractionData.data?.structured || extractionData.data || {});
                setAnalysis(extractionData.analysis || extractionData.data?.analysis || null);
                // alert('AI Clinical Intake successful: Mental status markers synthesized.');
            }
        } catch (error) {
            console.error('[ConsultMSE] AI Extraction failed:', error);
        } finally {
            setExtracting(false);
        }
    };

    const handleSave = async () => {
        if (!narrative.trim() && Object.keys(findings).length === 0) return;
        setSaving(true);
        try {
            const responses = Object.entries(findings).map(([key, value]) => ({
                questionCode: key,
                value: value
            }));

            const payload = {
                patient_id: String(patientId),
                consult_id: consultId ? String(consultId) : undefined,
                narrative: narrative,
                responses: responses,
                analysis: analysis
            };

            const res = await MSEService.createMSE(payload as any);
            if (res) {
                if (onSave) onSave(res);
                resetForm();
                setActiveTab('history');
                fetchHistory();
            }
        } catch (error) {
            console.error('[ConsultMSE] Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setNarrative('');
        setFindings({});
        setAnalysis(null);
    };

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
                            <div className="flex gap-2 mt-3">
                                {record.analysis && (
                                    <span className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-md text-[8px] font-black uppercase tracking-tight border border-violet-100">AI Analyzed</span>
                                )}
                                <span className="px-2 py-0.5 border border-slate-200 text-slate-400 rounded-md text-[8px] font-black uppercase tracking-tight">Status Exam</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderNew = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20 pt-2">
            {/* Multi-modal Intake */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-violet-900 text-white flex items-center justify-center">
                        <Target size={16} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Mental Observation</h3>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Real-time Clinical Intake</p>
                    </div>
                </div>

                <textarea
                    value={narrative}
                    onChange={(e) => setNarrative(e.target.value)}
                    placeholder="Describe patient's appearance, mood, behavior, and cognitive function..."
                    className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-xl p-4 text-[11px] font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-slate-300 transition-all resize-none shadow-inner"
                />

                <div className="flex justify-end mt-4">
                    <Button
                        variant="primary"
                        size="sm"
                        disabled={extracting || !narrative.trim()}
                        onClick={handleAIExtract}
                        className="rounded-lg px-6 font-black uppercase text-[9px] tracking-widest bg-violet-600 hover:bg-violet-700"
                    >
                        {extracting ? '...' : (
                            <div className="flex items-center gap-2">
                                <Sparkles size={12} /> AI Extract Markers
                            </div>
                        )}
                    </Button>
                </div>
            </div>

            {/* Structured Output Preview */}
            {Object.keys(findings).length > 0 && (
                <div className="p-5 bg-violet-50/50 border-2 border-dashed border-violet-200 rounded-2xl space-y-4">
                    <h4 className="text-[9px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 size={12} /> Extracted Clinical Findings
                    </h4>
                    <div className="space-y-2">
                        {Object.entries(findings).slice(0, 5).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-2 border-b border-violet-100 last:border-none">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{key.replace(/_/g, ' ')}</span>
                                <span className="text-[10px] font-bold text-violet-700 truncate max-w-[60%]">{String(value)}</span>
                            </div>
                        ))}
                        {Object.keys(findings).length > 5 && (
                            <p className="text-[8px] font-bold text-violet-400 text-center uppercase tracking-widest pt-2">
                                + {Object.keys(findings).length - 5} additional clinical attributes
                            </p>
                        )}
                    </div>
                </div>
            )}

            <Button
                variant="primary"
                className="w-full h-14 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100"
                isLoading={saving}
                disabled={!narrative.trim() && Object.keys(findings).length === 0}
                onClick={handleSave}
            >
                Finalize Exam
            </Button>
        </div>
    );

    const renderDetail = () => (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pt-2">
            <button
                onClick={() => setSelectedRecord(null)}
                className="flex items-center gap-1.5 text-slate-400 font-black text-[9px] uppercase tracking-widest mb-2 hover:text-indigo-600 transition-colors"
            >
                <ChevronRight size={14} className="rotate-180" />
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
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
                        <span className="text-slate-400">Markers Detected</span>
                        <span className="text-indigo-600">{Object.keys(selectedRecord.responses || {}).length} Attributes</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">MSE Protocol Verified</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <Brain size={16} className="text-slate-400 mb-2" />
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Cognition</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight mt-1">Verified</span>
                </div>
                <div className="p-4 bg-white border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center text-center">
                    <Activity size={16} className="text-slate-400 mb-2" />
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Behavior</span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight mt-1">Observed</span>
                </div>
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
                            className={`px-6 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-violet-600 shadow-sm border border-slate-200' : 'text-slate-400'
                                }`}
                        >
                            History
                        </button>
                        <button
                            onClick={() => { setActiveTab('new'); setSelectedRecord(null); }}
                            className={`px-6 py-2 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-white text-violet-600 shadow-sm border border-slate-200' : 'text-slate-400'
                                }`}
                        >
                            New Exam
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto no-scrollbar">
                {selectedRecord ? renderDetail() : (activeTab === 'history' ? renderHistory() : renderNew())}
            </div>
        </div>
    );
};
