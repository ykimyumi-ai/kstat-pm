#!/usr/bin/env python3
"""원본 페이지 PNG에서 요소의 픽셀 좌표를 실측한다.

원본 PDF는 텍스트 레이어가 없는 래스터 이미지이므로, 레이아웃을 눈대중으로
옮기지 않기 위해 색상 마스크 기반으로 도형(박스/필/배지)의 경계를 추출하고
텍스트 줄의 바운딩 박스를 뽑아낸다.

사용:
    python3 tools/measure.py boxes  <page.png> [--min-w 40] [--min-h 14]
    python3 tools/measure.py lines  <page.png> <x0> <y0> <x1> <y1>
"""
import sys
import zlib
import struct
from collections import deque


# ── PNG 디코드 (의존성 없이 순수 파이썬) ────────────────────────────────
def read_png(path):
    data = open(path, "rb").read()
    assert data[:8] == b"\x89PNG\r\n\x1a\n", "PNG 아님"
    pos, idat, w, h, bitd, ctype = 8, b"", 0, 0, 0, 0
    while pos < len(data):
        ln = struct.unpack(">I", data[pos:pos + 4])[0]
        typ = data[pos + 4:pos + 8]
        body = data[pos + 8:pos + 8 + ln]
        if typ == b"IHDR":
            w, h, bitd, ctype = struct.unpack(">IIBB", body[:10])
        elif typ == b"IDAT":
            idat += body
        elif typ == b"IEND":
            break
        pos += 12 + ln
    assert bitd == 8 and ctype in (2, 6), f"지원하지 않는 PNG (bit={bitd} type={ctype})"
    nch = 3 if ctype == 2 else 4
    raw = zlib.decompress(idat)
    stride = w * nch
    out = bytearray(w * h * 3)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        ft = raw[p]
        p += 1
        line = bytearray(raw[p:p + stride])
        p += stride
        if ft == 1:
            for i in range(nch, stride):
                line[i] = (line[i] + line[i - nch]) & 0xFF
        elif ft == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 0xFF
        elif ft == 3:
            for i in range(stride):
                a = line[i - nch] if i >= nch else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 0xFF
        elif ft == 4:
            for i in range(stride):
                a = line[i - nch] if i >= nch else 0
                b = prev[i]
                c = prev[i - nch] if i >= nch else 0
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 0xFF
        prev = line
        if nch == 3:
            out[y * w * 3:(y + 1) * w * 3] = line
        else:
            for x in range(w):
                out[(y * w + x) * 3:(y * w + x) * 3 + 3] = line[x * 4:x * 4 + 3]
    return w, h, bytes(out)


# ── 색상 분류 ───────────────────────────────────────────────────────────
# 원본에서 추출한 namp-2026 팔레트. 각 픽셀을 가장 가까운 팔레트 색으로 라벨링한다.
PALETTE = {
    "NAVY":      (0x05, 0x35, 0x76),
    "NAVY_DEEP": (0x05, 0x2A, 0x77),
    "GOLD":      (0xB0, 0x8D, 0x4C),
    "GOLD_DEEP": (0x9C, 0x71, 0x23),
    "CREAM":     (0xEF, 0xE9, 0xD8),
    "PANEL":     (0xF5, 0xF6, 0xF8),
    "GRAY_DARK": (0x4E, 0x4E, 0x4E),
    "WHITE":     (0xFF, 0xFF, 0xFF),
}


def classify(r, g, b):
    """픽셀을 팔레트 라벨로 분류. 색상 계열이 멀면 None."""
    best, bd = None, 1e9
    for name, (pr, pg, pb) in PALETTE.items():
        d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
        if d < bd:
            best, bd = name, d
    # NAVY / NAVY_DEEP 은 사실상 같은 계열이므로 병합
    if best in ("NAVY", "NAVY_DEEP"):
        best = "NAVY"
    if best in ("GOLD", "GOLD_DEEP"):
        best = "GOLD"
    return best if bd < 2600 else None


