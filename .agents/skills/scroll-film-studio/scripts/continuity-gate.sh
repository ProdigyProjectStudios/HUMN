#!/usr/bin/env bash
# continuity-gate.sh <frames-dir> [step]
# Replit-safe Bash port of the original local-shape SSIM continuity gate.
set -euo pipefail
shopt -s nullglob
DIR=${1:-}
STEP=${2:-4}
[[ -n "$DIR" ]] || { echo "usage: continuity-gate.sh <frames-dir> [step]"; exit 1; }
[[ "$STEP" =~ ^[0-9]+$ && "$STEP" -gt 0 ]] || { echo "step must be a positive integer"; exit 1; }
command -v ffmpeg >/dev/null || { echo "missing dependency: ffmpeg"; exit 1; }

FRAMES=( "$DIR"/f_*.jpg )
(( ${#FRAMES[@]} < 4 )) && { echo "no frames in $DIR"; exit 1; }
echo "continuity gate — $DIR  (${#FRAMES[@]} frames, every $STEP)"

SCORES=(); NAMES=(); prev=""
for ((i=0; i<${#FRAMES[@]}; i+=STEP)); do
  f=${FRAMES[$i]}
  if [[ -n "$prev" ]]; then
    s=$(ffmpeg -i "$prev" -i "$f" -lavfi ssim -f null - 2>&1 | grep -o 'All:[0-9.]*' | cut -d: -f2 || true)
    if [[ -n "$s" ]]; then
      SCORES+=( "$s" )
      NAMES+=( "$(basename "$prev")->$(basename "$f")" )
    fi
  fi
  prev=$f
done

(( ${#SCORES[@]} < 3 )) && {
  echo "  FAIL measured ${#SCORES[@]} pairs — too few to judge."
  echo "  A gate that passes without measuring anything is worse than no gate."
  exit 1
}

med(){ printf '%s\n' "$@" | sort -n | awk '{a[NR]=$1} END{print (NR%2)?a[(NR+1)/2]:(a[NR/2]+a[NR/2+1])/2}'; }
MEDIAN=$(med "${SCORES[@]}")

CUTS=(); FROZEN=()
for ((i=0; i<${#SCORES[@]}; i++)); do
  lo=$(( i-3 < 0 ? 0 : i-3 ))
  hi=$(( i+3 >= ${#SCORES[@]} ? ${#SCORES[@]}-1 : i+3 ))
  span=$(( hi-lo+1 ))
  local_scores=( "${SCORES[@]:lo:span}" )
  LM=$(med "${local_scores[@]}")
  s=${SCORES[$i]}
  if awk "BEGIN{exit !($s < 0.45*$LM)}"; then CUTS+=( "${NAMES[$i]}  $s vs local $LM" ); fi
  if awk "BEGIN{exit !($s > 0.995)}"; then FROZEN+=( "${NAMES[$i]}  $s" ); fi
done

echo "  median $MEDIAN over ${#SCORES[@]} pairs — absolute value is NOT the test; local shape is"
if (( ${#CUTS[@]} )); then
  echo "  ${#CUTS[@]} hard cuts (collapse vs local baseline):"
  printf '    %s\n' "${CUTS[@]:0:6}"
fi
if (( ${#FROZEN[@]} )); then
  echo "  ${#FROZEN[@]} frozen pairs (camera stopped — dead scroll zone):"
  printf '    %s\n' "${FROZEN[@]:0:6}"
fi

FAIL=0
(( ${#CUTS[@]} )) && { echo "  FAIL ${#CUTS[@]} cuts — a sequence of shots, not one move"; FAIL=1; }
(( ${#FROZEN[@]} > 2 )) && { echo "  FAIL ${#FROZEN[@]} frozen pairs — the scroll will stall here"; FAIL=1; }

if (( FAIL )); then
  echo
  echo "REJECTED. Do not build on this footage — regenerate it."
  echo "The cause is almost always storyboard distance: a clip asked to change"
  echo "location, scale and lighting at once will teleport. Shorten the move, add"
  echo "an intermediate keyframe, and pin BOTH ends so the clip is forced to land."
  exit 1
fi
echo "  PASS — one continuous move"
