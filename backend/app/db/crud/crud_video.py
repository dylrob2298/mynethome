# crud_video.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.dialects.postgresql import insert

from ..models.video import Video

from ...schemas.video import VideoCreate, VideoUpdate, VideoSearchParams


async def create_video(db: AsyncSession, video_in: VideoCreate) -> Video:
    """
    Create a new Video record.
    """
    db_video = Video(**video_in.model_dump())
    db.add(db_video)
    await db.commit()
    await db.refresh(db_video)
    return db_video

async def create_videos(db: AsyncSession, videos_in: list[VideoCreate]) -> None:
    """
    Bulk create new Video records and avoid duplicates with ON CONFLICT DO NOTHING
    """
    if not videos_in:
        return
    

    db_videos = [video_in.model_dump() for video_in in videos_in]
    stmt = insert(Video).values(db_videos)
    stmt = stmt.on_conflict_do_nothing(index_elements=["id"])

    await db.execute(stmt)
    await db.commit()


async def get_video_by_id(db: AsyncSession, video_id: str) -> Video | None:
    """
    Retrieve a single Video by its YT video ID.
    """
    query = select(Video).where(Video.id == video_id)
    result = await db.execute(query)
    return result.scalars().first()


async def get_videos_by_channel_id(db: AsyncSession, channel_id: str) -> list[Video]:
    """
    Retrieve all videos belonging to a specific channel ID.
    """
    query = select(Video).where(Video.channel_id == channel_id)
    result = await db.execute(query)
    return result.scalars().all()


async def get_all_videos(db: AsyncSession) -> list[Video]:
    """
    Retrieve all videos in the database (careful with large data sets!).
    """
    query = select(Video)
    result = await db.execute(query)
    return result.scalars().all()

async def get_videos(db: AsyncSession, params: VideoSearchParams) -> list[Video]:
    """
    Retrieve videos matching the given search parameters:
    - Filter by channel_ids, title, description, is_favorited
    - Order by created_at, last_updated, published_at, or title
    - Support pagination via limit & offset
    """

    query = select(Video)

    # 1) Apply filters
    if params.channel_ids:
        query = query.where(Video.channel_id.in_(params.channel_ids))
    if params.title:
        # case-insensitive substring match
        query = query.where(Video.title.ilike(f"%{params.title}%"))
    if params.description:
        query = query.where(Video.description.ilike(f"%{params.description}%"))
    if params.is_favorited is not None:
        query = query.where(Video.is_favorited == params.is_favorited)

    # 2) Order by user-specified field
    #    By default, we do descending for datetime fields, ascending for title.
    if params.order_by == "created_at":
        query = query.order_by(Video.created_at.desc())
    elif params.order_by == "last_updated":
        query = query.order_by(Video.last_updated.desc())
    elif params.order_by == "published_at":
        query = query.order_by(Video.published_at.desc())
    elif params.order_by == "title":
        query = query.order_by(Video.title.asc())
    else:
        # Just in case, fallback
        query = query.order_by(Video.published_at.desc())

    # 3) Pagination
    query = query.limit(params.limit).offset(params.offset)

    # 4) Execute the query
    result = await db.execute(query)
    return result.scalars().all()

async def update_video(db: AsyncSession, video_id: str, video_update: VideoUpdate) -> Video:
    """
    Update fields of an existing Video. Raises ValueError if the video doesn't exist.
    """
    db_video = await get_video_by_id(db, video_id)
    if not db_video:
        raise ValueError(f"Video with ID {video_id} does not exist.")
    
    update_data = video_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_video, field, value)
    
    await db.commit()
    await db.refresh(db_video)
    return db_video


async def delete_video(db: AsyncSession, video_id: str) -> None:
    """
    Delete a single video by its ID.
    """
    await db.execute(delete(Video).where(Video.id == video_id))
    await db.commit()
