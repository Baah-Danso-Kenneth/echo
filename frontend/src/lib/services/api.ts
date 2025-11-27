import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Define types based on backend schemas
export interface User {
  id: number;
  username: string;
  email: string;
  display_name: string;
  bio?: string;
  created_at: string;
}

export interface Post {
  id: number;
  content: string;
  created_at: string;
  author: User;
  like_count: number;
  comment_count: number;
  is_liked_by_current_user: boolean;
}

export interface Comment {
  id: number;
  content: string;
  created_at: string;
  author: User;
  post_id: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
    prepareHeaders: (headers, { getState }) => {
      // We will implement token retrieval from state later
      const token = (getState() as { auth: { token: string | null } }).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Post', 'User', 'Comment'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<User, { email: string; password: string; username: string; display_name: string }>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    getPosts: builder.query<{ items: Post[]; total: number }, { page?: number; size?: number }>({
      query: ({ page = 1, size = 10 } = {}) => `/posts?page=${page}&size=${size}`,
      providesTags: (result) =>
        result
          ? [
            ...result.items.map(({ id }: { id: number }) => ({ type: 'Post' as const, id })),
            { type: 'Post', id: 'LIST' },
          ]
          : [{ type: 'Post', id: 'LIST' }],
    }),
    getPost: builder.query<Post, number>({
      query: (id) => `/posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    createPost: builder.mutation<Post, { content: string }>({
      query: (body) => ({
        url: '/posts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),
    likePost: builder.mutation<void, number>({
      query: (id) => ({
        url: `/posts/${id}/like`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Post', id }],
    }),
    getComments: builder.query<{ items: Comment[] }, number>({
      query: (postId) => `/posts/${postId}/comments`,
      providesTags: (result, error, postId) => [{ type: 'Comment', id: `LIST_${postId}` }],
    }),
    createComment: builder.mutation<Comment, { postId: number; content: string }>({
      query: ({ postId, content }) => ({
        url: `/posts/${postId}/comments`,
        method: 'POST',
        body: { content, post_id: postId },
      }),
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Comment', id: `LIST_${postId}` },
        { type: 'Post', id: postId }, // Update comment count on post
      ],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useGetPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useLikePostMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
} = api;
