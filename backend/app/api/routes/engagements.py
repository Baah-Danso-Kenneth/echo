from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.models.models import Post, Like, Retweet, User
from app.schemas.schemas import MessageResponse, LikeResponse, RetweetResponse
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/posts", tags=["Engagements"])


# ============================================
# Like Endpoints
# ============================================

@router.post("/{post_id}/like", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def like_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Like a post.

    If the post is already liked by the user, returns 400.
    """
    # Check if post exists
    post_result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = post_result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Check if already liked
    existing_like = await db.execute(
        select(Like).where(
            Like.user_id == current_user.id,
            Like.post_id == post_id
        )
    )

    if existing_like.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already liked this post"
        )

    # Create like
    new_like = Like(
        user_id=current_user.id,
        post_id=post_id
    )

    try:
        db.add(new_like)
        await db.commit()

        return {
            "message": "Post liked successfully",
            "detail": f"Post {post_id} has been liked"
        }
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to like post. It may have already been liked."
        )


@router.delete("/{post_id}/like", response_model=MessageResponse)
async def unlike_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Unlike a post.

    Removes the like from the specified post.
    """
    # Find the like
    result = await db.execute(
        select(Like).where(
            Like.user_id == current_user.id,
            Like.post_id == post_id
        )
    )
    like = result.scalar_one_or_none()

    if not like:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like not found. You haven't liked this post."
        )

    # Delete the like
    await db.delete(like)
    await db.commit()

    return {
        "message": "Post unliked successfully",
        "detail": f"Like removed from post {post_id}"
    }


@router.get("/{post_id}/likes", response_model=list[LikeResponse])
async def get_post_likes(
        post_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Get all users who liked a specific post.

    Returns a list of likes with user information.
    """
    # Check if post exists
    post_result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = post_result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Get all likes with user info
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Like)
        .options(selectinload(Like.user))
        .where(Like.post_id == post_id)
        .order_by(Like.created_at.desc())
    )
    likes = result.scalars().all()

    return likes


# ============================================
# Retweet Endpoints
# ============================================

@router.post("/{post_id}/retweet", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def retweet_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Retweet a post.

    Creates a retweet entry and optionally creates a new post entry.
    If already retweeted, returns 400.
    """
    # Check if post exists
    post_result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = post_result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Can't retweet your own post
    if post.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot retweet your own post"
        )

    # Check if already retweeted
    existing_retweet = await db.execute(
        select(Retweet).where(
            Retweet.user_id == current_user.id,
            Retweet.original_post_id == post_id
        )
    )

    if existing_retweet.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already retweeted this post"
        )

    # Create retweet entry
    new_retweet = Retweet(
        user_id=current_user.id,
        original_post_id=post_id
    )

    # Create a new post entry for the retweet (appears in user's timeline)
    retweet_post = Post(
        content=post.content,  # Copy original content
        user_id=current_user.id,
        is_retweet=True,
        original_post_id=post_id
    )

    try:
        db.add(new_retweet)
        db.add(retweet_post)
        await db.commit()

        return {
            "message": "Post retweeted successfully",
            "detail": f"Post {post_id} has been retweeted"
        }
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to retweet post. It may have already been retweeted."
        )


@router.delete("/{post_id}/retweet", response_model=MessageResponse)
async def unretweet_post(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Remove a retweet (undo retweet).

    Deletes the retweet entry and the retweet post from timeline.
    """
    # Find the retweet entry
    retweet_result = await db.execute(
        select(Retweet).where(
            Retweet.user_id == current_user.id,
            Retweet.original_post_id == post_id
        )
    )
    retweet = retweet_result.scalar_one_or_none()

    if not retweet:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Retweet not found. You haven't retweeted this post."
        )

    # Find and delete the retweet post
    retweet_post_result = await db.execute(
        select(Post).where(
            Post.user_id == current_user.id,
            Post.original_post_id == post_id,
            Post.is_retweet == True
        )
    )
    retweet_post = retweet_post_result.scalar_one_or_none()

    # Delete both the retweet entry and the post
    await db.delete(retweet)
    if retweet_post:
        await db.delete(retweet_post)

    await db.commit()

    return {
        "message": "Retweet removed successfully",
        "detail": f"Retweet of post {post_id} has been removed"
    }


@router.get("/{post_id}/retweets", response_model=list[RetweetResponse])
async def get_post_retweets(
        post_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Get all users who retweeted a specific post.

    Returns a list of retweets with user information.
    """
    # Check if post exists
    post_result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = post_result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Get all retweets with user info
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Retweet)
        .options(selectinload(Retweet.user))
        .where(Retweet.original_post_id == post_id)
        .order_by(Retweet.created_at.desc())
    )
    retweets = result.scalars().all()

    return retweets