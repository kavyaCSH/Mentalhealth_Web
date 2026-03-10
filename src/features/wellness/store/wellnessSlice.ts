import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface MoodEntry {
    id: string;
    value: number;
    timestamp: string;
}

interface WellnessState {
    moodHistory: MoodEntry[];
    lastHeartRate: number;
}

const initialState: WellnessState = {
    moodHistory: [],
    lastHeartRate: 0,
};

const wellnessSlice = createSlice({
    name: 'wellness',
    initialState,
    reducers: {
        addMoodEntry: (state, action: PayloadAction<number>) => {
            const newEntry: MoodEntry = {
                id: Date.now().toString(),
                value: action.payload,
                timestamp: new Date().toISOString(),
            };
            state.moodHistory.push(newEntry);
            if (state.moodHistory.length > 20) {
                state.moodHistory.shift();
            }
        },
        updatePulse: (state, action: PayloadAction<number>) => {
            state.lastHeartRate = action.payload;
        },
    },
});

export const { addMoodEntry, updatePulse } = wellnessSlice.actions;
export default wellnessSlice.reducer;
