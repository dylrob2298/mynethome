from fastapi import APIRouter, HTTPException, Query
from typing import Annotated
from ..schemas.article import ArticleOut, ArticleUpdate, ArticleSearchParams
from ..dependencies import DBSessionDep
from ..db.crud import crud_article


router = APIRouter(
    prefix="/articles",
    tags=["articles"]
)

@router.get("/", response_model=list[ArticleOut])
async def get_articles(db_session: DBSessionDep, feed_id: int, limit: int | None = 10, offset: int | None = 0):
    return  await crud_article.get_articles_by_feed_id(db_session, feed_id, limit, offset)

@router.get("/search", response_model=list[ArticleOut])
async def get_articles(db_session: DBSessionDep, article_search_query: Annotated[ArticleSearchParams, Query()]):
    return await crud_article.get_articles(db_session, article_search_query)

@router.patch("/{article_id}", response_model=ArticleOut)
async def update_article(db_session: DBSessionDep, article_id: int, article_update: ArticleUpdate):
    existing_article = await crud_article.get_article_by_id(db_session, article_id)
    if not existing_article:
        raise HTTPException(status_code=404, detail="Article not found.")
    return await crud_article.update_article(db_session, existing_article, article_update)

@router.delete("/{article_id}")
async def delete_article(db_session: DBSessionDep, article_id: int):
    await crud_article.delete_article_by_id(db_session, article_id)
    return { "message": "Article deleted."}


    

