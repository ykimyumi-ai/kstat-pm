#!/usr/bin/env python3
"""이 덱 팔레트로 namp-2026 의 실측 엔진을 돌린다.

측정 로직(PNG 디코드·연결성분·글줄 바운딩)은 덱과 무관하게 같으므로 복제하지 않고
가져다 쓰되, 색 분류표만 이 인포그래픽의 블루 팔레트로 갈아끼운다.

사용:
    python3 tools/measure.py boxes src/p1.png [min_w] [min_h]
    python3 tools/measure.py lines src/p1.png x0 y0 x1 y1
    python3 tools/measure.py span  src/p1.png x y [x y ...]
    python3 tools/measure.py pick  src/p1.png x y [x y ...]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', '..', 'namp-2026', 'tools'))
import measure  # noqa: E402

# theme.js 의 C 와 같은 값이어야 한다. 여기서 갈리면 실측과 산출물이 어긋난다.
measure.PALETTE = {
    "NAVY_DEEP": (0x00, 0x33, 0x7F),
    "NAVY":      (0x0B, 0x3C, 0x88),
    "BLUE_DEEP": (0x00, 0x44, 0x9C),
    "BLUE":      (0x1D, 0x6F, 0xBF),
    "BLUE_MID":  (0x4E, 0x9B, 0xDD),
    "BLUE_LT":   (0x7D, 0xC0, 0xF0),
    "BLUE_PALE": (0xB9, 0xDB, 0xF6),
    "RING_BG":   (0xC5, 0xD9, 0xE8),
    "TINT":      (0xE8, 0xF1, 0xFB),
    "CARD":      (0xFF, 0xFF, 0xFF),
    "TXT":       (0x1A, 0x1A, 0x1A),
}

# NAVY_DEEP/NAVY/BLUE_DEEP 은 원본에서 몇 단위씩 흔들려 사실상 한 계열이다.
_MERGE = {"NAVY_DEEP": "NAVY", "BLUE_DEEP": "NAVY"}
_classify = measure.classify


def classify(r, g, b):
    c = _classify(r, g, b)
    return _MERGE.get(c, c)


measure.classify = classify
measure.find_boxes.__globals__['classify'] = classify

if __name__ == '__main__':
    measure.main()
