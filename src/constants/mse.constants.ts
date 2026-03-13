import type { MSESection } from '../types/mse.types';

export const MSE_FALLBACK_QUESTIONNAIRE: MSESection[] = [
    {
        "section": "appearance",
        "title": "Appearance",
        "description": "Clinician's observation of the patient's physical presentation",
        "questions": [
            { "key": "grooming", "label": "Grooming", "type": "select", "options": ["Well groomed", "Adequately groomed", "Disheveled", "Unkempt", "Bizarre"] },
            { "key": "dress", "label": "Dress / Attire", "type": "select", "options": ["Appropriate for occasion", "Casual", "Overly formal", "Bizarre/Eccentric", "Inappropriate"] },
            { "key": "hygiene", "label": "Hygiene", "type": "select", "options": ["Good", "Fair", "Poor", "Neglected"] },
            { "key": "eye_contact", "label": "Eye Contact", "type": "select", "options": ["Normal", "Avoidant", "Intense/Staring", "Fleeting", "Absent"] },
            { "key": "notes", "label": "Additional Appearance Notes", "type": "text", "placeholder": "e.g. appeared older than stated age, jaundiced, tremulous" }
        ]
    },
    {
        "section": "behavior",
        "title": "Behavior & Psychomotor Activity",
        "description": "Clinician's observation of patient's behavior and activity level",
        "questions": [
            { "key": "attitude", "label": "Attitude towards Examiner", "type": "select", "options": ["Cooperative", "Guarded", "Suspicious", "Hostile", "Withdrawn", "Seductive", "Dramatic"] },
            { "key": "psychomotor", "label": "Psychomotor Activity", "type": "select", "options": ["Normal", "Agitated / Restless", "Psychomotor retardation", "Catatonic", "Hyperactive"] },
            { "key": "mannerisms", "label": "Abnormal Movements / Mannerisms", "type": "multiselect", "options": ["Tremor", "Tics", "Stereotypies", "Echopraxia", "Waxy flexibility", "Posturing", "None"] },
            { "key": "notes", "label": "Behavior Notes", "type": "text", "placeholder": "Additional behavioral observations" }
        ]
    },
    {
        "section": "speech",
        "title": "Speech",
        "description": "Characteristics of the patient's verbal communication",
        "questions": [
            { "key": "rate", "label": "Rate", "type": "select", "options": ["Normal", "Pressured (rapid)", "Slow / Bradylalia", "Mutism"] },
            { "key": "volume", "label": "Volume", "type": "select", "options": ["Normal", "Loud", "Soft", "Whispering"] },
            { "key": "articulation", "label": "Articulation", "type": "select", "options": ["Clear", "Slurred", "Stuttering", "Dysarthric"] },
            { "key": "spontaneity", "label": "Spontaneity", "type": "select", "options": ["Spontaneous", "Restricted", "Only when prompted", "Absent"] },
            { "key": "notes", "label": "Speech Notes", "type": "text", "placeholder": "e.g. tangential replies, neologisms, punning" }
        ]
    },
    {
        "section": "mood",
        "title": "Mood",
        "description": "The patient's subjective emotional state",
        "questions": [
            { "key": "subjective", "label": "Patient's description of mood (in their own words)", "type": "text", "placeholder": "e.g. \"I feel terrible\", \"I am fine\", \"I feel empty\"" },
            { "key": "clinician_observed", "label": "Clinician's observed mood", "type": "select", "options": ["Euthymic", "Depressed", "Elevated", "Euphoric", "Anxious", "Irritable", "Dysphoric", "Empty"] }
        ]
    },
    {
        "section": "affect",
        "title": "Affect",
        "description": "Clinician's observation of the patient's expressed emotional responses",
        "questions": [
            { "key": "quality", "label": "Affect Quality", "type": "select", "options": ["Euthymic", "Depressed", "Elevated", "Anxious", "Irritable", "Fearful", "Suspicious"] },
            { "key": "range", "label": "Affect Range", "type": "select", "options": ["Full range", "Constricted", "Blunted", "Flat", "Labile"] },
            { "key": "appropriateness", "label": "Appropriateness to Content", "type": "select", "options": ["Congruent", "Incongruent", "Labile"] },
            { "key": "notes", "label": "Affect Notes", "type": "text", "placeholder": "e.g. smiles inappropriately when discussing death" }
        ]
    },
    {
        "section": "thought_form",
        "title": "Thought Form (Process)",
        "description": "How the patient organizes and expresses their thoughts",
        "questions": [
            { "key": "process", "label": "Thought Process", "type": "select", "options": ["Logical & goal-directed", "Tangential", "Circumstantial", "Flight of ideas", "Loose associations", "Thought blocking", "Perseveration", "Word salad / Incoherent"] },
            { "key": "coherence", "label": "Overall Coherence", "type": "select", "options": ["Fully coherent", "Mostly coherent", "Partially coherent", "Incoherent"] },
            { "key": "notes", "label": "Thought Form Notes", "type": "text", "placeholder": "e.g. derailment between topics, clang associations" }
        ]
    },
    {
        "section": "thought_content",
        "title": "Thought Content",
        "description": "What the patient is thinking about — content of thoughts",
        "questions": [
            { 
                "key": "delusions", 
                "label": "Delusions Present", 
                "type": "boolean",
                "follow_up": [
                    { "key": "delusion_types", "label": "Type of delusion", "type": "multiselect", "options": ["Paranoid / Persecutory", "Grandiose", "Somatic", "Nihilistic", "Erotomanic", "Reference", "Capgras syndrome", "Other"] }
                ]
            },
            { "key": "suicidal_ideation", "label": "Suicidal Ideation", "type": "select", "options": ["None", "Passive (wish to be dead)", "Active (wants to die)", "With plan", "With intent to act"] },
            { "key": "homicidal_ideation", "label": "Homicidal Ideation", "type": "select", "options": ["None", "Passive ideation", "Active ideation", "With specific target", "With plan"] },
            { "key": "obsessions", "label": "Obsessions / Compulsions", "type": "boolean" },
            { "key": "phobias", "label": "Phobias", "type": "boolean" },
            { "key": "other_content", "label": "Other Notable Thought Content", "type": "text", "placeholder": "e.g. preoccupation with illness, magical thinking" }
        ]
    },
    {
        "section": "perception",
        "title": "Perceptual Disturbances",
        "description": "Any abnormal sensory experiences",
        "questions": [
            { 
                "key": "hallucinations", 
                "label": "Hallucinations Present", 
                "type": "boolean",
                "follow_up": [
                    { "key": "hallucination_types", "label": "Type", "type": "multiselect", "options": ["Auditory", "Visual", "Olfactory", "Tactile", "Gustatory", "Command hallucinations"] },
                    { "key": "hallucination_details", "label": "Details", "type": "text", "placeholder": "e.g. hears voices telling him to harm himself" }
                ]
            },
            { "key": "illusions", "label": "Illusions", "type": "boolean" },
            { "key": "depersonalization", "label": "Depersonalization (feeling detached from self)", "type": "boolean" },
            { "key": "derealization", "label": "Derealization (world feels unreal)", "type": "boolean" }
        ]
    },
    {
        "section": "insight",
        "title": "Insight",
        "description": "Patient's awareness and understanding of their illness",
        "questions": [
            { "key": "level", "label": "Insight Level", "type": "select", "options": ["Good — fully aware of illness and treatment need", "Partial — some awareness but minimizing", "Poor — denies illness", "Absent — completely unaware"] },
            { "key": "description", "label": "Clinical Notes on Insight", "type": "text", "placeholder": "e.g. patient acknowledges mood problems but denies need for medication" }
        ]
    },
    {
        "section": "judgment",
        "title": "Judgment",
        "description": "Patient's capacity to make reasonable decisions",
        "questions": [
            { "key": "level", "label": "Judgment", "type": "select", "options": ["Intact", "Mildly impaired", "Moderately impaired", "Severely impaired"] },
            { "key": "notes", "label": "Judgment Notes", "type": "text", "placeholder": "e.g. still driving despite episodes of psychosis" }
        ]
    },
    {
        "section": "cognition",
        "title": "Cognition",
        "description": "Cognitive function assessment",
        "questions": [
            { 
                "key": "orientation", 
                "label": "Orientation", 
                "type": "group",
                "items": [
                    { "key": "person", "label": "Person (knows who they are)", "type": "boolean" },
                    { "key": "place", "label": "Place (knows where they are)", "type": "boolean" },
                    { "key": "time", "label": "Time (knows date/year)", "type": "boolean" }
                ]
            },
            { "key": "memory", "label": "Memory", "type": "select", "options": ["Intact", "Mildly impaired", "Moderately impaired", "Severely impaired"] },
            { "key": "concentration", "label": "Concentration / Attention", "type": "select", "options": ["Intact", "Mildly impaired", "Moderately impaired", "Severely impaired"] },
            { "key": "cognitive_test", "label": "Formal Cognitive Test Administered", "type": "select", "options": ["None", "MMSE", "MoCA", "Mini-Cog", "Other"] },
            { "key": "cognitive_score", "label": "Score", "type": "number", "placeholder": "e.g. 24", "min": 0, "max": 30 },
            { "key": "cognitive_max", "label": "Out of (maximum score)", "type": "number", "placeholder": "30" }
        ]
    }
];
