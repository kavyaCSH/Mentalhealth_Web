import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import {
    ChevronLeft,
    ChevronRight,
    Save,
    AlertCircle,
    Activity,
    CheckCircle2,
    Brain,
    ClipboardList,
    Sparkles,
    Zap,
    Users,
    History,
    Shield,
    FileText,
    Bot,
    Mic,
    MicOff
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { PastHistoryService } from '../../../api/services/pastHistory.service';
import { UserService } from '../../../api/services/user.service';
import type { PastHistorySection, PastHistoryResponse } from '../../../types/pastHistory.types';

const FindingItem = ({ label, value }: { label: string; value: any }) => {
    if (value === null || value === undefined || value === '') return null;

    if (value === false) return null;
    if (value === 'None') return null;
    if (Array.isArray(value)) {
        if (value.length === 0) return null;
        if (typeof value[0] === 'object') {
            // Render complex array objects (from the new history format)
            return (
                <div className="flex flex-col py-4 border-b border-slate-50 last:border-none group">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{label.replace(/_/g, ' ')}</span>
                    <div className="space-y-4">
                        {value.map((item: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-xl space-y-2">
                                {Object.entries(item).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 uppercase tracking-tighter">{k.replace(/_/g, ' ')}</span>
                                        <span className="font-bold text-slate-800">{String(v)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
    }

    let displayValue = '';
    if (typeof value === 'boolean') {
        displayValue = value ? 'Confirmed / Present' : 'Denied / Absent';
    } else if (Array.isArray(value)) {
        displayValue = value.join(', ');
    } else if (typeof value === 'object') {
        const activeEntries = Object.entries(value)
            .filter(([_, v]) => v === true || (typeof v === 'string' && v.length > 0 && v !== 'None'));

        if (activeEntries.length === 0) return null;

        displayValue = activeEntries
            .map(([k, _]) => k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '))
            .join(', ');
    } else {
        displayValue = String(value);
    }

    if (!displayValue || displayValue === 'No specific markers' || displayValue === 'Neutral') return null;

    return (
        <div className="flex justify-between items-start py-3 border-b border-slate-50 last:border-none group">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label.replace(/_/g, ' ')}</span>
            <span className="text-xs font-bold text-slate-700 text-right max-w-[60%] group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{displayValue}</span>
        </div>
    );
};

const PAST_HISTORY_QUESTIONS = [
    {
        "section": "psychiatric_past",
        "title": "Psychiatric History",
        "questions": [
            {
                "key": "previous_diagnosis",
                "professional_label": "Prior Psychiatric Diagnoses",
                "patient_label": "Past Diagnoses",
                "type": "multiselect",
                "options": [
                    "Depression",
                    "Anxiety",
                    "Insomnia",
                    "Sleep Disorder",
                    "Bipolar Disorder",
                    "Schizophrenia",
                    "PTSD",
                    "OCD",
                    "ADHD",
                    "Eating Disorder",
                    "Personality Disorder",
                    "Other"
                ],
                "allow_custom": true,
                "label": "Prior Psychiatric Diagnoses"
            },
            {
                "key": "hospitalizations",
                "professional_label": "Prior Psychiatric Hospitalizations",
                "patient_label": "Prior Hospital Stays",
                "type": "array",
                "item_structure": [
                    {
                        "key": "year",
                        "label": "Year",
                        "type": "text"
                    },
                    {
                        "key": "reason",
                        "label": "Reason",
                        "type": "text"
                    },
                    {
                        "key": "location",
                        "label": "Location",
                        "type": "text"
                    },
                    {
                        "key": "duration",
                        "label": "Duration",
                        "type": "text"
                    }
                ],
                "label": "Prior Psychiatric Hospitalizations"
            },
            {
                "key": "suicide_attempts",
                "professional_label": "Suicide Attempts / Self-Harm History",
                "patient_label": "History of Self-Harm",
                "type": "array",
                "item_structure": [
                    {
                        "key": "year",
                        "label": "Year",
                        "type": "text"
                    },
                    {
                        "key": "method",
                        "label": "Method",
                        "type": "text"
                    },
                    {
                        "key": "intent",
                        "label": "Intent",
                        "type": "text"
                    }
                ],
                "label": "Suicide Attempts / Self-Harm History"
            },
            {
                "key": "medication_trials",
                "professional_label": "Medication History",
                "patient_label": "Past Medications",
                "type": "array",
                "item_structure": [
                    {
                        "key": "name",
                        "label": "Medication Name",
                        "type": "text"
                    },
                    {
                        "key": "dose",
                        "label": "Dose",
                        "type": "text"
                    },
                    {
                        "key": "duration",
                        "label": "How long?",
                        "type": "text"
                    },
                    {
                        "key": "response",
                        "label": "Response (Helpful?)",
                        "type": "text"
                    },
                    {
                        "key": "side_effects",
                        "label": "Side Effects",
                        "type": "text"
                    }
                ],
                "label": "Medication History"
            },
            {
                "key": "psychotherapy_history",
                "professional_label": "Psychotherapy History",
                "patient_label": "History of Therapy",
                "type": "textarea",
                "placeholder": "Types of therapy, duration, and helpfulness",
                "label": "Psychotherapy History"
            }
        ]
    },
    {
        "section": "medical_surgical",
        "title": "Medical & Surgical History",
        "questions": [
            {
                "key": "chronic_conditions",
                "professional_label": "Chronic Medical Conditions",
                "patient_label": "Ongoing Health Issues",
                "type": "multiselect",
                "options": [
                    "Hypertension",
                    "Diabetes",
                    "Thyroid Disorder",
                    "Seizures",
                    "Asthma",
                    "Heart Disease",
                    "Migraines",
                    "Chronic Pain",
                    "None"
                ],
                "allow_custom": true,
                "label": "Chronic Medical Conditions"
            },
            {
                "key": "surgeries",
                "professional_label": "Surgical History",
                "patient_label": "Past Operations",
                "type": "array",
                "item_structure": [
                    {
                        "key": "procedure",
                        "label": "Procedure",
                        "type": "text"
                    },
                    {
                        "key": "year",
                        "label": "Year",
                        "type": "text"
                    }
                ],
                "label": "Surgical History"
            },
            {
                "key": "head_injury",
                "professional_label": "History of Head Injury",
                "patient_label": "Any Head Injuries?",
                "type": "boolean_group",
                "fields": [
                    {
                        "key": "detected",
                        "label": "Have you ever had a head injury?",
                        "type": "boolean"
                    },
                    {
                        "key": "loss_of_consciousness",
                        "label": "Did you lose consciousness?",
                        "type": "boolean"
                    },
                    {
                        "key": "details",
                        "label": "Details",
                        "type": "text"
                    }
                ],
                "label": "History of Head Injury"
            },
            {
                "key": "seizures",
                "professional_label": "Seizure History",
                "patient_label": "History of Seizures",
                "type": "boolean_group",
                "fields": [
                    {
                        "key": "detected",
                        "label": "Ever had a seizure?",
                        "type": "boolean"
                    },
                    {
                        "key": "frequency",
                        "label": "Frequency",
                        "type": "text"
                    },
                    {
                        "key": "last_seizure",
                        "label": "Last Seizure Date",
                        "type": "text"
                    }
                ],
                "label": "Seizure History"
            },
            {
                "key": "allergies",
                "professional_label": "Allergies",
                "patient_label": "Allergies",
                "type": "multiselect",
                "options": [
                    "Drug Allergies",
                    "Food Allergies",
                    "Environmental Allergies",
                    "Latex",
                    "None"
                ],
                "allow_custom": true,
                "label": "Allergies"
            }
        ]
    },
    {
        "section": "family_history",
        "title": "Family History",
        "questions": [
            {
                "key": "conditions",
                "professional_label": "Family Mental Health / Substance History",
                "patient_label": "Family Health History",
                "type": "array",
                "item_structure": [
                    {
                        "key": "relative",
                        "label": "Relative (e.g. Mother)",
                        "type": "text"
                    },
                    {
                        "key": "condition",
                        "label": "Condition (e.g. Bipolar)",
                        "type": "text"
                    },
                    {
                        "key": "outcome",
                        "label": "Outcome/Notes",
                        "type": "text"
                    }
                ],
                "label": "Family Mental Health / Substance History"
            },
            {
                "key": "suicide_in_family",
                "professional_label": "Family History of Suicide",
                "patient_label": "Family History of Suicide",
                "type": "boolean",
                "label": "Family History of Suicide"
            },
            {
                "key": "substance_abuse_in_family",
                "professional_label": "Family History of Substance Abuse",
                "patient_label": "Family History of Drug/Alcohol Problems",
                "type": "boolean",
                "label": "Family History of Substance Abuse"
            }
        ]
    },
    {
        "section": "substance_history",
        "title": "Substance Use History",
        "questions": [
            {
                "key": "alcohol",
                "professional_label": "Alcohol Use",
                "patient_label": "Alcohol consumption",
                "type": "boolean_group",
                "fields": [
                    {
                        "key": "status",
                        "label": "Current Status",
                        "type": "select",
                        "options": [
                            "Current",
                            "Past",
                            "Never"
                        ]
                    },
                    {
                        "key": "quantity",
                        "label": "Quantity (drinks/week)",
                        "type": "text"
                    },
                    {
                        "key": "frequency",
                        "label": "Frequency",
                        "type": "text"
                    },
                    {
                        "key": "last_use",
                        "label": "Last Drink",
                        "type": "text"
                    }
                ],
                "label": "Alcohol Use"
            },
            {
                "key": "tobacco_nicotine",
                "professional_label": "Tobacco / Nicotine",
                "patient_label": "Smoking / Vaping",
                "type": "boolean_group",
                "fields": [
                    {
                        "key": "status",
                        "label": "Status",
                        "type": "select",
                        "options": [
                            "Current",
                            "Past",
                            "Never"
                        ]
                    },
                    {
                        "key": "type",
                        "label": "Type",
                        "type": "text"
                    },
                    {
                        "key": "quantity",
                        "label": "Pack years / daily use",
                        "type": "text"
                    }
                ],
                "label": "Tobacco / Nicotine"
            },
            {
                "key": "illicit_drugs",
                "professional_label": "Illicit Drug Use",
                "patient_label": "Recreational Drugs",
                "type": "array",
                "item_structure": [
                    {
                        "key": "drug",
                        "label": "Drug Name",
                        "type": "text"
                    },
                    {
                        "key": "status",
                        "label": "Status",
                        "type": "select",
                        "options": [
                            "Current",
                            "Past",
                            "Never",
                            "Unknown"
                        ]
                    },
                    {
                        "key": "frequency",
                        "label": "Frequency",
                        "type": "text"
                    },
                    {
                        "key": "last_use",
                        "label": "Last Use",
                        "type": "text"
                    }
                ],
                "label": "Illicit Drug Use"
            },
            {
                "key": "caffeine",
                "professional_label": "Caffeine Intake",
                "patient_label": "Daily Caffeine",
                "type": "text",
                "label": "Caffeine Intake"
            },
            {
                "key": "prescription_misuse",
                "professional_label": "Prescription Misuse",
                "patient_label": "Misuse of prescribed meds?",
                "type": "text",
                "label": "Prescription Misuse"
            }
        ]
    },
    {
        "section": "developmental_history",
        "title": "Developmental History",
        "questions": [
            {
                "key": "pregnancy_complications",
                "professional_label": "Birth/Pregnancy Complications",
                "patient_label": "Birth Issues",
                "type": "text",
                "label": "Birth/Pregnancy Complications"
            },
            {
                "key": "delivery_type",
                "professional_label": "Delivery Type",
                "type": "select",
                "options": [
                    "Normal",
                    "C-Section",
                    "Forceps",
                    "Other"
                ],
                "label": "Delivery Type"
            },
            {
                "key": "milestones",
                "professional_label": "Developmental Milestones",
                "type": "select",
                "options": [
                    "On-time",
                    "Delayed",
                    "Early"
                ],
                "label": "Developmental Milestones"
            },
            {
                "key": "childhood_behavior",
                "professional_label": "Childhood Behavior/Temperament",
                "type": "text",
                "label": "Childhood Behavior/Temperament"
            },
            {
                "key": "school_performance",
                "professional_label": "Academic Performance",
                "type": "text",
                "label": "Academic Performance"
            }
        ]
    },
    {
        "section": "social_history",
        "title": "Personal & Social History",
        "questions": [
            {
                "key": "education",
                "professional_label": "Highest Education",
                "type": "select",
                "options": [
                    "Primary",
                    "High School",
                    "Vocational",
                    "Undergraduate",
                    "Graduate",
                    "Doctorate"
                ],
                "label": "Highest Education"
            },
            {
                "key": "employment",
                "professional_label": "Current Employment",
                "type": "text",
                "label": "Current Employment"
            },
            {
                "key": "marital_status",
                "professional_label": "Relationship Status",
                "type": "select",
                "options": [
                    "Single",
                    "Married",
                    "Partnered",
                    "Divorced",
                    "Widowed"
                ],
                "label": "Relationship Status"
            },
            {
                "key": "living_situation",
                "professional_label": "Living Situation",
                "type": "text",
                "label": "Living Situation"
            },
            {
                "key": "legal_history",
                "professional_label": "Legal History",
                "patient_label": "Any Legal Issues?",
                "type": "boolean_group",
                "fields": [
                    {
                        "key": "legal_issues",
                        "label": "Any Legal Issues?",
                        "type": "boolean"
                    },
                    {
                        "key": "legal_details",
                        "label": "Details",
                        "type": "text"
                    }
                ],
                "label": "Legal History"
            },
            {
                "key": "spiritual_beliefs",
                "professional_label": "Spiritual/Cultural Beliefs",
                "type": "text",
                "label": "Spiritual/Cultural Beliefs"
            },
            {
                "key": "strengths_hobbies",
                "professional_label": "Strengths & Hobbies",
                "type": "text",
                "label": "Strengths & Hobbies"
            }
        ]
    },
    {
        "section": "trauma_history",
        "title": "Trauma & Abuse History",
        "questions": [
            {
                "key": "physical_abuse",
                "professional_label": "History of Physical Abuse",
                "type": "boolean",
                "label": "History of Physical Abuse"
            },
            {
                "key": "emotional_abuse",
                "professional_label": "History of Emotional Abuse",
                "type": "boolean",
                "label": "History of Emotional Abuse"
            },
            {
                "key": "sexual_abuse",
                "professional_label": "History of Sexual Abuse",
                "type": "boolean",
                "label": "History of Sexual Abuse"
            },
            {
                "key": "significant_losses",
                "professional_label": "Significant Losses / Grief",
                "type": "text",
                "label": "Significant Losses / Grief"
            },
            {
                "key": "military_service",
                "professional_label": "Military Service History",
                "type": "boolean",
                "label": "Military Service History"
            },
            {
                "key": "trauma_notes",
                "professional_label": "Additional Trauma Notes",
                "type": "textarea",
                "label": "Additional Trauma Notes"
            }
        ]
    }
] as any;

const PastHistoryPage = () => {
    const { patientId: userId, historyId } = useParams<{ patientId: string; historyId?: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const isPatient = (currentUser as any)?.role === 'patient' ||
        (currentUser as any)?.role === 'PATIENT' ||
        (currentUser as any)?.group === 'PATIENT' ||
        (currentUser as any)?.group === 'patient';

    const [sections, setSections] = useState<PastHistorySection[]>(PAST_HISTORY_QUESTIONS);
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<PastHistoryResponse | null>(null);

    // AI Assistant State
    const [useAssistant, setUseAssistant] = useState(false);
    const [narrative, setNarrative] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = React.useRef<any>(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => {
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        setNarrative(prev => prev + ' ' + event.results[i][0].transcript);
                    }
                }
            };
            recognitionRef.current.onend = () => setIsRecording(false);
        }
    }, []);

    const toggleRecording = () => {
        if (!recognitionRef.current) return alert('Voice recognition not supported.');
        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    useEffect(() => {
        const fetchQuestionnaire = async () => {
            try {
                const res = await PastHistoryService.getQuestions();
                const data = res.data || res;
                if (Array.isArray(data) && data.length > 0) {
                    setSections(data);
                } else {
                    console.warn('[PastHistory] API returned empty questions, using defaults.');
                }
            } catch (err) {
                console.error('Failed to fetch Past History questionnaire:', err);
                // We keep the defaults set in useState
            }
        };

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                if (!userId || userId === 'undefined') {
                    if (!historyId) {
                        setIsLoading(false);
                        return;
                    }
                }

                let hexId = userId;
                if (isPatient && (currentUser?.id === userId || currentUser?._id === userId || !userId)) {
                    hexId = currentUser?._id || currentUser?.id || hexId;
                } else if (userId && userId !== 'undefined') {
                    try {
                        const userProfile = await UserService.getUserById(userId);
                        if (userProfile) {
                            hexId = userProfile._id || userProfile.id || hexId;
                        }
                    } catch (e) {
                        console.warn('[PastHistory] Profile fetch failed:', e);
                    }
                }

                await fetchQuestionnaire();

                if (historyId) {
                    const res = await PastHistoryService.getPastHistoryById(historyId!);
                    const data = res.data || res;
                    setResult(data as PastHistoryResponse);
                }
            } catch (err: any) {
                console.error('[PastHistory] Fetch failed:', err);
                setError('Could not load clinical history components.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId, historyId, isPatient, currentUser]);

    const handleValueChange = (section: string, key: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] || {}),
                [key]: value
            }
        }));
    };

    const handleMultiselectToggle = (section: string, key: string, option: string) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentArr = Array.isArray(currentSection[key]) ? [...currentSection[key]] : [];
            const newArr = currentArr.includes(option)
                ? currentArr.filter((o: string) => o !== option)
                : [...currentArr, option];

            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [key]: newArr
                }
            };
        });
    };

    const handleArrayAdd = (section: string, key: string, structure: any[]) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentArr = Array.isArray(currentSection[key]) ? [...currentSection[key]] : [];
            const newItem = structure.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});

            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [key]: [...currentArr, newItem]
                }
            };
        });
    };

    const handleArrayItemChange = (section: string, key: string, index: number, fieldKey: string, value: any) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentArr = Array.isArray(currentSection[key]) ? [...currentSection[key]] : [];
            const updatedItem = { ...currentArr[index], [fieldKey]: value };
            const newArr = [...currentArr];
            newArr[index] = updatedItem;

            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [key]: newArr
                }
            };
        });
    };

    const handleArrayRemove = (section: string, key: string, index: number) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentArr = Array.isArray(currentSection[key]) ? [...currentSection[key]] : [];
            const newArr = currentArr.filter((_, i) => i !== index);

            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [key]: newArr
                }
            };
        });
    };

    const handleBooleanGroupChange = (section: string, key: string, fieldKey: string, value: any) => {
        setResponses(prev => {
            const currentSection = prev[section] || {};
            const currentGroup = currentSection[key] || {};

            return {
                ...prev,
                [section]: {
                    ...currentSection,
                    [key]: {
                        ...currentGroup,
                        [fieldKey]: value
                    }
                }
            };
        });
    };

    const handleNarrativeExtract = async () => {
        if (!narrative.trim() || narrative.length < 20) {
            setError('Please provide a more detailed narrative (min 20 chars).');
            return;
        }

        setIsExtracting(true);
        setError(null);
        try {
            const activeId = userId || currentUser?._id || currentUser?.id;
            const res = await PastHistoryService.extractFromNarrative(narrative, activeId!);
            const data = (res as any).data || res;
            const newRes: Record<string, any> = { ...responses };

            // 1. Psychiatric Mapping (Mobile Parity)
            if (data.psychiatric_history) {
                const diagnoses = Array.isArray(data.psychiatric_history.previous_diagnosis) ? data.psychiatric_history.previous_diagnosis : [];
                // Ensure sleep-related findings from episodes/other fields are promoted to diagnoses
                if (data.psychiatric_history.previous_episodes && String(data.psychiatric_history.previous_episodes).toLowerCase().includes('insomnia')) {
                    if (!diagnoses.includes('Insomnia')) diagnoses.push('Insomnia');
                }

                newRes['psychiatric_past'] = {
                    previous_diagnosis: diagnoses.join(', '),
                    hospitalizations: Array.isArray(data.psychiatric_history.hospitalizations) ? data.psychiatric_history.hospitalizations.map((h: any) => `${h.year || ''} ${h.reason || ''}`).join(' | ') : '',
                    suicide_attempts: Array.isArray(data.psychiatric_history.suicide_attempts) ? data.psychiatric_history.suicide_attempts.map((s: any) => `${s.year || ''} ${s.method || ''}`).join(' | ') : '',
                    psychotherapy_history: data.psychiatric_history.psychotherapy_history || ''
                };
            }

            // 2. Medical & Surgical Mapping
            if (data.medical_history) {
                newRes['medical_surgical'] = {
                    chronic_conditions: Array.isArray(data.medical_history.chronic_conditions) ? data.medical_history.chronic_conditions.join(', ') : '',
                    surgeries: Array.isArray(data.medical_history.surgeries) ? data.medical_history.surgeries.map((s: any) => `${s.year || ''} ${s.procedure || ''}`).join(', ') : '',
                    allergies: Array.isArray(data.medical_history.allergies) ? data.medical_history.allergies.join(', ') : '',
                    head_injury: data.medical_history.head_injury?.details || '',
                    seizures: data.medical_history.seizures?.frequency || ''
                };
            }

            // 3. Family Mapping
            if (data.family_history) {
                newRes['family_history'] = {
                    conditions: Array.isArray(data.family_history.conditions) ? data.family_history.conditions.map((c: any) => `${c.relative || ''}: ${c.condition || ''}`).join(', ') : '',
                    suicide_in_family: !!data.family_history.suicide_in_family,
                    substance_abuse_in_family: !!data.family_history.substance_abuse_in_family
                };
            }

            // 4. Substance Use
            if (data.substance_use) {
                const sub = data.substance_use;
                newRes['substance_history'] = {
                    alcohol_status: sub.alcohol?.status || 'Never',
                    tobacco_status: sub.tobacco_nicotine?.status || 'Never',
                    illicit_drugs: Array.isArray(sub.illicit_drugs) ? sub.illicit_drugs.map((d: any) => `${d.drug || ''} (${d.status || ''})`).join(', ') : ''
                };
            }

            // 5. Personal / Social / Trauma
            if (data.social_history) {
                newRes['social_history'] = {
                    living_situation: data.social_history.living_situation || '',
                    employment: data.social_history.employment || '',
                    legal_history: data.social_history.legal_history?.legal_details || ''
                };
            }

            if (data.trauma_history) {
                newRes['trauma_history'] = {
                    trauma_notes: data.trauma_history.trauma_notes || '',
                    significant_losses: data.trauma_history.significant_losses || ''
                };
            }

            if (data.developmental_history) {
                newRes['developmental_history'] = {
                    milestones: data.developmental_history.milestones || '',
                    childhood_behavior: data.developmental_history.childhood_behavior || ''
                };
            }

            setResponses(newRes);
            setUseAssistant(false);
            setCurrentStep(0);
        } catch (err) {
            console.error('AI Extraction failed:', err);
            setError('AI extraction failed. Please enter data manually.');
        } finally {
            setIsExtracting(false);
        }
    };

    const THEMES: Record<string, any> = {
        indigo: { active: 'bg-indigo-600 border-indigo-600 text-white', done: 'bg-indigo-50 border-indigo-100 text-indigo-700', iconActive: 'text-white', iconDone: 'text-indigo-600', dot: 'bg-indigo-500', bgSoft: 'bg-indigo-50', textSoft: 'text-indigo-600', borderSoft: 'border-indigo-100', borderFocus: 'focus:border-indigo-500', hoverBorder: 'hover:border-indigo-200', shadow: 'ring-indigo-400/20' },
        rose: { active: 'bg-rose-600 border-rose-600 text-white', done: 'bg-rose-50 border-rose-100 text-rose-700', iconActive: 'text-white', iconDone: 'text-rose-600', dot: 'bg-rose-500', bgSoft: 'bg-rose-50', textSoft: 'text-rose-600', borderSoft: 'border-rose-100', borderFocus: 'focus:border-rose-500', hoverBorder: 'hover:border-rose-200', shadow: 'ring-rose-400/20' },
        amber: { active: 'bg-amber-600 border-amber-600 text-white', done: 'bg-amber-50 border-amber-100 text-amber-700', iconActive: 'text-white', iconDone: 'text-amber-600', dot: 'bg-amber-500', bgSoft: 'bg-amber-50', textSoft: 'text-amber-600', borderSoft: 'border-amber-100', borderFocus: 'focus:border-amber-500', hoverBorder: 'hover:border-amber-200', shadow: 'ring-amber-400/20' },
        emerald: { active: 'bg-emerald-600 border-emerald-600 text-white', done: 'bg-emerald-50 border-emerald-100 text-emerald-700', iconActive: 'text-white', iconDone: 'text-emerald-600', dot: 'bg-emerald-500', bgSoft: 'bg-emerald-50', textSoft: 'text-emerald-600', borderSoft: 'border-emerald-100', borderFocus: 'focus:border-emerald-500', hoverBorder: 'hover:border-emerald-200', shadow: 'ring-emerald-400/20' }
    };

    const getTheme = (section: string) => {
        const colors: Record<string, string> = {
            psychiatric_past: 'indigo',
            medical_surgical: 'rose',
            substance_history: 'amber',
            family_history: 'emerald',
            developmental_history: 'indigo',
            social_history: 'emerald',
            trauma_history: 'rose'
        };
        return THEMES[colors[section.toLowerCase()] || 'indigo'];
    };

    const getSectionIcon = (section: string) => {
        switch (section.toLowerCase()) {
            case 'psychiatric_past': return <Brain size={18} />;
            case 'medical_surgical': return <Activity size={18} />;
            case 'substance_history': return <Zap size={18} />;
            case 'family_history': return <Users size={18} />;
            case 'developmental_history': return <Sparkles size={18} />;
            case 'social_history': return <FileText size={18} />;
            case 'trauma_history': return <Shield size={18} />;
            default: return <ClipboardList size={18} />;
        }
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        setError(null);
        try {
            let hexId = userId || currentUser?._id || currentUser?.id;
            if (!hexId) throw new Error('Patient identity missing.');

            // Build structured payload for backend (Mobile Parity)
            const payload: any = {
                patient_id: hexId,
                narrative: narrative,
                status: 'completed',
                psychiatric_history: {
                    previous_diagnosis: (() => {
                        const val = responses.psychiatric_past?.previous_diagnosis;
                        if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
                        if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
                        return [];
                    })(),
                    hospitalizations: responses.psychiatric_past?.hospitalizations ? (Array.isArray(responses.psychiatric_past.hospitalizations) ? responses.psychiatric_past.hospitalizations : responses.psychiatric_past.hospitalizations.split('|').map((s: string) => ({ reason: s.trim() }))) : [],
                    psychotherapy_history: responses.psychiatric_past?.psychotherapy_history || ''
                },
                medical_history: {
                    chronic_conditions: (() => {
                        const val = responses.medical_surgical?.chronic_conditions;
                        if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
                        if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
                        return [];
                    })(),
                    surgeries: responses.medical_surgical?.surgeries ? (Array.isArray(responses.medical_surgical.surgeries) ? responses.medical_surgical.surgeries : responses.medical_surgical.surgeries.split(',').map((s: string) => ({ procedure: s.trim() }))) : [],
                    allergies: (() => {
                        const val = responses.medical_surgical?.allergies;
                        if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
                        if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
                        return [];
                    })()
                },
                substance_use: {
                    alcohol: { status: responses.substance_history?.alcohol_status || 'Never' },
                    tobacco_nicotine: { status: responses.substance_history?.tobacco_status || 'Never' },
                    illicit_drugs: responses.substance_history?.illicit_drugs ? (Array.isArray(responses.substance_history.illicit_drugs) ? responses.substance_history.illicit_drugs.map((d: any) => typeof d === 'string' ? { drug: d, status: 'Past' } : d) : responses.substance_history.illicit_drugs.split(',').map((s: string) => ({ drug: s.trim(), status: 'Past' }))) : []
                },
                family_history: {
                    conditions: responses.family_history?.conditions ? responses.family_history.conditions.split(',').map((s: string) => ({ condition: s.trim() })) : [],
                    suicide_in_family: !!responses.family_history?.suicide_in_family,
                    substance_abuse_in_family: !!responses.family_history?.substance_abuse_in_family
                },
                social_history: {
                    living_situation: responses.social_history?.living_situation || '',
                    employment: responses.social_history?.employment || ''
                },
                trauma_history: {
                    trauma_notes: responses.trauma_history?.trauma_notes || '',
                    significant_losses: responses.trauma_history?.significant_losses || ''
                },
                developmental_history: {
                    milestones: responses.developmental_history?.milestones || 'On-time'
                }
            };

            const res = await PastHistoryService.createPastHistory(payload);
            setResult((res as any).data || res);
        } catch (err: any) {
            setError(err.message || 'Failed to save clinical history.');
        } finally { setIsSaving(false); }
    };

    const navigateBack = () => navigate(isPatient ? '/records' : `/patients/${userId}/health`);

    const renderQuestion = (section: string, question: any) => {
        const value = responses[section]?.[question.key];
        const theme = getTheme(section);
        const labelText = question.patient_label || question.professional_label || question.label || question.key;

        switch (question.type) {
            case 'select':
            case 'multiselect':
                return (
                    <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {(() => {
                                const baseOpts = question.options || [];
                                const currentVals = Array.isArray(value) ? value : (value ? [value] : []);
                                const allDisplayOpts = Array.from(new Set([...baseOpts, ...currentVals]));

                                return allDisplayOpts.map((opt: string) => {
                                    const isSel = question.type === 'select' ? value === opt : currentVals.includes(opt);
                                    return (
                                        <button key={opt} onClick={() => question.type === 'select' ? handleValueChange(section, question.key, opt) : handleMultiselectToggle(section, question.key, opt)}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group/opt ${isSel ? theme.active + ' shadow-lg shadow-indigo-100' : `bg-slate-50 border-slate-50/50 text-slate-500 hover:border-indigo-200 hover:bg-white`}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black uppercase tracking-tight">{opt}</span>
                                                {isSel && <CheckCircle2 size={14} className="opacity-80" />}
                                            </div>
                                        </button>
                                    );
                                });
                            })()}
                        </div>
                        {question.allow_custom && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add other..."
                                    className="px-4 py-2 bg-slate-50 border-2 border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-300 outline-none transition-all flex-1"
                                    onKeyDown={(e: any) => {
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            handleMultiselectToggle(section, question.key, e.target.value.trim());
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );
            case 'boolean':
                return (
                    <div className="space-y-4 mt-2">
                        <div className="flex gap-4">
                            {[true, false].map(v => (
                                <button key={v ? 'y' : 'n'} onClick={() => handleValueChange(section, question.key, v)}
                                    className={`flex-1 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 ${value === v ? (v ? theme.active : 'bg-slate-800 border-slate-800 text-white') : 'bg-slate-50 border-transparent text-slate-400'}`}>
                                    {v ? 'Confirmed' : 'Denied'}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'textarea':
                return (
                    <textarea
                        value={value || ''}
                        onChange={e => handleValueChange(section, question.key, e.target.value)}
                        placeholder={question.placeholder || "Enter details..."}
                        className={`w-full min-h-[120px] p-6 bg-slate-50 border-2 border-transparent rounded-3xl text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-300 outline-none transition-all resize-none mt-2`}
                    />
                );
            case 'text':
                return (
                    <input
                        type="text"
                        value={value || ''}
                        onChange={e => handleValueChange(section, question.key, e.target.value)}
                        placeholder={question.placeholder || "Describe..."}
                        className={`w-full p-6 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-300 outline-none transition-all mt-2`}
                    />
                );
            case 'boolean_group':
                return (
                    <div className={`space-y-6 mt-4 p-6 bg-slate-50/50 rounded-3xl border border-slate-100`}>
                        {question.fields?.map((f: any) => (
                            <div key={f.key} className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{f.label}</label>
                                {f.type === 'boolean' ? (
                                    <div className="flex gap-2">
                                        {[true, false].map(boolVal => {
                                            const isSel = responses[section]?.[question.key]?.[f.key] === boolVal;
                                            return (
                                                <button key={boolVal ? 'y' : 'n'}
                                                    onClick={() => handleBooleanGroupChange(section, question.key, f.key, boolVal)}
                                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSel ? (boolVal ? theme.active : 'bg-slate-600 border-slate-600 text-white') : 'bg-white border-slate-100 text-slate-400 border-2 hover:border-indigo-200'}`}>
                                                    {boolVal ? 'Yes' : 'No'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl overflow-hidden border border-slate-100">
                                        {f.type === 'select' ? (
                                            <select
                                                value={responses[section]?.[question.key]?.[f.key] || ''}
                                                onChange={e => handleBooleanGroupChange(section, question.key, f.key, e.target.value)}
                                                className="w-full p-3 text-xs font-bold text-slate-700 outline-none bg-transparent"
                                            >
                                                <option value="">Select Option</option>
                                                {f.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder={f.label}
                                                value={responses[section]?.[question.key]?.[f.key] || ''}
                                                onChange={e => handleBooleanGroupChange(section, question.key, f.key, e.target.value)}
                                                className="w-full p-3 text-xs font-bold text-slate-700 outline-none bg-transparent"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            case 'array':
                const items = responses[section]?.[question.key] || [];
                return (
                    <div className="space-y-4 mt-4">
                        <div className="space-y-3">
                            {items.map((item: any, idx: number) => (
                                <div key={idx} className="bg-white border-2 border-slate-100 rounded-3xl p-6 relative group/row hover:border-indigo-100 transition-all">
                                    <button
                                        onClick={() => handleArrayRemove(section, question.key, idx)}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all shadow-lg hover:bg-rose-600"
                                    >
                                        <AlertCircle size={14} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {question.item_structure?.map((field: any) => (
                                            <div key={field.key} className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{field.label}</label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        value={item[field.key] || ''}
                                                        onChange={e => handleArrayItemChange(section, question.key, idx, field.key, e.target.value)}
                                                        className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-indigo-50/50 focus:ring-2 ring-indigo-200"
                                                    >
                                                        <option value="">Choose...</option>
                                                        {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={item[field.key] || ''}
                                                        onChange={e => handleArrayItemChange(section, question.key, idx, field.key, e.target.value)}
                                                        placeholder={field.label}
                                                        className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:bg-indigo-50/50 focus:ring-2 ring-indigo-200"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => handleArrayAdd(section, question.key, question.item_structure || [])}
                            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all font-black uppercase text-[10px] flex items-center justify-center gap-2"
                        >
                            <Sparkles size={14} /> Add Entry to {labelText}
                        </button>
                    </div>
                );
            default: return null;
        }
    };

    if (isLoading) return <div className="flex flex-col items-center justify-center min-h-[60vh]"><Activity className="animate-spin text-indigo-600 mb-4" size={40} /><p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Compiling Framework...</p></div>;

    if (result) return (
        <div className="p-8 max-w-6xl animate-fade-in pb-24 space-y-12">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3"><History className="text-indigo-600" size={32} />Past Clinical History</h1>
                </div>
                <Button variant="primary" onClick={navigateBack} className="rounded-2xl px-8 font-black uppercase text-xs tracking-widest">Return to Profile</Button>
            </header>
            <section className="card-premium p-12 bg-white border-slate-100 shadow-2xl">
                <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b pb-8">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><History size={28} /></div>
                        <div><h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">AI Clinical Extraction</h2><p className="text-xl font-black text-slate-900">Historical Profile Complete</p></div>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-12">
                        <div className="space-y-4"><h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Summary</h3><p className="text-xl font-black text-slate-800 leading-relaxed italic">"{result.ai_notes || 'No overview available.'}"</p></div>
                        <div className="bg-slate-50 p-8 rounded-[2rem]"><h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4">Risk Factors</h3><div className="flex flex-wrap gap-2">{result.risk_flags?.length ? result.risk_flags?.map((f: any, i: number) => <span key={i} className="px-3 py-1 bg-white border border-rose-100 text-rose-600 text-[10px] font-black rounded-lg uppercase">{f}</span>) : <span className="text-xs font-bold text-slate-400">No major risks identified</span>}</div></div>
                    </div>

                    <div className="pt-12 border-t">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8">Clinical Markers & Findings</h3>
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                            {sections.map(s => (
                                <div key={s.section} className="space-y-4">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.25em] flex items-center gap-2">
                                        {getSectionIcon(s.section)} {s.title}
                                    </h4>
                                    <div className="space-y-1">
                                        {s.questions.map(q => {
                                            const val = (result as any)[s.section]?.[q.key] || responses[s.section]?.[q.key];
                                            return <FindingItem key={q.key} label={q.professional_label || q.label} value={val} />;
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    const currentSection = sections[currentStep];

    return (
        <div className="p-8 max-w-6xl space-y-10 animate-fade-in pb-24">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={navigateBack} className="p-3 bg-white border rounded-2xl text-slate-500 hover:bg-slate-50"><ChevronLeft size={20} /></button>
                    <div><h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3"><History className="text-indigo-600" size={32} />Past History</h1></div>
                </div>
            </header>

            <div className="card-premium p-12 bg-white space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4"><div className="p-4 bg-indigo-50 text-indigo-600 rounded-full"><Sparkles size={24} /></div><div><h2 className="text-2xl font-black text-slate-900">Narrative Intake</h2><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Describe patient's clinical history in your own words</p></div></div>
                    <button onClick={toggleRecording} className={`p-4 rounded-2xl flex items-center gap-3 border-2 ${isRecording ? 'bg-rose-500 text-white border-rose-500 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{isRecording ? <MicOff size={20} /> : <Mic size={20} />}<span className="text-[10px] font-black uppercase tracking-widest">{isRecording ? 'Listening...' : 'Voice Record'}</span></button>
                </div>
                <textarea value={narrative} onChange={e => setNarrative(e.target.value)} placeholder="Type or record medical and psychiatric history here..." className="w-full min-h-[300px] p-8 bg-slate-50 border-2 border-transparent rounded-[2.5rem] text-lg font-bold text-slate-700 focus:bg-white focus:border-indigo-600 outline-none transition-all resize-none shadow-inner" />
                <div className="flex justify-end"><Button variant="primary" className="px-16 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100" onClick={handleNarrativeExtract} isLoading={isExtracting} rightIcon={<ChevronRight size={18} />}>Extract with AI</Button></div>
            </div>
            {error && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-rose-500 text-white p-4 rounded-2xl flex items-center gap-3 text-sm font-black uppercase shadow-2xl"><AlertCircle size={20} />{error}</div>}
        </div>
    );
};

export default PastHistoryPage;
