#!/usr/bin/env bash
# ONE Seedance 2.5 generation. No retries, no alternatives.
# Submits payload.json once (idempotency key prevents a duplicate charge if the
# submit is re-sent), polls until a terminal status, and downloads the MP4.
set -euo pipefail
cd "$(dirname "$0")"

if [ -f request.json ]; then
  echo "request.json already exists: a generation was already submitted. Refusing to submit again." >&2
  exit 1
fi

IDEM="humn-hf-master-720p"
curl -sS -X POST https://api.higgsfield.ai/bytedance/seedance-2.5/text-to-video \
  -H "Authorization: Key $HF_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEM" \
  --data @payload.json > request.json
cat request.json; echo

STATUS_URL=$(jq -r '.status_url // empty' request.json)
[ -n "$STATUS_URL" ] || { echo "Submit did not return a status_url; not retrying." >&2; exit 1; }

while true; do
  sleep 10
  curl -sS "$STATUS_URL" -H "Authorization: Key $HF_KEY" > status.json
  S=$(jq -r '.status' status.json)
  echo "$(date +%T) status=$S"
  case "$S" in
    completed) break ;;
    failed|nsfw|canceled|cancelled) echo "Terminal status $S; not retrying." >&2; cat status.json; exit 1 ;;
  esac
done

URL=$(jq -r '.video.url' status.json)
curl -sS -L "$URL" -o master.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate:format=duration -of compact master.mp4
echo "saved $(pwd)/master.mp4"
