from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, ForeignKey, DateTime, ARRAY
from sqlalchemy.sql import func
from datetime import datetime, timezone
from ..base import Base

class Article(Base):
    __tablename__ = 'articles'
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(nullable=False)
    link: Mapped[str] = mapped_column(unique=True, nullable=False)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    author: Mapped[str | None] = mapped_column(nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(nullable=True)
    categories: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    is_favorited: Mapped[bool] = mapped_column(default=False)
    is_read: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False)

    feeds: Mapped[list["Feed"]] = relationship("Feed", secondary="feed_articles", back_populates="articles", lazy="selectin") # type: ignore
