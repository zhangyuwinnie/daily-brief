"""Live test: resolve a known Training Data episode to its YouTube watch URL.

Run: python3 scripts/test_resolve_playlist_videos.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from resolve_playlist_videos import is_playlist_url, resolve

PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLOhHNjZItNnMm5tdW61JpnyxeYH5NDDx8"

CASES = [
    {
        "title": "Builder Theme: From SEO to Agent-Led Growth: Profound's James Cadwallader",
        "expected_video_id": "RyTwRCKeDo4",
    },
    {
        "title": "How Autonomous Labs Will Transform Scientific Research: Ginkgo Bioworks' Jason Kelly",
        "expected_video_id": "g45Alfg7diw",
    },
]


def main() -> int:
    assert is_playlist_url(PLAYLIST_URL), "PLAYLIST_URL should be detected as a playlist"

    failures: list[str] = []
    for case in CASES:
        title = case["title"]
        expected_vid = case["expected_video_id"]
        resolved = resolve(PLAYLIST_URL, title)
        expected = f"https://www.youtube.com/watch?v={expected_vid}"
        if resolved == expected:
            print(f"PASS  {title!r} -> {resolved}")
        else:
            failures.append(f"{title!r}: expected {expected}, got {resolved}")
            print(f"FAIL  {title!r} -> {resolved} (expected {expected})")

    if failures:
        print(f"\n{len(failures)} failure(s)")
        return 1
    print("\nAll cases passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
