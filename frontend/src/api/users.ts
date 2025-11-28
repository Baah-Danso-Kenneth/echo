import apiClient from './client';
import { UserProfile } from '@/types';

export const usersApi = {
    /**
     * Get user profile by username
     */
    async getUserProfile(username: string): Promise<UserProfile> {
        const response = await apiClient.get<UserProfile>(`/api/users/${username}`);
        return response.data;
    },
};
