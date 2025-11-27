import apiClient from './client';
import { Post, PostDetail, PostCreate, PostListResponse } from '@/types';

export const postsApi = {
    /**
     * Get paginated list of posts
     */
    async getPosts(page: number = 1, pageSize: number = 20): Promise<PostListResponse> {
        const response = await apiClient.get<PostListResponse>('/api/posts', {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },

    /**
     * Get a specific post by ID
     */
    async getPost(postId: number): Promise<PostDetail> {
        const response = await apiClient.get<PostDetail>(`/api/posts/${postId}`);
        return response.data;
    },

    /**
     * Create a new post
     */
    async createPost(postData: PostCreate): Promise<Post> {
        const formData = new FormData();
        formData.append('content', postData.content);
        if (postData.image) {
            formData.append('image', postData.image);
        }

        const response = await apiClient.post<Post>('/api/posts', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Delete a post
     */
    async deletePost(postId: number): Promise<void> {
        await apiClient.delete(`/api/posts/${postId}`);
    },

    /**
     * Get posts by a specific user
     */
    async getUserPosts(
        username: string,
        page: number = 1,
        pageSize: number = 20
    ): Promise<PostListResponse> {
        const response = await apiClient.get<PostListResponse>(`/api/posts/user/${username}`, {
            params: { page, page_size: pageSize },
        });
        return response.data;
    },
};
