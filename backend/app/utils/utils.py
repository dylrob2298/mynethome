from sqlalchemy.ext.asyncio import AsyncSession
from ..schemas.feed import FeedOut
from ..db.crud.crud_article import get_article_counts_for_feeds
from ..db.models.feed import Feed
from ..db.session import sessionmanager
from ..services.feed_service import handle_refresh_all_feeds

async def enrich_feeds(
    db_session: AsyncSession, feeds: list[Feed]
) -> list[FeedOut]:
    """
    Enrich a list of Feed objects with the total number of articles.

    :param db_session: Database session
    :param feeds: List of Feed objects
    :return: List of FeedOut objects with total_articles included
    """
    if not feeds:
        return []

    article_counts = await get_article_counts_for_feeds(
        db_session, [feed.id for feed in feeds]
    )

    return [
        FeedOut(
            id=feed.id,
            name=feed.name,
            url=feed.url,
            category=feed.category,
            author=feed.author,
            description=feed.description,
            image_url=feed.image_url,
            created_at=feed.created_at,
            last_updated=feed.last_updated,
            total_articles=article_counts.get(feed.id, 0),
        )
        for feed in feeds
    ]

async def scheduled_refresh_feeds():
    async with sessionmanager.session() as db_session:
        results = await handle_refresh_all_feeds(db_session)

    print("All feeds refreshed via job")
    print(results)