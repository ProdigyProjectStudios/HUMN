#!/usr/bin/env bash
# assemble.sh <assets-dir> <frames-out-dir> <clip1> <clip2> ...  (clip names, no .mp4, in order)
# Replit-safe Bash port of the original helper.
set -euo pipefail
shopt -s nullglob
A=${1:-}; F=${2:-}
if [[ -z "$A" || -z "$F" || $# -lt 4 ]]; then
  echo "usage: assemble.sh <assets-dir> <frames-out-dir> <clip1> <clip2> ... (>=2 clips)"; exit 1
fi
shift 2
for CLIP in "$@"; do [[ -r "$A/$CLIP.mp4" ]] || { echo "missing clip: $A/$CLIP.mp4"; exit 1; }; done
mkdir -p "$F"

INPUTS=(); FILTER=""; N=0
for CLIP in "$@"; do
  INPUTS+=( -i "$A/$CLIP.mp4" )
  if (( N == 0 )); then FILTER+="[${N}:v]setpts=PTS-STARTPTS[v${N}];"
  else FILTER+="[${N}:v]select='gte(n\\,1)',setpts=PTS-STARTPTS[v${N}];"; fi
  N=$((N+1))
done
CONCAT=""; for ((i=0;i<N;i++)); do CONCAT+="[v${i}]"; done
FILTER+="${CONCAT}concat=n=${N}:v=1:a=0[out]"

ffmpeg -y -v error "${INPUTS[@]}" -filter_complex "$FILTER" -map "[out]" \
  -fps_mode vfr -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p "$A/master.mp4"
echo "master: $(ffprobe -v error -select_streams v -show_entries stream=width,height,nb_frames -of csv=p=0 "$A/master.mp4")"

rm -f "$F"/f_*.jpg
ffmpeg -v error -i "$A/master.mp4" -vf "scale=1024:-2" -fps_mode passthrough -q:v 6 "$F/f_%04d.jpg"
FRAMES=( "$F"/f_*.jpg )
COUNT=${#FRAMES[@]}
if (( COUNT == 0 )); then echo "FAILED — no frames were extracted"; exit 1; fi
echo "frames: $COUNT at 1024w, $(du -sh "$F" | cut -f1)  ->  set FRAME_COUNT=$COUNT in the engine"

LAST=${FRAMES[$((COUNT-1))]}
SEAM=$(ffmpeg -v error -i "$LAST" -vf "crop=iw:ih*0.12:0:ih*0.88,scale=1:1" -frames:v 1 -f rawvideo -pix_fmt rgb24 - | xxd -p | cut -c1-6)
if [[ -z "$SEAM" ]]; then echo "warning: seam colour could not be sampled — sample $LAST manually"; else
echo "seam colour of $(basename "$LAST"): #$SEAM   (start the after-film section background here)"; fi
