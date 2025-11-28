// User types
export interface User {
    id: number;
    username: string;
    email: string;
    display_name: string;
    bio?: string;
    created_at: string;
}

export interface UserResponse {
    id: number;
    username: string;
    display_name: string;
    bio?: string;
    created_at: string;
}

export interface UserProfile extends UserResponse {
    post_count: number;
}

export interface UserCreate {
    username: string;
    email: string;
    password: string;
    display_name: string;
    bio?: string;
}

export interface UserLogin {
    email: string;
    password: string;
}

// Post types
export interface Post {
    id: number;
    content: string;
    image_url?: string;
    created_at: string;
    is_retweet: boolean;
    author: UserResponse;
    like_count: number;
    retweet_count: number;
    comment_count: number;
    is_liked_by_current_user: boolean;
    is_retweeted_by_current_user: boolean;
}

export interface PostDetail extends Post {
    original_post?: Post;
    updated_at: string;
}

export interface PostCreate {
    content: string;
    image?: File;
}

// Comment types
export interface Comment {
    id: number;
    content: string;
    post_id: number;
    parent_comment_id?: number;
    created_at: string;
    updated_at: string;
    author: UserResponse;
    reply_count: number;
}

export interface CommentCreate {
    content: string;
    post_id: number;
    parent_comment_id?: number;
}

export interface CommentUpdate {
    content: string;
}

export interface CommentWithReplies extends Comment {
    replies: Comment[];
}

// Engagement types
export interface Like {
    id: number;
    user: UserResponse;
    post_id: number;
    created_at: string;
}

export interface Retweet {
    id: number;
    user: UserResponse;
    original_post_id: number;
    created_at: string;
}

// Authentication types
export interface Token {
    access_token: string;
    token_type: string;
}

export interface TokenData {
    user_id?: number;
    username?: string;
}

// Pagination types
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface PostListResponse extends PaginatedResponse<Post> { }
export interface CommentListResponse extends PaginatedResponse<Comment> { }

// Response types
export interface MessageResponse {
    message: string;
    detail?: string;
}

export interface ErrorResponse {
    error: string;
    detail?: string;
    status_code: number;
}
