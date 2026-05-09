"""Extract NotebookLM-bound URLs from a daily briefing markdown."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

from resolve_playlist_videos import is_playlist_url, resolve as resolve_playlist  # noqa: E402

HEADING_PAIR_RE = re.compile(r"^##\s+\[(.+?)\]\((https?://[^)\s]+)\)", re.MULTILINE)
ANY_LINK_RE = re.compile(r"\]\((https?://[^)\s]+)\)")


def keep_url(url: str) -> bool:
    parsed = urlparse(url)
    host = (parsed.netloc or "").lower()
    if host in {"t.co", "x.com", "twitter.com", "www.twitter.com"}:
        return False
    if host in {"youtube.com", "www.youtube.com"} and "watch" not in parsed.path and "watch" not in parsed.query:
        return False
    if not host:
        return False
    return True


def extract_links(briefing_markdown: str) -> list[str]:
    seen: set[str] = set()
    urls: list[str] = []

    def add(url: str) -> None:
        cleaned = url.rstrip(".,;:")
        if cleaned and cleaned not in seen and keep_url(cleaned):
            seen.add(cleaned)
            urls.append(cleaned)

    heading_pairs: list[tuple[str, str]] = HEADING_PAIR_RE.findall(briefing_markdown)
    heading_urls = {url for _, url in heading_pairs}

    for title, raw_url in heading_pairs:
        if is_playlist_url(raw_url):
            try:
                resolved = resolve_playlist(raw_url, title)
            except Exception as exc:  # noqa: BLE001
                print(f"[playlist-resolve] {raw_url} failed: {exc}")
                resolved = None
            if resolved:
                print(f"[playlist-resolve] {title!r} -> {resolved}")
                add(resolved)
            else:
                print(f"[playlist-resolve] {title!r}: no match in {raw_url}, dropping")
            continue
        add(raw_url)

    for raw_url in ANY_LINK_RE.findall(briefing_markdown):
        if raw_url in heading_urls:
            continue
        add(raw_url)

    return urls


def _cli() -> int:
    if len(sys.argv) != 3:
        print("Usage: extract_audio_links.py <briefing.md> <out_links.txt>", file=sys.stderr)
        return 2
    briefing = Path(sys.argv[1]).read_text(encoding="utf-8", errors="ignore")
    out = Path(sys.argv[2])
    urls = extract_links(briefing)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(urls) + ("\n" if urls else ""), encoding="utf-8")
    print(f"Collected {len(urls)} unique links -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(_cli())
