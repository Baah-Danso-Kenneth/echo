import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../services/api';

interface AuthState {
    user: User | null;
    token: string | null;
}

const initialState: AuthState = {
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: User | null; token: string }>
        ) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            if (typeof window !== 'undefined') {
                localStorage.setItem('token', token);
            }
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
            }
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectCurrentToken = (state: { auth: AuthState }) => state.auth.token;
