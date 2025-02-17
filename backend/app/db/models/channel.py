from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime, Text
from datetime import datetime, timezone
from ..base import Base

class Channel(Base):
    __tablename__ = "channels"

    id: Mapped[str] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploads_id: Mapped[str] = mapped_column(nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(nullable=True)
    category: Mapped[str | None] = mapped_column(nullable=True)
    is_favorited: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), nullable=False)
    last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False)

    videos: Mapped[list["Video"]] = relationship( # type: ignore
        "Video",
        back_populates="channel",
        cascade="all, delete-orphan"
    )