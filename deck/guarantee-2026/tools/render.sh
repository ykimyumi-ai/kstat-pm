#!/usr/bin/env bash
# 생성한 PPTX 를 원본과 **같은 픽셀 크기**(1600×2400)로 렌더한다.
# 원본과 나란히 놓고 어긋남을 재려면 해상도가 같아야 한다.
# 1600px / 10.667in = 150dpi.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${1:-/tmp/guarantee-render}"
PPTX="${2:-$(ls -t out/*.pptx | head -1)}"

rm -rf "$OUT"; mkdir -p "$OUT"
# 한글 파일명이면 LibreOffice 가 못 여는 경우가 있어 ASCII 이름으로 복사해 변환한다.
cp "$PPTX" "$OUT/deck.pptx"
soffice --headless --norestore --convert-to pdf --outdir "$OUT" "$OUT/deck.pptx" >/dev/null 2>&1
pdftoppm -r 150 -png "$OUT/deck.pdf" "$OUT/r"
for f in "$OUT"/r-*.png; do
  n=$(basename "$f" .png | sed 's/^r-//')
  mv "$f" "$(printf '%s/r%02d.png' "$OUT" "$((10#$n))")"
done
ls -1 "$OUT"/r*.png
