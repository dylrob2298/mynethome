from pydantic import BaseModel, HttpUrl, Field
from .base import BaseSchema
from .category import CategoryOut
from datetime import datetime
from typing import Literal

class ChannelBase(BaseSchema):
    id: str
    title: str
    handle: str | None = None
    description: str | None = None
    uploads_id: str
    thumbnail_url: HttpUrl | None = None

class ChannelAddParams(BaseModel):
    handle: str
    categories: list[str] = []

class ChannelCreate(ChannelBase):
    pass

class ChannelOut(ChannelBase):
    created_at: datetime
    last_updated: datetime
    is_favorited: bool
    total_videos: int = 0
    categories: list[CategoryOut] = []

class ChannelUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    is_favorited: bool | None = None

class ChannelSearchParams(BaseModel):
    title: str | None = None
    categories: list[str] = []
    order_by: Literal["created_at", "last_updated", "title"] = "title"
    limit: int = Field(100, gt=0, le=100)
    offset: int = Field(0, ge=0)