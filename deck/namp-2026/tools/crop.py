#!/usr/bin/env python3
"""원본 페이지 PNG의 일부 영역을 잘라 확대 저장한다.

원본은 텍스트 레이어가 없어 작은 글자를 눈으로 읽어 전사해야 하므로,
해당 영역만 정수배 확대해 판독 정확도를 올린다.

사용: python3 tools/crop.py <src.png> <out.png> <x> <y> <w> <h> [scale]
"""
import sys
import zlib
import struct

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from measure import read_png  # noqa: E402


def write_png(path, w, h, rgb):
    def chunk(t, d):
        c = t + d
        return struct.pack(">I", len(d)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    raw = b"".join(b"\x00" + rgb[y * w * 3:(y + 1) * w * 3] for y in range(h))
    open(path, "wb").write(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 6))
        + chunk(b"IEND", b"")
    )


def main():
    src, out = sys.argv[1], sys.argv[2]
    x, y, cw, ch = (int(v) for v in sys.argv[3:7])
    scale = int(sys.argv[7]) if len(sys.argv) > 7 else 2
    w, h, px = read_png(src)
    cw = min(cw, w - x)
    ch = min(ch, h - y)
    ow, oh = cw * scale, ch * scale
    buf = bytearray(ow * oh * 3)
    for oy in range(oh):
        sy = y + oy // scale
        row = bytearray(ow * 3)
        for ox in range(ow):
            sx = x + ox // scale
            i = (sy * w + sx) * 3
            row[ox * 3:ox * 3 + 3] = px[i:i + 3]
        buf[oy * ow * 3:(oy + 1) * ow * 3] = row
    write_png(out, ow, oh, bytes(buf))
    print(f"{out} {ow}x{oh} (src {cw}x{ch} @{scale}x)")


if __name__ == "__main__":
    main()
