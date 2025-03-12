from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Annotated

from ..schemas.channel import ChannelAddParams, ChannelOut, ChannelSearchParams, ChannelUpdate
from ..schemas.video import VideoOut, VideoSearchParams, VideoSearchResponse, VideoUpdate
from ..dependencies import DBSessionDep, YouTubeAPIDep
from ..db.crud import crud_channel, crud_video
from ..services.youtube_service import handle_add_channel, background_handle_add_all_channel_uploads

router = APIRouter(
    prefix="/youtube",
    tags=["youtube"]
)

@router.post("/channels/", response_model=ChannelOut)
async def add_new_channel(
    new_channel_params: ChannelAddParams, 
    db_session: DBSessionDep, 
    ytapi: YouTubeAPIDep, 
    background_tasks: BackgroundTasks
):
    new_channel_handle = new_channel_params.handle
    new_channel = await handle_add_channel(new_channel_handle, db_session, ytapi)

    uploads_id = new_channel.uploads_id
    background_tasks.add_task(background_handle_add_all_channel_uploads, uploads_id, ytapi)
    return new_channel

@router.get("/channels/", response_model=list[ChannelOut])
async def get_channels(db_session: DBSessionDep, channel_search_query: Annotated[ChannelSearchParams, Query()]):
    channels = await crud_channel.get_channels(db_session, channel_search_query)
    if not channels:
        return []
    return channels

@router.get("/channels/{channel_id}", response_model=ChannelOut)
async def get_channel_by_id(channel_id: str, db_session: DBSessionDep):
    channel = await crud_channel.get_channel_by_id(db_session, channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return channel

@router.patch("/channels/{channel_id}", response_model=ChannelOut)
async def update_channel_by_id(db_session: DBSessionDep, channel_id: str, channel_update: ChannelUpdate):
    existing_channel = await crud_channel.get_channel_by_id(db_session, channel_id)
    if not existing_channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return await crud_channel.update_channel(db_session, channel_id, channel_update)

@router.delete("/channels/{channel_id}")
async def delete_channel_by_id(channel_id: str, db_session: DBSessionDep):
    await crud_channel.delete_channel(db_session, channel_id)
    return { "message": "channel deleted" }

@router.get("/videos/", response_model=VideoSearchResponse)
async def get_videos(db_session: DBSessionDep, video_search_query: Annotated[VideoSearchParams, Query()]):
    videos, total_count = await crud_video.get_videos(db_session, video_search_query)
    if not videos:
        return []
    return VideoSearchResponse(videos=videos, total_count=total_count)

@router.patch("/videos/{video_id}", response_model=VideoOut)
async def update_video_by_id(db_session: DBSessionDep, video_id: str, video_update: VideoUpdate):
    existing_video = await crud_video.get_video_by_id(db_session, video_id)
    if not existing_video:
        raise HTTPException(status_code=404, detail="Video not found")
    return await crud_video.update_video(db_session, video_id, video_update)
