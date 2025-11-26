from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import get_user_id_from_token
from app.models.models import User
from app.schemas.schemas import TokenData

# ============================================
# Authentication Dependencies
# ============================================

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.

    Usage:
        @router.get("/protected")
        async def protected_route(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.id}

    Raises:
        HTTPException: If token is invalid or user not found
    """
    # Extract token from Authorization header
    token = credentials.credentials

    # Decode token and get user ID
    user_id = get_user_id_from_token(token)

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Fetch user from database
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
        db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to optionally get the current user.
    Returns None if no valid token is provided.

    Useful for public endpoints that behave differently for authenticated users.

    Usage:
        @router.get("/posts")
        async def get_posts(current_user: Optional[User] = Depends(get_current_user_optional)):
            # current_user will be None if not authenticated
            pass
    """
    if credentials is None:
        return None

    token = credentials.credentials
    user_id = get_user_id_from_token(token)

    if user_id is None:
        return None

    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()


# ============================================
# Pagination Dependencies
# ============================================

class PaginationParams:
    """
    Reusable pagination parameters.

    Usage:
        @router.get("/posts")
        async def get_posts(pagination: PaginationParams = Depends()):
            # Use pagination.page and pagination.page_size
            pass
    """

    def __init__(
            self,
            page: int = 1,
            page_size: int = 20
    ):
        self.page = max(1, page)  # Ensure page is at least 1
        self.page_size = min(max(1, page_size), 100)  # Between 1 and 100
        self.skip = (self.page - 1) * self.page_size
        self.limit = self.page_size


def get_pagination_params(
        page: int = 1,
        page_size: int = 20
) -> PaginationParams:
    """
    Alternative pagination dependency as a function.
    """
    return PaginationParams(page=page, page_size=page_size)


# ============================================
# Validation Dependencies
# ============================================

async def validate_post_owner(
        post_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
) -> bool:
    """
    Dependency to check if the current user owns a specific post.

    Usage:
        @router.delete("/posts/{post_id}")
        async def delete_post(
            post_id: int,
            is_owner: bool = Depends(validate_post_owner)
        ):
            # Will raise 403 if user doesn't own the post
            pass

    Raises:
        HTTPException: If user doesn't own the post
    """
    from app.models.models import Post

    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to perform this action"
        )

    return True

# ============================================
# Rate Limiting (Optional - Placeholder)
# ============================================

# class RateLimiter:
#     """
#     Simple in-memory rate limiter.
#     For production, use Redis-based rate limiting.
#     """
#     def __init__(self, requests: int = 100, window: int = 60):
#         self.requests = requests
#         self.window = window
#         # Implementation would go here
#
#     async def __call__(self, request: Request):
#         # Rate limiting logic
#         pass