from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.article import Article
from ..models.feed import Feed
from ..models.feed_articles import FeedArticles
from ...schemas.article import ArticleCreate

async def bulk_associate_articles_with_feed(
    db: AsyncSession, feed_id: int, articles_data: list[ArticleCreate]
) -> dict:
    # Fetch the feed
    feed_query = select(Feed).where(Feed.id == feed_id)
    feed = (await db.execute(feed_query)).scalars().first()
    if not feed:
        raise ValueError(f"Feed with ID {feed_id} does not exist.")
    
    # Extract article links for deduplication
    article_links = [str(article.link) for article in articles_data]

    # Fetch existing articles by link
    existing_articles_query = (
        select(Article).where(Article.link.in_(article_links))
    )
    existing_articles = (await db.execute(existing_articles_query)).scalars().all()
    existing_links = {article.link for article in existing_articles}

    # Create new articles for links that do not exist
    new_articles_data = [
        Article(**article.model_dump())
        for article in articles_data
        if str(article.link) not in existing_links
    ]
    db.add_all(new_articles_data)  # Bulk add new articles
    await db.commit()  # Commit new articles to assign IDs

    # Refresh to get IDs for newly created articles
    for new_article in new_articles_data:
        await db.refresh(new_article)

    # Combine all articles (new + existing)
    all_articles = {article.link: article for article in existing_articles + new_articles_data}

    # Fetch existing feed-article relationships
    existing_relationships_query = (
        select(FeedArticles.article_id)
        .where(FeedArticles.feed_id == feed_id)
        .join(Article, FeedArticles.article_id == Article.id)
        .where(Article.link.in_(article_links))
    )
    existing_relationships = {row[0] for row in (await db.execute(existing_relationships_query)).all()}

    # Prepare new relationships for bulk insert
    new_relationships = [
        {"feed_id": feed_id, "article_id": article.id}
        for article in all_articles.values()
        if article.id not in existing_relationships
    ]
    if new_relationships:
        await db.execute(insert(FeedArticles), new_relationships)
        await db.commit()

    return {
        "new_articles_count": len(new_articles_data),
        "existing_articles_count": len(existing_articles),
        "new_relationships_count": len(new_relationships),
    }
