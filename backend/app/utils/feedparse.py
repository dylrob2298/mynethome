import feedparser
from datetime import datetime, timezone

from ..schemas.feed import FeedCreate
from ..schemas.article import ArticleCreate

def get_entry_image(entry):
    """
    Retrieves the first available image URL from a feed entry.

    Args:
        entry (dict): A single entry parsed by feedparser.

    Returns:
        str | None: The image URL if found, or None otherwise.
    """
    # Check for media:content (common in Media RSS feeds)
    if "media_content" in entry:
        for media in entry.media_content:
            if media.get("type", "").startswith("image/"):
                return media.get("url")
    
    # Check for media:thumbnail
    if "media_thumbnail" in entry:
        return entry.media_thumbnail[0].get("url")
    
    # Check for enclosures (common in Atom feeds)
    if "enclosures" in entry:
        for enclosure in entry.enclosures:
            if enclosure.get("type", "").startswith("image/"):
                return enclosure.get("href")
    
    # Check for custom fields (e.g., image or thumbnail)
    if "image" in entry:
        return entry.get("image")
    if "thumbnail" in entry:
        return entry.get("thumbnail")
    
    # No image found
    return None

def extract_feed_info(feed_info, url: str) -> FeedCreate:
    image_url = (
        feed_info.get("image", {}).get("href") or
        feed_info.get("icon") or
        feed_info.get("logo")
    )
    return FeedCreate(
        name=feed_info.get("title", "Unknown Feed"),
        url=url,
        link=feed_info.get("link"),
        author=feed_info.get("author"),
        description=feed_info.get("subtitle"),
        image_url=image_url
    )


def convert_to_utc(parsed_time) -> datetime:
    """
    Converts a parsed time tuple to a timezone-aware UTC datetime.

    Args:
        parsed_time (time.struct_time): The parsed time structure.

    Returns:
        datetime: A timezone-aware datetime in UTC.
    """
    if parsed_time:
        naive_datetime = datetime(*parsed_time[:6])
        return naive_datetime.replace(tzinfo=timezone.utc)
    return None

def parse_article_entries(entries: list[dict]) -> list[ArticleCreate]:
    articles = []
    for entry in entries:
        article = ArticleCreate(
            title=entry.get("title", "No Title"),
            link=entry.get("link"),
            published_at=convert_to_utc(entry.get("published_parsed")),
            updated_at=convert_to_utc(entry.get("updated_parsed")),
            author=entry.get("author"),
            summary=entry.get("summary"),
            content=entry.get("content", [{}])[0].get("value") if entry.get("content") else None,
            image_url=get_entry_image(entry),
            categories=None, # TODO: add category handling
        )
        articles.append(article)

    return articles

def parse_feed(url: str) -> tuple[FeedCreate, list[ArticleCreate]]:
    """
    Parses the given Feed URL using feedparser
    
    Args:
        url (str): the url of the Feed
        
    Returns:
        FeedParsed: The parsed feed with parsed articles"""
    feed_data = feedparser.parse(url)
    if feed_data.bozo:
        raise ValueError(f"Error parsing feed from {url}: {feed_data.bozo_exception}")
    
    feed_info = feed_data.feed
    entries_info = feed_data.entries
    feed = extract_feed_info(feed_info, url)
    articles = parse_article_entries(entries_info)

    return feed, articles