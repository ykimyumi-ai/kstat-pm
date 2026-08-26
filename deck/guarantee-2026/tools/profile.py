#!/usr/bin/env python3
"""카드 경계를 찾는다 — 흰 카드가 거의 흰 배경 위에 얹혀 색 분류로는 안 잡힌다.

지정한 가로줄/세로줄을 따라가며 색이 바뀌는 지점을 모두 뽑는다. 카드 테두리(연한
파랑)·구분선·막대 끝이 전부 '변화 지점'으로 잡히므로 좌표를 눈으로 찍지 않아도 된다.

사용:
    python3 tools/profile.py col src/p1.png <x> [y0] [y1]   # 세로로 훑기
    python3 tools/profile.py row src/p1.png <y> [x0] [x1]   # 가로로 훑기
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', '..', 'namp-2026', 'tools'))
from measure import read_png  # noqa: E402


def hexs(px, i):
    return f"#{px[i]:02X}{px[i+1]:02X}{px[i+2]:02X}"


def main():
    mode, path, at = sys.argv[1], sys.argv[2], int(sys.argv[3])
    w, h, px = read_png(path)
    lim = h if mode == 'col' else w
    a = int(sys.argv[4]) if len(sys.argv) > 4 else 0
    b = int(sys.argv[5]) if len(sys.argv) > 5 else lim
    print(f"# {path} {w}x{h}  {mode} {at}  [{a},{b})")
    prev = None
    start = a
    for t in range(a, b):
        i = ((t * w + at) if mode == 'col' else (at * w + t)) * 3
        cur = (px[i], px[i + 1], px[i + 2])
        if prev is None:
            prev = cur
            continue
        # 8 이상 벌어지면 다른 색으로 본다 (JPEG 유래 잡티를 흘려보낸다)
        if max(abs(cur[k] - prev[k]) for k in range(3)) > 8:
            if t - start >= 2:
                print(f"{start:5}-{t-1:5} ({t-start:4}px)  "
                      f"#{prev[0]:02X}{prev[1]:02X}{prev[2]:02X}")
            start = t
            prev = cur
    if b - start >= 2:
        print(f"{start:5}-{b-1:5} ({b-start:4}px)  "
              f"#{prev[0]:02X}{prev[1]:02X}{prev[2]:02X}")


main()
