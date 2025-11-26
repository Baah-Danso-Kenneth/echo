from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_token_for_user
from app.models.models import User
from app.schemas.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    MessageResponse
)
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
        user_data: UserCreate,
        db: AsyncSession = Depends(get_db)
):
    """
    Register a new user account.

    - **username**: Unique username (3-50 chars, alphanumeric + underscore)
    - **email**: Valid email address
    - **password**: Password (min 8 chars)
    - **display_name**: Display name for the user
    - **bio**: Optional user biography
    """
    # Check if username already exists
    result = await db.execute(
        select(User).where(User.username == user_data.username)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )

    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_email = result.scalar_one_or_none()

    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    hashed_pwd = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pwd,
        display_name=user_data.display_name,
        bio=user_data.bio
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
async def login(
        credentials: UserLogin,
        db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password to get an access token.

    Returns a JWT token to use in the Authorization header:
    `Authorization: Bearer <token>`
    """
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()

    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_token_for_user(user.id, user.username)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
        current_user: User = Depends(get_current_user)
):
    """
    Get information about the currently authenticated user.

    Requires authentication (JWT token in Authorization header).
    """
    return current_user


@router.post("/logout", response_model=MessageResponse)
async def logout(
        current_user: User = Depends(get_current_user)
):
    """
    Logout endpoint (stateless JWT - just remove token on client side).

    Since we're using stateless JWT tokens, the actual logout happens
    on the client side by removing the token from storage.

    This endpoint is here for consistency and future token blacklisting.
    """
    return {
        "message": "Successfully logged out",
        "detail": "Remove the token from client storage"
    }