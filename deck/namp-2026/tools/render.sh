#!/usr/bin/env bash
# 생성한 PPTX를 LibreOffice로 PDF 변환 후 페이지별 PNG로 추출한다.
# 원본 이미지와 나란히 놓고 레이아웃 어긋남·겹침·잘림을 눈으로 확인하는 용도.
#
# 주의: 컨테이너에 KoPub돋움체가 없어 나눔 폰트로 대체 렌더된다.
#       배치 검증에는 충분하지만 자간에 따른 미세 줄바꿈은 실제 PC에서 확인해야 한다.
#
# 사용: tools/render.sh [출력디렉터리]
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${1:-/tmp/namp-render}"
PPTX=$(ls -t out/*.pptx | head -1)

rm -rf "$OUT"
mkdir -p "$OUT"
# 한글 파일명이면 LibreOffice가 못 여는 경우가 있어 ASCII 이름으로 복사해 변환한다.
cp "$PPTX" "$OUT/deck.pptx"
soffice --headless --norestore --convert-to pdf --outdir "$OUT" "$OUT/deck.pptx" >/dev/null 2>&1
pdftoppm -r 140 -png "$OUT/deck.pdf" "$OUT/r"

# r-1.png → r01.png 로 정렬용 개명
# 10# 을 붙이지 않으면 08·09가 8진수로 해석돼 두 장이 사라진다.
for f in "$OUT"/r-*.png; do
  n=$(basename "$f" .png | sed 's/^r-//')
  mv "$f" "$(printf '%s/r%02d.png' "$OUT" "$((10#$n))")"
done
ls -1 "$OUT"/r*.png
