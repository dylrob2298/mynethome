from pydantic import BaseModel, HttpUrl, Field
from .base import BaseSchema
from datetime import datetime
from typing import Literal

class FeedBase(BaseSchema):
    name: str
    url: HttpUrl
    category: str | None = None
    description: str | None = None
    author: str | None = None
    image_url: HttpUrl | None = None

class FeedAdd(BaseModel):
    url: str
    category: str | None = None

class FeedUpdate(BaseModel):
    name: str | None = None
    category: str | None = None

class FeedCreate(FeedBase):
    pass

class FeedOut(FeedBase):
    id: int
    created_at: datetime
    last_updated: datetime

    model_config = {
        "from_attributes": True
    }

class FeedSearchParams(BaseModel):
    name: str | None = None
    category: str | None = None
    description: str | None = None
    author: str | None = None
    order_by: Literal["created_at", "last_updated"] = "created_at"
    limit: int = Field(100, gt=0, le=100)
    offset: int = Field(0, ge=0)