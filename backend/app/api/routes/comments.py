from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import Comment, Post, User
from app.schemas.schemas import (
    CommentCreate, CommentUpdate, CommentResponse,
    CommentListResponse, MessageResponse, CommentWithReplies
)
from app.api.dependencies import get_current_user, PaginationParams

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
        comment_data: CommentCreate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Create a new comment on a post or reply to another comment.

    - **content**: Comment text (1-500 characters)
    - **post_id**: ID of the post being commented on
    - **parent_comment_id**: Optional - ID of parent comment for nested replies
    """
    # Verify post exists
    post_result = await db.execute(
        select(Post).where(Post.id == comment_data.post_id)
    )
    post = post_result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # If replying to a comment, verify it exists
    if comment_data.parent_comment_id:
        parent_result = await db.execute(
            select(Comment).where(Comment.id == comment_data.parent_comment_id)
        )
        parent_comment = parent_result.scalar_one_or_none()

        if not parent_comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )

        # Ensure parent comment is on the same post
        if parent_comment.post_id != comment_data.post_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent comment must be on the same post"
            )

    # Create comment
    new_comment = Comment(
        content=comment_data.content,
        user_id=current_user.id,
        post_id=comment_data.post_id,
        parent_comment_id=comment_data.parent_comment_id
    )

    db.add(new_comment)
    await db.commit()
    await db.refresh(new_comment, ["author"])

    # Build response with reply count
    return await _build_comment_response(new_comment, db)


@router.get("/post/{post_id}", response_model=CommentListResponse)
async def get_post_comments(
        post_id: int,
        pagination: PaginationParams = Depends(),
        db: AsyncSession = Depends(get_db)
):
    """
    Get all top-level comments for a post (paginated).

    Returns only top-level comments (no nested replies).
    Use GET /comments/{comment_id}/replies to get nested replies.
    """
    # Verify post exists
    post_result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = post_result.scalar_one_or_none()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    # Get total count of top-level comments
    count_query = select(func.count(Comment.id)).where(
        Comment.post_id == post_id,
        Comment.parent_comment_id.is_(None)
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get comments with author info
    query = (
        select(Comment)
        .options(selectinload(Comment.author))
        .where(
            Comment.post_id == post_id,
            Comment.parent_comment_id.is_(None)
        )
        .order_by(desc(Comment.created_at))
        .offset(pagination.skip)
        .limit(pagination.limit)
    )

    result = await db.execute(query)
    comments = result.scalars().all()

    # Build responses with reply counts
    comment_responses = []
    for comment in comments:
        comment_response = await _build_comment_response(comment, db)
        comment_responses.append(comment_response)

    return {
        "items": comment_responses,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "total_pages": (total + pagination.page_size - 1) // pagination.page_size
    }


@router.get("/{comment_id}", response_model=CommentWithReplies)
async def get_comment(
        comment_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Get a specific comment with its direct replies.

    Returns the comment and its immediate child replies (one level deep).
    """
    # Get comment with author
    result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Get direct replies
    replies_result = await db.execute(
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.parent_comment_id == comment_id)
        .order_by(Comment.created_at)
    )
    replies = replies_result.scalars().all()

    # Build response
    comment_response = await _build_comment_response(comment, db)
    reply_responses = []
    for reply in replies:
        reply_response = await _build_comment_response(reply, db)
        reply_responses.append(reply_response)

    return {
        **comment_response.model_dump(),
        "replies": reply_responses
    }


@router.get("/{comment_id}/replies", response_model=CommentListResponse)
async def get_comment_replies(
        comment_id: int,
        pagination: PaginationParams = Depends(),
        db: AsyncSession = Depends(get_db)
):
    """
    Get paginated replies to a specific comment.

    Useful for loading nested comment threads.
    """
    # Verify parent comment exists
    parent_result = await db.execute(
        select(Comment).where(Comment.id == comment_id)
    )
    parent_comment = parent_result.scalar_one_or_none()

    if not parent_comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Get total count of replies
    count_query = select(func.count(Comment.id)).where(
        Comment.parent_comment_id == comment_id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get replies
    query = (
        select(Comment)
        .options(selectinload(Comment.author))
        .where(Comment.parent_comment_id == comment_id)
        .order_by(Comment.created_at)
        .offset(pagination.skip)
        .limit(pagination.limit)
    )

    result = await db.execute(query)
    replies = result.scalars().all()

    # Build responses
    reply_responses = []
    for reply in replies:
        reply_response = await _build_comment_response(reply, db)
        reply_responses.append(reply_response)

    return {
        "items": reply_responses,
        "total": total,
        "page": pagination.page,
        "page_size": pagination.page_size,
        "total_pages": (total + pagination.page_size - 1) // pagination.page_size
    }


@router.patch("/{comment_id}", response_model=CommentResponse)
async def update_comment(
        comment_id: int,
        comment_data: CommentUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Update a comment's content.

    Only the comment author can update their comment.
    """
    # Get comment
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check ownership
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this comment"
        )

    # Update comment
    comment.content = comment_data.content
    await db.commit()
    await db.refresh(comment, ["author"])

    return await _build_comment_response(comment, db)


@router.delete("/{comment_id}", response_model=MessageResponse)
async def delete_comment(
        comment_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Delete a comment.

    Only the comment author can delete their comment.
    Deleting a comment also deletes all its nested replies (cascade).
    """
    # Get comment
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )

    # Check ownership
    if comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this comment"
        )

    # Delete comment (cascades to replies)
    await db.delete(comment)
    await db.commit()

    return {
        "message": "Comment deleted successfully",
        "detail": f"Comment {comment_id} and all its replies have been deleted"
    }


# ============================================
# Helper Functions
# ============================================

async def _build_comment_response(
        comment: Comment,
        db: AsyncSession
) -> CommentResponse:
    """
    Build a CommentResponse with reply count.
    """
    # Get reply count
    reply_count_query = select(func.count(Comment.id)).where(
        Comment.parent_comment_id == comment.id
    )
    reply_count_result = await db.execute(reply_count_query)
    reply_count = reply_count_result.scalar() or 0

    return CommentResponse(
        id=comment.id,
        content=comment.content,
        post_id=comment.post_id,
        parent_comment_id=comment.parent_comment_id,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        author=comment.author,
        reply_count=reply_count
    )