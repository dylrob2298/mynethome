from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.feed import Feed
from ...schemas.feed import FeedCreate, FeedUpdate, FeedSearchParams

async def create_feed(db: AsyncSession, feed_in: FeedCreate) -> Feed:
    db_feed: Feed = Feed(**feed_in.model_dump())
    db.add(db_feed)
    await db.commit()
    await db.refresh(db_feed)
    return db_feed

async def get_feed_by_url(db: AsyncSession, url: str) -> Feed | None:
    query = select(Feed).where(Feed.url == url)
    result = await db.execute(query)
    return result.scalars().first()

async def get_feed_by_id(db: AsyncSession, id: int) -> Feed | None:
    query = select(Feed).where(Feed.id == id)
    result = await db.execute(query)
    return result.scalars().first()

async def get_all_feeds(db: AsyncSession) -> list[Feed] | None:
    query = select(Feed)
    result = await db.execute(query)
    return result.scalars().all()

async def update_feed(db: AsyncSession, feed_id: int, feed_update: FeedUpdate) -> Feed:
    db_feed = await get_feed_by_id(db, feed_id)
    if not db_feed:
        raise ValueError(f"Feed with ID {feed_id} does not exist.")
    
    update_data = feed_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_feed, field, value)
    
    await db.commit()
    await db.refresh(db_feed)
    return db_feed

async def delete_feed(db: AsyncSession, feed_id: int) -> None:
    feed = await get_feed_by_id(db, feed_id)
    if feed:
        await db.delete(feed)
        await db.commit()

async def get_feeds(db: AsyncSession, params: FeedSearchParams) -> list[Feed]:
    query = select(Feed)

    if params.name:
        query = query.where(Feed.name.ilike(f"%{params.name}%"))
    
    if params.category:
        query = query.where(Feed.category.ilike(f"%{params.category}%"))

    if params.order_by == "created_at":
        query = query.order_by(Feed.created_at.desc())
    elif params.order_by == "last_updated":
        query = query.order_by(Feed.last_updated.desc())

    query = query.limit(params.limit).offset(params.offset)

    result = await db.execute(query)
    return result.scalars().all()