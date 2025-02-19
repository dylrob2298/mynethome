# app/services/feed_service.py
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, timedelta

from ..utils.feedparse import parse_feed
from ..db.crud import crud_feed, crud_article, bulk_operations
from ..schemas.feed import FeedAdd, FeedOut, FeedCreate
from ..schemas.article import ArticleCreate, ArticleUpdate

async def handle_feed_addition(new_feed: FeedAdd, db_session: AsyncSession) -> FeedOut:
    """
    Handles the addition of a new feed and its articles.
    """
    url = new_feed.url

    # Check if feed already exists
    existing_feed = await crud_feed.get_feed_by_url(db_session, url)
    if existing_feed:
        raise HTTPException(status_code=400, detail="A feed with this URL already exists.")

    # Parse feed and articles
    try:
        parsed_feed, parsed_articles = parse_feed(url)
        if not parsed_feed:
            raise ValueError("error adding feed")
    except ValueError as e:
        print("here")
        print(e)
        raise HTTPException(status_code=400, detail=str(e))

    # Add category
    feed_create = FeedCreate(category=new_feed.category, **parsed_feed.model_dump(exclude="category"))

    # Store feed and articles
    new_feed_data = await crud_feed.create_feed(db_session, feed_create)
    result = await bulk_operations.bulk_associate_articles_with_feed(db_session, new_feed_data.id, parsed_articles)

    print(result)

    return FeedOut.model_validate(new_feed_data)

async def handle_refresh_feed(feed_id: int, db_session: AsyncSession):
    feed = await crud_feed.get_feed_by_id(db_session, feed_id)
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found.")
    now = datetime.now(timezone.utc)
    if (now - feed.last_updated) < timedelta(hours=1):
        return {
            "message": "Feed recently updated. No need to refresh."
        }

    try:
        parsed_feed, parsed_articles = parse_feed(feed.url, feed.etag, feed.modified)
        if not parsed_feed:
            return {
                "message": "Feed has no updates",
                "feed": feed.url,
                "new_articles": 0,
                "updated_articles": 0
            }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    response = await bulk_operations.bulk_associate_articles_with_feed(db_session, feed_id, parsed_articles)
    
    return {
        "message": "Feed refreshed successfully.",
        "feed": parsed_feed,
        "response": response
    }

async def handle_refresh_all_feeds(db_session: AsyncSession):
    """Handles refreshing all subscribed RSS Feeds"""
    feeds = await crud_feed.get_all_feeds(db_session)

    results = []
    for feed in feeds:
        try:
            refresh_result = await handle_refresh_feed(feed.id, db_session)
            results.append(refresh_result)
        except HTTPException as e:
            results.append({
                "feed": feed.url,
                "message": str(e)
            })
    
    return {
        "message": "feeds refreshed",
        "results": results
    }
  


