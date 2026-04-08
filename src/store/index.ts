import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../features/auth/store/authSlice';
import wellnessReducer from '../features/wellness/store/wellnessSlice';
import notificationReducer from '../features/notifications/store/notificationSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        wellness: wellnessReducer,
        notifications: notificationReducer,
    },
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
