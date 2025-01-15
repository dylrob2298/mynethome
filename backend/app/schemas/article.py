from pydantic import BaseModel, Field, HttpUrl
from typing import Literal
from .base import BaseSchema
from datetime import datetime

class ArticleBase(BaseSchema):
    title: str
    link: HttpUrl
    author: str | None = None
    summary: str | None = None
    content: str | None = None
    image_url: HttpUrl | None = None
    categories: list[str] | None = None
    published_at: datetime
    updated_at: datetime | None = None

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(ArticleBase):
    title: str | None = None
    link: HttpUrl | None = None
    categories: list[str] | None = None
    published_at: datetime | None = None
    updated_at: datetime | None = None
    is_favorited: bool | None = None
    is_read: bool | None = None

class ArticleParsed(ArticleBase):
    pass

class ArticleOut(ArticleBase):
    id: int
    is_favorited: bool
    is_read: bool
    created_at: datetime
    last_updated: datetime

    model_config = {
        "from_attributes": True
    }

class ArticleSearchParams(BaseModel):
    limit: int = Field(100, gt=0, le=100)
    offset: int = Field(0, ge=0)
    feed_id: int | None = None
    title: str | None = None
    author: str | None = None
    is_favorited: bool | None = None
    is_read: bool | None = None
    order_by: Literal["created_at", "last_updated", "published_at", "updated_at"] = "created_at"

class ArticleSearchResponse(BaseSchema):
    articles: list[ArticleOut]
    total_count: int