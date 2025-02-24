from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, Text
from datetime import datetime, timezone
from ..base import Base

class Feed(Base):
    __tablename__ = "feeds"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(nullable=False)
    url: Mapped[str] = mapped_column(unique=True, nullable=False)
    link: Mapped[str | None] = mapped_column(nullable=True)
    category: Mapped[str | None] = mapped_column(nullable=True)
    author: Mapped[str | None] = mapped_column(nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False)
    modified: Mapped[str | None] = mapped_column(nullable=True)
    etag: Mapped[str | None] = mapped_column(nullable=True)

    articles: Mapped[list["Article"]] = relationship( # type: ignore
        "Article", secondary="feed_articles", back_populates="feeds", lazy="selectin"
    )

    categories: Mapped[list["Category"]] = relationship("Category", secondary="feed_categories", back_populates="feeds") # type: ignore