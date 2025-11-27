import { configureStore } from '@reduxjs/toolkit';
import { api } from './services/api';
import authReducer from './features/auth/authSlice';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export const makeStore = () => {
    return configureStore({
        reducer: {
            [api.reducerPath]: api.reducer,
            auth: authReducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(api.middleware),
    });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
