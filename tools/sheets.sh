#!/usr/bin/env bash
# Review sheets from the encoded film (what viewers actually see, motion blur included).
#   bash tools/sheets.sh [out/final.mp4]
set -euo pipefail
IN="${1:-out/final.mp4}"
q() { ffmpeg -v error -y "$@"; }

# Contact sheet: one frame per second (t = 0.5, 1.5 … 59.5), 10 across.
q -ss 0.5 -i "$IN" -vf "fps=1,scale=216:-1,tile=10x6:padding=6:color=0x222222" -frames:v 1 -update 1 out/contact.png
# Strip: 12 consecutive frames through the fastest move (whip pan at 3.6 s).
q -ss 3.58 -i "$IN" -vf "scale=180:-1,tile=12x1:padding=4:color=0x222222" -frames:v 1 -update 1 out/strip.png
# Phone test: how it reads at 360 px wide, one frame every 4 s.
q -ss 1.9 -i "$IN" -vf "fps=1/4,scale=360:-1,tile=5x3:padding=6:color=0x222222" -frames:v 1 -update 1 out/phone.png
echo "sheets → out/contact.png out/strip.png out/phone.png"
