import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from .core.config import settings
from .db.session import sessionmanager
from .routers import articles, feeds

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG if settings.debug_logs else logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Function that handles startup and shutdown events.
    To understand more, read https://fastapi.tiangolo.com/advanced/events/
    """
    yield
    if sessionmanager._engine is not None:
        # Close the DB connection
        await sessionmanager.close()

app = FastAPI(lifespan=lifespan)

app.include_router(feeds.router)
app.include_router(articles.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}

