import apiClient from './client';
import {
    Comment,
    CommentCreate,
    CommentUpdate,
    CommentListResponse,
    CommentWithReplies,
    MessageResponse,
} from '@/types';

export const commentsApi = {
    /**
     * Get comments for a post
     */
    async getPostComments(
        postId: number,
        page: number = 1,
        pageSize: number = 20
    ): Promise<CommentListResponse> {
        const response = await apiClient.get<CommentListResponse>(`/api/comments/post/${postId}`, {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    /**
     * Get a specific comment with its replies
     */
    async getComment(commentId: number): Promise<CommentWithReplies> {
        const response = await apiClient.get<CommentWithReplies>(`/api/comments/${commentId}`);
        return response.data;
    },

    /**
     * Get replies to a comment
     */
    async getCommentReplies(
        commentId: number,
        page: number = 1,
        pageSize: number = 20
    ): Promise<CommentListResponse> {
        const response = await apiClient.get<CommentListResponse>(
            `/api/comments/${commentId}/replies`,
            {
                params: { page, page_size: pageSize },
            }
        );
        return response.data;
    },

    /**
     * Create a new comment
     */
    async createComment(commentData: CommentCreate): Promise<Comment> {
        const response = await apiClient.post<Comment>('/api/comments', commentData);
        return response.data;
    },

    /**
     * Update a comment
     */
    async updateComment(commentId: number, commentData: CommentUpdate): Promise<Comment> {
        const response = await apiClient.patch<Comment>(`/api/comments/${commentId}`, commentData);
        return response.data;
    },

    /**
     * Delete a comment
     */
    async deleteComment(commentId: number): Promise<MessageResponse> {
        const response = await apiClient.delete<MessageResponse>(`/api/comments/${commentId}`);
        return response.data;
    },
};
