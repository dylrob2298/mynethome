from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Annotated

from ..schemas.channel import ChannelAddParams, ChannelOut, ChannelSearchParams
from ..schemas.video import VideoOut, VideoSearchParams
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
    new_channel_username = new_channel_params.username
    new_channel = await handle_add_channel(new_channel_username, db_session, ytapi)

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

@router.delete("/channels/{channel_id}")
async def delete_channel_by_id(channel_id: str, db_session: DBSessionDep):
    await crud_channel.delete_channel(db_session, channel_id)
    return { "message": "channel deleted" }

@router.get("/videos/", response_model=list[VideoOut])
async def get_videos(db_session: DBSessionDep, video_search_query: Annotated[VideoSearchParams, Query()]):
    videos = await crud_video.get_videos(db_session, video_search_query)
    if not videos:
        return []
    return videos
