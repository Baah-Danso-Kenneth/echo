from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import Optional

from app.core.database import get_db
from app.models.models import Post, User, Like, Retweet
from app.schemas.schemas import (
    PostCreate, PostResponse, PostDetail, PostListResponse
)
from app.api.dependencies import get_current_user, get_current_user_optional, PaginationParams

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
        post_data: PostCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Create a new post.

    Requires authentication.
    - **content**: Post content (1-280 characters)
    """
    new_post = Post(
        content=post_data.content,
        user_id=current_user.id,
        is_retweet=False
    )

    db.add(new_post)
    await db.commit()
    await db.refresh(new_post, ["author"])

    # Return post with engagement counts
    return await _build_post_response(new_post, current_user.id, db)


@router.get("", response_model=PostListResponse)
async def get_posts(
        pagination: PaginationParams = Depends(),
        current_user: Optional[User] = Depends(get_current_user_optional),
        db: AsyncSession = Depends(get_db)
):
    """
    Get a paginated list of all posts (feed).

    Posts are returned in reverse chronological order (newest first).
    Authentication is optional - if authenticated, includes user's like/retweet status.
    """
    # Get total count
    count_query = select(func.count(Post.id)).where(Post.is_retweet == False)
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get posts with author eager loaded
    query = (
        select(Post)
        .options(selectinload(Post.author))
        .where(Post.is_retweet == False)
        .order_by(desc(Post.created_at))
        .offset(pagination.skip)
        .limit(pagination.limit)
    )

    result = await db.execute(query)
    posts = result.scalars().all()

    # Build response with engagement data
    user_id = current_user.id if current_user else None
    post_responses = []
    for post in posts:
        post_response = await _build_post_response(post, user_id, db)
        post_responses.append(post_response)

    return {
        "items": post_responses,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "total_pages": (total + pagination.page_size - 1) // pagination.page_size
    }


@router.get("/{post_id}", response_model=PostDetail)
async def get_post(
        post_id: int,
        current_user: Optional[User] = Depends(get_current_user_optional),
        db: AsyncSession = Depends(get_db)
):
    """
    Get a specific post by ID with full details.

    Includes author info, engagement counts, and original post if it's a retweet.
    """
    # Get post with author
    result = await db.execute(
        select(Post)
        .options(selectinload(Post.author))
        .where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Build detailed response
    user_id = current_user.id if current_user else None
    post_response = await _build_post_response(post, user_id, db)

    # If it's a retweet, get the original post
    original_post_response = None
    if post.is_retweet and post.original_post_id:
        original_result = await db.execute(
            select(Post)
            .options(selectinload(Post.author))
            .where(Post.id == post.original_post_id)
        )
        original_post = original_result.scalar_one_or_none()
        if original_post:
            original_post_response = await _build_post_response(original_post, user_id, db)

    return {
        **post_response.model_dump(),
        "original_post": original_post_response,
        "updated_at": post.updated_at
    }


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Delete a post.

    Only the post author can delete their own posts.
    """
    # Get the post
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Check if current user is the author
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this post"
        )

    # Delete the post (cascades to likes, retweets, comments)
    await db.delete(post)
    await db.commit()

    return None


@router.get("/user/{username}", response_model=PostListResponse)
async def get_user_posts(
        username: str,
        pagination: PaginationParams = Depends(),
        current_user: Optional[User] = Depends(get_current_user_optional),
        db: AsyncSession = Depends(get_db)
):
    """
    Get all posts by a specific user.

    Returns posts in reverse chronological order.
    """
    # Find user by username
    user_result = await db.execute(
        select(User).where(User.username == username)
    )
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get total count
    count_query = select(func.count(Post.id)).where(
        Post.user_id == user.id,
        Post.is_retweet == False
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()

    # Get user's posts
    query = (
        select(Post)
        .options(selectinload(Post.author))
        .where(Post.user_id == user.id, Post.is_retweet == False)
        .order_by(desc(Post.created_at))
        .offset(pagination.skip)
        .limit(pagination.limit)
    )

    result = await db.execute(query)
    posts = result.scalars().all()

    # Build responses
    user_id = current_user.id if current_user else None
    post_responses = []
    for post in posts:
        post_response = await _build_post_response(post, user_id, db)
        post_responses.append(post_response)

    return {
        "items": post_responses,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "total_pages": (total + pagination.page_size - 1) // pagination.page_size
    }


# ============================================
# Helper Functions
# ============================================

async def _build_post_response(
        post: Post,
        current_user_id: Optional[int],
        db: AsyncSession
) -> PostResponse:
    """
    Build a PostResponse with engagement counts and user interaction status.
    """
    # Get like count
    like_count_query = select(func.count(Like.id)).where(Like.post_id == post.id)
    like_count_result = await db.execute(like_count_query)
    like_count = like_count_result.scalar() or 0

    # Get retweet count
    retweet_count_query = select(func.count(Retweet.id)).where(Retweet.original_post_id == post.id)
    retweet_count_result = await db.execute(retweet_count_query)
    retweet_count = retweet_count_result.scalar() or 0

    # Get comment count
    from app.models.models import Comment
    comment_count_query = select(func.count(Comment.id)).where(Comment.post_id == post.id)
    comment_count_result = await db.execute(comment_count_query)
    comment_count = comment_count_result.scalar() or 0

    # Check if current user liked/retweeted this post
    is_liked = False
    is_retweeted = False

    if current_user_id:
        # Check like status
        like_check = await db.execute(
            select(Like).where(
                Like.user_id == current_user_id,
                Like.post_id == post.id
            )
        )
        is_liked = like_check.scalar_one_or_none() is not None

        # Check retweet status
        retweet_check = await db.execute(
            select(Retweet).where(
                Retweet.user_id == current_user_id,
                Retweet.original_post_id == post.id
            )
        )
        is_retweeted = retweet_check.scalar_one_or_none() is not None

    return PostResponse(
        id=post.id,
        content=post.content,
        created_at=post.created_at,
        is_retweet=post.is_retweet,
        author=post.author,
        like_count=like_count,
        retweet_count=retweet_count,
        comment_count=comment_count,
        is_liked_by_current_user=is_liked,
        is_retweeted_by_current_user=is_retweeted
    )