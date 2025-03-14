import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .core.config import settings
from .db.session import sessionmanager
from .routers import articles, feeds, youtube, categories
from .utils.utils import scheduled_refresh_feeds


logging.basicConfig(stream=sys.stdout, level=logging.DEBUG if settings.debug_logs else logging.INFO)

origins = [
    "https://localhost:3000",
    "http://localhost:3000",
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Function that handles startup and shutdown events.
    To understand more, read https://fastapi.tiangolo.com/advanced/events/
    """
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        scheduled_refresh_feeds,
        "cron",
        hour="0,6,12,18",
        name="daily_feeds_refresh",
        misfire_grace_time=3600,
        coalesce=True
    )

    # job to quickly test scheduled_refresh_feeds
    # scheduler.add_job(scheduled_refresh_feeds, "interval", minutes=1)


    scheduler.start()

    yield

    scheduler.shutdown()

    if sessionmanager._engine is not None:
        # Close the DB connection
        await sessionmanager.close()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )

app.include_router(feeds.router)
app.include_router(articles.router)
app.include_router(youtube.router)
app.include_router(categories.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}

