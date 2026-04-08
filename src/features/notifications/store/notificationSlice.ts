import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { NotificationService } from '../../../api/services/notification.service';
import type { Notification } from '../../../types/common.types';

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};

export const fetchUnreadCount = createAsyncThunk(
    'notifications/fetchUnreadCount',
    async (_, { rejectWithValue }) => {
        try {
            const data = await NotificationService.getNotifications({ page: 1, limit: 100 });
            return data.filter(n => !n.isRead && !n.read).length;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch unread count');
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        setUnreadCount: (state, action) => {
            state.unreadCount = action.payload;
        },
        incrementUnreadCount: (state) => {
            state.unreadCount += 1;
        },
        decrementUnreadCount: (state) => {
            if (state.unreadCount > 0) state.unreadCount -= 1;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUnreadCount.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
                state.isLoading = false;
                state.error = null;
            })
            .addCase(fetchUnreadCount.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setUnreadCount, incrementUnreadCount, decrementUnreadCount } = notificationSlice.actions;
export default notificationSlice.reducer;
