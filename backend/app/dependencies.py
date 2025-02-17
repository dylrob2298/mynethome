from typing import Annotated

from .db.session import get_db_session
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from .utils.youtube_client_manager import get_youtube_api
from .utils.youtubeapi import YouTubeAPI

DBSessionDep = Annotated[AsyncSession, Depends(get_db_session)]

YouTubeAPIDep = Annotated[YouTubeAPI, Depends(get_youtube_api)]
