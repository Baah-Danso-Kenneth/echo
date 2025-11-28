import apiClient from './client';
import { UserLogin, UserCreate, UserResponse, Token } from '@/types';

export const authApi = {
    /**
     * Login with email and password
     */
    async login(credentials: UserLogin): Promise<Token> {
        const response = await apiClient.post<Token>('/api/auth/login', credentials);
        return response.data;
    },

    /**
     * Register a new user
     */
    async register(userData: UserCreate): Promise<UserResponse> {
        const response = await apiClient.post<UserResponse>('/api/auth/register', userData);
        return response.data;
    },

    /**
     * Get current authenticated user
     */
    async getCurrentUser(): Promise<UserResponse> {
        const response = await apiClient.get<UserResponse>('/api/auth/me');
        return response.data;
    },

    /**
     * Logout (client-side token removal)
     */
    async logout(): Promise<void> {
        await apiClient.post('/api/auth/logout');
    },
};
