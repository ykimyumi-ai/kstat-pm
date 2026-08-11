#!/usr/bin/env python3
"""14~16장의 사진·아이콘을 원본 PNG에서 잘라 assets/ 로 저장한다.

이 3장에는 앞의 13장에 없던 사진(공장·크레인·서버·트럭·클립보드)과 원형 아이콘이
들어 있다. 사진은 도형으로 다시 그릴 수 없으므로 원본에서 잘라 PPTX에 삽입한다.
글자와 도형은 그대로 네이티브로 그리므로 편집 가능성은 유지된다.

잘라내는 사각형은 원본 좌표(px)다. 사진이 pill 위로 걸치는 경우 pill 픽셀까지
함께 잘라내고, 슬라이드에서는 pill을 먼저 그린 뒤 그 위에 얹어 이음매를 없앤다.
(그래서 s15·s16은 pill 색을 원본 실측값으로 쓴다.)

사용: python3 tools/extract-assets.py <원본PNG디렉터리>
"""
import os
import struct
import sys
import zlib

sys.path.insert(0, os.path.dirname(__file__))
from measure import read_png  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')

# (원본파일, 저장이름, x, y, w, h)
CROPS = [
    ('p14.png', 's14-server',    222, 382, 174, 146),
    ('p14.png', 's14-factory',  1192, 356, 206, 108),
    ('p14.png', 's14-crane',    1183, 464, 215, 116),
    ('p14.png', 's14-truck',    1100, 645, 298, 136),
    ('p14.png', 's14-clipboard', 224, 618, 172, 158),
    ('p14.png', 's14-icon1',      53, 894,  75,  75),
    ('p14.png', 's14-icon2',     404, 894,  75,  75),
    ('p14.png', 's14-icon3',     779, 894,  75,  75),
    ('p14.png', 's14-icon4',    1141, 894,  75,  75),
    ('p15.png', 's15-factory',   440, 360, 270,  92),
    ('p15.png', 's15-crane',    1180, 316, 260, 140),
    ('p16.png', 's16-server',    318, 332, 150, 104),
    ('p16.png', 's16-truck',     752, 344, 222,  94),
    ('p16.png', 's16-clipboard',1278, 320, 176, 124),
    ('p17.png', 's17-gavel',    1296, 668, 232, 182),
]


def write_png(path, w, h, rgb):
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    raw = b''.join(b'\x00' + rgb[y * w * 3:(y + 1) * w * 3] for y in range(h))
    open(path, 'wb').write(
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b'')
    )


def main():
    src = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    cache = {}
    for fname, name, x, y, cw, ch in CROPS:
        if fname not in cache:
            cache[fname] = read_png(os.path.join(src, fname))
        w, h, px = cache[fname]
        buf = bytearray(cw * ch * 3)
        for row in range(ch):
            s = ((y + row) * w + x) * 3
            buf[row * cw * 3:(row + 1) * cw * 3] = px[s:s + cw * 3]
        dst = os.path.join(OUT, name + '.png')
        write_png(dst, cw, ch, bytes(buf))
        print(f'{name}.png  {cw}×{ch}  ({os.path.getsize(dst) // 1024} KB)')


if __name__ == '__main__':
    main()
