# crud_category.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from ..models.category import Category
from ..models.feed import Feed
from ...schemas.category import CategoryCreate, CategoryUpdate

async def create_category(db: AsyncSession, category_in: CategoryCreate) -> Category:
    """
    Create a new category.
    """
    db_category = Category(**category_in.model_dump())
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    return db_category


async def get_category_by_id(db: AsyncSession, category_id: int) -> Category | None:
    """
    Retrieve a category by its ID.
    Returns None if not found.
    """
    query = select(Category).where(Category.id == category_id)
    result = await db.execute(query)
    return result.scalars().first()


async def get_category_by_name(db: AsyncSession, name: str) -> Category | None:
    """
    Retrieve a category by name.
    Returns None if not found.
    """
    query = select(Category).where(Category.name == name)
    result = await db.execute(query)
    return result.scalars().first()


async def get_all_categories(db: AsyncSession) -> List[Category]:
    """
    Retrieve all categories.
    """
    query = select(Category)
    result = await db.execute(query)
    return result.scalars().all()


async def update_category(db: AsyncSession, category_id: int, category_in: CategoryUpdate) -> Category:
    """
    Update a category by ID.
    """
    db_category = await get_category_by_id(db, category_id)
    if not db_category:
        raise ValueError(f"Category with ID {category_id} does not exist.")
    
    update_data = category_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)

    await db.commit()
    await db.refresh(db_category)
    return db_category


async def delete_category(db: AsyncSession, category_id: int) -> None:
    """
    Delete a category by ID.
    """
    db_category = await get_category_by_id(db, category_id)
    if not db_category:
        raise ValueError(f"Category with ID {category_id} does not exist.")

    await db.delete(db_category)
    await db.commit()


async def add_feed_to_category(db: AsyncSession, category_id: int, feed_id: int) -> Category:
    """
    Add a feed to a category (many-to-many).
    Returns the updated Category object.
    """
    db_category = await get_category_by_id(db, category_id)
    if not db_category:
        raise ValueError(f"Category with ID {category_id} does not exist.")

    query_feed = select(Feed).where(Feed.id == feed_id)
    result_feed = await db.execute(query_feed)
    db_feed = result_feed.scalars().first()

    if not db_feed:
        raise ValueError(f"Feed with ID {feed_id} does not exist.")

    if db_feed not in db_category.feeds:
        db_category.feeds.append(db_feed)

    await db.commit()
    await db.refresh(db_category)
    return db_category


async def remove_feed_from_category(db: AsyncSession, category_id: int, feed_id: int) -> Category:
    """
    Remove a feed from a category (many-to-many).
    Returns the updated Category object.
    """
    db_category = await get_category_by_id(db, category_id)
    if not db_category:
        raise ValueError(f"Category with ID {category_id} does not exist.")

    query_feed = select(Feed).where(Feed.id == feed_id)
    result_feed = await db.execute(query_feed)
    db_feed = result_feed.scalars().first()

    if not db_feed:
        raise ValueError(f"Feed with ID {feed_id} does not exist.")

    if db_feed in db_category.feeds:
        db_category.feeds.remove(db_feed)

    await db.commit()
    await db.refresh(db_category)
    return db_category
