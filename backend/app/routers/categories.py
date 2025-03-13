from fastapi import APIRouter, HTTPException, Query
from typing import Annotated
from ..schemas.category import CategoryCreate, CategoryOut, CategoryUpdate, UpdateFeedCategory, UpdateChannelCategory
from ..dependencies import DBSessionDep
from ..db.crud import crud_category


router = APIRouter(
    prefix="/categories",
    tags=["categories"]
)

@router.get("/", response_model=list[CategoryOut])
async def get_all_categories(db_session: DBSessionDep):
    return await crud_category.get_all_categories(db_session)

@router.post("/create", response_model=CategoryOut)
async def create_category(db_session: DBSessionDep, new_cat: CategoryCreate):
    return await crud_category.create_category(db_session, category_in=new_cat)

@router.delete("/delete/{category_id}")
async def delete_category(db_session: DBSessionDep, category_id: int):
    await crud_category.delete_category(db_session, category_id)
    return { "message": "category deleted" }

@router.post("/addFeed")
async def add_feed_to_category(db_session: DBSessionDep, ids: UpdateFeedCategory):
    feed_id = ids.feed_id
    category_id = ids.category_id

    await crud_category.add_feed_to_category(db_session, category_id, feed_id)
    return { "message": "added feed to category" }

@router.post("/removeFeed")
async def remove_feed_from_category(db_session: DBSessionDep, ids: UpdateFeedCategory):
    feed_id = ids.feed_id
    category_id = ids.category_id

    await crud_category.remove_feed_from_category(db_session, category_id, feed_id)
    return { "message": "removed feed from category" }

@router.post("/addChannel")
async def add_channel_to_category(db_session: DBSessionDep, ids: UpdateChannelCategory):
    channel_id = ids.channel_id
    category_id = ids.category_id

    await crud_category.add_channel_to_category(db_session, category_id, channel_id)
    return { "message": "added channel to category" }

@router.post("/removeChannel")
async def remove_channel_from_category(db_session: DBSessionDep, ids: UpdateChannelCategory):
    channel_id = ids.channel_id
    category_id = ids.category_id

    await crud_category.remove_channel_from_category(db_session, category_id, channel_id)
    return { "message": "removed channel from category" }




    

