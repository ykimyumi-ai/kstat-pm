#!/usr/bin/env python3
"""원본과 렌더를 겹쳐 어긋남을 눈으로 잡는다.

원본의 잉크는 빨강, 렌더의 잉크는 파랑으로 칠한다. 겹치면 어두운 보라가 된다.
빨강만 보이면 원본에만 있는 것(빠뜨렸거나 자리가 다르다), 파랑만 보이면 내 쪽만.

사용: python3 tools/overlay.py <원본.png> <렌더.png> <출력.png> [thresh=200]
"""
import os
import struct
import sys
import zlib

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', '..', 'namp-2026', 'tools'))
from measure import read_png  # noqa: E402


def main():
    a, b, out = sys.argv[1], sys.argv[2], sys.argv[3]
    th = int(sys.argv[4]) if len(sys.argv) > 4 else 200
    w1, h1, p1 = read_png(a)
    w2, h2, p2 = read_png(b)
    w, h = min(w1, w2), min(h1, h2)
    buf = bytearray(b'\xff' * (w * h * 3))
    for y in range(h):
        for x in range(w):
            i1 = (y * w1 + x) * 3
            i2 = (y * w2 + x) * 3
            d1 = (p1[i1] * 299 + p1[i1 + 1] * 587 + p1[i1 + 2] * 114) // 1000 < th
            d2 = (p2[i2] * 299 + p2[i2 + 1] * 587 + p2[i2 + 2] * 114) // 1000 < th
            j = (y * w + x) * 3
            if d1 and d2:
                buf[j:j + 3] = b'\x30\x20\x60'
            elif d1:
                buf[j:j + 3] = b'\xe0\x30\x30'
            elif d2:
                buf[j:j + 3] = b'\x30\x70\xe0'

    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)
    raw = b''.join(b'\x00' + bytes(buf[y * w * 3:(y + 1) * w * 3]) for y in range(h))
    open(out, 'wb').write(
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 6)) + chunk(b'IEND', b''))
    print(out, w, h)


main()
