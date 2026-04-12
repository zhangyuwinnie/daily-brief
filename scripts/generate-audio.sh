#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BRIEFINGS_DIR="${BRIEFINGS_DIR:-$REPO_ROOT/briefings}"
DATE_STR="${1:-$(TZ=America/Los_Angeles date +%F)}"
MAX_AUDIO_LINKS="${MAX_AUDIO_LINKS:-6}"
AUDIO_FORMAT="${AUDIO_FORMAT:-deep-dive}"
AUDIO_LENGTH="${AUDIO_LENGTH:-default}"
SOURCE_TIMEOUT_SECONDS="${SOURCE_TIMEOUT_SECONDS:-240}"
AUDIO_TIMEOUT_SECONDS="${AUDIO_TIMEOUT_SECONDS:-1800}"
POLL_INTERVAL_SECONDS="${POLL_INTERVAL_SECONDS:-3}"

BRIEFING_FILE="$BRIEFINGS_DIR/${DATE_STR}.md"
LINKS_FILE="$BRIEFINGS_DIR/ai_links_${DATE_STR}.txt"
REQUEST_FILE="$BRIEFINGS_DIR/notebooklm_request_${DATE_STR}.json"
AUDIO_FILE="$BRIEFINGS_DIR/ai_links_${DATE_STR}_audio_overview.mp3"

log() {
  printf '[generate-audio] %s\n' "$1"
}

if [[ ! -f "$BRIEFING_FILE" ]]; then
  log "Skipping ${DATE_STR}: briefing markdown not found at ${BRIEFING_FILE}"
  exit 0
fi

if ! command -v notebooklm-audio-overview >/dev/null 2>&1; then
  log "Skipping ${DATE_STR}: notebooklm-audio-overview is not installed"
  exit 0
fi

if ! command -v notebooklm >/dev/null 2>&1; then
  log "Skipping ${DATE_STR}: notebooklm CLI is not installed"
  exit 0
fi

if ! notebooklm auth check --test >/dev/null 2>&1; then
  log "Skipping ${DATE_STR}: NotebookLM auth is missing or expired"
  exit 0
fi

python3 - <<'PY' "$BRIEFING_FILE" "$LINKS_FILE"
import re
import sys
from urllib.parse import urlparse
from pathlib import Path

briefing_file = Path(sys.argv[1])
links_file = Path(sys.argv[2])
heading_link_re = re.compile(r'\]\((https?://[^)\s]+)\)')

seen = set()
urls = []

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

for raw_url in heading_link_re.findall(briefing_file.read_text(encoding='utf-8', errors='ignore')):
    url = raw_url.rstrip('.,;:')
    if not keep_url(url):
        continue
    if url not in seen:
        seen.add(url)
        urls.append(url)

links_file.parent.mkdir(parents=True, exist_ok=True)
links_file.write_text("\n".join(urls) + ("\n" if urls else ""), encoding="utf-8")
print(f"Collected {len(urls)} unique links -> {links_file}")
PY

if [[ ! -s "$LINKS_FILE" ]]; then
  log "Skipping ${DATE_STR}: no links found in ${BRIEFING_FILE}"
  exit 0
fi

python3 - <<'PY' "$LINKS_FILE" "$REQUEST_FILE" "$AUDIO_FILE" "$DATE_STR" "$MAX_AUDIO_LINKS" "$AUDIO_FORMAT" "$AUDIO_LENGTH" "$SOURCE_TIMEOUT_SECONDS" "$AUDIO_TIMEOUT_SECONDS" "$POLL_INTERVAL_SECONDS"
import json
import sys
from pathlib import Path

links_file = Path(sys.argv[1])
request_file = Path(sys.argv[2])
audio_file = Path(sys.argv[3])
date_str = sys.argv[4]
max_links = int(sys.argv[5])
audio_format = sys.argv[6]
audio_length = sys.argv[7]
source_timeout_seconds = int(sys.argv[8])
audio_timeout_seconds = int(sys.argv[9])
poll_interval_seconds = int(sys.argv[10])

links = [line.strip() for line in links_file.read_text(encoding="utf-8").splitlines() if line.strip()]
links = links[:max_links]

request_payload = {
    "links": links,
    "notebook_name": f"AI Links Builder Briefing {date_str}",
    "output_path": str(audio_file),
    "language": "zh",
    "audio_format": audio_format,
    "audio_length": audio_length,
    "episode_focus": (
        "请用中文，以双主持人播客的形式，运用第一性原理分析这组 AI 领域的 "
        "links/news/feed。不要逐条总结链接；请把相近事件归并成几个最关键的主题，"
        "只讨论真正重要的变化。对每个主题都回答：1. Why it matters 2. Why it matters "
        "for builders 3. 哪些变化是短期噪音，哪些是长期拐点 4. 哪些二阶影响最容易被忽视 "
        "5. 对创业者、产品团队和开发者最实际的机会是什么 请少讲表面信息，多讲底层结构、"
        "能力约束、商业逻辑、分发逻辑和未来 6-12 个月的判断。"
    ),
    "reuse_notebook": False,
    "strict_mode": False,
    "source_timeout_seconds": source_timeout_seconds,
    "audio_timeout_seconds": audio_timeout_seconds,
    "poll_interval_seconds": poll_interval_seconds,
    "overwrite": False,
}

request_file.write_text(json.dumps(request_payload, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Request written -> {request_file}")
PY

if notebooklm-audio-overview --input "$REQUEST_FILE"; then
  log "Audio generated at ${AUDIO_FILE}"
else
  log "NotebookLM audio generation failed for ${DATE_STR}; continuing without audio"
  exit 0
fi
