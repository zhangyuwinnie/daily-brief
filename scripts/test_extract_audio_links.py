"""Unit test: feed a Follow-Builders YouTube playlist URL through the extractor.

Run: python3 scripts/test_extract_audio_links.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from extract_audio_links import extract_links

PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLOhHNjZItNnMm5tdW61JpnyxeYH5NDDx8"

PLAYLIST_HIT_TITLE = "Builder Theme: From SEO to Agent-Led Growth: Profound's James Cadwallader"
PLAYLIST_HIT_VIDEO_ID = "RyTwRCKeDo4"
PLAYLIST_HIT_URL = f"https://www.youtube.com/watch?v={PLAYLIST_HIT_VIDEO_ID}"

# Channel has the video, playlist does not, and the YouTube title differs from
# the RSS title — exercises the channel-search fallback path.
CHANNEL_FALLBACK_TITLE = "Builder Theme: Anthropic's Boris Cherny: Coding's Printing Press Moment"
CHANNEL_FALLBACK_VIDEO_ID = "SlGRN8jh2RI"
CHANNEL_FALLBACK_URL = f"https://www.youtube.com/watch?v={CHANNEL_FALLBACK_VIDEO_ID}"

BRIEFING_MARKDOWN = f"""# Daily Briefing: Test

## [Vercel Agentic Infrastructure](https://vercel.com/blog/agentic-infrastructure)
**Source:** Vercel News

## [{PLAYLIST_HIT_TITLE}]({PLAYLIST_URL})
**Source:** Follow Builders

## [{CHANNEL_FALLBACK_TITLE}]({PLAYLIST_URL})
**Source:** Follow Builders

## [Standalone YT Video](https://www.youtube.com/watch?v=DvyZcCfepeI)
**Source:** Test

## [Tweet that should be filtered](https://x.com/someuser/status/1234567890)
**Source:** Test
"""


def main() -> int:
    failures: list[str] = []

    urls = extract_links(BRIEFING_MARKDOWN)
    print(f"\nExtracted {len(urls)} URLs:")
    for url in urls:
        print(f"  {url}")
    print()

    if PLAYLIST_HIT_URL not in urls:
        failures.append(
            f"Expected playlist match {PLAYLIST_HIT_URL} for {PLAYLIST_HIT_TITLE!r}"
        )
    else:
        print(f"PASS  playlist hit: {PLAYLIST_HIT_TITLE!r} -> {PLAYLIST_HIT_URL}")

    if CHANNEL_FALLBACK_URL not in urls:
        failures.append(
            f"Expected channel-search fallback {CHANNEL_FALLBACK_URL} for {CHANNEL_FALLBACK_TITLE!r}"
        )
    else:
        print(f"PASS  channel-search fallback: {CHANNEL_FALLBACK_TITLE!r} -> {CHANNEL_FALLBACK_URL}")

    if PLAYLIST_URL in urls:
        failures.append(f"Raw playlist URL leaked through: {PLAYLIST_URL}")
    else:
        print("PASS  raw playlist URL was not emitted")

    if "https://www.youtube.com/watch?v=DvyZcCfepeI" not in urls:
        failures.append("Expected the standalone watch URL to pass through")
    else:
        print("PASS  standalone watch URL passes through unchanged")

    if any("x.com" in u for u in urls):
        failures.append("x.com URL was not filtered out")
    else:
        print("PASS  x.com link was filtered out")

    if "https://vercel.com/blog/agentic-infrastructure" not in urls:
        failures.append("Expected the non-YouTube blog URL to pass through")
    else:
        print("PASS  non-YouTube blog URL passes through")

    if failures:
        print(f"\n{len(failures)} failure(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("\nAll cases passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
