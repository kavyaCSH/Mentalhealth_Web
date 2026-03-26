// axios removed

// NeuroVitals AI Engine URL - Ported from Mobile Integration
const ENGINE_URL = import.meta.env.VITE_NEUROVITALS_ENGINE_URL || 'http://192.168.100.104:8114';

export interface AnalysisResult {
    ClinicalFeatures: any;
    BayesianPosteriors: Record<string, number>;
    Explainability: any;
    ClinicalTrends: any;
    MentalHealthRiskClass: string;
    ConfidenceScore: number;
    SignalQualityIndex: number;
    LivenessScore: number;
    IdentityVerified: boolean;
    DominantCondition: string;
    DetectedGender: string;
    DetectedAge: number;
    Mood: {
        Arousal: number;
        Valence: number;
        MoodState: string;
        EmotionalStability: number;
        CognitiveReadiness: number;
        SocialEngagement: number;
    };
}

export const NeuroVitalsService = {
    detectGender: async (blob: Blob): Promise<{ success: boolean; gender: string; age: number }> => {
        const formData = new FormData();
        formData.append('file', blob, 'frame.jpg');
        const response = await fetch(`${ENGINE_URL}/detect_gender`, {
            method: 'POST',
            body: formData
        });
        return response.json();
    },

    analyze: async (videoBlob: Blob, age: string, gender: string): Promise<AnalysisResult> => {
        const formData = new FormData();
        // Browser MediaRecorder primarily WebM
        const fileName = videoBlob.type.includes('mp4') ? 'scan.mp4' : 'scan.webm';
        formData.append('file', videoBlob, fileName);
        formData.append('age', age);
        formData.append('gender', gender);

        const response = await fetch(`${ENGINE_URL}/analyze`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(`Engine Error ${response.status}: ${JSON.stringify(errBody)}`);
        }
        return response.json();
    }
};
