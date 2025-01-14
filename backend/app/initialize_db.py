import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from db.base import Base
from db.models.article import Article
from db.models.feed import Feed  # Import your Base
from core.config import settings  # Import your config with DATABASE_URL

async def init_db():
    # Create an async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)

    # Use the async engine to create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
