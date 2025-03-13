from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select
from ..models.feed import Feed
from ..models.article import Article
from ..models.feed_articles import FeedArticles
from ..models.category import Category
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
    """
    Deletes a feed and any orphaned articles (articles with no associated feeds).
    """
    # Delete the feed
    await db.execute(delete(Feed).where(Feed.id == feed_id))

    # Find orphaned articles (articles with no associated feeds)
    orphaned_articles = await db.execute(
        select(Article.id)
        .join(FeedArticles, FeedArticles.article_id == Article.id, isouter=True)
        .where(FeedArticles.feed_id.is_(None))
    )
    article_ids_to_delete = [row[0] for row in orphaned_articles]

    # Delete orphaned articles
    if article_ids_to_delete:
        await db.execute(delete(Article).where(Article.id.in_(article_ids_to_delete)))

    # Commit the transaction
    await db.commit()

async def get_feeds(db: AsyncSession, params: FeedSearchParams) -> list[Feed]:
    # Start with distinct feeds to avoid duplicates if a feed matches multiple categories
    query = select(Feed).distinct()

    # If filtering by multiple categories
    if params.categories and len(params.categories) > 0:
        query = (
            query
            .join(Feed.categories)      # many-to-many join
            .where(Category.name.in_(params.categories))
        )

    # (Optional) If you want to keep the old single `category` field:
    if params.category:
        query = query.where(Feed.category.ilike(f"%{params.category}%"))

    if params.name:
        query = query.where(Feed.name.ilike(f"%{params.name}%"))

    if params.description:
        query = query.where(Feed.description.ilike(f"%{params.description}%"))

    if params.author:
        query = query.where(Feed.author.ilike(f"%{params.author}%"))

    # Order By
    if params.order_by == "name":
        query = query.order_by(Feed.name.asc())
    elif params.order_by == "created_at":
        query = query.order_by(Feed.created_at.desc())
    elif params.order_by == "last_updated":
        query = query.order_by(Feed.last_updated.desc())

    # Pagination
    query = query.limit(params.limit).offset(params.offset)

    # Execute and return
    result = await db.execute(query)
    return result.unique().scalars().all()