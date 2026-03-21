#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bootstrap_project_tracking.sh TARGET_DIR [options]

Options:
  --project-name NAME       Override project name shown in generated docs
  --plan-path PATH          Plan file path written into generated docs
  --progress-file NAME      progress filename to create (default: PROGRESS.md)
  --dev-command CMD         Dev command written into AGENTS.md
  --build-command CMD       Build/verification command written into AGENTS.md
  --thesis TEXT             One-line product thesis for the progress template
  --next-batch TEXT         Initial next batch text for the progress template
  --force                   Overwrite existing AGENTS/progress file
  --help                    Show this help

Example:
  bootstrap_project_tracking.sh /path/to/project \
    --project-name "My Project" \
    --plan-path "plans/mvp.md" \
    --dev-command "pnpm dev" \
    --build-command "pnpm build" \
    --progress-file "PROGRESS.md"
EOF
}

escape_replacement() {
  printf '%s' "$1" | sed -e 's/[\/&|]/\\&/g'
}

render_template() {
  local input_path="$1"
  local output_path="$2"

  local project_name_escaped
  local progress_file_escaped
  local plan_path_escaped
  local dev_command_escaped
  local build_command_escaped
  local thesis_escaped
  local next_batch_escaped
  local date_escaped

  project_name_escaped="$(escape_replacement "$PROJECT_NAME")"
  progress_file_escaped="$(escape_replacement "$PROGRESS_FILE")"
  plan_path_escaped="$(escape_replacement "$PLAN_PATH")"
  dev_command_escaped="$(escape_replacement "$DEV_COMMAND")"
  build_command_escaped="$(escape_replacement "$BUILD_COMMAND")"
  thesis_escaped="$(escape_replacement "$PROJECT_THESIS")"
  next_batch_escaped="$(escape_replacement "$NEXT_BATCH")"
  date_escaped="$(escape_replacement "$TODAY")"

  sed \
    -e "s|__PROJECT_NAME__|$project_name_escaped|g" \
    -e "s|__PROGRESS_FILE__|$progress_file_escaped|g" \
    -e "s|__PLAN_PATH__|$plan_path_escaped|g" \
    -e "s|__DEV_COMMAND__|$dev_command_escaped|g" \
    -e "s|__BUILD_COMMAND__|$build_command_escaped|g" \
    -e "s|__PROJECT_THESIS__|$thesis_escaped|g" \
    -e "s|__NEXT_BATCH__|$next_batch_escaped|g" \
    -e "s|__DATE__|$date_escaped|g" \
    "$input_path" > "$output_path"
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

TARGET_DIR="$1"
shift

PROJECT_NAME=""
PROGRESS_FILE="PROGRESS.md"
PLAN_PATH="plans/mvp-architecture.md"
DEV_COMMAND="npm run dev"
BUILD_COMMAND="npm run build"
PROJECT_THESIS="Describe the product in one sentence."
NEXT_BATCH="Describe the highest-priority next implementation batch."
FORCE=0
TODAY="$(date +%F)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-name)
      PROJECT_NAME="${2:-}"
      shift 2
      ;;
    --plan-path)
      PLAN_PATH="${2:-}"
      shift 2
      ;;
    --progress-file)
      PROGRESS_FILE="${2:-}"
      shift 2
      ;;
    --dev-command)
      DEV_COMMAND="${2:-}"
      shift 2
      ;;
    --build-command)
      BUILD_COMMAND="${2:-}"
      shift 2
      ;;
    --thesis)
      PROJECT_THESIS="${2:-}"
      shift 2
      ;;
    --next-batch)
      NEXT_BATCH="${2:-}"
      shift 2
      ;;
    --force)
      FORCE=1
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$PROJECT_NAME" ]]; then
  PROJECT_NAME="$(basename "$TARGET_DIR")"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../templates"

AGENTS_TEMPLATE="$TEMPLATE_DIR/AGENTS.md.tpl"
PROGRESS_TEMPLATE="$TEMPLATE_DIR/PROGRESS.md.tpl"

if [[ ! -f "$AGENTS_TEMPLATE" || ! -f "$PROGRESS_TEMPLATE" ]]; then
  echo "Template files not found under $TEMPLATE_DIR" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

AGENTS_PATH="$TARGET_DIR/AGENTS.md"
PROGRESS_PATH="$TARGET_DIR/$PROGRESS_FILE"

if [[ "$FORCE" -ne 1 ]]; then
  if [[ -e "$AGENTS_PATH" ]]; then
    echo "Refusing to overwrite existing $AGENTS_PATH. Re-run with --force if intended." >&2
    exit 1
  fi

  if [[ -e "$PROGRESS_PATH" ]]; then
    echo "Refusing to overwrite existing $PROGRESS_PATH. Re-run with --force if intended." >&2
    exit 1
  fi
fi

render_template "$AGENTS_TEMPLATE" "$AGENTS_PATH"
render_template "$PROGRESS_TEMPLATE" "$PROGRESS_PATH"

echo "Created:"
echo "- $AGENTS_PATH"
echo "- $PROGRESS_PATH"
