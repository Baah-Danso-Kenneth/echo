from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    posts: Mapped[List["Post"]] = relationship(
        "Post",
        back_populates="author",
        foreign_keys="Post.user_id",
        cascade="all, delete-orphan"
    )
    likes: Mapped[List["Like"]] = relationship(
        "Like",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    comments: Mapped[List["Comment"]] = relationship(
        "Comment",
        back_populates="author",
        cascade="all, delete-orphan"
    )
    retweets: Mapped[List["Retweet"]] = relationship(
        "Retweet",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # For handling retweets - if this post is a retweet, reference the original
    is_retweet: Mapped[bool] = mapped_column(default=False, nullable=False)
    original_post_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True  # Index for sorting by date
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    comments: Mapped[List["Comment"]] = relationship(
        "Comment",
        back_populates="post",
        cascade="all, delete-orphan"
    )

    # Relationships
    author: Mapped["User"] = relationship(
        "User",
        back_populates="posts",
        foreign_keys=[user_id]
    )
    likes: Mapped[List["Like"]] = relationship(
        "Like",
        back_populates="post",
        cascade="all, delete-orphan"
    )
    retweets: Mapped[List["Retweet"]] = relationship(
        "Retweet",
        back_populates="original_post",
        cascade="all, delete-orphan"
    )

    # Self-referential relationship for retweets
    original_post: Mapped[Optional["Post"]] = relationship(
        "Post",
        remote_side=[id],
        foreign_keys=[original_post_id]
    )

    def __repr__(self) -> str:
        return f"<Post(id={self.id}, user_id={self.user_id}, content='{self.content[:30]}...')>"


class Like(Base):
    __tablename__ = "likes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    post_id: Mapped[int] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="likes")
    post: Mapped["Post"] = relationship("Post", back_populates="likes")

    # Ensure a user can only like a post once
    __table_args__ = (
        UniqueConstraint('user_id', 'post_id', name='unique_user_post_like'),
    )

    def __repr__(self) -> str:
        return f"<Like(id={self.id}, user_id={self.user_id}, post_id={self.post_id})>"


class Retweet(Base):
    __tablename__ = "retweets"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    original_post_id: Mapped[int] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="retweets")
    original_post: Mapped["Post"] = relationship("Post", back_populates="retweets")

    # Ensure a user can only retweet a post once
    __table_args__ = (
        UniqueConstraint('user_id', 'original_post_id', name='unique_user_post_retweet'),
    )

    def __repr__(self) -> str:
        return f"<Retweet(id={self.id}, user_id={self.user_id}, original_post_id={self.original_post_id})>"


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    post_id: Mapped[int] = mapped_column(
        ForeignKey("posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )


    # Optional: Support for nested comments (replies to comments)
    parent_comment_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    author: Mapped["User"] = relationship("User", back_populates="comments")
    post: Mapped["Post"] = relationship("Post", back_populates="comments")

    # Self-referential relationship for nested comments (replies)
    parent_comment: Mapped[Optional["Comment"]] = relationship(
        "Comment",
        remote_side=[id],
        back_populates="replies",
        foreign_keys=[parent_comment_id]
    )
    replies: Mapped[List["Comment"]] = relationship(
        "Comment",
        back_populates="parent_comment",
        foreign_keys=[parent_comment_id],
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Comment(id={self.id}, user_id={self.user_id}, post_id={self.post_id})>"