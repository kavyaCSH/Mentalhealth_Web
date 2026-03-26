import React, { useState } from 'react';
import { AssessmentService } from '../../api/services/assessment.service';
import type { ProfessionalAssessmentSubmission } from '../../types/assessment.types';
import Button from '../ui/Button';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

interface ConsultQuestionnaireProps {
    patientId: string | number;
    categoryId: string;
    title: string;
    consultId?: string | number;
    initialQuestions?: any[];
    onSave: () => void;
    onCancel: () => void;
}

export const ConsultQuestionnaire: React.FC<ConsultQuestionnaireProps> = ({
    patientId, categoryId, title, consultId, initialQuestions, onSave, onCancel
}) => {
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);

    const questions = initialQuestions || [];

    const handleSelectOption = (questionId: string, value: any, label: string) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: { value, label }
        }));
    };

    const handleSave = async () => {
        if (!patientId || !categoryId) return;
        setSaving(true);
        try {
            // Build responses with strict type conversion (numeric where possible) 
            // prioritizing IDs as done in mobile app's ConsultQuestionnaire.tsx:146
            const formattedResponses = questions.map(q => {
                const qIdRaw = q.questionId || q.id || q._id || `q-${questions.indexOf(q)}`;
                const selection = responses[String(qIdRaw)];
                
                if (!selection) return null;

                // EXACT mapping from mobile production logic
                return {
                    questionId: isNaN(Number(qIdRaw)) ? String(qIdRaw) : Number(qIdRaw),
                    optionId: String(selection.value)
                };
            }).filter(Boolean);

            const patientIdNum = isNaN(Number(patientId)) ? String(patientId) : Number(patientId);
            // Ensure consultId is only sent if it's a valid Number, otherwise omit to avoid Cast errors
            const consultIdNum = consultId && !isNaN(Number(consultId)) ? Number(consultId) : undefined;

            const payload: ProfessionalAssessmentSubmission = {
                patientId: patientIdNum,
                consultId: consultIdNum,
                category: categoryId,
                responses: formattedResponses as any[],
                notes: `Professional evaluation: ${title}`
            };

            // Attempt Submission (Service handles 403/404/400 fallbacks internally)
            const res: any = await AssessmentService.submitProfessionalAssessment(payload);

            if (res.code === 200 || res.code === 201 || res.success || res.status === 'success' || res.data) {
                onSave();
            } else {
                alert(res.message || 'Transmission format rejected. Check diagnostic selections.');
            }
        } catch (error: any) {
            console.error('Submission failed', error);
            const msg = error.response?.data?.message || error.message || 'Network sync error';
            alert(`Selection transmission error: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    const isComplete = questions.length > 0 && Object.keys(responses).length === questions.length;

    return (
        <div className="flex flex-col h-full animate-fade-in pb-20">
            <div className="flex items-center gap-4 mb-6 sticky top-0 bg-slate-50 z-10 py-3 border-b border-slate-100">
                <button
                    onClick={onCancel}
                    className="w-10 h-10 bg-white hover:bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 transition-all border border-slate-100 hover:text-indigo-600 shadow-sm"
                >
                    <ChevronLeft size={18} />
                </button>
                <div>
                    <h2 className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{title}</h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                        {questions.length} Diagnostic Elements
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 scrollbar-hide px-1">
                {questions.map((q, idx) => (
                    <div key={q.id || q.questionId || idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all">
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600 font-black text-[10px] shrink-0 border border-slate-100">
                                {idx + 1}
                            </div>
                            <div className="flex-1 space-y-5 mt-1">
                                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest leading-loose">
                                    {q.questionText || q.text}
                                </h3>
                                <div className="space-y-3">
                                    {(q.options || []).map((opt: any, oidx: number) => {
                                        const qId = String(q.id || q.questionId || `q-${idx}`);
                                        const oId = String(opt.id || opt.value || opt.optionId || `o-${oidx}`);
                                        const currentSelection = responses[qId]?.value;
                                        const isSelected = currentSelection !== undefined && String(currentSelection) === oId;

                                        return (
                                            <button
                                                key={oidx}
                                                onClick={() => handleSelectOption(qId, oId, opt.text || opt.label || '')}
                                                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${
                                                    isSelected
                                                    ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-600/20 text-white'
                                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                                        isSelected 
                                                        ? 'bg-white border-white text-indigo-600 shadow-sm' 
                                                        : 'bg-slate-50 border-slate-200 text-slate-400'
                                                    }`}>
                                                        {isSelected ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-[0.05em] transition-colors ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                                                        {opt.text || opt.label}
                                                    </span>
                                                </div>
                                                
                                                {isSelected && (
                                                    <div className="text-[8px] font-black text-white/60 uppercase tracking-widest">Selected</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
                <Button
                    variant="primary"
                    className="w-full h-14 text-[10px] tracking-widest uppercase font-black rounded-xl shadow-xl shadow-indigo-600/20"
                    isLoading={saving}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {isComplete ? 'Transmit Synthesis' : `Evaluation Phase ${Object.keys(responses).length}/${questions.length}`}
                </Button>
            </div>
        </div>
    );
};
