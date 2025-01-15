from sqlalchemy import distinct, func, select
from sqlalchemy.orm import aliased
from sqlalchemy.ext.asyncio import AsyncSession
from ..models.article import Article
from ..models.feed_articles import FeedArticles
from ...schemas.article import ArticleCreate, ArticleUpdate, ArticleSearchParams
from .crud_feed import get_feed_by_id

async def create_article(db: AsyncSession, article_in: ArticleCreate) -> Article:
    """Create a single Article"""
    db_article = Article(**article_in.model_dump())
    db.add(db_article)
    await db.commit()
    await db.refresh(db_article)
    return db_article

async def create_articles(db: AsyncSession, articles_in: list[ArticleCreate]) -> None:
    """Bulk create articles"""
    db_articles = [Article(**article_in.model_dump()) for article_in in articles_in]
    db.add_all(db_articles)
    await db.commit()

async def create_or_get_article(db: AsyncSession, article_data: ArticleCreate) -> Article:
    """Create or get an article"""
    existing_article = await get_article_by_link(db, article_data.link)
    if existing_article:
        return existing_article

    return await create_article(db, article_data)


async def associate_article_with_feed(db: AsyncSession, feed_id: int, article_data: ArticleCreate) -> Article:
    # Create or retrieve the article
    article = await create_or_get_article(db, article_data)

    # Associate the article with the feed using ORM
    feed = await get_feed_by_id(db, feed_id)
    if not feed:
        raise ValueError(f"Feed with ID {feed_id} does not exist.")

    if article not in feed.articles:
        feed.articles.append(article)
        await db.commit()

    return article

async def update_article(db: AsyncSession, db_article: Article, article_data: ArticleUpdate) -> Article:
    for field, value in article_data.model_dump(exclude_unset=True).items():
        setattr(db_article, field, value)
    await db.commit()
    await db.refresh(db_article)
    return db_article

async def get_articles_by_feed_id(db: AsyncSession, feed_id: int, limit: int = 10, offset: int = 0) -> list[Article]:
    query = (
        select(Article)
        .join(FeedArticles, FeedArticles.article_id == Article.id)
        .where(FeedArticles.feed_id == feed_id)
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    return result.scalars().all()

async def get_articles(db: AsyncSession, params: ArticleSearchParams) -> tuple[list[Article], int]:
    """
    Search articles with pagination and return the total count, resolving column ambiguities.

    :param db: Database session
    :param params: Search parameters
    :return: Tuple of (paginated articles, total count)
    """
    # Alias for Article to ensure column uniqueness
    article_alias = aliased(Article)

    # Base query selecting only Article columns
    query = select(
        *[getattr(article_alias, col) for col in Article.__table__.columns.keys()]
    )

    # Base query for total count (no pagination or sorting)
    total_query = select(func.count(distinct(article_alias.id)))

    # Join FeedArticles for feed filtering
    if params.feed_ids:
        query = query.join(
            FeedArticles,
            FeedArticles.article_id == article_alias.id
        ).where(FeedArticles.feed_id.in_(params.feed_ids))

        total_query = total_query.join(
            FeedArticles,
            FeedArticles.article_id == article_alias.id
        ).where(FeedArticles.feed_id.in_(params.feed_ids))

    # Apply filters based on search parameters
    if params.title:
        query = query.where(article_alias.title.ilike(f"%{params.title}%"))
        total_query = total_query.where(article_alias.title.ilike(f"%{params.title}%"))

    if params.author:
        query = query.where(article_alias.author.ilike(f"%{params.author}%"))
        total_query = total_query.where(article_alias.author.ilike(f"%{params.author}%"))

    if params.is_favorited is not None:
        query = query.where(article_alias.is_favorited == params.is_favorited)
        total_query = total_query.where(article_alias.is_favorited == params.is_favorited)

    if params.is_read is not None:
        query = query.where(article_alias.is_read == params.is_read)
        total_query = total_query.where(article_alias.is_read == params.is_read)

    # Sorting for the paginated query
    if params.order_by == "created_at":
        query = query.order_by(article_alias.created_at.desc())
    elif params.order_by == "last_updated":
        query = query.order_by(article_alias.last_updated.desc())
    elif params.order_by == "published_at":
        query = query.order_by(article_alias.published_at.desc())
    elif params.order_by == "updated_at":
        query = query.order_by(article_alias.updated_at.desc())

    # Pagination for the paginated query
    paginated_query = query.limit(params.limit).offset(params.offset)

    # Execute queries
    result = await db.execute(paginated_query)
    total_count = await db.scalar(total_query)

    # Map query results to Article objects
    articles = [Article(**row._asdict()) for row in result]

    return articles, total_count


async def get_article_by_link(db: AsyncSession, link: str) -> Article | None:
    query = select(Article).where(Article.link == link)
    result = await db.execute(query)
    return result.scalars().first()

async def get_article_by_id(db: AsyncSession, id: int) -> Article | None:
    query = select(Article).where(Article.id == id)
    result = await db.execute(query)
    return result.scalars().first()

async def delete_article_by_id(db: AsyncSession, article_id: int) -> None:
    article = await get_article_by_id(db, article_id)
    if article:
        await db.delete(article)
        await db.commit()

async def get_article_counts_for_feeds(db: AsyncSession, feed_ids: list[int]) -> dict[int, int]:
    """
    Calculate the number of articles for each feed in the provided list of feed IDs.

    :param db: Database session
    :param feed_ids: List of feed IDs
    :return: Dictionary mapping feed ID to article count
    """
    query = (
        select(FeedArticles.feed_id, func.count(FeedArticles.article_id).label("article_count"))
        .where(FeedArticles.feed_id.in_(feed_ids))
        .group_by(FeedArticles.feed_id)
    )

    result = await db.execute(query)
    return {row.feed_id: row.article_count for row in result.all()}
