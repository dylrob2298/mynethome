# crud_video.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func, distinct
from sqlalchemy.orm import aliased
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

async def get_videos(db: AsyncSession, params: VideoSearchParams) -> tuple[list[Video], int]:
    """
    Retrieve videos matching the given search parameters and return paginated results along with the total count.
    - Filter by channel_ids, title, description, is_favorited
    - Order by created_at, last_updated, published_at, or title
    - Support pagination via limit & offset
    """

    # Alias to ensure clarity in column selection
    video_alias = aliased(Video)

    # Base query to fetch videos
    query = select(
        *[getattr(video_alias, col) for col in Video.__table__.columns.keys()]
    )

    # Base query to count total matching videos (without pagination)
    total_query = select(func.count(distinct(video_alias.id)))

    # 1) Apply filters
    if params.channel_ids:
        query = query.where(video_alias.channel_id.in_(params.channel_ids))
        total_query = total_query.where(video_alias.channel_id.in_(params.channel_ids))

    if params.title:
        query = query.where(video_alias.title.ilike(f"%{params.title}%"))
        total_query = total_query.where(video_alias.title.ilike(f"%{params.title}%"))

    if params.description:
        query = query.where(video_alias.description.ilike(f"%{params.description}%"))
        total_query = total_query.where(video_alias.description.ilike(f"%{params.description}%"))

    if params.is_favorited is not None:
        query = query.where(video_alias.is_favorited == params.is_favorited)
        total_query = total_query.where(video_alias.is_favorited == params.is_favorited)

    # 2) Sorting based on user preference
    if params.order_by == "created_at":
        query = query.order_by(video_alias.created_at.desc())
    elif params.order_by == "last_updated":
        query = query.order_by(video_alias.last_updated.desc())
    elif params.order_by == "published_at":
        query = query.order_by(video_alias.published_at.desc())
    elif params.order_by == "title":
        query = query.order_by(video_alias.title.asc())
    else:
        query = query.order_by(video_alias.published_at.desc())  # Default order

    # 3) Apply Pagination
    paginated_query = query.limit(params.limit).offset(params.offset)

    # 4) Execute Queries
    result = await db.execute(paginated_query)
    total_count = await db.scalar(total_query)

    # Convert results to Video objects
    videos = [Video(**row._asdict()) for row in result]

    return videos, total_count

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
