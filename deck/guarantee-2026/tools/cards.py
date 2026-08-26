#!/usr/bin/env python3
"""옅은 테두리로 둘러싸인 카드의 사각형을 찾는다.

흰 카드가 거의 흰 지면 위에 얹혀 색 분류로는 안 잡히므로, 테두리 색과 가까운
픽셀이 한 줄/한 칸에 길게 이어지는 곳을 카드 모서리로 본다.

사용: python3 tools/cards.py <png> [tol=48] [minrun=400]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', '..', 'namp-2026', 'tools'))
from measure import read_png  # noqa: E402


def main():
    path = sys.argv[1]
    tol = int(sys.argv[2]) if len(sys.argv) > 2 else 48
    run = int(sys.argv[3]) if len(sys.argv) > 3 else 400
    w, h, px = read_png(path)

    def c(x, y):
        i = (y * w + x) * 3
        return (px[i], px[i + 1], px[i + 2])

    def edge(p):
        # 옅은 파랑 계열: 파랑이 빨강보다 확실히 크고 너무 어둡지 않다
        return p[2] - p[0] > 16 and 120 < p[0] < 245 and p[2] < 252

    def group(items):
        out = []
        for it in items:
            if out and it[0] - out[-1][-1][0] <= 3:
                out[-1].append(it)
            else:
                out.append([it])
        return out

    rows = [(y, min(xs), max(xs)) for y in range(1, h - 1)
            for xs in [[x for x in range(20, w - 20) if edge(c(x, y))]] if len(xs) > run]
    cols = [(x, min(ys), max(ys)) for x in range(1, w - 1)
            for ys in [[y for y in range(20, h - 20) if edge(c(x, y))]] if len(ys) > run // 2]
    print('# 가로 모서리')
    for g in group(rows):
        print(f'  y={g[0][0]}-{g[-1][0]}  x={min(r[1] for r in g)}..{max(r[2] for r in g)}')
    print('# 세로 모서리')
    for g in group(cols):
        print(f'  x={g[0][0]}-{g[-1][0]}  y={min(r[1] for r in g)}..{max(r[2] for r in g)}')


main()
