import apiClient from './client';
import { MessageResponse, Like, Retweet } from '@/types';

export const engagementsApi = {
    /**
     * Like a post
     */
    async likePost(postId: number): Promise<MessageResponse> {
        const response = await apiClient.post<MessageResponse>(`/api/posts/${postId}/like`);
        return response.data;
    },

    /**
     * Unlike a post
     */
    async unlikePost(postId: number): Promise<MessageResponse> {
        const response = await apiClient.delete<MessageResponse>(`/api/posts/${postId}/like`);
        return response.data;
    },

    /**
     * Retweet a post
     */
    async retweetPost(postId: number): Promise<MessageResponse> {
        const response = await apiClient.post<MessageResponse>(`/api/posts/${postId}/retweet`);
        return response.data;
    },

    /**
     * Unretweet a post
     */
    async unretweetPost(postId: number): Promise<MessageResponse> {
        const response = await apiClient.delete<MessageResponse>(`/api/posts/${postId}/retweet`);
        return response.data;
    },

    /**
     * Get all likes for a post
     */
    async getPostLikes(postId: number): Promise<Like[]> {
        const response = await apiClient.get<Like[]>(`/api/posts/${postId}/likes`);
        return response.data;
    },

    /**
     * Get all retweets for a post
     */
    async getPostRetweets(postId: number): Promise<Retweet[]> {
        const response = await apiClient.get<Retweet[]>(`/api/posts/${postId}/retweets`);
        return response.data;
    },
};