def find_boxes(w, h, px, min_w, min_h, targets):
    """지정한 색 계열의 연결 성분 바운딩 박스를 찾는다."""
    lab = bytearray(w * h)          # 0=기타, 1..n=타깃 색 인덱스
    idx = {t: i + 1 for i, t in enumerate(targets)}
    for i in range(w * h):
        c = classify(px[i * 3], px[i * 3 + 1], px[i * 3 + 2])
        if c in idx:
            lab[i] = idx[c]
    seen = bytearray(w * h)
    boxes = []
    for start in range(w * h):
        if lab[start] == 0 or seen[start]:
            continue
        col = lab[start]
        q = deque([start])
        seen[start] = 1
        x0 = x1 = start % w
        y0 = y1 = start // w
        n = 0
        while q:
            cur = q.popleft()
            n += 1
            cx, cy = cur % w, cur // w
            x0, x1 = min(x0, cx), max(x1, cx)
            y0, y1 = min(y0, cy), max(y1, cy)
            for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                if 0 <= nx < w and 0 <= ny < h:
                    ni = ny * w + nx
                    if not seen[ni] and lab[ni] == col:
                        seen[ni] = 1
                        q.append(ni)
        bw, bh = x1 - x0 + 1, y1 - y0 + 1
        if bw >= min_w and bh >= min_h and n > bw * bh * 0.35:
            boxes.append((targets[col - 1], x0, y0, bw, bh, n / (bw * bh)))
    boxes.sort(key=lambda b: (b[2], b[1]))
    return boxes


def find_lines(w, h, px, x0, y0, x1, y1, thresh=150):
    """지정 영역에서 어두운 픽셀(=글자) 행을 묶어 텍스트 줄 bbox를 뽑는다."""
    rows = []
    for y in range(y0, y1):
        cnt = 0
        for x in range(x0, x1):
            i = (y * w + x) * 3
            if (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) // 1000 < thresh:
                cnt += 1
        rows.append(cnt)
    lines, cur = [], None
    for k, c in enumerate(rows):
        if c > 0 and cur is None:
            cur = k
        elif c == 0 and cur is not None:
            if k - cur >= 4:
                lines.append((cur, k))
            cur = None
    if cur is not None:
        lines.append((cur, len(rows)))
    out = []
    for a, b in lines:
        lx0, lx1 = x1, x0
        for y in range(y0 + a, y0 + b):
            for x in range(x0, x1):
                i = (y * w + x) * 3
                if (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) // 1000 < thresh:
                    lx0, lx1 = min(lx0, x), max(lx1, x)
        out.append((lx0, y0 + a, lx1 - lx0 + 1, b - a))
    return out


def main():
    mode = sys.argv[1]
    w, h, px = read_png(sys.argv[2])
    if mode == "boxes":
        mw = int(sys.argv[3]) if len(sys.argv) > 3 else 40
        mh = int(sys.argv[4]) if len(sys.argv) > 4 else 14
        print(f"# image {w}x{h}")
        for name, x, y, bw, bh, fill in find_boxes(
            w, h, px, mw, mh, ["NAVY", "GOLD", "CREAM", "PANEL", "GRAY_DARK"]
        ):
            print(f"{name:9} x={x:4} y={y:4} w={bw:4} h={bh:3}  fill={fill:.2f}")
    elif mode == "lines":
        x0, y0, x1, y1 = (int(v) for v in sys.argv[3:7])
        print(f"# image {w}x{h}  region ({x0},{y0})-({x1},{y1})")
        for lx, ly, lw, lh in find_lines(w, h, px, x0, y0, x1, y1):
            print(f"line x={lx:4} y={ly:4} w={lw:4} h={lh:3}")
    elif mode == "span":
        # (x,y) 지점의 색을 기준으로 좌우/상하로 같은 색이 이어지는 범위를 잰다.
        # 흰 카드가 위에 얹혀 연결 성분이 조각나는 큰 패널의 외곽을 잡을 때 쓴다.
        for i in range(3, len(sys.argv), 2):
            x, y = int(sys.argv[i]), int(sys.argv[i + 1])
            j = (y * w + x) * 3
            ref = (px[j], px[j + 1], px[j + 2])

            def same(xx, yy):
                k = (yy * w + xx) * 3
                return all(abs(px[k + t] - ref[t]) <= 6 for t in range(3))

            lx = x
            while lx > 0 and same(lx - 1, y):
                lx -= 1
            rx = x
            while rx < w - 1 and same(rx + 1, y):
                rx += 1
            ty = y
            while ty > 0 and same(x, ty - 1):
                ty -= 1
            by = y
            while by < h - 1 and same(x, by + 1):
                by += 1
            print(f"({x},{y}) #{ref[0]:02X}{ref[1]:02X}{ref[2]:02X}  "
                  f"x={lx} y={ty} w={rx-lx+1} h={by-ty+1}")
    elif mode == "pick":
        for i in range(3, len(sys.argv), 2):
            x, y = int(sys.argv[i]), int(sys.argv[i + 1])
            j = (y * w + x) * 3
            print(f"({x},{y}) #{px[j]:02X}{px[j+1]:02X}{px[j+2]:02X}")


if __name__ == "__main__":
    main()
