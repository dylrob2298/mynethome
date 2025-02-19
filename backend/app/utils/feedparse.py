import requests
import feedparser
from datetime import datetime, timezone
from bs4 import BeautifulSoup

from ..schemas.feed import FeedCreate
from ..schemas.article import ArticleCreate

def get_entry_image(entry):
    """
    Retrieves the first available image URL from a feed entry.

    Args:
        entry (dict): A single entry parsed by feedparser.

    Returns:
        (image_url, updated_summary, updated_description):
            image_url (str | None) - The image URL if found, or None otherwise.
            updated_summary (str | None) - The summary with the first <img> removed if it was found in summary.
            updated_description (str | None) - The description with the first <img> removed if it was found in description.
    """
    # Helper to find and remove the first <img> tag from HTML
    def extract_and_remove_first_image(html_content: str | None):
        if not html_content:
            return None, html_content  # No image, and return original content

        soup = BeautifulSoup(html_content, "html.parser")
        img_tag = soup.find("img")
        if img_tag and "src" in img_tag.attrs:
            img_src = img_tag["src"]
            # Remove the img tag from the document
            img_tag.decompose()
            # Return the img src and the updated HTML
            return img_src, str(soup)
        return None, html_content

    # ------------------------
    # 1. Check for media:content (common in Media RSS feeds)
    if "media_content" in entry:
        for media in entry.media_content:
            if media.get("type", "").startswith("image/"):
                return (
                    media.get("url"),
                    getattr(entry, "summary", None),
                    getattr(entry, "description", None),
                )

    # 2. Check for media:thumbnail
    if "media_thumbnail" in entry:
        return (
            entry.media_thumbnail[0].get("url"),
            getattr(entry, "summary", None),
            getattr(entry, "description", None),
        )

    # 3. Check for enclosures (common in Atom feeds)
    if "enclosures" in entry:
        for enclosure in entry.enclosures:
            if enclosure.get("type", "").startswith("image/"):
                return (
                    enclosure.get("href"),
                    getattr(entry, "summary", None),
                    getattr(entry, "description", None),
                )

    # 4. Check for custom fields (e.g., image or thumbnail)
    if "image" in entry:
        return (
            entry.get("image"),
            getattr(entry, "summary", None),
            getattr(entry, "description", None),
        )
    if "thumbnail" in entry:
        return (
            entry.get("thumbnail"),
            getattr(entry, "summary", None),
            getattr(entry, "description", None),
        )

    # 5. Finally, parse summary or description HTML for the first <img> tag
    summary_html = getattr(entry, "summary", None)
    description_html = getattr(entry, "description", None)

    # Attempt to extract from summary first
    summary_img, updated_summary = extract_and_remove_first_image(summary_html)
    if summary_img:
        # Found an image in summary; return it and updated summary
        return summary_img, updated_summary, description_html

    # If not found in summary, try description
    description_img, updated_description = extract_and_remove_first_image(description_html)
    if description_img:
        return description_img, summary_html, updated_description

    # No image found anywhere
    return None, summary_html, description_html

def extract_feed_info(feed_info, url: str, etag: str | None, modified: str | None) -> FeedCreate:
    image_url = (
        feed_info.get("image", {}).get("href") or
        feed_info.get("icon") or
        feed_info.get("logo")
    )
    return FeedCreate(
        name=feed_info.get("title") or "Unknown Feed",
        url=url,
        link=feed_info.get("link"),
        author=feed_info.get("author"),
        description=feed_info.get("subtitle"),
        image_url=image_url,
        etag=etag,
        modified=modified
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
        image_url, summary, description = get_entry_image(entry)
        
        published_dt = entry.get("published_parsed")
        if published_dt:
            published_dt = convert_to_utc(published_dt)
        else:
            published_dt = datetime.now(timezone.utc)

        article = ArticleCreate(
            title=entry.get("title") or "No Title",
            link=entry.get("link"),
            published_at=published_dt,
            updated_at=convert_to_utc(entry.get("updated_parsed")),
            author=entry.get("author"),
            summary=summary or description,
            content=entry.get("content", [{}])[0].get("value") if entry.get("content") else None,
            image_url=image_url,
            categories=None, # TODO: add category handling
        )
        articles.append(article)

    return articles

def parse_feed(url: str, etag: str | None = None, modified: str | None = None) -> tuple[FeedCreate, list[ArticleCreate]] | tuple[None, None]:
    """
    Parses the given Feed URL using feedparser
    
    Args:
        url (str): the url of the Feed
        
    Returns:
        FeedParsed: The parsed feed with parsed articles"""
    
    response = requests.get(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "application/xml,text/xml;q=0.9,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            # "Accept-Language": "en-US,en;q=0.5",
        }, 
        timeout=15)
    response.raise_for_status()

    feed_data = feedparser.parse(response.content)
    
    # print("feed parsed: ")
    # print(feed_data)

    if feed_data.bozo:
        print("Bozo exception:", feed_data.bozo_exception)
        raise ValueError(f"Error parsing feed from {url}: {feed_data.bozo_exception}")
    
    feed_info = feed_data.feed
    new_etag = feed_data.get("etag")
    new_modified = feed_data.get("modified")
    entries_info = feed_data.entries
    feed = extract_feed_info(feed_info, url, new_etag, new_modified)
    articles = parse_article_entries(entries_info)

    return feed, articles