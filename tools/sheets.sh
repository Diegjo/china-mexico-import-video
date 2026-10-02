#!/usr/bin/env bash
# Review sheets from the encoded film (what viewers actually see, motion blur included).
#   bash tools/sheets.sh [out/final.mp4]
# Frames are picked by frame number, so sheet timestamps are exact (fps=N rounds to the nearest second).
set -euo pipefail
IN="${1:-out/final.mp4}"
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$IN" | awk -F/ '{ printf "%d", $1 / $2 }')
q() { ffmpeg -v error -y "$@"; }

# Contact sheet: one frame per second (t = 0.5, 1.5 … 59.5), 10 across.
q -i "$IN" -vf "select='eq(mod(n\,$FPS)\,$((FPS / 2)))',scale=216:-1,tile=10x6:padding=6:color=0x222222" -frames:v 1 -update 1 out/contact.png
# Strip: 12 consecutive frames through the fastest move (whip pan at 3.6 s).
q -i "$IN" -vf "select='gte(n\,$((FPS * 358 / 100)))',scale=180:-1,tile=12x1:padding=4:color=0x222222" -frames:v 1 -update 1 out/strip.png
# Phone test: how it reads at 360 px wide, one frame every 4 s from t = 1.9.
q -i "$IN" -vf "select='gte(n\,$((FPS * 19 / 10)))*eq(mod(n-$((FPS * 19 / 10))\,$((FPS * 4)))\,0)',scale=360:-1,tile=5x3:padding=6:color=0x222222" -frames:v 1 -update 1 out/phone.png
echo "sheets → out/contact.png out/strip.png out/phone.png"
