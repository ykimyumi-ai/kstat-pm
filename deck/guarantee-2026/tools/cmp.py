#!/usr/bin/env python3
"""원본과 렌더의 같은 구역에서 글줄 상자를 나란히 재서 어긋난 값을 뽑는다.

overlay 는 눈으로 보는 용도, 이건 숫자로 잡는 용도다.
사용: python3 tools/cmp.py <원본.png> <렌더.png> <thresh> <x0 y0 x1 y1> [...]
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ink import boxes  # noqa: E402
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', '..', 'namp-2026', 'tools'))
from measure import read_png  # noqa: E402


def main():
    wa, ha, pa = read_png(sys.argv[1])
    wb, hb, pb = read_png(sys.argv[2])
    th = int(sys.argv[3])
    a = [int(v) for v in sys.argv[4:]]
    for i in range(0, len(a), 4):
        x0, y0, x1, y1 = a[i:i + 4]
        A = boxes(wa, ha, pa, x0, y0, x1, y1, th)
        B = boxes(wb, hb, pb, x0, y0, x1, y1, th)
        print(f"# ({x0},{y0})-({x1},{y1})  원본 {len(A)}줄 / 렌더 {len(B)}줄")
        for j in range(max(len(A), len(B))):
            sa = (f"x={A[j][0]:4} y={A[j][1]:4} w={A[j][2]-A[j][0]+1:4} h={A[j][3]-A[j][1]+1:3}"
                  if j < len(A) else "                          -")
            sb = (f"x={B[j][0]:4} y={B[j][1]:4} w={B[j][2]-B[j][0]+1:4} h={B[j][3]-B[j][1]+1:3}"
                  if j < len(B) else "                          -")
            d = ""
            if j < len(A) and j < len(B):
                d = f"   Δx={B[j][0]-A[j][0]:+4} Δy={B[j][1]-A[j][1]:+4} Δw={(B[j][2]-B[j][0])-(A[j][2]-A[j][0]):+4}"
            print(f"  원본 {sa}\n  렌더 {sb}{d}")


main()
