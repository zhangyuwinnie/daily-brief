"""Resolve a YouTube playlist URL to a watch URL by matching episode title."""

from __future__ import annotations

import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from typing import Iterable

_USER_AGENT = "Mozilla/5.0 (compatible; daily-brief-resolver/1.0)"
_YT_INITIAL_DATA_RE = re.compile(r"var ytInitialData = ({.*?});</script>", re.DOTALL)
_BUILDER_THEME_PREFIX = re.compile(r"^\s*builder theme:\s*", re.IGNORECASE)
_CHANNEL_HANDLE_RE = re.compile(r'"canonicalBaseUrl":"(/@[^"/]+)"')


def is_playlist_url(url: str) -> bool:
    parsed = urllib.parse.urlparse(url)
    if parsed.netloc.lower() not in ("youtube.com", "www.youtube.com"):
        return False
    if "playlist" in parsed.path:
        return True
    qs = urllib.parse.parse_qs(parsed.query)
    return "list" in qs and "v" not in qs


def _fetch_html(url: str, *, timeout: float = 15.0) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def _parse_initial_data(html: str) -> dict | None:
    match = _YT_INITIAL_DATA_RE.search(html)
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        return None


def _extract_video_pairs(data: dict, renderer_key: str) -> list[tuple[str, str]]:
    found: list[tuple[str, str]] = []

    def walk(node):
        if isinstance(node, dict):
            renderer = node.get(renderer_key)
            if renderer:
                vid = renderer.get("videoId")
                title_obj = renderer.get("title", {})
                if "runs" in title_obj:
                    title = "".join(r.get("text", "") for r in title_obj["runs"])
                else:
                    title = title_obj.get("simpleText", "")
                if vid and title:
                    found.append((vid, title))
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    walk(data)
    return found


def fetch_playlist_videos(playlist_url: str, *, timeout: float = 15.0) -> list[tuple[str, str]]:
    data = _parse_initial_data(_fetch_html(playlist_url, timeout=timeout))
    return _extract_video_pairs(data, "playlistVideoRenderer") if data else []


def fetch_playlist_channel_handle(playlist_url: str, *, timeout: float = 15.0) -> str | None:
    match = _CHANNEL_HANDLE_RE.search(_fetch_html(playlist_url, timeout=timeout))
    return match.group(1) if match else None


def search_channel_videos(channel_handle: str, query: str, *, timeout: float = 15.0) -> list[tuple[str, str]]:
    if not channel_handle.startswith("/"):
        channel_handle = "/" + channel_handle
    url = f"https://www.youtube.com{channel_handle}/search?query={urllib.parse.quote(query)}"
    data = _parse_initial_data(_fetch_html(url, timeout=timeout))
    return _extract_video_pairs(data, "videoRenderer") if data else []


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = _BUILDER_THEME_PREFIX.sub("", text)
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _score(target_norm: str, candidate_norm: str) -> float:
    if not target_norm or not candidate_norm:
        return 0.0
    if target_norm == candidate_norm:
        return 1.0
    if target_norm in candidate_norm or candidate_norm in target_norm:
        shorter = min(len(target_norm), len(candidate_norm))
        longer = max(len(target_norm), len(candidate_norm))
        return 0.9 * shorter / longer
    target_tokens = set(target_norm.split())
    candidate_tokens = set(candidate_norm.split())
    overlap = len(target_tokens & candidate_tokens)
    return overlap / len(target_tokens | candidate_tokens)


def match_title(target: str, candidates: Iterable[tuple[str, str]], *, threshold: float = 0.6) -> str | None:
    target_norm = _normalize(target)
    if not target_norm:
        return None
    best_vid: str | None = None
    best_score = 0.0
    for vid, title in candidates:
        score = _score(target_norm, _normalize(title))
        if score > best_score:
            best_score = score
            best_vid = vid
    return best_vid if best_score >= threshold else None


def match_title_channel_search(
    target: str,
    candidates: Iterable[tuple[str, str]],
    *,
    min_token_overlap: int = 2,
    min_token_len: int = 4,
    max_candidates: int = 10,
) -> str | None:
    # Channel search already restricts by channel, so we can match leniently —
    # require enough distinctive tokens (length >= min_token_len) to overlap.
    target_tokens = {t for t in _normalize(target).split() if len(t) >= min_token_len}
    if not target_tokens:
        return None
    best_vid: str | None = None
    best_overlap = 0
    for vid, title in list(candidates)[:max_candidates]:
        cand_tokens = set(_normalize(title).split())
        overlap = len(target_tokens & cand_tokens)
        if overlap > best_overlap and overlap >= min_token_overlap:
            best_overlap = overlap
            best_vid = vid
    return best_vid


def resolve(playlist_url: str, target_title: str) -> str | None:
    videos = fetch_playlist_videos(playlist_url)
    vid = match_title(target_title, videos)
    if vid:
        return f"https://www.youtube.com/watch?v={vid}"

    handle = fetch_playlist_channel_handle(playlist_url)
    if not handle:
        return None
    query = _BUILDER_THEME_PREFIX.sub("", target_title).strip()
    if not query:
        return None
    results = search_channel_videos(handle, query)
    vid = match_title_channel_search(target_title, results)
    return f"https://www.youtube.com/watch?v={vid}" if vid else None


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: resolve_playlist_videos.py <playlist_url> <title>", file=sys.stderr)
        sys.exit(2)
    result = resolve(sys.argv[1], sys.argv[2])
    if result:
        print(result)
        sys.exit(0)
    sys.exit(1)
