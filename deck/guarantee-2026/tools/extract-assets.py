#!/usr/bin/env python3
"""원본 페이지에서 일러스트·아이콘을 잘라 assets/ 에 PNG 로 저장한다.

글자·도형·차트는 전부 네이티브로 다시 그리지만, 사람·건물·돈다발 같은 일러스트는
도형으로 재현할 수 없어 원본 픽셀을 그대로 얹는다.

크롭은 넉넉하게 잡는다 — 잘라낸 여백이 얹히는 면(흰 카드·네이비 밴드)과 같은 색이라
이음매가 드러나지 않는다. 밴드 위 아이콘은 반드시 밴드 안쪽만 잘라야 한다.

사용: python3 tools/extract-assets.py [원본디렉터리=src]
"""
import os
import struct
import sys
import zlib

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                '..', '..', 'namp-2026', 'tools'))
from measure import read_png  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')

# (원본, 저장이름, x, y, w, h)
CROPS = [
    # ── 1장 ────────────────────────────────────────────────
    # 부제 '…기업이 많습니다' 가 x=1000 까지 오므로 히어로는 그 오른쪽부터 자른다.
    # 부제 아래로 삐져나온 구름 조각만 따로 떼어 이어 붙인다.
    ('p1.png', 'g01-hero',      1020,   40,  538,  278),
    ('p1.png', 'g01-hero-cloud', 936,  246,   86,   72),
    ('p1.png', 'g01-boss',        70,  460,  225,  258),
    ('p1.png', 'g01-worker',     592,  484,  222,  236),
    ('p1.png', 'g01-student',   1086,  482,  188,  238),
    ('p1.png', 'g01-building',    88, 1076,  220,  278),
    ('p1.png', 'g01-shop',       867, 1164,  120,  120),
    ('p1.png', 'g01-cal-icon',   120, 1616,   80,   68),
    ('p1.png', 'g01-cal5',        98, 1866,  314,   90),
    ('p1.png', 'g01-cal3',       478, 1864,  240,   92),
    ('p1.png', 'g01-money-icon', 818, 1612,   78,   78),
    ('p1.png', 'g01-cash-big',   855, 1840,  250,  156),
    ('p1.png', 'g01-cash-small',1240, 1868,  216,  122),
    ('p1.png', 'g01-bulb',       116, 1996,   90,  120),
    ('p1.png', 'g01-barchart',   814, 1996,   92,  120),
    ('p1.png', 'g01-clipboard',  140, 2178,  116,  132),

    # ── 2장 ────────────────────────────────────────────────
    # 제목이 x=1010 까지 오므로 히어로는 그 오른쪽부터. 제목 아래로 삐져나온
    # 왼쪽 구름·건물 조각은 따로 떼어 이어 붙인다.
    ('p2.png', 'g02-hero',      1026,   30,  536,  292),
    ('p2.png', 'g02-hero-left',  960,  152,   64,  168),
    # 두 사람 그림은 눈금 아래 '매우 악화' 글자와 가까워, 글자가 딸려 들어가지 않게
    # x 를 자르거나(패널1) 글자 줄 위에서 끊고 아래를 따로 뗀다(패널2).
    ('p2.png', 'g02-think',       64,  488,  212,  394),
    ('p2.png', 'g02-scope',      830,  474,  234,  326),
    ('p2.png', 'g02-scope-b',    830,  798,  152,   84),
    ('p2.png', 'g02-moneybag',    96, 1728,  248,  262),
    ('p2.png', 'g02-bulb',       104, 2052,  114,  106),
    ('p2.png', 'g02-target',     744, 2052,  114,  106),
    ('p2.png', 'g02-clipboard',  124, 2234,  172,  114),
]

# 같은 모양이 세로로 반복되는 것(막대 옆 아이콘·메달·순위 아이콘)은 표로 만든다
for _i, _y in enumerate((1138, 1220, 1302, 1384, 1466)):
    CROPS.append(('p2.png', f'g02-fac{_i + 1}', 686, _y + 2, 88, 80))
for _i, _y in enumerate((1684, 1756, 1827, 1898, 1968)):
    CROPS.append(('p2.png', f'g02-medal{_i + 1}', 744, _y, 92, 80))
for _i, _y in enumerate((1694, 1760, 1830, 1901, 1970)):
    CROPS.append(('p2.png', f'g02-rank{_i + 1}', 836, _y, 102, 74))


def write_png(path, w, h, rgb):
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    raw = b''.join(b'\x00' + rgb[y * w * 3:(y + 1) * w * 3] for y in range(h))
    open(path, 'wb').write(
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b''))


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else 'src'
    os.makedirs(OUT, exist_ok=True)
    cache = {}
    for page, name, x, y, cw, ch in CROPS:
        if page not in cache:
            cache[page] = read_png(os.path.join(src, page))
        w, h, px = cache[page]
        if x < 0 or y < 0 or x + cw > w or y + ch > h:
            raise SystemExit(f'{name}: 크롭이 지면을 벗어난다')
        buf = bytearray(cw * ch * 3)
        for r in range(ch):
            s = ((y + r) * w + x) * 3
            buf[r * cw * 3:(r + 1) * cw * 3] = px[s:s + cw * 3]
        write_png(os.path.join(OUT, f'{name}.png'), cw, ch, bytes(buf))
        print(f'  {name}.png  {cw}x{ch}')


main()
