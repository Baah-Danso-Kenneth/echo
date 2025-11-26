from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.models import User, Post
from app.schemas.schemas import UserResponse, UserProfile

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{username}", response_model=UserProfile)
async def get_user_profile(
        username: str,
        db: AsyncSession = Depends(get_db)
):
    """
    Get a user's profile by username.

    Returns user information along with statistics (post count).
    """
    # Find user
    result = await db.execute(
        select(User).where(User.username == username)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get post count
    post_count_query = select(func.count(Post.id)).where(
        Post.user_id == user.id,
        Post.is_retweet == False
    )
    post_count_result = await db.execute(post_count_query)
    post_count = post_count_result.scalar() or 0

    return UserProfile(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        bio=user.bio,
        created_at=user.created_at,
        post_count=post_count
    )


@router.get("/{user_id}/by-id", response_model=UserResponse)
async def get_user_by_id(
        user_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Get a user by their ID.

    Alternative endpoint if you have the user ID instead of username.
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user