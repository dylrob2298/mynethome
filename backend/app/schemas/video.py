from pydantic import BaseModel, HttpUrl, Field
from .base import BaseSchema
from datetime import datetime
from typing import Literal

class VideoBase(BaseSchema):
    id: str
    title: str
    description: str | None = None
    channel_id: str
    thumbnail_url: HttpUrl | None = None
    published_at: datetime

class VideoCreate(VideoBase):
    pass

class VideoOut(VideoBase):
    created_at: datetime
    last_updated: datetime
    is_favorited: bool

class VideoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    thumbnail_url: HttpUrl | None = None
    is_favorited: bool | None = None

class VideoSearchParams(BaseModel):
    channel_ids: list[str] = []
    title: str | None = None
    description: str | None = None
    is_favorited: bool | None = None
    order_by: Literal["created_at", "last_updated", "published_at", "title"] = "published_at"
    limit: int = Field(100, gt=0, le=100)
    offset: int = Field(0, ge=0)