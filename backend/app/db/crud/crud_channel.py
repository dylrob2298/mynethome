# crud_channel.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

# Import your models
from ..models.channel import Channel
from ..models.category import Category
# Import your Pydantic schemas (example names)
from ...schemas.channel import ChannelCreate, ChannelUpdate, ChannelSearchParams


async def create_channel(db: AsyncSession, channel_in: ChannelCreate) -> Channel:
    """
    Create a new Channel record from the data in 'channel_in'.
    """
    db_channel = Channel(**channel_in.model_dump())  # if using pydantic-model_dump
    db.add(db_channel)
    await db.commit()
    await db.refresh(db_channel)
    return db_channel


async def get_channel_by_id(db: AsyncSession, channel_id: str) -> Channel | None:
    """
    Retrieve a Channel by its primary key (the YT channel ID, e.g. UC_xxx).
    """
    query = select(Channel).where(Channel.id == channel_id)
    result = await db.execute(query)
    return result.scalars().first()


async def get_all_channels(db: AsyncSession) -> list[Channel]:
    """
    Return all channels in the database.
    """
    query = select(Channel)
    result = await db.execute(query)
    return result.scalars().all()

async def get_channels(db: AsyncSession, params: ChannelSearchParams) -> list[Channel]:
    """
    Return all channels matching the given search params in the database
    """
    query = select(Channel).options(selectinload(Channel.categories))  # 🔹 Explicitly load categories

    # If filtering by multiple categories
    if params.categories and len(params.categories) > 0:
        query = (
            query
            .join(Channel.categories)      # many-to-many join
            .where(Category.name.in_(params.categories))
        )
    
    if params.title:
        query = query.where(Channel.title.ilike(f"%{params.title}%"))

    if params.order_by == "title":
        query = query.order_by(Channel.title.asc())
    elif params.order_by == "created_at":
        query = query.order_by(Channel.created_at.desc())
    elif params.order_by == "last_updated":
        query = query.order_by(Channel.last_updated.desc())

    query = query.limit(params.limit).offset(params.offset)

    result = await db.execute(query)
    return result.scalars().all()


async def update_channel(
    db: AsyncSession,
    channel_id: str,
    channel_update: ChannelUpdate
) -> Channel:
    """
    Update fields of an existing Channel. 
    Raises ValueError if the Channel doesn't exist.
    """
    db_channel = await get_channel_by_id(db, channel_id)
    if not db_channel:
        raise ValueError(f"Channel with ID {channel_id} does not exist.")
    
    update_data = channel_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_channel, field, value)
    
    await db.commit()
    await db.refresh(db_channel)
    return db_channel


async def delete_channel(db: AsyncSession, channel_id: str) -> None:
    """
    Delete a channel by its ID. 
    All related videos (if cascade='all, delete-orphan' is set) will be deleted automatically.
    """
    await db.execute(delete(Channel).where(Channel.id == channel_id))
    await db.commit()
