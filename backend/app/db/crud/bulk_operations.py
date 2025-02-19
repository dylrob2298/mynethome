from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.article import Article
from ..models.feed import Feed
from ..models.feed_articles import FeedArticles
from ...schemas.article import ArticleCreate

async def bulk_associate_articles_with_feed(
    db: AsyncSession, feed_id: int, articles_data: list[ArticleCreate]
) -> dict:
    """
    Inserts or updates Articles in bulk (using Postgres upsert) 
    and associates them with the given Feed. 
    
    - On conflict for Articles (unique link), we update title, 
      published_at, updated_at, author, summary, content, image_url, 
      categories, etc.
    - For the junction table (FeedArticles), we do "ON CONFLICT DO NOTHING"
      so we don't re-insert an existing (feed_id, article_id) pair.
    - Duplicates in articles_data (by link) are removed to avoid 
      redundant inserts/upserts.

    Returns:
        dict of counts:
        {
            "new_articles_count": int,
            "existing_articles_count": int,
            "new_relationships_count": int,
        }
    """

    # If there's nothing to process, return early
    if not articles_data:
        return {
            "new_articles_count": 0,
            "existing_articles_count": 0,
            "new_relationships_count": 0,
        }

    # 1) Ensure the feed exists
    feed_query = select(Feed).where(Feed.id == feed_id)
    feed = (await db.execute(feed_query)).scalars().first()
    if not feed:
        raise ValueError(f"Feed with ID {feed_id} does not exist.")

    # -------------------------------------------------------------------------
    # Deduplicate `articles_data` by link to ensure we only upsert one row
    # per unique link.
    # If you want to keep the *last* instance of a given link instead of the
    # first, you can iterate in reversed(...) or adjust logic accordingly.
    # -------------------------------------------------------------------------
    unique_links = set()
    deduplicated_articles: list[ArticleCreate] = []
    for article in articles_data:
        if article.link not in unique_links:
            deduplicated_articles.append(article)
            unique_links.add(article.link)
    # Now `deduplicated_articles` has only one entry per link

    # 2) Extract the incoming links
    incoming_links = [str(a.link) for a in deduplicated_articles]

    # 3) Check existing links in the DB for counting new vs. existing
    existing_links_query = select(Article.link).where(Article.link.in_(incoming_links))
    existing_links_in_db = set((await db.execute(existing_links_query)).scalars().all())

    # 4) Convert ArticleCreate items to dict for bulk insert
    article_dicts = [item.model_dump() for item in deduplicated_articles]

    # 5) Upsert (insert on conflict do update) Articles
    stmt = (
        pg_insert(Article)
        .values(article_dicts)
        .on_conflict_do_update(
            constraint="articles_link_key",  # or index_elements=["link"]
            set_={
                "title":        pg_insert(Article).excluded.title,
                # "published_at": pg_insert(Article).excluded.published_at,
                "updated_at":   pg_insert(Article).excluded.updated_at,
                "author":       pg_insert(Article).excluded.author,
                "summary":      pg_insert(Article).excluded.summary,
                "content":      pg_insert(Article).excluded.content,
                "image_url":    pg_insert(Article).excluded.image_url,
                "categories":   pg_insert(Article).excluded.categories,
                # Possibly also update is_favorited, is_read, etc.
            },
        )
        .returning(Article.id, Article.link)
    )

    result = await db.execute(stmt)
    await db.commit()

    rows = result.fetchall()  # list of (id, link)
    link_to_id = {r.link: r.id for r in rows}

    # 6) Count how many new vs. how many updated
    new_articles_count = sum(1 for link in link_to_id if link not in existing_links_in_db)
    existing_articles_count = len(link_to_id) - new_articles_count

    # 7) Insert into feed_articles table with ON CONFLICT DO NOTHING
    feed_article_values = [
        {"feed_id": feed_id, "article_id": link_to_id[link]}
        for link in link_to_id
    ]
    stmt_feed_articles = (
        pg_insert(FeedArticles)
        .values(feed_article_values)
        .on_conflict_do_nothing(index_elements=["feed_id", "article_id"])
        .returning(FeedArticles.article_id)
    )
    result_feed_articles = await db.execute(stmt_feed_articles)
    await db.commit()

    new_relationship_article_ids = result_feed_articles.scalars().all()
    new_relationships_count = len(new_relationship_article_ids)

    return {
        "new_articles_count": new_articles_count,
        "existing_articles_count": existing_articles_count,
        "new_relationships_count": new_relationships_count,
    }
