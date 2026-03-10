import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { AuthService } from '../../../api/services/auth.service';
import type { User } from '../../../types/user.types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null as string | null,
};

export const getCurrentUser = createAsyncThunk<User, void, { rejectValue: string }>(
    'auth/getCurrentUser',
    async (_, { rejectWithValue }) => {
        try {
            return await AuthService.getMe();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch user profile');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            { payload: { user, token } }: PayloadAction<{ user: User; token: string }>
        ) => {
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            localStorage.setItem('token', token);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setUser: (state, action: PayloadAction<User>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getCurrentUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getCurrentUser.fulfilled, (state, { payload }) => {
                state.isLoading = false;
                state.user = payload;
                state.isAuthenticated = true;
            })
            .addCase(getCurrentUser.rejected, (state, { payload }) => {
                state.isLoading = false;
                state.error = payload as string;
                state.isAuthenticated = false;
                state.user = null;
                localStorage.removeItem('token');
            });
    },
});

export const { setCredentials, logout, setLoading, setUser } = authSlice.actions;
export default authSlice.reducer;
