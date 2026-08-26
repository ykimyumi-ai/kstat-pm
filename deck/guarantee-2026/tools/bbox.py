#!/usr/bin/env python3
"""구역 안에서 '배경이 아닌' 픽셀의 바운딩 박스를 잰다. 일러스트 크롭 범위용.

사용: python3 tools/bbox.py <png> <tol> <x0> <y0> <x1> <y1> [...]
      tol 이 클수록 옅은 색을 배경으로 본다(기본 8 정도).
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', '..', 'namp-2026', 'tools'))
from measure import read_png  # noqa: E402


def main():
    path, tol = sys.argv[1], int(sys.argv[2])
    w, h, px = read_png(path)
    a = [int(v) for v in sys.argv[3:]]
    for i in range(0, len(a), 4):
        x0, y0, x1, y1 = a[i:i + 4]
        ax = ay = 10 ** 9
        bx = by = -1
        for y in range(y0, y1):
            for x in range(x0, x1):
                j = (y * w + x) * 3
                if min(px[j], px[j + 1], px[j + 2]) < 255 - tol:
                    ax = min(ax, x); bx = max(bx, x)
                    ay = min(ay, y); by = max(by, y)
        if bx < 0:
            print(f"  ({x0},{y0})-({x1},{y1}) 비어 있음")
        else:
            print(f"  x={ax:4} y={ay:4} w={bx-ax+1:4} h={by-ay+1:4}"
                  f"   (구역 {x0},{y0}-{x1},{y1})")


main()
