#!/bin/bash

CHECK_INTERVAL=180   # 3분
BRANCH="main"

timestamp() {
  date "+%Y-%m-%d %H:%M:%S"
}

echo "[$(timestamp)] 🔍 PR merge watcher started (interval: ${CHECK_INTERVAL}s)"

while true; do
  echo "[$(timestamp)] 🔎 Checking merged PR..."

  MERGED_COUNT=$(gh pr list \
    --state merged \
    --base "$BRANCH" \
    --limit 1 \
    --json number \
    | jq length)

  if [ "$MERGED_COUNT" -eq 1 ]; then
    echo "[$(timestamp)] ✅ Merged PR detected. Waiting..."
  else
    echo "[$(timestamp)] 🚀 No merged PR. Triggering Cursor Agent..."
    
    # ❗요청한 그대로 실행
    cursor agent -p "작업 진행"

    echo "[$(timestamp)] ⏸ Trigger done. Sleeping..."
  fi

  sleep "$CHECK_INTERVAL"
done
