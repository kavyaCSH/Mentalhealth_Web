export interface WellnessStats {
    moodHistory: MoodEntry[];
    lastHeartRate?: number;
    activityLevel?: string;
    sleepHours?: number;
}

export interface MoodEntry {
    date: string;
    mood: string;
    note?: string;
}
