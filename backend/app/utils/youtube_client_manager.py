# youtube_client_manager.py
import os
from typing import Optional, Iterator
from contextlib import contextmanager

from .youtubeapi import YouTubeAPI  # your existing class
from ..core.config import settings

# This could come from your settings or environment variables
YOUTUBE_API_KEY = settings.YOUTUBE_API_KEY  # or from your config

class YouTubeAPIManager:
    def __init__(self, api_key: Optional[str] = None):
        """
        For this example, we assume an API key only (for read-only public data).
        """
        self._api_key = api_key
        self._client: Optional[YouTubeAPI] = None

    def init_client(self):
        """
        Create a single YouTubeAPI instance, stored on the manager.
        """
        if not self._api_key:
            raise ValueError("No YOUTUBE_API_KEY provided.")
        self._client = YouTubeAPI(api_key=self._api_key)

    @contextmanager
    def get_client(self) -> Iterator[YouTubeAPI]:
        """
        Yield the YouTubeAPI client. This is a plain context manager, not async,
        because the google client library is generally not async.
        """
        if self._client is None:
            self.init_client()

        yield self._client

youtube_api_manager = YouTubeAPIManager(api_key=YOUTUBE_API_KEY)

def get_youtube_api() -> YouTubeAPI:
    """
    A simple dependency that returns the global YouTubeAPI instance.
    """
    # Ensure the manager has been initialized
    if youtube_api_manager._client is None:
        youtube_api_manager.init_client()
    return youtube_api_manager._client
