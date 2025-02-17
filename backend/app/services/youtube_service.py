import asyncio
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from ..utils.youtubeapi import YouTubeAPI
from ..schemas.channel import ChannelCreate, ChannelOut
from ..schemas.video import VideoCreate
from ..db.crud import crud_channel, crud_video
from ..db.session import sessionmanager

async def handle_add_channel(new_channel_username: str, db_session: AsyncSession, ytapi: YouTubeAPI) -> ChannelOut:
    '''
    Handles the addition of a new YouTube Channel and retrieving its uploaded videos
    '''
    
    response = ytapi.get_channel_info(username=new_channel_username)
    items = response.get("items", [])
    if not items:
        raise HTTPException(status_code=404, detail="Channel not found on YouTube.")
    
    item_data = items[0]
    channel_id = item_data.get("id")
    if not channel_id:
        raise HTTPException(status_code=404, detail="Unexpected error, channel has no id")
    
    existing_channel = await crud_channel.get_channel_by_id(db_session, channel_id)
    if existing_channel:
        raise HTTPException(status_code=400, detail="A channel with this id already exists.")
    
    snippet = item_data.get("snippet", {})
    content_details = item_data.get("contentDetails", {})
    related_playlists = content_details.get("relatedPlaylists", {})

    thumbnail_url = get_thumbnail_url_from_snippet(snippet)

    new_channel_data = ChannelCreate(
        id=channel_id,
        title=snippet.get("title"),
        description=snippet.get("description"),
        uploads_id=related_playlists.get("uploads"),
        thumbnail_url=thumbnail_url,  # <--- storing the selected thumbnail
    )

    created_channel = await crud_channel.create_channel(db_session, new_channel_data)

    return ChannelOut.model_validate(created_channel)

def get_thumbnail_url_from_snippet(snippet):
    thumbnails = snippet.get("thumbnails", {})
    # Try 'high', else 'medium', else 'default'
    thumbnail_url = (thumbnails.get("high", {}) or {}).get("url")
    if not thumbnail_url:
        thumbnail_url = (thumbnails.get("medium", {}) or {}).get("url")
    if not thumbnail_url:
        thumbnail_url = (thumbnails.get("default", {}) or {}).get("url")
    return thumbnail_url

async def fetch_playlist_page_async(
    youtube_client,
    playlist_id: str,
    part: str = "snippet,contentDetails",
    max_results: int = 50,
    page_token: str | None = None
) -> dict:
    """
    Offload the blocking googleapiclient call to a thread.
    Returns the JSON response for one page of results.
    """
    request = youtube_client.playlistItems().list(
        part=part,
        playlistId=playlist_id,
        maxResults=max_results,
        pageToken=page_token,
    )
    # Execute in a thread to avoid blocking the main async loop
    response = await asyncio.to_thread(request.execute)
    return response

async def background_handle_add_all_channel_uploads(uploads_id: str, ytapi: YouTubeAPI, batch_size: int = 500) -> int:
    async with sessionmanager.session() as db_session:
        total_inserted = await handle_add_all_channel_uploads(
            uploads_id,
            db_session,
            ytapi,
            batch_size
        )
        return total_inserted

async def handle_add_all_channel_uploads(
    uploads_id: str,
    db_session: AsyncSession,
    ytapi: YouTubeAPI,
    batch_size: int = 500
) -> int:
    """
    Asynchronously fetch *all* uploaded videos for a channel from YouTube
    and store them in batches in the database.

    - Uses pagination to handle large playlists.
    - Offloads blocking API calls to a thread (to_thread).
    - Commits in chunks (batch_size) to reduce memory usage & partial commits.
    - Returns total number of videos inserted.

    Raises HTTPException(404) if no items are found at all.
    """

    page_token = None
    video_batch: list[VideoCreate] = []
    total_inserted = 0
    first_page = True

    while True:
        # 1) Fetch one page of results (blocking call in a thread)
        response = await fetch_playlist_page_async(
            ytapi.youtube,
            playlist_id=uploads_id,
            page_token=page_token
        )
        items = response.get("items", [])
        
        # 2) If first_page is empty, raise 404
        if first_page and not items:
            raise HTTPException(
                status_code=404,
                detail="No uploaded videos found for this channel on YouTube."
            )
        first_page = False

        # 3) Convert each item to a VideoCreate for bulk insert
        for item in items:
            snippet = item.get("snippet", {})
            content_details = item.get("contentDetails", {})
            video_id = content_details.get("videoId")
            if not video_id:
                # Sometimes "contentDetails" may not have a videoId (rare, but could happen)
                resource_id = snippet.get("resourceId", {})
                video_id = resource_id.get("videoId")

            thumbnail_url = get_thumbnail_url_from_snippet(snippet)
            new_video = VideoCreate(
                id=video_id,
                title=snippet.get("title"),
                description=snippet.get("description"),
                channel_id=snippet.get("channelId"),
                thumbnail_url=thumbnail_url,
                published_at=datetime.fromisoformat(snippet.get("publishedAt").replace("Z", "+00:00")),
            )
            video_batch.append(new_video)

            # If we hit the batch_size, flush to DB
            if len(video_batch) >= batch_size:
                await crud_video.create_videos(db_session, video_batch)
                total_inserted += len(video_batch)
                video_batch.clear()

        # 4) Check for more pages
        page_token = response.get("nextPageToken")
        if not page_token:
            break  # no more pages

    # 5) Insert any leftover videos in final batch
    if video_batch:
        await crud_video.create_videos(db_session, video_batch)
        total_inserted += len(video_batch)

    return total_inserted

async def handle_update_channel_videos(channel_id: str, db_session: AsyncSession, ytapi: YouTubeAPI):
    """
    Update the database with the latest uploaded videos from the given channel id
    Only grab the first page of new uploads
    """
    channel = await crud_channel.get_channel_by_id(db_session, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found.")
    
    response = await fetch_playlist_page_async(youtube_client=ytapi, playlist_id=channel.uploads_id)
    items = response.get("items", [])

    new_videos = []

    for item in items:
        snippet = item.get("snippet", {})
        content_details = item.get("contentDetails", {})
        video_id = content_details.get("videoId")
        if not video_id:
            # Sometimes "contentDetails" may not have a videoId (rare, but could happen)
            resource_id = snippet.get("resourceId", {})
            video_id = resource_id.get("videoId")

        thumbnail_url = get_thumbnail_url_from_snippet(snippet)
        new_video = VideoCreate(
            id=video_id,
            title=snippet.get("title"),
            description=snippet.get("description"),
            channel_id=snippet.get("channelId"),
            thumbnail_url=thumbnail_url,
            published_at=datetime.fromisoformat(snippet.get("publishedAt").replace("Z", "+00:00")),
        )
        new_videos.append(new_video)
    
    await crud_video.create_videos(new_videos)