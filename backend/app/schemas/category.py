from pydantic import BaseModel
from .base import BaseSchema

class CategoryBase(BaseSchema):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: str

class CategoryOut(CategoryBase):
    id: int

class UpdateFeedCategory(BaseSchema):
    category_id: int
    feed_id: int

class UpdateChannelCategory(BaseSchema):
    category_id: int
    channel_id: str
    