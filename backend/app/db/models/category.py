from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..base import Base


class FeedCategory(Base):
    __tablename__ = "feed_categories"

    feed_id: Mapped[int] = mapped_column(ForeignKey("feeds.id"), primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), primary_key=True)

class ChannelCategory(Base):
    __tablename__ = "channel_categories"

    channel_id: Mapped[int] = mapped_column(ForeignKey("channels.id"), primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), primary_key=True)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(unique=True, nullable=False)

    feeds: Mapped[list["Feed"]] = relationship("Feed", secondary="feed_categories", back_populates="categories") # type: ignore
    channels: Mapped[list["Channel"]] = relationship("Channel", secondary="channel_categories", back_populates="categories") # type: ignore

