# youtubeapi.py

import os
from typing import Dict, Any, Iterator, List, Optional

import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors


class YouTubeAPI:
    """
    A helper class to interact with the YouTube Data API using the
    googleapiclient.discovery library.

    Supports two authentication methods:
    1) OAuth 2.0 client credentials (for private or user-specific data).
    2) API Key (for public data, read-only).
    """

    def __init__(
        self,
        api_service_name: str = "youtube",
        api_version: str = "v3",
        client_secrets_file: Optional[str] = None,
        api_key: Optional[str] = None,
        scopes: Optional[List[str]] = None,
    ):
        """
        Initialize a YouTube client using either OAuth 2.0 or an API key.

        :param api_service_name: The name of the Google API service, defaults to "youtube".
        :param api_version: The version of the API, defaults to "v3".
        :param client_secrets_file: Path to OAuth2 client secrets JSON file (from Google Cloud Console).
        :param api_key: A public API key for read-only access to public resources.
        :param scopes: List of OAuth scopes; e.g., ["https://www.googleapis.com/auth/youtube.readonly"].
        """
        # If BOTH api_key and client_secrets_file are provided, we'll just prefer OAuth2.
        if client_secrets_file is not None:
            if not scopes:
                scopes = ["https://www.googleapis.com/auth/youtube.readonly"]
            # For local development only (disables HTTPS verification).
            # Do NOT use this in production.
            os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

            # Run the OAuth flow
            flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
                client_secrets_file,
                scopes=scopes,
            )
            credentials = flow.run_console()
            self.youtube = googleapiclient.discovery.build(
                api_service_name,
                api_version,
                credentials=credentials
            )
        elif api_key is not None:
            # Build using an API key (sufficient for public data).
            self.youtube = googleapiclient.discovery.build(
                api_service_name,
                api_version,
                developerKey=api_key
            )
        else:
            raise ValueError("Must provide either a client_secrets_file (OAuth) or an api_key.")

    def get_channel_info(
        self,
        channel_id: str = None,
        username: str = None,
        parts: str = "snippet,contentDetails,statistics"
    ) -> Dict[str, Any]:
        """
        Retrieves channel details for a given channel ID or username.

        :param channel_id: The channel ID (e.g., UC_xxx...).
        :param username: The channel username (legacy).
        :param parts: The parts to request, default snippet,contentDetails,statistics.
        :return: The API response dict for the channel.
        """
        if not channel_id and not username:
            raise ValueError("You must provide either channel_id or username.")

        request = self.youtube.channels().list(
            part=parts,
            id=channel_id,
            forUsername=username
        )
        response = request.execute()
        return response

    def get_uploads_playlist_id(self, channel_id: str) -> Optional[str]:
        """
        Fetch the 'uploads' playlist ID for a given channel.

        :param channel_id: The channel ID.
        :return: The playlist ID (e.g., "UU_xxx") or None if not found.
        """
        channel_info = self.get_channel_info(channel_id=channel_id, parts="contentDetails")
        items = channel_info.get("items", [])
        if not items:
            return None
        related_playlists = items[0]["contentDetails"].get("relatedPlaylists", {})
        return related_playlists.get("uploads")

    def get_playlist_items(
        self, 
        playlist_id: str, 
        parts: str = "snippet,contentDetails", 
        max_results: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Retrieve ALL items from a given playlist by paginating through results.

        :param playlist_id: The ID of the playlist (e.g., 'UU_xxx' for a channel's uploads).
        :param parts: The parts to request, defaults to snippet and contentDetails.
        :param max_results: Page size for each API call (max 50).
        :return: A list of playlist items (each item is a dict).
        """
        items = []
        next_page_token = None

        while True:
            request = self.youtube.playlistItems().list(
                part=parts,
                playlistId=playlist_id,
                maxResults=max_results,
                pageToken=next_page_token
            )
            response = request.execute()

            items.extend(response.get("items", []))
            next_page_token = response.get("nextPageToken", None)
            if not next_page_token:
                break

        return items

    def get_all_videos_for_channel(
        self, 
        channel_id: str,
        parts: str = "snippet,contentDetails"
    ) -> List[Dict[str, Any]]:
        """
        Retrieve ALL uploaded videos for the given channel by using the
        channel's 'uploads' playlist.

        :param channel_id: The channel ID (e.g., UC_xxx).
        :param parts: The parts to request for each playlist item.
        :return: A list of playlist items representing each video.
        """
        uploads_playlist_id = self.get_uploads_playlist_id(channel_id)
        if not uploads_playlist_id:
            return []  # Channel or playlist not found

        # Fetch *all* videos from that playlist
        return self.get_playlist_items(playlist_id=uploads_playlist_id, parts=parts)
