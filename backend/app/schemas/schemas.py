from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ============================================
# User Schemas
# ============================================

class UserBase(BaseModel):
    """Base user schema with common fields"""
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_\s]+$")
    email: EmailStr
    display_name: str = Field(..., min_length=1, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)


class UserCreate(BaseModel):
    """Schema for user registration"""
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_\s]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (public info)"""
    id: int
    username: str
    display_name: str
    bio: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserProfile(UserResponse):
    """Extended user profile with statistics"""
    post_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Post Schemas
# ============================================

class PostCreate(BaseModel):
    """Schema for creating a new post"""
    content: str = Field(..., min_length=1, max_length=280)


class PostBase(BaseModel):
    """Base post schema"""
    id: int
    content: str
    created_at: datetime
    is_retweet: bool = False

    model_config = ConfigDict(from_attributes=True)


class PostResponse(PostBase):
    """Schema for post response with author and engagement counts"""
    author: UserResponse
    like_count: int = 0
    retweet_count: int = 0
    comment_count: int = 0
    is_liked_by_current_user: bool = False
    is_retweeted_by_current_user: bool = False

    model_config = ConfigDict(from_attributes=True)


class PostDetail(PostResponse):
    """Detailed post response (for individual post view)"""
    original_post: Optional["PostResponse"] = None
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Comment Schemas
# ============================================

class CommentCreate(BaseModel):
    """Schema for creating a new comment"""
    content: str = Field(..., min_length=1, max_length=500)
    post_id: int = Field(..., gt=0)
    parent_comment_id: Optional[int] = Field(None, gt=0)  # For nested replies


class CommentUpdate(BaseModel):
    """Schema for updating a comment"""
    content: str = Field(..., min_length=1, max_length=500)


class CommentBase(BaseModel):
    """Base comment schema"""
    id: int
    content: str
    post_id: int
    parent_comment_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CommentResponse(CommentBase):
    """Schema for comment response with author info"""
    author: UserResponse
    reply_count: int = 0  # Number of replies to this comment

    model_config = ConfigDict(from_attributes=True)


class CommentWithReplies(CommentResponse):
    """Comment response with nested replies (for threaded comments)"""
    replies: list["CommentResponse"] = []

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Retweet Schemas
# ============================================

class RetweetCreate(BaseModel):
    """Schema for creating a retweet"""
    original_post_id: int = Field(..., gt=0)


class RetweetResponse(BaseModel):
    """Schema for retweet response"""
    id: int
    user: UserResponse
    original_post_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Like Schemas
# ============================================

class LikeResponse(BaseModel):
    """Schema for like response"""
    id: int
    user: UserResponse
    post_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================
# Authentication Schemas
# ============================================

class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data"""
    user_id: Optional[int] = None
    username: Optional[str] = None


# ============================================
# Pagination & Response Wrappers
# ============================================

class PaginatedResponse(BaseModel):
    """Generic paginated response wrapper"""
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


class PostListResponse(BaseModel):
    """Paginated list of posts"""
    items: list[PostResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CommentListResponse(BaseModel):
    """Paginated list of comments"""
    items: list[CommentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================
# Generic Response Schemas
# ============================================

class MessageResponse(BaseModel):
    """Generic message response"""
    message: str
    detail: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
    status_code: int