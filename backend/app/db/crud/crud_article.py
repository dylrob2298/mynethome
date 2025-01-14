from sqlalchemy import select
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

async def get_articles(db: AsyncSession, params: ArticleSearchParams) -> list[Article]:
    query = select(Article)

    if params.feed_id:
        query = query.join(FeedArticles, FeedArticles.article_id == Article.id).where(FeedArticles.feed_id == params.feed_id)
    
    if params.title:
        query = query.where(Article.title.ilike(f"%{params.title}%"))

    if params.author:
        query = query.where(Article.author.ilike(f"%{params.author}%"))

    if params.is_favorited is not None:
        query = query.where(Article.is_favorited == params.is_favorited)

    if params.is_read is not None:
        query = query.where(Article.is_read == params.is_read)

    if params.order_by == "created_at":
        query = query.order_by(Article.created_at.desc())
    elif params.order_by == "last_updated":
        query = query.order_by(Article.last_updated.desc())

    query = query.limit(params.limit).offset(params.offset)

    result = await db.execute(query)
    return result.scalars().all()


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