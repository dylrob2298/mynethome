from pydantic import BaseModel, HttpUrl, Field
from .base import BaseSchema
from datetime import datetime
from typing import Literal

class ChannelBase(BaseSchema):
    id: str
    title: str
    description: str | None = None
    uploads_id: str
    thumbnail_url: HttpUrl | None = None
    category: str | None = None

class ChannelAddParams(BaseModel):
    username: str
    category: str | None = None

class ChannelCreate(ChannelBase):
    pass

class ChannelOut(ChannelBase):
    created_at: datetime
    last_updated: datetime
    is_favorited: bool

class ChannelUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    thumbnail_url: HttpUrl | None = None
    category: str | None = None
    is_favorited: bool | None = None

class ChannelSearchParams(BaseModel):
    title: str | None = None
    category: str | None = None
    order_by: Literal["created_at", "last_updated", "title"] = "title"
    limit: int = Field(100, gt=0, le=100)
    offset: int = Field(0, ge=0)