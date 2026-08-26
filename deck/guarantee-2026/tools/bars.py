#!/usr/bin/env python3
"""파랑 막대의 사각형을 모두 뽑는다. 차트 좌표(시작 x·길이·행 간격)를 재는 용도.

사용: python3 tools/bars.py <png> <x0> <y0> <x1> <y1> [minw=40]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', '..', 'namp-2026', 'tools'))
from measure import read_png  # noqa: E402


def main():
    path = sys.argv[1]
    x0, y0, x1, y1 = (int(v) for v in sys.argv[2:6])
    minw = int(sys.argv[6]) if len(sys.argv) > 6 else 40
    w, h, px = read_png(path)

    def c(x, y):
        i = (y * w + x) * 3
        return (px[i], px[i + 1], px[i + 2])

    def isbar(p):
        return p[2] > 120 and p[2] - p[0] > 35 and p[0] < 235

    segs = {}
    for y in range(y0, y1):
        xs = [x for x in range(x0, x1) if isbar(c(x, y))]
        g = []
        prev = None
        for x in xs:
            if prev is None or x - prev > 6:
                g.append([x, x])
            else:
                g[-1][1] = x
            prev = x
        segs[y] = [tuple(t) for t in g if t[1] - t[0] >= minw]

    bars = {}
    for y in sorted(segs):
        for t in segs[y]:
            key = None
            for k in bars:
                if abs(k[0] - t[0]) < 8 and abs(k[1] - t[1]) < 12 and bars[k][1] >= y - 3:
                    key = k
                    break
            if key:
                bars[key][1] = y
            else:
                bars[t] = [y, y]
    for k, v in sorted(bars.items(), key=lambda kv: (kv[1][0], kv[0][0])):
        if v[1] - v[0] > 14:
            print(f'x={k[0]:4}..{k[1]:4} (w={k[1]-k[0]+1:4})  '
                  f'y={v[0]:4}..{v[1]:4} (h={v[1]-v[0]+1:3})')


main()
