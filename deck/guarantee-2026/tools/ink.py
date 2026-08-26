#!/usr/bin/env python3
"""여러 구역의 '글자 잉크' 바운딩 박스를 한 번에 뽑는다.

measure.py lines 는 구역 하나씩만 되고 일러스트가 섞이면 통째로 뭉친다.
여기서는 어두운 픽셀의 연결 성분을 잡아 같은 줄끼리만 묶으므로, 옆에 그림이
있어도 글줄만 골라낼 수 있다.

사용: python3 tools/ink.py <png> <thresh> <x0> <y0> <x1> <y1> [x0 y0 x1 y1 ...]
"""
import os
import sys
from collections import deque

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', '..', 'namp-2026', 'tools'))
from measure import read_png  # noqa: E402


def boxes(w, h, px, x0, y0, x1, y1, thresh):
    dark = bytearray((x1 - x0) * (y1 - y0))
    bw = x1 - x0
    for y in range(y0, y1):
        for x in range(x0, x1):
            i = (y * w + x) * 3
            lum = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) // 1000
            if lum < thresh:
                dark[(y - y0) * bw + (x - x0)] = 1
    seen = bytearray(len(dark))
    out = []
    for st in range(len(dark)):
        if not dark[st] or seen[st]:
            continue
        q = deque([st])
        seen[st] = 1
        ax = bx = st % bw
        ay = by = st // bw
        n = 0
        while q:
            p = q.popleft()
            n += 1
            cx, cy = p % bw, p // bw
            ax, bx = min(ax, cx), max(bx, cx)
            ay, by = min(ay, cy), max(by, cy)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < bw and 0 <= ny < (y1 - y0):
                    q2 = ny * bw + nx
                    if dark[q2] and not seen[q2]:
                        seen[q2] = 1
                        q.append(q2)
        if n >= 12:
            out.append([ax + x0, ay + y0, bx + x0, by + y0])
    # y 가 겹치는 성분을 한 줄로 묶는다
    out.sort(key=lambda b: (b[1], b[0]))
    lines = []
    for b in out:
        hit = None
        for L in lines:
            ov = min(L[3], b[3]) - max(L[1], b[1])
            if ov > 0.45 * min(L[3] - L[1], b[3] - b[1]):
                hit = L
                break
        if hit:
            hit[0] = min(hit[0], b[0]); hit[1] = min(hit[1], b[1])
            hit[2] = max(hit[2], b[2]); hit[3] = max(hit[3], b[3])
        else:
            lines.append(b[:])
    lines.sort(key=lambda b: (b[1], b[0]))
    return lines


def main():
    path, thresh = sys.argv[1], int(sys.argv[2])
    w, h, px = read_png(path)
    a = [int(v) for v in sys.argv[3:]]
    for i in range(0, len(a), 4):
        x0, y0, x1, y1 = a[i:i + 4]
        print(f"# ({x0},{y0})-({x1},{y1})")
        for b in boxes(w, h, px, x0, y0, x1, y1, thresh):
            print(f"  x={b[0]:4} y={b[1]:4} w={b[2]-b[0]+1:4} h={b[3]-b[1]+1:3}")


if __name__ == '__main__':
    main()
