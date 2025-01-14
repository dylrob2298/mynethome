from fastapi import APIRouter, HTTPException, Query
from typing import Annotated
from ..schemas.feed import FeedAdd, FeedOut, FeedUpdate, FeedSearchParams
from ..dependencies import DBSessionDep
from ..db.crud import crud_feed
from ..services.feed_service import handle_feed_addition, handle_refresh_feed


router = APIRouter(
    prefix="/feeds",
    tags=["feeds"]
)

@router.get("/", response_model=list[FeedOut])
async def get_all_feeds(db_session: DBSessionDep):
    feeds = await crud_feed.get_all_feeds(db_session)
    if not feeds:
        return []
    return [FeedOut.model_validate(feed) for feed in feeds]

@router.post("/", response_model=FeedOut)
async def add_new_feed(new_feed: FeedAdd, db_session: DBSessionDep):
    return await handle_feed_addition(new_feed, db_session)

@router.get("/search", response_model=list[FeedOut])
async def get_feeds(db_session: DBSessionDep, feed_search_query: Annotated[FeedSearchParams, Query()]):
    return await crud_feed.get_feeds(db_session, feed_search_query)

@router.patch("/{feed_id}", response_model=FeedOut)
async def update_feed(feed_id: int, feed_update: FeedUpdate, db_session: DBSessionDep):
    if not feed_update.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No fields to update.")
    try:
        updated_feed = await crud_feed.update_feed(db_session, feed_id, feed_update)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    return FeedOut.model_validate(updated_feed)

@router.delete("/{feed_id}")
async def delete_feed(feed_id: int, db_session: DBSessionDep):
    await crud_feed.delete_feed(db_session, feed_id)
    return { "message": "feed deleted" }

@router.post("/{feed_id}/refresh")
async def refresh_feed_by_id(feed_id: int, db_session: DBSessionDep):
    return await handle_refresh_feed(feed_id, db_session)
