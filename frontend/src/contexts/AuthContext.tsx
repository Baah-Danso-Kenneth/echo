import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { UserResponse } from '@/types';
import { authApi } from '@/api/auth';
import { storage } from '@/utils/storage';
import { toast } from 'sonner';

interface AuthContextType {
    user: UserResponse | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is authenticated on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = storage.getToken();

            if (token) {
                // Don't set user from saved data, verify token first
                try {
                    const currentUser = await authApi.getCurrentUser();
                    setUser(currentUser);
                    storage.setUser(currentUser);
                } catch (error) {
                    // Token is invalid, clear storage
                    storage.clear();
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const tokenData = await authApi.login({ email, password });
            storage.setToken(tokenData.access_token);

            // Fetch user data
            const userData = await authApi.getCurrentUser();
            setUser(userData);
            storage.setUser(userData);

            toast.success('Logged in successfully');
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Failed to login';
            toast.error(message);
            throw error;
        }
    };

    const register = async (userData: any) => {
        try {
            const newUser = await authApi.register(userData);

            // Auto-login after registration
            await login(userData.email, userData.password);

            toast.success('Account created successfully');
        } catch (error: any) {
            const message = error.response?.data?.detail || 'Failed to register';
            toast.error(message);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Call backend logout endpoint
            await authApi.logout();
        } catch (error) {
            // Ignore errors from logout endpoint
            console.error('Logout API error:', error);
        } finally {
            // Always clear local state regardless of API response
            storage.clear();
            setUser(null);
            toast.success('Logged out successfully');
        }
    };

    const refreshUser = async () => {
        try {
            const userData = await authApi.getCurrentUser();
            setUser(userData);
            storage.setUser(userData);
        } catch (error) {
            console.error('Failed to refresh user data:', error);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
