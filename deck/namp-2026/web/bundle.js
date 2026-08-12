"use strict";
var Deck = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // theme.js
  var require_theme = __commonJS({
    "theme.js"(exports, module) {
      "use strict";
      var SLIDE_W = 11;
      var SLIDE_H = 7.3333;
      var C = {
        NAVY: "053576",
        // 라벨 pill · 번호 배지 · 섹션 헤더
        NAVY_DEEP: "052A77",
        // 번호 사각 배지 · 진한 강조
        NAVY_LINE: "0B3070",
        // 헤더 구분선
        BLUE_TXT: "133784",
        // 인용문 강조 · 수치 텍스트
        BLUE_PALE: "E5EBF7",
        // 옅은 파랑 박스
        GOLD: "B08D4C",
        // 보고 배지 · 강조 박스 · 타임라인 종점
        GOLD_DEEP: "9C7123",
        // 로드맵 하단 바
        CREAM: "EFE9D8",
        // 프로세스 결과 박스 · 본실태조사 박스
        PANEL: "F5F6F8",
        // 큰 패널 배경
        ROW_ALT: "F4F5F7",
        // 행 교대 배경
        CARD: "FFFFFF",
        // 흰 카드
        LINE: "DDE1E8",
        // 옅은 구분선
        GRAY_DARK: "4E4E4E",
        // 재단 연동제 DB 박스
        TXT: "1A1A1A",
        // 본문
        TXT_MID: "333333",
        TXT_SUB: "606060",
        // 보조 · 각주
        WHITE: "FFFFFF"
      };
      var FONT_B = "KoPub\uB3CB\uC6C0\uCCB4 Bold";
      var FONT_M = "KoPub\uB3CB\uC6C0\uCCB4 Medium";
      var INK_RATIO = 0.99;
      var MIN_PT = 10;
      function scaler(imgW, imgH) {
        const kx = SLIDE_W / imgW;
        const ky = SLIDE_H / imgH;
        const r = (v) => Math.round(v * 1e3) / 1e3;
        return {
          imgW,
          imgH,
          kx,
          ky,
          X: (px) => r(px * kx),
          // 가로 위치
          W: (px) => r(px * kx),
          // 가로 크기
          Y: (px) => r(px * ky),
          // 세로 위치
          H: (px) => r(px * ky),
          // 세로 크기
          // 글자 크기: 원본에서 잰 한글 글자 잉크 높이(px)를 pt로 환산한다.
          // 계수 0.99 는 추정값이 아니라 실측 캘리브레이션 결과다 — 원본의 제목·부제·
          // 인용문·각주 4개 표본에 대해 KoPub돋움체 실제 메트릭으로 계산한 폭이
          // 원본 폭의 0.98~1.04배가 되도록 맞춘 값이다.
          // 원본의 초소형 주석은 10pt 미만이 되는데, kstat-ppt 원칙 15(최소 10pt)에
          // 따라 하한을 둔다. 그만큼 해당 주석은 원본보다 조금 커진다.
          FS: (inkPx) => Math.max(
            MIN_PT,
            Math.round(inkPx / INK_RATIO * ky * 72 * 10) / 10
          ),
          // 이미 pt로 정한 값을 세로 압축 비율만큼 줄일 때
          PT: (pt) => Math.round(pt * (ky / (SLIDE_H / 1024)) * 10) / 10
        };
      }
      module.exports = { SLIDE_W, SLIDE_H, C, FONT_B, FONT_M, INK_RATIO, MIN_PT, scaler };
    }
  });

  // fontmetrics.js
  var require_fontmetrics = __commonJS({
    "fontmetrics.js"(exports, module) {
      "use strict";
      var _fs;
      function nodeFs() {
        if (_fs === void 0) {
          try {
            _fs = __require("fs");
          } catch (e) {
            _fs = null;
          }
        }
        return _fs;
      }
      function findFont(file) {
        const fs = nodeFs();
        if (!fs) return null;
        const here = typeof __dirname === "string" ? __dirname : ".";
        const dirs = [
          "/usr/share/fonts/truetype/kopub",
          `${here}/node_modules/font-kopub/fonts`,
          "/tmp/fontpkg/node_modules/font-kopub/fonts"
        ];
        for (const d of dirs) {
          const p = `${d}/${file}`;
          if (fs.existsSync(p)) return p;
        }
        return null;
      }
      function parseTTF(path) {
        const b = nodeFs().readFileSync(path);
        const numTables = b.readUInt16BE(4);
        const tables = {};
        for (let i = 0; i < numTables; i++) {
          const o = 12 + i * 16;
          tables[b.toString("latin1", o, o + 4)] = {
            off: b.readUInt32BE(o + 8),
            len: b.readUInt32BE(o + 12)
          };
        }
        const head = tables.head.off;
        const unitsPerEm = b.readUInt16BE(head + 18);
        const indexToLocFormat = b.readInt16BE(head + 50);
        const numHMetrics = b.readUInt16BE(tables.hhea.off + 34);
        const adv = [];
        for (let i = 0; i < numHMetrics; i++) {
          adv.push(b.readUInt16BE(tables.hmtx.off + i * 4));
        }
        const cmapOff = tables.cmap.off;
        const nSub = b.readUInt16BE(cmapOff + 2);
        let best = null;
        for (let i = 0; i < nSub; i++) {
          const r = cmapOff + 4 + i * 8;
          const pid = b.readUInt16BE(r);
          const eid = b.readUInt16BE(r + 2);
          const off = cmapOff + b.readUInt32BE(r + 4);
          const fmt = b.readUInt16BE(off);
          const score = pid === 3 && eid === 10 && fmt === 12 ? 3 : pid === 3 && eid === 1 && fmt === 4 ? 2 : fmt === 4 || fmt === 12 ? 1 : 0;
          if (score && (!best || score > best.score)) best = { off, fmt, score };
        }
        const map = /* @__PURE__ */ new Map();
        if (best && best.fmt === 4) {
          const o = best.off;
          const segX2 = b.readUInt16BE(o + 6);
          const seg = segX2 / 2;
          const endO = o + 14;
          const startO = endO + segX2 + 2;
          const deltaO = startO + segX2;
          const rangeO = deltaO + segX2;
          for (let i = 0; i < seg; i++) {
            const end = b.readUInt16BE(endO + i * 2);
            const start = b.readUInt16BE(startO + i * 2);
            const delta = b.readInt16BE(deltaO + i * 2);
            const ro = b.readUInt16BE(rangeO + i * 2);
            if (start === 65535) continue;
            for (let c = start; c <= end && c !== 65536; c++) {
              let g;
              if (ro === 0) {
                g = c + delta & 65535;
              } else {
                const gi = rangeO + i * 2 + ro + (c - start) * 2;
                if (gi + 1 >= b.length) continue;
                g = b.readUInt16BE(gi);
                if (g) g = g + delta & 65535;
              }
              if (g) map.set(c, g);
            }
          }
        } else if (best && best.fmt === 12) {
          const o = best.off;
          const nGroups = b.readUInt32BE(o + 12);
          for (let i = 0; i < nGroups; i++) {
            const g = o + 16 + i * 12;
            const s = b.readUInt32BE(g);
            const e = b.readUInt32BE(g + 4);
            const gi = b.readUInt32BE(g + 8);
            for (let c = s; c <= e; c++) map.set(c, gi + (c - s));
          }
        }
        void indexToLocFormat;
        return { unitsPerEm, adv, map, lastAdv: adv[adv.length - 1] };
      }
      var FONTS = {};
      function load(bold) {
        const key = bold ? "B" : "M";
        if (key in FONTS) return FONTS[key];
        const p = findFont(bold ? "KoPubDotum-Bold.ttf" : "KoPubDotum-Medium.ttf");
        FONTS[key] = p ? parseTTF(p) : null;
        return FONTS[key];
      }
      var TABLE = null;
      var RANGE_FLAT = null;
      var STRICT = false;
      var ADV_CACHE = /* @__PURE__ */ new Map();
      function setStrict(v) {
        STRICT = !!v;
      }
      function useTable(t) {
        TABLE = t;
        RANGE_FLAT = t ? t.ranges.reduce((a, [s, e]) => (a.push(s, e), a), []) : null;
        ADV_CACHE.clear();
      }
      function inFont(cp) {
        const r = RANGE_FLAT;
        let lo = 0, hi = r.length / 2 - 1;
        while (lo <= hi) {
          const mid = lo + hi >> 1;
          if (cp < r[mid * 2]) hi = mid - 1;
          else if (cp > r[mid * 2 + 1]) lo = mid + 1;
          else return true;
        }
        return false;
      }
      function tableAdvance(cp, bold) {
        const key = bold ? -cp : cp;
        const hit = ADV_CACHE.get(key);
        if (hit !== void 0) return hit;
        const t = TABLE;
        let a;
        if (bold && t.boldAdv[cp] !== void 0) a = t.boldAdv[cp];
        else if (cp >= t.hangul[0] && cp <= t.hangul[1]) a = t.hangulAdv;
        else if (t.adv[cp] !== void 0) a = t.adv[cp];
        else if (inFont(cp)) a = t.defaultAdv;
        else a = bold ? t.lastAdv.bold : t.lastAdv.medium;
        ADV_CACHE.set(key, a);
        return a;
      }
      var isCJK = (ch) => /[ᄀ-ᇿ　-〿㄰-㆏가-힯一-鿿＀-￯]/.test(ch);
      var isWestern = (ch) => !isCJK(ch) && !/\s/.test(ch);
      function boundaryEm(str) {
        let n = 0;
        const cs = [...str];
        for (let i = 1; i < cs.length; i++) {
          const a = cs[i - 1], b = cs[i];
          if (isCJK(a) && isWestern(b) || isWestern(a) && isCJK(b)) n++;
        }
        return n * 0.25;
      }
      function widthIn(str, fontSize, bold) {
        const em = fontSize / 72;
        if (TABLE) {
          let u = 0;
          for (const ch of str) u += tableAdvance(ch.codePointAt(0), bold);
          return (u / TABLE.unitsPerEm + boundaryEm(str)) * em;
        }
        const f = load(bold);
        if (!f) {
          if (STRICT) {
            throw new Error("fontmetrics: \uD3F0\uD2B8 \uD3ED \uD45C\uAC00 \uC5C6\uB2E4 \u2014 \uADFC\uC0AC\uB85C \uB118\uC5B4\uAC00\uBA74 \uC0B0\uCD9C\uBB3C\uC774 CLI \uC640 \uB2EC\uB77C\uC9C4\uB2E4");
          }
          let u = 0;
          for (const ch of str) u += isCJK(ch) ? 0.95 : 0.5;
          return (u + boundaryEm(str)) * em;
        }
        let units = 0;
        for (const ch of str) {
          const g = f.map.get(ch.codePointAt(0));
          const a = g === void 0 ? f.lastAdv : f.adv[g] !== void 0 ? f.adv[g] : f.lastAdv;
          units += a;
        }
        return (units / f.unitsPerEm + boundaryEm(str)) * em;
      }
      function fitFont(str, fontSize, boxWidthIn, bold, minPt) {
        const lines = String(str).split("\n");
        let fs2 = fontSize;
        const min = minPt || 10;
        for (let i = 0; i < 60; i++) {
          const widest = Math.max(...lines.map((l) => widthIn(l, fs2, bold)));
          if (widest <= boxWidthIn || fs2 <= min) break;
          fs2 = Math.round((fs2 - 0.2) * 10) / 10;
        }
        return Math.max(fs2, min);
      }
      function lineCount(str, fontSize, boxWidthIn, bold) {
        let n = 0;
        for (const para of String(str).split("\n")) {
          const words = para.split(" ");
          let cur = "";
          let lines = 1;
          for (const w of words) {
            const test = cur ? `${cur} ${w}` : w;
            if (widthIn(test, fontSize, bold) > boxWidthIn && cur) {
              lines++;
              cur = w;
            } else {
              cur = test;
            }
          }
          n += lines;
        }
        return n;
      }
      module.exports = { widthIn, fitFont, lineCount, load, useTable, setStrict };
    }
  });

  // helpers.js
  var require_helpers = __commonJS({
    "helpers.js"(exports, module) {
      "use strict";
      var { C, FONT_B, FONT_M, MIN_PT } = require_theme();
      var FM = require_fontmetrics();
      function fit(str, fs, boxWIn, bold, padIn) {
        const avail = (boxWIn - (padIn === void 0 ? 0.08 : padIn)) * 0.972;
        return FM.fitFont(str, fs, Math.max(avail, 0.2), bold, MIN_PT);
      }
      function fitBox(str, fs, boxWIn, boxHIn, bold, lsm, extraIn) {
        let cur = fit(str, fs, boxWIn, bold, 0.02);
        const lh = (lsm || 1.28) * 1.18 / 72;
        const avail = boxHIn - (extraIn || 0);
        for (let i = 0; i < 40; i++) {
          const n = FM.lineCount(str, cur, boxWIn - 0.02, bold);
          if (n * cur * lh <= avail || cur <= MIN_PT) break;
          cur = Math.round((cur - 0.2) * 10) / 10;
        }
        return Math.max(cur, MIN_PT);
      }
      function txtOpts(o) {
        return {
          fontFace: o.bold ? FONT_B : FONT_M,
          fontSize: o.fs,
          color: o.color || C.TXT,
          bold: !!o.bold,
          align: o.align || "left",
          valign: o.valign || "middle",
          lineSpacingMultiple: o.lsm || 0.95,
          margin: 0,
          wrap: o.wrap !== false,
          charSpacing: o.cs,
          breakLine: void 0
        };
      }
      function pill(sl, s, p, o) {
        const { x, y, w, h } = p;
        const fill = { color: o.fill };
        const rad = Math.min(h / 2, o.rad === void 0 ? 24 : o.rad);
        const dia = rad * 2;
        sl.addShape(o.pres.shapes.OVAL, { x: s.X(x), y: s.Y(y), w: s.W(dia), h: s.H(dia), fill, line: { type: "none" } });
        sl.addShape(o.pres.shapes.OVAL, { x: s.X(x + w - dia), y: s.Y(y), w: s.W(dia), h: s.H(dia), fill, line: { type: "none" } });
        sl.addShape(o.pres.shapes.OVAL, { x: s.X(x), y: s.Y(y + h - dia), w: s.W(dia), h: s.H(dia), fill, line: { type: "none" } });
        sl.addShape(o.pres.shapes.OVAL, { x: s.X(x + w - dia), y: s.Y(y + h - dia), w: s.W(dia), h: s.H(dia), fill, line: { type: "none" } });
        sl.addShape(o.pres.shapes.RECTANGLE, { x: s.X(x + rad), y: s.Y(y), w: s.W(w - dia), h: s.H(h), fill, line: { type: "none" } });
        sl.addShape(o.pres.shapes.RECTANGLE, { x: s.X(x), y: s.Y(y + rad), w: s.W(w), h: s.H(h - dia), fill, line: { type: "none" } });
        if (o.text) {
          const bold = o.bold !== false;
          sl.addText(o.text, {
            x: s.X(x),
            y: s.Y(y),
            w: s.W(w),
            h: s.H(h),
            ...txtOpts({
              fs: fit(o.text, o.fs, s.W(w), bold, o.pad),
              color: o.color || C.WHITE,
              bold,
              align: o.align || "center",
              lsm: o.lsm
            })
          });
        }
      }
      function roundRect(sl, s, p, o) {
        const rad = Math.min(o.rad === void 0 ? 14 : o.rad, p.w / 2, p.h / 2);
        const dia = rad * 2;
        const fill = { color: o.fill || C.WHITE };
        const line = o.line ? { color: o.line, width: 0.75 } : { type: "none" };
        for (const [cx, cy] of [
          [p.x, p.y],
          [p.x + p.w - dia, p.y],
          [p.x, p.y + p.h - dia],
          [p.x + p.w - dia, p.y + p.h - dia]
        ]) {
          sl.addShape(o.pres.shapes.OVAL, {
            x: s.X(cx),
            y: s.Y(cy),
            w: s.W(dia),
            h: s.H(dia),
            fill,
            line
          });
        }
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x + rad),
          y: s.Y(p.y),
          w: s.W(p.w - dia),
          h: s.H(p.h),
          fill,
          line
        });
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y + rad),
          w: s.W(p.w),
          h: s.H(p.h - dia),
          fill,
          line
        });
        if (o.line) {
          sl.addShape(o.pres.shapes.RECTANGLE, {
            x: s.X(p.x + rad),
            y: s.Y(p.y + 1),
            w: s.W(p.w - dia),
            h: s.H(p.h - 2),
            fill,
            line: { type: "none" }
          });
          sl.addShape(o.pres.shapes.RECTANGLE, {
            x: s.X(p.x + 1),
            y: s.Y(p.y + rad),
            w: s.W(p.w - 2),
            h: s.H(p.h - dia),
            fill,
            line: { type: "none" }
          });
        }
      }
      function panel(sl, s, p, o) {
        o = o || {};
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          fill: { color: o.fill || C.PANEL },
          line: o.line ? { color: o.line, width: 0.75 } : { type: "none" }
        });
      }
      function card(sl, s, p, o) {
        o = o || {};
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          fill: { color: o.fill || C.CARD },
          line: o.line ? { color: o.line, width: 0.75 } : { type: "none" }
        });
      }
      function text(sl, s, p, o) {
        const fs = o.fit ? fit(o.text, o.fs, s.W(p.w), o.bold, o.pad) : o.fs;
        sl.addText(o.text, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          ...txtOpts({ ...o, fs })
        });
      }
      function numBadge(sl, s, p, o) {
        const shapes = {
          circle: o.pres.shapes.OVAL,
          square: o.pres.shapes.RECTANGLE,
          diamond: o.pres.shapes.DIAMOND,
          hexagon: o.pres.shapes.HEXAGON
        };
        sl.addShape(shapes[o.kind || "circle"], {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          fill: { color: o.fill || C.NAVY },
          line: { type: "none" }
        });
        sl.addText(String(o.n), {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          ...txtOpts({ fs: o.fs, color: o.color || C.WHITE, bold: true, align: "center" })
        });
      }
      function goldBadge(sl, s, p, o) {
        pill(sl, s, p, { pres: o.pres, fill: o.fill || C.GOLD, text: o.text, fs: o.fs, color: C.WHITE, bold: true });
      }
      function arrowBadge(sl, s, p, o) {
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          fill: { color: C.GOLD },
          line: { type: "none" }
        });
        sl.addShape(o.pres.shapes.ISOSCELES_TRIANGLE, {
          x: s.X(p.x + p.w),
          y: s.Y(p.y),
          w: s.W(p.h * 0.55),
          h: s.H(p.h),
          fill: { color: C.GOLD },
          line: { type: "none" },
          rotate: 90
        });
        sl.addText(o.text, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          ...txtOpts({ fs: o.fs, color: C.WHITE, bold: true, align: "center" })
        });
      }
      function runHead(sl, s, o) {
        sl.addText(
          [
            { text: "2026 ", options: { color: C.BLUE_TXT, bold: true } },
            { text: o.text, options: { color: C.TXT_SUB, bold: false } }
          ],
          {
            x: s.X(30),
            y: s.Y(o.y || 14),
            w: s.W(700),
            h: s.H(28),
            ...txtOpts({ fs: o.fs, align: "left" })
          }
        );
      }
      function chapterBadge(sl, s, o) {
        sl.addText(o.runs, {
          x: s.X(o.x),
          y: s.Y(o.y),
          w: s.W(o.w),
          h: s.H(o.h),
          ...txtOpts({ fs: o.fs, align: "right", color: C.TXT_SUB })
        });
      }
      function titleBlock(sl, s, o) {
        sl.addText(o.title, {
          x: s.X(o.tx),
          y: s.Y(o.ty),
          w: s.W(o.tw || 1400),
          h: s.H(o.th),
          ...txtOpts({ fs: o.tfs, bold: true, color: C.TXT, valign: "middle" })
        });
        const marks = o.marks === void 0 ? 2 : o.marks;
        const mw = o.mw || 13, mh = o.mh || 30;
        for (let i = 0; i < marks; i++) {
          sl.addShape(o.pres.shapes.PARALLELOGRAM, {
            x: s.X(o.sx + i * (mw + 5)),
            y: s.Y(o.sy),
            w: s.W(mw),
            h: s.H(mh),
            fill: { color: i === marks - 1 ? C.NAVY : C.TXT_SUB },
            line: { type: "none" },
            rotate: 0,
            flipH: true
          });
        }
        sl.addText(o.sub, {
          x: s.X(o.bx),
          y: s.Y(o.by),
          w: s.W(o.bw || 1200),
          h: s.H(o.bh),
          ...txtOpts({ fs: o.bfs, bold: true, color: C.TXT, valign: "middle" })
        });
      }
      function quoteBand(sl, s, p, o) {
        const bw = 4, arm = Math.min(26, p.h * 0.28);
        if (o.style === "box") {
          const rad = 12;
          const edge = { color: "DDE1E8", width: 0.75 };
          const white = { color: C.WHITE };
          for (const [cx, cy] of [
            [p.x, p.y],
            [p.x + p.w - rad * 2, p.y],
            [p.x, p.y + p.h - rad * 2],
            [p.x + p.w - rad * 2, p.y + p.h - rad * 2]
          ]) {
            sl.addShape(o.pres.shapes.OVAL, {
              x: s.X(cx),
              y: s.Y(cy),
              w: s.W(rad * 2),
              h: s.H(rad * 2),
              fill: white,
              line: edge
            });
          }
          sl.addShape(o.pres.shapes.RECTANGLE, {
            x: s.X(p.x + rad),
            y: s.Y(p.y),
            w: s.W(p.w - rad * 2),
            h: s.H(p.h),
            fill: white,
            line: edge
          });
          sl.addShape(o.pres.shapes.RECTANGLE, {
            x: s.X(p.x),
            y: s.Y(p.y + rad),
            w: s.W(p.w),
            h: s.H(p.h - rad * 2),
            fill: white,
            line: edge
          });
          sl.addShape(o.pres.shapes.RECTANGLE, {
            x: s.X(p.x + rad),
            y: s.Y(p.y + 1),
            w: s.W(p.w - rad * 2),
            h: s.H(p.h - 2),
            fill: white,
            line: { type: "none" }
          });
          sl.addShape(o.pres.shapes.RECTANGLE, {
            x: s.X(p.x + 1),
            y: s.Y(p.y + rad),
            w: s.W(p.w - 2),
            h: s.H(p.h - rad * 2),
            fill: white,
            line: { type: "none" }
          });
        } else {
          const brk = (x, dir) => {
            sl.addShape(o.pres.shapes.RECTANGLE, {
              x: s.X(x),
              y: s.Y(p.y),
              w: s.W(bw),
              h: s.H(p.h),
              fill: { color: C.LINE },
              line: { type: "none" }
            });
            for (const yy of [p.y, p.y + p.h - bw]) {
              sl.addShape(o.pres.shapes.RECTANGLE, {
                x: s.X(dir > 0 ? x : x - arm + bw),
                y: s.Y(yy),
                w: s.W(arm),
                h: s.H(bw),
                fill: { color: C.LINE },
                line: { type: "none" }
              });
            }
          };
          brk(p.x, 1);
          brk(p.x + p.w - bw, -1);
        }
        const qfs = o.fs * 1.5;
        const qy = o.style === "box" ? p.y + 4 : p.y + 2;
        sl.addText("\u201C", {
          x: s.X(p.x + (o.style === "box" ? 16 : 30)),
          y: s.Y(qy),
          w: s.W(60),
          h: s.H(p.h * 0.6),
          ...txtOpts({ fs: qfs, bold: true, color: "B9BEC6", align: "center", valign: "top" })
        });
        sl.addText("\u201D", {
          x: s.X(p.x + p.w - (o.style === "box" ? 76 : 90)),
          y: s.Y(qy),
          w: s.W(60),
          h: s.H(p.h * 0.6),
          ...txtOpts({ fs: qfs, bold: true, color: "B9BEC6", align: "center", valign: "top" })
        });
        const padX = o.padX === void 0 ? 88 : o.padX;
        const innerW = s.W(p.w - padX * 2);
        const lines = [];
        let cur = "";
        o.runs.forEach((r) => {
          cur += r.text;
          if (r.br) {
            lines.push(cur);
            cur = "";
          }
        });
        if (cur) lines.push(cur);
        const fs = fit(lines.join("\n"), o.fs, innerW, true, 0.05);
        sl.addText(
          o.runs.map((r) => ({
            text: r.text,
            options: { color: r.hi ? C.BLUE_TXT : C.TXT, bold: true, breakLine: !!r.br }
          })),
          {
            x: s.X(p.x + padX),
            y: s.Y(p.y),
            w: innerW,
            h: s.H(p.h),
            ...txtOpts({ fs, bold: true, align: "center", lsm: o.lsm || 1.15 })
          }
        );
      }
      function formulaBox(sl, s, p, o) {
        const rad = Math.min(o.rad === void 0 ? 10 : o.rad, p.h / 2);
        const edge = { color: o.edge || "D6DAE1", width: 0.75 };
        const white = { color: C.WHITE };
        for (const [cx, cy] of [
          [p.x, p.y],
          [p.x + p.w - rad * 2, p.y],
          [p.x, p.y + p.h - rad * 2],
          [p.x + p.w - rad * 2, p.y + p.h - rad * 2]
        ]) {
          sl.addShape(o.pres.shapes.OVAL, {
            x: s.X(cx),
            y: s.Y(cy),
            w: s.W(rad * 2),
            h: s.H(rad * 2),
            fill: white,
            line: edge
          });
        }
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x + rad),
          y: s.Y(p.y),
          w: s.W(p.w - rad * 2),
          h: s.H(p.h),
          fill: white,
          line: edge
        });
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y + rad),
          w: s.W(p.w),
          h: s.H(p.h - rad * 2),
          fill: white,
          line: edge
        });
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x + rad),
          y: s.Y(p.y + 1),
          w: s.W(p.w - rad * 2),
          h: s.H(p.h - 2),
          fill: white,
          line: { type: "none" }
        });
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x + 1),
          y: s.Y(p.y + rad),
          w: s.W(p.w - 2),
          h: s.H(p.h - rad * 2),
          fill: white,
          line: { type: "none" }
        });
        sl.addText(o.text, {
          x: s.X(p.x + 2),
          y: s.Y(p.y),
          w: s.W(p.w - 4),
          h: s.H(p.h),
          ...txtOpts({
            fs: fit(o.text, o.fs, s.W(p.w - 4), true, 0.01),
            bold: true,
            color: o.color || C.TXT,
            align: "center"
          })
        });
      }
      var ASSET_BASE = typeof __dirname === "string" ? `${__dirname}/assets` : "assets";
      function setAssetBase(base) {
        ASSET_BASE = base;
      }
      function image(sl, s, p, o) {
        sl.addImage({
          // altText 를 주지 않으면 pptxgenjs 가 소스 경로를 그대로 descr 에 박는다.
          // 그러면 납품 파일에 빌드한 사람의 절대 경로가 남고, CLI 와 웹 산출물도 갈린다.
          altText: o.name,
          path: `${ASSET_BASE}/${o.name}.png`,
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h)
        });
      }
      function accentCard(sl, s, p, o) {
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          fill: { color: C.WHITE },
          line: { color: "E4E7EC", width: 0.75 }
        });
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(9),
          h: s.H(p.h),
          fill: { color: o.tone },
          line: { type: "none" }
        });
        const hh = o.hh === void 0 ? 30 : o.hh;
        const bt = o.bt === void 0 ? 40 : o.bt;
        sl.addText(o.head, {
          x: s.X(p.x + 24),
          y: s.Y(p.y + 6),
          w: s.W(220),
          h: s.H(hh),
          ...txtOpts({ fs: o.hfs, bold: true, color: o.tone, align: "left" })
        });
        bullets(sl, s, { x: p.x + 24, y: p.y + bt, w: p.w - 40, h: p.h - bt - 8 }, {
          items: o.items,
          fs: o.fs,
          gap: o.gap === void 0 ? 2 : o.gap,
          lsm: o.lsm || 1.1
        });
      }
      function bandBar(sl, s, p, o) {
        const rad = Math.min(p.h / 2, o.rad === void 0 ? 20 : o.rad);
        const dia = rad * 2;
        const fill = { color: o.fill };
        for (const [cx, cy] of [
          [p.x, p.y],
          [p.x + p.w - dia, p.y],
          [p.x, p.y + p.h - dia],
          [p.x + p.w - dia, p.y + p.h - dia]
        ]) {
          sl.addShape(o.pres.shapes.OVAL, {
            x: s.X(cx),
            y: s.Y(cy),
            w: s.W(dia),
            h: s.H(dia),
            fill,
            line: { type: "none" }
          });
        }
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x + rad),
          y: s.Y(p.y),
          w: s.W(p.w - dia),
          h: s.H(p.h),
          fill,
          line: { type: "none" }
        });
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y + rad),
          w: s.W(p.w),
          h: s.H(p.h - dia),
          fill,
          line: { type: "none" }
        });
        const plain = o.runs.map((r) => r.text).join("");
        sl.addText(
          o.runs.map((r) => ({
            text: r.text,
            options: { color: r.hl ? o.hl || "FFE500" : C.WHITE, bold: true }
          })),
          {
            x: s.X(p.x + 30),
            y: s.Y(p.y),
            w: s.W(p.w - 60),
            h: s.H(p.h),
            ...txtOpts({ fs: fit(plain, o.fs, s.W(p.w - 60), true, 0.06), bold: true, align: "center" })
          }
        );
      }
      function footnote(sl, s, o) {
        sl.addText(o.text, {
          x: s.X(o.x || 34),
          y: s.Y(o.y),
          w: s.W(o.w || 1450),
          h: s.H(o.h || 30),
          ...txtOpts({ fs: o.fs, color: o.color || C.TXT_SUB, align: "left" })
        });
      }
      function vline(sl, s, p, o) {
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(o.thick || 1.5),
          h: s.H(p.h),
          fill: { color: o.color || C.LINE },
          line: { type: "none" }
        });
      }
      function hline(sl, s, p, o) {
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(o.thick || 1.5),
          fill: { color: o.color || C.LINE },
          line: { type: "none" }
        });
      }
      function timeline(sl, s, o) {
        const { y, d } = o;
        const first = o.nodes[0].x;
        const last = o.nodes[o.nodes.length - 1].x + d;
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(first + d / 2),
          y: s.Y(y + d / 2 - 1),
          w: s.W(last - first - d),
          h: s.H(2),
          fill: { color: o.lineColor || C.LINE },
          line: { type: "none" }
        });
        o.nodes.forEach((nd) => {
          sl.addShape(o.pres.shapes.OVAL, {
            x: s.X(nd.x),
            y: s.Y(y),
            w: s.W(d),
            h: s.H(d),
            fill: { color: nd.fill || C.NAVY },
            line: { type: "none" }
          });
          sl.addText(String(nd.n), {
            x: s.X(nd.x),
            y: s.Y(y),
            w: s.W(d),
            h: s.H(d),
            ...txtOpts({ fs: o.fs, color: C.WHITE, bold: true, align: "center" })
          });
        });
      }
      function chevron(sl, s, p, o) {
        sl.addShape(o.pres.shapes.ISOSCELES_TRIANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          fill: { color: o.fill || C.LINE },
          line: { type: "none" },
          rotate: 90
        });
      }
      function arrowDown(sl, s, p, o) {
        sl.addShape(o.pres.shapes.DOWN_ARROW, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          fill: { color: o.fill || C.TXT_SUB },
          line: { type: "none" }
        });
      }
      function bullets(sl, s, p, o) {
        const items = o.items.map((it) => String(typeof it === "string" ? it : it.text).replace(/\n/g, " "));
        const fs = fitBox(
          items.join("\n"),
          o.fs,
          s.W(p.w) - 0.22,
          s.H(p.h),
          o.bold,
          o.lsm || 1.05,
          (o.gap || 4) / 72 * (items.length - 1)
        );
        sl.addText(
          o.items.map((it, i) => ({
            text: items[i],
            options: {
              bullet: o.bullet === false ? false : { characterCode: "2022" },
              breakLine: true,
              color: typeof it === "object" && it.color || o.color || C.TXT,
              bold: typeof it === "object" && it.bold || o.bold || false,
              paraSpaceAfter: i === o.items.length - 1 ? 0 : o.gap || 4,
              indentLevel: typeof it === "object" && it.lvl || 0
            }
          })),
          {
            x: s.X(p.x),
            y: s.Y(p.y),
            w: s.W(p.w),
            h: s.H(p.h),
            ...txtOpts({ fs, align: "left", valign: o.valign || "top", lsm: o.lsm || 1.05 })
          }
        );
      }
      function richBullets(sl, s, p, o) {
        const groups = o.groups.map((runs) => runs.map((r) => ({ ...r, t: String(r.t).replace(/\n/g, " ") })));
        const plain = groups.map((runs) => runs.map((r) => r.t).join(""));
        const bulletIndent = 0.32;
        const gapIn = (o.gap || 6) / 72 * (groups.length - 1);
        const fs = fitBox(
          plain.join("\n"),
          o.fs,
          s.W(p.w) - bulletIndent,
          s.H(p.h),
          false,
          o.lsm || 1.28,
          gapIn
        );
        const out = [];
        groups.forEach((runs, gi) => {
          runs.forEach((r, ri) => {
            out.push({
              text: r.t,
              options: {
                // 문단 속성이 어느 run에서 읽힐지 렌더러마다 달라 모든 run에 같은 값을 준다.
                bullet: { characterCode: "2022" },
                subscript: !!r.sub,
                superscript: !!r.sup,
                italic: !!r.i,
                breakLine: ri === runs.length - 1,
                paraSpaceAfter: gi === groups.length - 1 ? 0 : o.gap || 6
              }
            });
          });
        });
        sl.addText(out, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          ...txtOpts({ fs, align: "left", valign: "top", lsm: o.lsm || 1.28 })
        });
      }
      function bigNum(sl, s, p, o) {
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: s.W(p.w),
          h: s.H(p.h),
          fill: { color: C.NAVY },
          line: { type: "none" }
        });
        sl.addText(o.label, {
          x: s.X(p.x),
          y: s.Y(p.y + 18),
          w: s.W(p.w),
          h: s.H(44),
          ...txtOpts({ fs: o.lfs, color: C.WHITE, bold: true, align: "center" })
        });
        sl.addShape(o.pres.shapes.RECTANGLE, {
          x: s.X(p.x + p.w * 0.16),
          y: s.Y(p.y + 68),
          w: s.W(p.w * 0.68),
          h: s.H(1.5),
          fill: { color: "FFFFFF" },
          line: { type: "none" }
        });
        sl.addText(
          [
            { text: o.value, options: { fontSize: o.vfs } },
            { text: o.unit, options: { fontSize: o.ufs } }
          ],
          {
            x: s.X(p.x),
            y: s.Y(p.y + 78),
            w: s.W(p.w),
            h: s.H(86),
            ...txtOpts({ fs: o.vfs, color: C.WHITE, bold: true, align: "center" })
          }
        );
        sl.addText("\u2014", {
          x: s.X(p.x),
          y: s.Y(p.y + 168),
          w: s.W(p.w),
          h: s.H(24),
          ...txtOpts({ fs: o.lfs, color: "FFFFFF", bold: true, align: "center" })
        });
        sl.addText(o.note, {
          x: s.X(p.x),
          y: s.Y(p.y + 194),
          w: s.W(p.w),
          h: s.H(40),
          ...txtOpts({ fs: o.nfs, color: C.WHITE, bold: true, align: "center" })
        });
      }
      function dline(sl, s, p, o) {
        const horiz = (o.dir || "h") === "h";
        sl.addShape(o.pres.shapes.LINE, {
          x: s.X(p.x),
          y: s.Y(p.y),
          w: horiz ? s.W(p.w) : 0,
          h: horiz ? 0 : s.H(p.h),
          line: {
            color: o.color || "CFD3DA",
            width: o.width || 0.75,
            dashType: o.dash || "sysDash"
          }
        });
      }
      module.exports = {
        pill,
        panel,
        card,
        text,
        numBadge,
        goldBadge,
        arrowBadge,
        runHead,
        chapterBadge,
        titleBlock,
        quoteBand,
        formulaBox,
        footnote,
        image,
        setAssetBase,
        accentCard,
        bandBar,
        roundRect,
        dline,
        vline,
        hline,
        timeline,
        chevron,
        arrowDown,
        bullets,
        richBullets,
        bigNum,
        txtOpts
      };
    }
  });

  // slides/s01.js
  var require_s01 = __commonJS({
    "slides/s01.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 30,
          ty: 10,
          tw: 1e3,
          th: 68,
          tfs: s.FS(46),
          sx: 34,
          sy: 92,
          mw: 12,
          mh: 30,
          marks: 2,
          sub: d.sub,
          bx: 68,
          by: 88,
          bw: 900,
          bh: 44,
          bfs: s.FS(29)
        });
        H.quoteBand(sl, s, { x: 130, y: 138, w: 1290, h: 62 }, {
          pres,
          runs: d.quote,
          fs: s.FS(29)
        });
        H.panel(sl, s, { x: 33, y: 226, w: 1470, h: 360 }, P);
        H.pill(sl, s, { x: 42, y: 215, w: 356, h: 45 }, {
          pres,
          fill: C.NAVY,
          text: d.sec1,
          fs: s.FS(26)
        });
        const rowY = [268, 333, 398, 470];
        const rowH = [58, 58, 68, 96];
        d.rows.forEach((r, i) => {
          const y = rowY[i], h = rowH[i];
          H.pill(sl, s, { x: 66, y, w: 326, h }, {
            pres,
            fill: r.gold ? C.GOLD : C.NAVY,
            text: r.label,
            fs: r.gold ? s.FS(19) : s.FS(24)
          });
          H.text(sl, s, { x: 406, y, w: 694, h }, {
            text: r.act,
            fs: s.FS(22),
            align: "center",
            lsm: 1.25,
            fit: true
          });
          H.vline(sl, s, { x: 1102, y: y + 8, h: h - 16 }, P);
          H.goldBadge(sl, s, { x: 1121, y: y + h / 2 - 15, w: 73, h: 30 }, {
            pres,
            text: d.badge,
            fs: s.FS(20)
          });
          H.text(sl, s, { x: 1210, y, w: 296, h }, {
            text: r.rep,
            fs: s.FS(22),
            align: "left",
            fit: true
          });
          if (i < d.rows.length - 1) {
            H.hline(sl, s, { x: 66, y: y + h + 3, w: 1420 }, P);
          }
        });
        H.panel(sl, s, { x: 33, y: 610, w: 1470, h: 167 }, P);
        H.pill(sl, s, { x: 42, y: 600, w: 357, h: 43 }, {
          pres,
          fill: C.NAVY,
          text: d.sec2,
          fs: s.FS(26)
        });
        const nodeX = [116, 275, 434, 588, 733, 881, 1024, 1153];
        H.timeline(sl, s, {
          pres,
          y: 660,
          d: 33,
          fs: s.FS(19),
          nodes: d.steps.map((st, i) => ({ n: st.n, x: nodeX[i], fill: st.gold ? C.GOLD : C.NAVY }))
        });
        d.steps.forEach((st, i) => {
          const cx = nodeX[i] + 16.5;
          H.text(sl, s, { x: cx - 85, y: 700, w: 170, h: 32 }, {
            text: st.pct,
            fs: s.FS(26),
            bold: true,
            color: st.gold ? C.TXT : C.BLUE_TXT,
            align: "center"
          });
          H.text(sl, s, { x: cx - 85, y: 736, w: 170, h: 28 }, {
            text: st.cnt,
            fs: s.FS(20),
            color: C.TXT_MID,
            align: "center"
          });
          if (i < d.steps.length - 1) {
            H.vline(sl, s, { x: (nodeX[i] + nodeX[i + 1]) / 2 + 16.5, y: 700, h: 60 }, { pres, color: C.LINE });
          }
        });
        H.pill(sl, s, { x: 1233, y: 720, w: 267, h: 37 }, {
          pres,
          fill: C.GOLD,
          text: d.stepNote,
          fs: s.FS(16),
          pad: 0.02
        });
        H.panel(sl, s, { x: 32, y: 803, w: 1471, h: 152 }, P);
        H.pill(sl, s, { x: 42, y: 792, w: 300, h: 43 }, {
          pres,
          fill: C.NAVY,
          text: d.sec3,
          fs: s.FS(26)
        });
        const colX = [46, 528, 1010];
        d.principles.forEach((p, i) => {
          H.numBadge(sl, s, { x: colX[i], y: 852, w: 32, h: 32 }, {
            pres,
            kind: "square",
            n: i + 1,
            fs: s.FS(19)
          });
          H.text(sl, s, { x: colX[i] + 44, y: 846, w: 442, h: 104 }, {
            text: p,
            fs: s.FS(20),
            align: "left",
            valign: "top",
            lsm: 1.32,
            fit: true
          });
          if (i < 2) {
            H.vline(sl, s, { x: colX[i] + 462, y: 845, h: 95 }, { pres, color: C.LINE });
          }
        });
        H.footnote(sl, s, { y: 968, fs: s.FS(20), text: d.foot });
      };
    }
  });

  // slides/s02.js
  var require_s02 = __commonJS({
    "slides/s02.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 32,
          ty: 8,
          tw: 1e3,
          th: 74,
          tfs: s.FS(54),
          sx: 38,
          sy: 114,
          mw: 13,
          mh: 33,
          marks: 2,
          sub: d.sub,
          bx: 76,
          by: 110,
          bw: 900,
          bh: 46,
          bfs: s.FS(33)
        });
        H.quoteBand(sl, s, { x: 88, y: 162, w: 1360, h: 104 }, {
          pres,
          runs: d.quote,
          fs: s.FS(29),
          lsm: 1.4
        });
        H.panel(sl, s, { x: 37, y: 343, w: 593, h: 496 }, P);
        H.pill(sl, s, { x: 37, y: 288, w: 593, h: 53 }, {
          pres,
          fill: C.NAVY,
          text: d.leftHead,
          fs: s.FS(30)
        });
        const cardY = [378, 500, 623];
        d.designCards.forEach((t, i) => {
          H.card(sl, s, { x: 55, y: cardY[i], w: 557, h: 96 }, { pres, line: C.LINE });
          H.numBadge(sl, s, { x: 75, y: cardY[i] + 25, w: 45, h: 45 }, {
            pres,
            kind: "circle",
            n: i + 1,
            fs: s.FS(24)
          });
          H.text(sl, s, { x: 131, y: cardY[i], w: 476, h: 96 }, {
            text: t,
            fs: s.FS(22),
            align: "left",
            lsm: 1.3,
            fit: true,
            pad: 0.02
          });
        });
        H.pill(sl, s, { x: 54, y: 765, w: 555, h: 50 }, {
          pres,
          fill: C.GOLD,
          text: d.reserveBar,
          fs: s.FS(28)
        });
        H.panel(sl, s, { x: 653, y: 342, w: 846, h: 497 }, P);
        H.pill(sl, s, { x: 653, y: 289, w: 846, h: 52 }, {
          pres,
          fill: C.NAVY,
          text: d.rightHead,
          fs: s.FS(30)
        });
        const orgY = [368, 449, 612, 684, 759];
        const orgH = [51, 132, 50, 52, 52];
        d.orgRows.forEach((r, i) => {
          const y = orgY[i], h = orgH[i];
          H.card(sl, s, { x: 672, y: y - 6, w: 812, h: h + 12 }, { pres, line: C.LINE });
          H.pill(sl, s, { x: 708, y, w: 251, h }, {
            pres,
            fill: C.NAVY,
            text: r.roleFull || r.role,
            fs: s.FS(24)
          });
          H.text(sl, s, { x: 980, y: r.note ? y + 1 : y, w: 504, h: r.note ? 84 : h }, {
            text: r.desc,
            fs: s.FS(22),
            align: "left",
            lsm: r.note ? 1.06 : 1.24,
            fit: true,
            pad: 0.02,
            valign: r.note ? "top" : "middle"
          });
          if (r.note) {
            H.text(sl, s, { x: 980, y: y + 87, w: 504, h: 44 }, {
              text: r.note,
              fs: s.FS(16),
              color: C.TXT_SUB,
              align: "left",
              valign: "top",
              lsm: 1.02
            });
          }
        });
        H.vline(sl, s, { x: 681, y: 392, h: 394 }, { pres, color: C.NAVY, thick: 2 });
        d.orgRows.forEach((r, i) => {
          sl.addShape(pres.shapes.OVAL, {
            x: s.X(675),
            y: s.Y(orgY[i] + orgH[i] / 2 - 6),
            w: s.W(13),
            h: s.H(13),
            fill: { color: C.NAVY },
            line: { type: "none" }
          });
        });
        H.panel(sl, s, { x: 38, y: 874, w: 1460, h: 99 }, P);
        H.pill(sl, s, { x: 54, y: 893, w: 167, h: 61 }, {
          pres,
          fill: C.NAVY,
          text: d.bottomLabel,
          fs: s.FS(26)
        });
        H.text(sl, s, { x: 250, y: 893, w: 1230, h: 61 }, {
          text: d.bottomText,
          fs: s.FS(26),
          align: "left",
          fit: true
        });
      };
    }
  });

  // slides/s03.js
  var require_s03 = __commonJS({
    "slides/s03.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 26,
          ty: 8,
          tw: 1e3,
          th: 70,
          tfs: s.FS(48),
          sx: 26,
          sy: 104,
          mw: 12,
          mh: 31,
          marks: 1,
          sub: d.sub,
          bx: 54,
          by: 100,
          bw: 900,
          bh: 44,
          bfs: s.FS(29)
        });
        H.quoteBand(sl, s, { x: 46, y: 152, w: 1446, h: 84 }, {
          pres,
          runs: d.quote,
          fs: s.FS(29)
        });
        const colX = [45, 374, 737, 1108];
        const colW = [293, 323, 333, 386];
        const badgeX = [167, 505, 878, 1281];
        H.hline(sl, s, { x: 45, y: 276, w: 1449 }, { pres, color: C.LINE, thick: 2 });
        d.stages.forEach((st, i) => {
          sl.addShape(pres.shapes.RECTANGLE, {
            x: s.X(badgeX[i]),
            y: s.Y(258),
            w: s.W(41),
            h: s.H(39),
            fill: { color: C.NAVY_DEEP },
            line: { type: "none" }
          });
          H.text(sl, s, { x: badgeX[i], y: 258, w: 41, h: 39 }, {
            text: String(st.n),
            fs: s.FS(24),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          H.text(sl, s, { x: colX[i], y: 306, w: colW[i], h: 42 }, {
            text: st.name,
            fs: s.FS(29),
            bold: true,
            color: C.NAVY_DEEP,
            align: "center",
            fit: true
          });
          H.card(sl, s, { x: colX[i], y: 357, w: colW[i], h: 278 }, { pres, line: C.LINE });
          H.richBullets(sl, s, { x: colX[i] + 14, y: 363, w: colW[i] - 26, h: 268 }, {
            groups: st.bullets,
            fs: s.FS(21),
            gap: 3,
            lsm: 1.08
          });
          H.arrowDown(sl, s, { x: colX[i] + colW[i] / 2 - 8, y: 638, w: 16, h: 16 }, P);
          H.panel(sl, s, { x: colX[i], y: 656, w: colW[i], h: 83 }, { pres, fill: C.CREAM });
          H.text(sl, s, { x: colX[i] + 8, y: 656, w: colW[i] - 16, h: 83 }, {
            text: st.out,
            fs: s.FS(21),
            bold: true,
            align: "center",
            lsm: 1.25,
            fit: true
          });
        });
        H.panel(sl, s, { x: 46, y: 778, w: 1445, h: 171 }, P);
        H.pill(sl, s, { x: 617, y: 759, w: 288, h: 38 }, {
          pres,
          fill: C.NAVY,
          text: d.sec,
          fs: s.FS(24)
        });
        const pX = [66, 552, 1052];
        const pW = [440, 460, 400];
        d.principles.forEach((p, i) => {
          H.numBadge(sl, s, { x: pX[i], y: 815, w: 32, h: 32 }, {
            pres,
            kind: "circle",
            n: i + 1,
            fs: s.FS(19)
          });
          sl.addText(
            p.runs.map((r) => ({
              text: r.t,
              options: { bold: !!r.b, color: r.c === "BLUE" ? C.BLUE_TXT : C.TXT }
            })),
            {
              x: s.X(pX[i] + 44),
              y: s.Y(810),
              w: s.W(pW[i]),
              h: s.H(126),
              ...H.txtOpts({ fs: s.FS(20), align: "left", valign: "top", lsm: 1.3 })
            }
          );
          if (i < 2) H.vline(sl, s, { x: pX[i] + pW[i] + 56, y: 805, h: 118 }, { pres, color: C.LINE });
        });
        H.footnote(sl, s, { y: 962, fs: s.FS(20), text: d.foot });
      };
    }
  });

  // slides/s04.js
  var require_s04 = __commonJS({
    "slides/s04.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.runHead(sl, s, { text: d.runHead, y: 16, fs: s.FS(18) });
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 28,
          ty: 50,
          tw: 1100,
          th: 72,
          tfs: s.FS(49),
          sx: 36,
          sy: 137,
          mw: 12,
          mh: 31,
          marks: 2,
          sub: d.sub,
          bx: 74,
          by: 133,
          bw: 900,
          bh: 44,
          bfs: s.FS(29)
        });
        H.quoteBand(sl, s, { x: 56, y: 178, w: 1426, h: 82 }, {
          pres,
          runs: d.quote,
          fs: s.FS(29)
        });
        const hx = [106, 573, 1034];
        const hw = [404, 404, 447];
        d.heads.forEach((t, i) => {
          H.pill(sl, s, { x: hx[i], y: 276, w: hw[i], h: 47 }, {
            pres,
            fill: C.NAVY,
            text: t,
            fs: s.FS(28)
          });
          if (i < 2) {
            H.chevron(sl, s, { x: hx[i] + hw[i] + 12, y: 285, w: 26, h: 30 }, { pres, fill: "C9CDD5" });
          }
        });
        const rowY = [335, 390, 445, 502];
        d.rows.forEach((r, i) => {
          H.panel(sl, s, { x: 55, y: rowY[i], w: 1426, h: 49 }, { pres, fill: C.ROW_ALT });
          H.numBadge(sl, s, { x: 82, y: rowY[i] + 8, w: 33, h: 33 }, {
            pres,
            kind: "circle",
            n: r.n,
            fs: s.FS(19)
          });
          [[r.a, hx[0], hw[0]], [r.b, hx[1], hw[1]], [r.c, hx[2], hw[2]]].forEach(([t, x, w]) => {
            H.text(sl, s, { x, y: rowY[i], w, h: 49 }, {
              text: t,
              fs: s.FS(24),
              align: "center",
              fit: true
            });
          });
        });
        H.panel(sl, s, { x: 42, y: 609, w: 653, h: 303 }, P);
        H.pill(sl, s, { x: 41, y: 563, w: 654, h: 45 }, {
          pres,
          fill: C.NAVY,
          text: d.leftHead,
          fs: s.FS(28)
        });
        const lY = [626, 748];
        const lH = [101, 82];
        d.leftRows.forEach((r, i) => {
          sl.addShape(pres.shapes.RECTANGLE, {
            x: s.X(70),
            y: s.Y(lY[i]),
            w: s.W(180),
            h: s.H(lH[i]),
            fill: { color: r.dark ? C.GRAY_DARK : C.GOLD },
            line: { type: "none" }
          });
          H.text(sl, s, { x: 70, y: lY[i], w: 180, h: lH[i] }, {
            text: r.label,
            fs: s.FS(24),
            bold: true,
            color: C.WHITE,
            align: "center",
            fit: true
          });
          H.card(sl, s, { x: 258, y: lY[i], w: 412, h: lH[i] }, { pres, fill: r.dark ? C.CARD : "FBFAF6" });
          H.bullets(sl, s, { x: 272, y: lY[i] + 6, w: 392, h: lH[i] - 12 }, {
            items: r.items,
            fs: s.FS(21),
            gap: 3,
            lsm: 1.25
          });
        });
        H.pill(sl, s, { x: 65, y: 848, w: 610, h: 50 }, {
          pres,
          fill: C.GOLD,
          text: d.leftBar,
          fs: s.FS(28)
        });
        H.panel(sl, s, { x: 723, y: 609, w: 772, h: 303 }, P);
        H.pill(sl, s, { x: 723, y: 563, w: 772, h: 45 }, {
          pres,
          fill: C.NAVY,
          text: d.rightHead,
          fs: s.FS(28)
        });
        const rY = [625, 692, 752];
        const rH = [58, 52, 76];
        d.rightRows.forEach((t, i) => {
          H.card(sl, s, { x: 746, y: rY[i], w: 727, h: rH[i] }, { pres, line: C.LINE });
          H.numBadge(sl, s, { x: 768, y: rY[i] + rH[i] / 2 - 16, w: 33, h: 33 }, {
            pres,
            kind: "circle",
            n: i + 1,
            fs: s.FS(19)
          });
          H.text(sl, s, { x: 818, y: rY[i], w: 640, h: rH[i] }, {
            text: t,
            fs: s.FS(24),
            align: "left",
            lsm: 1.25,
            fit: true
          });
        });
        H.panel(sl, s, { x: 746, y: 842, w: 727, h: 55 }, { pres, fill: "EAF0F9" });
        H.text(sl, s, { x: 752, y: 842, w: 715, h: 55 }, {
          text: d.rightNote,
          fs: s.FS(22),
          bold: true,
          color: C.BLUE_TXT,
          align: "center",
          fit: true
        });
        H.panel(sl, s, { x: 43, y: 931, w: 1450, h: 53 }, P);
        sl.addShape(pres.shapes.RECTANGLE, {
          x: s.X(63),
          y: s.Y(944),
          w: s.W(6),
          h: s.H(28),
          fill: { color: C.NAVY },
          line: { type: "none" }
        });
        sl.addText(
          [
            { text: d.bottomLabel, options: { bold: true, color: C.NAVY } },
            { text: "   |   ", options: { color: C.LINE } },
            { text: d.bottomText, options: { color: C.TXT_MID } }
          ],
          {
            x: s.X(84),
            y: s.Y(931),
            w: s.W(1390),
            h: s.H(53),
            ...H.txtOpts({ fs: s.FS(22), align: "left" })
          }
        );
      };
    }
  });

  // slides/s05.js
  var require_s05 = __commonJS({
    "slides/s05.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 28,
          ty: 4,
          tw: 1200,
          th: 72,
          tfs: s.FS(47),
          sx: 30,
          sy: 92,
          mw: 12,
          mh: 31,
          marks: 2,
          sub: d.sub,
          bx: 68,
          by: 88,
          bw: 900,
          bh: 44,
          bfs: s.FS(31)
        });
        H.quoteBand(sl, s, { x: 62, y: 142, w: 1414, h: 76 }, {
          pres,
          runs: d.quote,
          fs: s.FS(29)
        });
        H.pill(sl, s, { x: 40, y: 237, w: 1455, h: 40 }, {
          pres,
          fill: C.NAVY,
          text: d.sec,
          fs: s.FS(25)
        });
        H.panel(sl, s, { x: 40, y: 285, w: 1455, h: 458 }, P);
        const rowY = [298, 413, 529, 641];
        const rowH = [98, 99, 93, 94];
        d.rows.forEach((r, i) => {
          const y = rowY[i], h = rowH[i];
          sl.addShape(pres.shapes.DIAMOND, {
            x: s.X(52),
            y: s.Y(y + h / 2 - 30),
            w: s.W(54),
            h: s.H(60),
            fill: { color: C.NAVY_DEEP },
            line: { type: "none" }
          });
          H.text(sl, s, { x: 52, y: y + h / 2 - 30, w: 54, h: 60 }, {
            text: String(r.n),
            fs: s.FS(24),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          sl.addShape(pres.shapes.RECTANGLE, {
            x: s.X(125),
            y: s.Y(y),
            w: s.W(266),
            h: s.H(h),
            fill: { color: C.NAVY },
            line: { type: "none" }
          });
          H.text(sl, s, { x: 129, y, w: 258, h }, {
            text: r.name,
            fs: s.FS(25),
            bold: true,
            color: C.WHITE,
            align: "center",
            fit: true
          });
          H.panel(sl, s, { x: 411, y, w: 410, h }, { pres, fill: "EFF1F4" });
          H.pill(sl, s, { x: 525, y, w: 182, h: 29 }, {
            pres,
            fill: "DCDFE5",
            text: d.reqLabel,
            fs: s.FS(19),
            color: C.TXT_MID
          });
          H.text(sl, s, { x: 419, y: y + 32, w: 394, h: h - 38 }, {
            text: r.req,
            fs: s.FS(21),
            align: "center",
            lsm: 1.25,
            fit: true,
            valign: "top"
          });
          H.chevron(sl, s, { x: 838, y: y + h / 2 - 14, w: 24, h: 28 }, { pres, fill: C.NAVY_DEEP });
          H.card(sl, s, { x: 879, y, w: 613, h }, { pres, line: C.LINE });
          H.goldBadge(sl, s, { x: 1073, y, w: 225, h: 29 }, {
            pres,
            text: d.resLabel,
            fs: s.FS(19)
          });
          H.text(sl, s, { x: 887, y: y + 32, w: 597, h: h - 38 }, {
            text: r.res,
            fs: s.FS(21),
            align: "center",
            lsm: 1.25,
            fit: true,
            valign: "top"
          });
        });
        H.panel(sl, s, { x: 51, y: 760, w: 1435, h: 175 }, P);
        H.pill(sl, s, { x: 75, y: 773, w: 219, h: 41 }, {
          pres,
          fill: C.NAVY,
          text: d.sec2,
          fs: s.FS(24)
        });
        d.prep.forEach((t, i) => {
          const y = 828 + i * 52;
          H.numBadge(sl, s, { x: 78, y, w: 32, h: 32 }, {
            pres,
            kind: "circle",
            n: i + 1,
            fs: s.FS(19),
            fill: C.WHITE,
            color: C.NAVY
          });
          sl.addShape(pres.shapes.OVAL, {
            x: s.X(78),
            y: s.Y(y),
            w: s.W(32),
            h: s.H(32),
            fill: { type: "none" },
            line: { color: C.NAVY, width: 1 }
          });
          H.text(sl, s, { x: 124, y, w: 1330, h: 32 }, {
            text: t,
            fs: s.FS(22),
            bold: true,
            color: C.NAVY_DEEP,
            align: "left",
            fit: true
          });
          if (i === 0) H.hline(sl, s, { x: 124, y: y + 42, w: 1330 }, { pres, color: "E6E9EE" });
        });
        H.footnote(sl, s, { x: 75, y: 940, fs: s.FS(20), text: d.foot });
      };
    }
  });

  // slides/s06.js
  var require_s06 = __commonJS({
    "slides/s06.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      var FM = require_fontmetrics();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.runHead(sl, s, { text: d.runHead, y: 15, fs: s.FS(18) });
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 28,
          ty: 44,
          tw: 1100,
          th: 74,
          tfs: s.FS(48),
          sx: 28,
          sy: 137,
          mw: 12,
          mh: 30,
          marks: 1,
          sub: d.sub,
          bx: 56,
          by: 133,
          bw: 900,
          bh: 44,
          bfs: s.FS(28)
        });
        H.quoteBand(sl, s, { x: 42, y: 164, w: 1456, h: 82 }, {
          pres,
          runs: d.quote,
          fs: s.FS(29)
        });
        const colX = [33, 304, 917];
        const colW = [257, 596, 582];
        const heads = [
          { fill: C.NAVY },
          { fill: "6E7175" },
          { fill: C.NAVY }
        ];
        d.heads.forEach((t, i) => {
          H.pill(sl, s, { x: i === 1 ? 313 : colX[i] + 10, y: 267, w: i === 1 ? 577 : colW[i] - 20, h: 43 }, {
            pres,
            fill: heads[i].fill,
            text: t,
            fs: s.FS(26)
          });
        });
        H.panel(sl, s, { x: 917, y: 319, w: 582, h: 327 }, { pres, fill: "EFF4FA" });
        const rowY = [319, 415, 496, 574];
        const rowH = [95, 79, 76, 73];
        d.rows.forEach((r, i) => {
          const y = rowY[i], h = rowH[i];
          H.panel(sl, s, { x: 33, y, w: 257, h }, { pres, fill: i % 2 ? C.PANEL : "EEF0F4" });
          H.numBadge(sl, s, { x: 52, y: y + h / 2 - 14, w: 29, h: 29 }, {
            pres,
            kind: "circle",
            n: r.n,
            fs: s.FS(18)
          });
          H.text(sl, s, { x: 92, y, w: 180, h }, {
            text: r.axis,
            fs: s.FS(24),
            bold: true,
            align: "left",
            fit: true
          });
          H.chevron(sl, s, { x: 272, y: y + h / 2 - 11, w: 20, h: 22 }, { pres, fill: "B9BEC6" });
          H.panel(sl, s, { x: 304, y, w: 596, h }, { pres, fill: i % 2 ? "FFFFFF" : "F7F8FA" });
          H.text(sl, s, { x: 312, y, w: 580, h }, {
            text: r.a,
            fs: s.FS(21),
            align: "center",
            lsm: 1.25,
            fit: true
          });
          H.text(sl, s, { x: 925, y, w: 566, h }, {
            text: r.b,
            fs: s.FS(21),
            bold: true,
            color: C.BLUE_TXT,
            align: "center",
            lsm: 1.25,
            fit: true
          });
          if (i < 3) H.hline(sl, s, { x: 33, y: y + h, w: 1466 }, { pres, color: "E2E5EA" });
        });
        H.panel(sl, s, { x: 25, y: 688, w: 1485, h: 262 }, P);
        H.pill(sl, s, { x: 595, y: 667, w: 334, h: 42 }, {
          pres,
          fill: C.NAVY,
          text: d.sec,
          fs: s.FS(26)
        });
        const pX = [45, 548, 1052];
        const pW = [452, 458, 432];
        d.principles.forEach((p, i) => {
          H.numBadge(sl, s, { x: pX[i], y: 726, w: 30, h: 30 }, {
            pres,
            kind: "circle",
            n: i + 1,
            fs: s.FS(18),
            fill: C.GOLD
          });
          H.text(sl, s, { x: pX[i] + 42, y: 722, w: pW[i], h: 34 }, {
            text: p.head,
            fs: s.FS(21),
            bold: true,
            align: "left",
            fit: true
          });
          const bodyFs = s.FS(21);
          const bodyLines = FM.lineCount(p.body, bodyFs, s.W(pW[i]) - 0.06, false);
          const bodyH = Math.ceil(bodyLines * bodyFs * 1.3 * 1.18 * (1536 / 11) / 72) + 6;
          H.text(sl, s, { x: pX[i] + 42, y: 758, w: pW[i], h: bodyH }, {
            text: p.body,
            fs: bodyFs,
            align: "left",
            valign: "top",
            lsm: 1.3
          });
          if (p.sub) {
            const subY = 758 + bodyH + 16;
            H.hline(sl, s, { x: pX[i] + 42, y: subY - 12, w: pW[i] }, { pres, color: "DCE0E6" });
            H.bullets(sl, s, { x: pX[i] + 46, y: subY, w: pW[i] - 4, h: 930 - subY }, {
              items: p.sub,
              fs: s.FS(20),
              gap: 2,
              lsm: 1.25
            });
          }
          if (i < 2) H.vline(sl, s, { x: pX[i] + pW[i] + 52, y: 715, h: 215 }, { pres, color: "DCE0E6" });
        });
        H.footnote(sl, s, { x: 34, y: 962, fs: s.FS(20), text: d.foot });
      };
    }
  });

  // slides/s07.js
  var require_s07 = __commonJS({
    "slides/s07.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.text(sl, s, { x: 30, y: 18, w: 1e3, h: 72 }, {
          text: d.title,
          fs: s.FS(48),
          bold: true,
          color: C.TXT
        });
        H.chapterBadge(sl, s, {
          x: 1e3,
          y: 24,
          w: 465,
          h: 40,
          fs: s.FS(24),
          runs: [
            { text: "/  ", options: { color: C.NAVY, bold: true } },
            { text: "\uC2DC\uD589\uADDC\uCE59 \uC81C12\uC870 \uC0B0\uCD9C\uBB3C 1:1 \uB9E4\uD551", options: { color: C.TXT_MID } }
          ]
        });
        H.quoteBand(sl, s, { x: 66, y: 110, w: 1360, h: 82 }, {
          pres,
          runs: d.quote,
          fs: s.FS(28)
        });
        H.panel(sl, s, { x: 31, y: 232, w: 1430, h: 498 }, P);
        H.pill(sl, s, { x: 30, y: 214, w: 263, h: 44 }, {
          pres,
          fill: C.NAVY,
          text: d.sec,
          fs: s.FS(26)
        });
        const rowY = [275, 339, 403, 466, 529, 592, 654];
        d.rows.forEach((r, i) => {
          const y = rowY[i];
          H.card(sl, s, { x: 52, y, w: 1390, h: 54 }, { pres });
          sl.addShape(pres.shapes.RECTANGLE, {
            x: s.X(80),
            y: s.Y(y + 11),
            w: s.W(33),
            h: s.H(32),
            fill: { color: C.NAVY },
            line: { type: "none" }
          });
          H.text(sl, s, { x: 80, y: y + 11, w: 33, h: 32 }, {
            text: String(r.n),
            fs: s.FS(20),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          if (r.nameSub) {
            sl.addText(
              [
                { text: r.name, options: { bold: true, color: C.NAVY_DEEP } },
                { text: r.nameSub, options: { bold: false, color: C.TXT_SUB, fontSize: s.FS(17) } }
              ],
              {
                x: s.X(138),
                y: s.Y(y),
                w: s.W(300),
                h: s.H(54),
                ...H.txtOpts({ fs: s.FS(23), bold: true, align: "left" })
              }
            );
          } else {
            H.text(sl, s, { x: 138, y, w: 300, h: 54 }, {
              text: r.name,
              fs: s.FS(23),
              bold: true,
              color: C.NAVY_DEEP,
              align: "left",
              fit: true
            });
          }
          if (r.descRuns) {
            sl.addText(
              [
                { text: "\uCE35\uBCC4 \uBA71\uBC30\uBD84(" },
                { text: "\u03B1", options: { italic: true } },
                { text: "=0.4, \uCC29\uC218 \uC2DC \uD655\uC815)\xB7\uCD94\uCD9C\uB960, \uAC00\uC911\uCE58 " },
                { text: "w", options: { italic: true } },
                { text: "=1/" },
                { text: "\u03C0", options: { italic: true } },
                { text: "1", options: { subscript: true } },
                { text: ", \uBAA8\uC9D1\uB2E8 M=N\xD7" },
                { text: "p\u0302", options: { italic: true } },
                { text: " \uCD94\uC815" }
              ],
              {
                x: s.X(452),
                y: s.Y(y),
                w: s.W(742),
                h: s.H(54),
                ...H.txtOpts({ fs: s.FS(21), align: "left" })
              }
            );
          } else {
            H.text(sl, s, { x: 452, y, w: 742, h: 54 }, {
              text: r.desc,
              fs: s.FS(21),
              align: "left",
              fit: true
            });
          }
          H.goldBadge(sl, s, { x: 1218, y: y + 11, w: 170, h: 33 }, {
            pres,
            text: r.when,
            fs: s.FS(20)
          });
        });
        H.panel(sl, s, { x: 33, y: 765, w: 1431, h: 234 }, P);
        H.pill(sl, s, { x: 29, y: 740, w: 224, h: 43 }, {
          pres,
          fill: C.NAVY,
          text: d.sec2,
          fs: s.FS(26)
        });
        const colX = [280, 660, 1040];
        const colW = [340, 340, 400];
        d.support.forEach((c, i) => {
          H.numBadge(sl, s, { x: colX[i] + colW[i] / 2 - 17, y: 790, w: 34, h: 34 }, {
            pres,
            kind: "circle",
            n: i + 1,
            fs: s.FS(20)
          });
          H.text(sl, s, { x: colX[i], y: 834, w: colW[i], h: 110 }, {
            text: c.text,
            fs: s.FS(22),
            bold: true,
            color: C.NAVY_DEEP,
            align: "center",
            valign: "top",
            lsm: 1.3,
            fit: true
          });
          if (c.note) {
            H.text(sl, s, { x: colX[i], y: 946, w: colW[i], h: 40 }, {
              text: c.note,
              fs: s.FS(17),
              color: C.TXT_SUB,
              align: "center",
              valign: "top"
            });
          }
          if (i < 2) H.vline(sl, s, { x: colX[i] + colW[i] + 20, y: 790, h: 180 }, { pres, color: "DCE0E6" });
        });
      };
    }
  });

  // slides/s08.js
  var require_s08 = __commonJS({
    "slides/s08.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 38,
          ty: 8,
          tw: 1100,
          th: 74,
          tfs: s.FS(49),
          sx: 40,
          sy: 100,
          mw: 12,
          mh: 30,
          marks: 1,
          sub: d.sub,
          bx: 68,
          by: 96,
          bw: 900,
          bh: 44,
          bfs: s.FS(29)
        });
        H.quoteBand(sl, s, { x: 42, y: 152, w: 1410, h: 88 }, {
          pres,
          runs: d.quote,
          fs: s.FS(28)
        });
        const colX = [42, 410, 749, 1103];
        const colW = [354, 322, 335, 336];
        H.hline(sl, s, { x: 42, y: 313, w: 1397 }, { pres, color: "C9CDD5", thick: 2 });
        d.phases.forEach((ph, i) => {
          const cx = colX[i] + colW[i] / 2;
          H.text(sl, s, { x: cx - 90, y: 258, w: 180, h: 44 }, {
            text: ph.no,
            fs: s.FS(38),
            bold: true,
            color: C.NAVY_DEEP,
            align: "center"
          });
          sl.addShape(pres.shapes.OVAL, {
            x: s.X(cx - 9),
            y: s.Y(305),
            w: s.W(18),
            h: s.H(18),
            fill: { color: C.NAVY_DEEP },
            line: { type: "none" }
          });
        });
        d.phases.forEach((ph, i) => {
          const x = colX[i], w = colW[i];
          H.panel(sl, s, { x, y: 334, w, h: 331 }, { pres, fill: "F7F8FA" });
          H.text(sl, s, { x: x + 4, y: 346, w: w - 8, h: 42 }, {
            text: ph.head,
            fs: s.FS(26),
            bold: true,
            align: "center",
            fit: true,
            pad: 0.02
          });
          H.hline(sl, s, { x: x + 24, y: 396, w: w - 48 }, { pres, color: "D8DCE3" });
          H.bullets(sl, s, { x: x + 24, y: 410, w: w - 44, h: 244 }, {
            items: ph.items,
            fs: s.FS(21),
            gap: 5,
            lsm: 1.25
          });
          sl.addShape(pres.shapes.RECTANGLE, {
            x: s.X(x),
            y: s.Y(665),
            w: s.W(w),
            h: s.H(83),
            fill: { color: C.GOLD },
            line: { type: "none" }
          });
          H.text(sl, s, { x: x + 8, y: 665, w: w - 16, h: 83 }, {
            text: ph.bar,
            fs: s.FS(22),
            bold: true,
            color: C.WHITE,
            align: "center",
            lsm: 1.2,
            fit: true
          });
        });
        H.panel(sl, s, { x: 42, y: 781, w: 1415, h: 186 }, P);
        H.pill(sl, s, { x: 64, y: 828, w: 240, h: 72 }, {
          pres,
          fill: C.NAVY,
          text: d.sec,
          fs: s.FS(26)
        });
        d.principles.forEach((t, i) => {
          const y = 800 + i * 52;
          H.numBadge(sl, s, { x: 340, y, w: 30, h: 30 }, {
            pres,
            kind: "circle",
            n: i + 1,
            fs: s.FS(18),
            fill: C.WHITE,
            color: C.NAVY
          });
          sl.addShape(pres.shapes.OVAL, {
            x: s.X(340),
            y: s.Y(y),
            w: s.W(30),
            h: s.H(30),
            fill: { type: "none" },
            line: { color: C.NAVY, width: 1 }
          });
          H.text(sl, s, { x: 384, y: y - 4, w: 1050, h: i === 2 ? 62 : 38 }, {
            text: t,
            fs: s.FS(21),
            align: "left",
            valign: "top",
            lsm: 1.28,
            fit: true
          });
        });
        H.footnote(sl, s, { x: 48, y: 984, fs: s.FS(20), text: d.foot });
      };
    }
  });

  // slides/s09.js
  var require_s09 = __commonJS({
    "slides/s09.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 36,
          ty: 18,
          tw: 1200,
          th: 76,
          tfs: s.FS(52),
          sx: 36,
          sy: 114,
          mw: 12,
          mh: 30,
          marks: 1,
          sub: d.sub,
          bx: 64,
          by: 110,
          bw: 900,
          bh: 44,
          bfs: s.FS(29)
        });
        H.quoteBand(sl, s, { x: 118, y: 158, w: 1262, h: 84 }, {
          pres,
          runs: d.quote,
          fs: s.FS(29)
        });
        H.panel(sl, s, { x: 34, y: 277, w: 1426, h: 423 }, P);
        H.pill(sl, s, { x: 578, y: 257, w: 337, h: 40 }, {
          pres,
          fill: C.NAVY,
          text: d.sec,
          fs: s.FS(25)
        });
        const rowY = [315, 378, 441, 504, 566, 628];
        d.rows.forEach((r, i) => {
          const y = rowY[i];
          H.card(sl, s, { x: 52, y, w: 1390, h: 54 }, { pres });
          H.numBadge(sl, s, { x: 96, y: y + 12, w: 31, h: 31 }, {
            pres,
            kind: "circle",
            n: r.n,
            fs: s.FS(19)
          });
          H.text(sl, s, { x: 152, y, w: 200, h: 54 }, {
            text: r.dim,
            fs: s.FS(24),
            bold: true,
            color: C.NAVY_DEEP,
            align: "left",
            fit: true
          });
          H.vline(sl, s, { x: 370, y: y + 12, h: 30 }, { pres, color: "DCE0E6" });
          H.text(sl, s, { x: 396, y, w: 340, h: 54 }, {
            text: r.req,
            fs: s.FS(22),
            align: "left",
            fit: true
          });
          H.vline(sl, s, { x: 752, y: y + 12, h: 30 }, { pres, color: "DCE0E6" });
          H.text(sl, s, { x: 776, y, w: 200, h: 54 }, {
            text: d.resLabel,
            fs: s.FS(22),
            bold: true,
            color: C.GOLD,
            align: "left",
            fit: true
          });
          H.vline(sl, s, { x: 990, y: y + 12, h: 30 }, { pres, color: "DCE0E6" });
          H.text(sl, s, { x: 1012, y, w: 418, h: 54 }, {
            text: r.res,
            fs: s.FS(22),
            align: "left",
            fit: true
          });
        });
        H.panel(sl, s, { x: 33, y: 741, w: 1427, h: 193 }, P);
        H.pill(sl, s, { x: 557, y: 726, w: 379, h: 41 }, {
          pres,
          fill: C.NAVY,
          text: d.sec2,
          fs: s.FS(25)
        });
        const colX = [70, 800];
        d.prep.forEach((p, i) => {
          const col = i < 2 ? 0 : 1;
          const row = i % 2;
          const x = colX[col];
          const y = 786 + row * 62;
          H.text(sl, s, { x, y, w: 24, h: 30 }, {
            text: "\u2713",
            fs: s.FS(22),
            bold: true,
            color: C.NAVY,
            align: "center"
          });
          H.text(sl, s, { x: x + 32, y: y - 4, w: 590, h: p.note ? 40 : 56 }, {
            text: p.text,
            fs: s.FS(21),
            align: "left",
            valign: "top",
            lsm: 1.3,
            fit: true
          });
          if (p.note) {
            H.text(sl, s, { x: x + 32, y: y + 32, w: 600, h: 30 }, {
              text: p.note,
              fs: s.FS(17),
              color: C.TXT_SUB,
              align: "left",
              fit: true
            });
          }
        });
        H.vline(sl, s, { x: 740, y: 776, h: 130 }, { pres, color: "DCE0E6" });
        H.footnote(sl, s, { x: 46, y: 966, fs: s.FS(20), text: d.foot });
      };
    }
  });

  // slides/s10.js
  var require_s10 = __commonJS({
    "slides/s10.js"(exports, module) {
      "use strict";
      var { C, FONT_B, FONT_M } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.runHead(sl, s, { text: d.runHead, y: 12, fs: s.FS(18) });
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 30,
          ty: 38,
          tw: 1e3,
          th: 78,
          tfs: s.FS(55),
          sx: 34,
          sy: 134,
          mw: 12,
          mh: 31,
          marks: 2,
          sub: d.sub,
          bx: 72,
          by: 130,
          bw: 900,
          bh: 44,
          bfs: s.FS(29)
        });
        H.quoteBand(sl, s, { x: 62, y: 178, w: 1414, h: 74 }, {
          pres,
          runs: d.quote,
          fs: s.FS(29)
        });
        H.pill(sl, s, { x: 32, y: 258, w: 948, h: 37 }, {
          pres,
          fill: C.NAVY,
          text: d.sec,
          fs: s.FS(24),
          rad: 6
        });
        const rowTop = [296, 368, 440, 502, 546];
        const rowH = [72, 72, 62, 44, 58];
        const line = { color: "E2E5EA", pt: 0.75 };
        sl.addTable(
          d.items.map((it) => [
            {
              text: it.name,
              options: { fontFace: FONT_B, fontSize: s.FS(25), bold: true, color: C.TXT, align: "left", valign: "middle" }
            },
            {
              text: it.calc,
              options: { fontFace: FONT_M, fontSize: s.FS(20), color: C.TXT_MID, align: "left", valign: "middle" }
            },
            {
              text: it.amt,
              options: { fontFace: FONT_B, fontSize: s.FS(25), bold: true, color: C.TXT, align: "right", valign: "middle" }
            }
          ]),
          {
            x: s.X(108),
            y: s.Y(296),
            w: s.W(872),
            // 비목명·금액은 KoPub 실측 폭에 맞춰 열 너비를 다시 나눴다(원본 197/500/175).
            colW: [s.W(230), s.W(442), s.W(200)],
            rowH: rowH.map((h) => s.H(h)),
            border: [
              { type: "solid", ...line },
              { type: "none" },
              { type: "solid", ...line },
              { type: "none" }
            ],
            margin: [0, s.W(14), 0, s.W(14)],
            fill: { color: "FFFFFF" }
          }
        );
        d.items.forEach((it, i) => {
          H.numBadge(sl, s, { x: 52, y: rowTop[i] + rowH[i] / 2 - 17, w: 34, h: 34 }, {
            pres,
            kind: "circle",
            n: it.n,
            fs: s.FS(20)
          });
        });
        H.hline(sl, s, { x: 32, y: 290, w: 948 }, { pres, color: "E2E5EA" });
        H.hline(sl, s, { x: 32, y: 604, w: 948 }, { pres, color: "E2E5EA" });
        H.bigNum(sl, s, { x: 1002, y: 257, w: 499, h: 254 }, {
          pres,
          label: d.bigLabel,
          lfs: s.FS(26),
          value: d.bigValue,
          vfs: s.FS(62),
          unit: d.bigUnit,
          ufs: s.FS(30),
          note: d.bigNote,
          nfs: s.FS(24)
        });
        sl.addShape(pres.shapes.RECTANGLE, {
          x: s.X(1002),
          y: s.Y(521),
          w: s.W(499),
          h: s.H(77),
          fill: { color: C.GOLD },
          line: { type: "none" }
        });
        d.supplyBar.forEach((b, i) => {
          const x = 1002 + i * 250;
          sl.addShape(pres.shapes.OVAL, {
            x: s.X(x + 16),
            y: s.Y(546),
            w: s.W(28),
            h: s.H(28),
            fill: { color: "FFFFFF" },
            line: { type: "none" }
          });
          H.text(sl, s, { x: x + 16, y: 546, w: 28, h: 28 }, {
            text: b.sym,
            fs: s.FS(19),
            bold: true,
            color: C.GOLD,
            align: "center"
          });
          H.text(sl, s, { x: x + 50, y: 521, w: 196, h: 77 }, {
            text: b.text,
            fs: s.FS(20),
            bold: true,
            color: C.WHITE,
            align: "left",
            fit: true
          });
        });
        H.panel(sl, s, { x: 33, y: 636, w: 1466, h: 97 }, P);
        H.pill(sl, s, { x: 32, y: 618, w: 242, h: 36 }, {
          pres,
          fill: C.NAVY,
          text: d.sec2,
          fs: s.FS(23)
        });
        H.text(sl, s, { x: 45, y: 658, w: 1442, h: 40 }, {
          text: d.directCost,
          fs: s.FS(24),
          align: "center",
          fit: true,
          pad: 1
        });
        H.text(sl, s, { x: 45, y: 698, w: 1442, h: 30 }, {
          text: d.directCostNote,
          fs: s.FS(18),
          color: C.TXT_SUB,
          align: "left",
          fit: true
        });
        H.panel(sl, s, { x: 33, y: 766, w: 1466, h: 204 }, P);
        H.pill(sl, s, { x: 31, y: 748, w: 241, h: 37 }, {
          pres,
          fill: C.NAVY,
          text: d.sec3,
          fs: s.FS(23)
        });
        const colX = [50, 552, 1052];
        const colW = [440, 440, 420];
        d.principles.forEach((p, i) => {
          H.numBadge(sl, s, { x: colX[i], y: 806, w: 30, h: 30 }, {
            pres,
            kind: "circle",
            n: i + 1,
            fs: s.FS(18)
          });
          H.text(sl, s, { x: colX[i] + 42, y: 798, w: colW[i], h: p.note ? 66 : 152 }, {
            text: p.body,
            fs: s.FS(20),
            align: "left",
            valign: "top",
            lsm: 1.3,
            fit: true
          });
          if (p.note) {
            H.text(sl, s, { x: colX[i] + 42, y: 872, w: colW[i], h: 96 }, {
              text: p.note,
              fs: s.FS(20),
              align: "left",
              valign: "top",
              lsm: 1.3,
              fit: true
            });
          }
          if (i < 2) H.vline(sl, s, { x: colX[i] + colW[i] + 44, y: 796, h: 160 }, { pres, color: "DCE0E6" });
        });
        H.footnote(sl, s, { x: 34, y: 980, fs: s.FS(20), text: d.foot });
      };
    }
  });

  // slides/s11.js
  var require_s11 = __commonJS({
    "slides/s11.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.runHead(sl, s, { text: d.runHead, y: 20, fs: s.FS(19) });
        H.chapterBadge(sl, s, {
          x: 1e3,
          y: 20,
          w: 460,
          h: 34,
          fs: s.FS(21),
          runs: [
            { text: "\u2162", options: { color: C.NAVY, bold: true } },
            { text: "  |  \uACFC\uC5C5 \uAD00\uB9AC \uBC29\uC548", options: { color: C.TXT_SUB } }
          ]
        });
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 28,
          ty: 44,
          tw: 1100,
          th: 72,
          tfs: s.FS(45),
          sx: 32,
          sy: 133,
          mw: 12,
          mh: 30,
          marks: 2,
          sub: d.sub,
          bx: 70,
          by: 129,
          bw: 900,
          bh: 44,
          bfs: s.FS(28)
        });
        H.quoteBand(sl, s, { x: 130, y: 172, w: 1240, h: 78 }, {
          pres,
          runs: d.quote,
          fs: s.FS(28)
        });
        H.panel(sl, s, { x: 32, y: 290, w: 1428, h: 428 }, P);
        H.pill(sl, s, { x: 30, y: 272, w: 295, h: 45 }, {
          pres,
          fill: C.NAVY,
          text: d.sec,
          fs: s.FS(26)
        });
        const rowY = [325, 403, 480, 552, 620];
        const rowH = [56, 56, 56, 56, 96];
        d.rows.forEach((r, i) => {
          const y = rowY[i], h = rowH[i];
          H.card(sl, s, { x: 52, y, w: 1390, h }, { pres });
          H.numBadge(sl, s, { x: 76, y: y + h / 2 - 20, w: 38, h: 40 }, {
            pres,
            kind: "hexagon",
            n: r.n,
            fs: s.FS(20),
            fill: C.NAVY_DEEP
          });
          H.text(sl, s, { x: 130, y, w: 180, h }, {
            text: r.risk,
            fs: s.FS(24),
            bold: true,
            color: C.NAVY_DEEP,
            align: "left",
            fit: true
          });
          H.panel(sl, s, { x: 315, y: y + 8, w: 430, h: h - 16 }, { pres, fill: "EFF1F4" });
          H.text(sl, s, { x: 323, y: y + 8, w: 414, h: h - 16 }, {
            text: r.cause,
            fs: s.FS(21),
            align: "center",
            lsm: 1.25,
            fit: true
          });
          H.arrowBadge(sl, s, { x: 780, y: y + h / 2 - 16, w: 151, h: 32 }, {
            pres,
            text: d.resLabel,
            fs: s.FS(19)
          });
          H.text(sl, s, { x: 960, y, w: 470, h }, {
            text: r.res,
            fs: s.FS(21),
            align: "left",
            lsm: 1.25,
            fit: true
          });
        });
        H.panel(sl, s, { x: 48, y: 781, w: 1416, h: 197 }, P);
        H.pill(sl, s, { x: 30, y: 754, w: 243, h: 42 }, {
          pres,
          fill: C.NAVY,
          text: d.sec2,
          fs: s.FS(26)
        });
        const colX = [70, 780];
        d.principles.forEach((t, i) => {
          const col = i < 2 ? 0 : 1;
          const row = i % 2;
          const x = colX[col];
          const y = 806 + row * 84;
          H.numBadge(sl, s, { x, y, w: 30, h: 30 }, {
            pres,
            kind: "circle",
            n: i + 1,
            fs: s.FS(18)
          });
          H.text(sl, s, { x: x + 42, y: y - 4, w: 610, h: 78 }, {
            text: t,
            fs: s.FS(20),
            align: "left",
            valign: "top",
            lsm: 1.28,
            fit: true
          });
        });
        H.vline(sl, s, { x: 740, y: 800, h: 164 }, { pres, color: "DCE0E6" });
        H.hline(sl, s, { x: 70, y: 880, w: 630 }, { pres, color: "E4E7EC" });
        H.hline(sl, s, { x: 780, y: 880, w: 630 }, { pres, color: "E4E7EC" });
        H.footnote(sl, s, { x: 46, y: 1e3, fs: s.FS(20), text: d.foot });
      };
    }
  });

  // slides/s12.js
  var require_s12 = __commonJS({
    "slides/s12.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 18,
          ty: 6,
          tw: 1200,
          th: 74,
          tfs: s.FS(52),
          sx: 22,
          sy: 90,
          mw: 12,
          mh: 31,
          marks: 1,
          sub: d.sub,
          bx: 52,
          by: 86,
          bw: 900,
          bh: 44,
          bfs: s.FS(29)
        });
        H.quoteBand(sl, s, { x: 140, y: 136, w: 1330, h: 68 }, {
          pres,
          runs: d.quote,
          fs: s.FS(30),
          padX: 40
        });
        H.panel(sl, s, { x: 44, y: 232, w: 884, h: 458 }, P);
        H.pill(sl, s, { x: 208, y: 213, w: 419, h: 42 }, {
          pres,
          fill: C.NAVY,
          text: d.leftHead,
          fs: s.FS(26)
        });
        const L = [
          {
            top: 232,
            bot: 403,
            badgeY: 272,
            nameY: 266,
            nameH: 78,
            bodyY: 264,
            bodyH: 138,
            bodyLsm: 1.17,
            badgeY2: 271,
            basisY: 300,
            basisH: 100
          },
          {
            top: 403,
            bot: 525,
            badgeY: 422,
            nameY: 414,
            nameH: 44,
            bodyY: 408,
            bodyH: 112,
            bodyLsm: 1.48,
            badgeY2: 416,
            basisY: 446,
            basisH: 74
          },
          {
            top: 525,
            bot: 690,
            badgeY: 543,
            nameY: 536,
            nameH: 78,
            bodyY: 530,
            bodyH: 155,
            bodyLsm: 1.22,
            badgeY2: 542,
            basisY: 572,
            basisH: 110
          }
        ];
        d.leftRows.forEach((r, i) => {
          const g = L[i];
          H.numBadge(sl, s, { x: 68, y: g.badgeY, w: 36, h: 42 }, {
            pres,
            kind: "hexagon",
            n: r.n,
            fs: s.FS(22)
          });
          H.text(sl, s, { x: 126, y: g.nameY, w: 155, h: g.nameH }, {
            text: r.name,
            fs: s.FS(30),
            bold: true,
            color: C.BLUE_TXT,
            align: "left",
            valign: "top",
            lsm: 1.3,
            fit: true,
            pad: 0.02
          });
          H.text(sl, s, { x: 291, y: g.bodyY, w: 405, h: g.bodyH }, {
            text: r.body,
            fs: s.FS(19),
            align: "left",
            valign: "top",
            lsm: g.bodyLsm,
            fit: true,
            pad: 0.02
          });
          H.vline(sl, s, { x: 700, y: g.top + 14, h: g.bot - g.top - 28 }, { pres, color: "E2E5EA" });
          H.goldBadge(sl, s, { x: 763, y: g.badgeY2, w: 100, h: 26 }, {
            pres,
            text: d.basisLabel,
            fs: s.FS(19)
          });
          H.text(sl, s, { x: 706, y: g.basisY, w: 214, h: g.basisH }, {
            text: r.basis,
            fs: s.FS(16),
            align: "center",
            valign: "top",
            lsm: 1.05,
            fit: true,
            pad: 0.02
          });
          if (i < 2) H.hline(sl, s, { x: 68, y: g.bot, w: 836 }, { pres, color: "E4E7EC" });
        });
        H.panel(sl, s, { x: 955, y: 232, w: 533, h: 458 }, P);
        H.pill(sl, s, { x: 986, y: 213, w: 408, h: 43 }, {
          pres,
          fill: C.NAVY,
          text: d.rightHead,
          fs: s.FS(26)
        });
        const R = [
          { badgeY: 273, bodyY: 310, bodyH: 92, bodyLsm: 1.25, gY: 414, basisY: 404, basisH: 56 },
          { badgeY: 475, bodyY: 509, bodyH: 120, bodyLsm: 1.22, gY: 637, basisY: 627, basisH: 56 }
        ];
        d.rightRows.forEach((r, i) => {
          const g = R[i];
          H.numBadge(sl, s, { x: 977, y: g.badgeY, w: 36, h: 42 }, {
            pres,
            kind: "hexagon",
            n: r.n,
            fs: s.FS(22)
          });
          H.text(sl, s, { x: 1030, y: g.badgeY, w: 380, h: 42 }, {
            text: r.name,
            fs: s.FS(30),
            bold: true,
            color: C.BLUE_TXT,
            align: "left",
            fit: true
          });
          H.text(sl, s, { x: 997, y: g.bodyY, w: 473, h: g.bodyH }, {
            text: r.body,
            fs: s.FS(19),
            align: "left",
            valign: "top",
            lsm: g.bodyLsm,
            fit: true,
            pad: 0.02
          });
          H.goldBadge(sl, s, { x: 994, y: g.gY, w: 103, h: 28 }, {
            pres,
            text: d.basisLabel,
            fs: s.FS(19)
          });
          H.text(sl, s, { x: 1112, y: g.basisY, w: 364, h: g.basisH }, {
            text: r.basis,
            fs: s.FS(19),
            align: "left",
            valign: "top",
            lsm: 1.06,
            fit: true,
            pad: 0.02
          });
          if (i === 0) H.hline(sl, s, { x: 976, y: 442, w: 492 }, { pres, color: "E4E7EC" });
        });
        H.panel(sl, s, { x: 37, y: 730, w: 1455, h: 224 }, P);
        H.pill(sl, s, { x: 471, y: 711, w: 524, h: 44 }, {
          pres,
          fill: C.NAVY,
          text: d.sec,
          fs: s.FS(28)
        });
        const B = [
          { bx: 64, by: 759, tx: 110, ty: 755, w: 440, byy: 800, bh: 150, lsm: 1.04, div: 502 },
          { bx: 527, by: 764, tx: 573, ty: 760, w: 275, byy: 811, bh: 140, lsm: 1.15, div: 809 },
          { bx: 844, by: 764, tx: 890, ty: 760, w: 292, byy: 815, bh: 136, lsm: 1.15, div: 1143 },
          { bx: 1184, by: 761, tx: 1230, ty: 757, w: 292, byy: 814, bh: 136, lsm: 1.2 }
        ];
        d.principles.forEach((p, i) => {
          const g = B[i];
          H.numBadge(sl, s, { x: g.bx, y: g.by, w: 34, h: 38 }, {
            pres,
            kind: "square",
            n: i + 1,
            fs: s.FS(21)
          });
          H.text(sl, s, { x: g.tx, y: g.ty, w: g.w - 40, h: 44 }, {
            text: p.head,
            fs: s.FS(26),
            bold: true,
            color: C.NAVY_DEEP,
            align: "left",
            fit: true
          });
          H.text(sl, s, { x: g.bx - 3, y: g.byy, w: g.w, h: g.bh }, {
            text: p.body,
            fs: s.FS(19),
            align: "left",
            valign: "top",
            lsm: g.lsm,
            fit: true,
            pad: 0.02
          });
          if (g.div) H.vline(sl, s, { x: g.div, y: 752, h: 186 }, { pres, color: "DCE0E6" });
        });
        H.footnote(sl, s, { x: 38, y: 966, fs: s.FS(20), text: d.foot });
      };
    }
  });

  // slides/s13.js
  var require_s13 = __commonJS({
    "slides/s13.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      var ACCENT = {
        NAVY: C.NAVY,
        GOLD: C.GOLD,
        SKY: "5BA3D0",
        NAVY_DEEP: C.NAVY_DEEP
      };
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 16,
          ty: 4,
          tw: 1200,
          th: 76,
          tfs: s.FS(55),
          sx: 18,
          sy: 88,
          mw: 12,
          mh: 31,
          marks: 2,
          sub: d.sub,
          bx: 62,
          by: 84,
          bw: 900,
          bh: 44,
          bfs: s.FS(31)
        });
        H.quoteBand(sl, s, { x: 146, y: 133, w: 1250, h: 58 }, {
          pres,
          runs: d.quote,
          fs: s.FS(29),
          style: "box",
          padX: 40
        });
        const drawCard = (it, g) => {
          H.numBadge(sl, s, { x: g.bx, y: g.by, w: 27, h: 31 }, {
            pres,
            kind: "square",
            n: it.n,
            fs: s.FS(19)
          });
          H.text(sl, s, { x: g.bx + 42, y: g.by - 5, w: g.fw - 50, h: 40 }, {
            text: it.name,
            fs: s.FS(31),
            bold: true,
            color: C.BLUE_TXT,
            align: "left",
            fit: true
          });
          H.formulaBox(sl, s, { x: g.fx, y: g.fy, w: g.fw, h: 32 }, {
            pres,
            text: it.formula,
            fs: s.FS(22)
          });
          H.goldBadge(sl, s, { x: g.fx + 2, y: g.ty, w: 88, h: 25 }, {
            pres,
            text: d.ruleLabel,
            fs: s.FS(18)
          });
          H.bullets(sl, s, { x: g.lx, y: g.ly, w: g.lw, h: g.lh }, {
            items: it.rules,
            fs: s.FS(19),
            gap: 1,
            lsm: g.lsm
          });
        };
        H.panel(sl, s, { x: 18, y: 226, w: 932, h: 482 }, { pres, fill: "FCFDFE", line: "E4E7EC" });
        H.pill(sl, s, { x: 233, y: 207, w: 443, h: 39 }, {
          pres,
          fill: C.NAVY,
          text: d.leftHead,
          fs: s.FS(26)
        });
        H.hline(sl, s, { x: 38, y: 455, w: 892 }, { pres, color: "E4E7EC" });
        H.vline(sl, s, { x: 504, y: 250, h: 430 }, { pres, color: "E4E7EC" });
        const coreGeom = [
          // ① 도입률 / ② 이행률 (윗줄) — 불릿 3줄·1줄
          { bx: 48, by: 259, fx: 30, fy: 298, fw: 468, ty: 344, lx: 44, lw: 458, ly: 370, lh: 80, lsm: 1.03 },
          { bx: 514, by: 260, fx: 512, fy: 298, fw: 430, ty: 344, lx: 522, lw: 420, ly: 370, lh: 80, lsm: 1.03 },
          // ③ 회피율 / ④ 반영률 (아랫줄) — 불릿 5줄·4줄
          { bx: 48, by: 467, fx: 30, fy: 505, fw: 468, ty: 546, lx: 44, lw: 458, ly: 570, lh: 122, lsm: 0.95 },
          { bx: 514, by: 467, fx: 512, fy: 505, fw: 430, ty: 546, lx: 522, lw: 420, ly: 570, lh: 122, lsm: 1.06 }
        ];
        d.core.forEach((it, i) => drawCard(it, coreGeom[i]));
        H.panel(sl, s, { x: 956, y: 226, w: 562, h: 482 }, { pres, fill: "FCFDFE", line: "E4E7EC" });
        H.pill(sl, s, { x: 1001, y: 207, w: 453, h: 39 }, {
          pres,
          fill: C.NAVY,
          text: d.rightHead,
          fs: s.FS(26)
        });
        const suppGeom = [
          { by: 259, fy: 295, ty: 339, ly: 338, lh: 56, div: 396 },
          { by: 407, fy: 443, ty: 488, ly: 487, lh: 56, div: 543 },
          { by: 554, fy: 590, ty: 634, ly: 633, lh: 66 }
        ];
        d.supp.forEach((it, i) => {
          const g = suppGeom[i];
          H.numBadge(sl, s, { x: 981, y: g.by, w: 27, h: 31 }, {
            pres,
            kind: "square",
            n: it.n,
            fs: s.FS(19)
          });
          H.text(sl, s, { x: 1023, y: g.by - 5, w: 460, h: 40 }, {
            text: it.name,
            fs: s.FS(31),
            bold: true,
            color: C.BLUE_TXT,
            align: "left",
            fit: true
          });
          H.formulaBox(sl, s, { x: 981, y: g.fy, w: 495, h: 32 }, {
            pres,
            text: it.formula,
            fs: s.FS(22)
          });
          H.goldBadge(sl, s, { x: 979, y: g.ty, w: 88, h: 25 }, {
            pres,
            text: d.ruleLabel,
            fs: s.FS(18)
          });
          H.bullets(sl, s, { x: 1078, y: g.ly, w: 398, h: g.lh }, {
            items: it.rules,
            fs: s.FS(19),
            gap: 1,
            lsm: 1
          });
          if (g.div) H.hline(sl, s, { x: 974, y: g.div, w: 530 }, { pres, color: "E4E7EC" });
        });
        H.panel(sl, s, { x: 18, y: 744, w: 1501, h: 233 }, P);
        H.pill(sl, s, { x: 474, y: 724, w: 526, h: 39 }, {
          pres,
          fill: C.NAVY,
          text: d.sec,
          fs: s.FS(28)
        });
        const cX = [63, 430, 801, 1162];
        d.principles.forEach((p, i) => {
          H.vline(sl, s, { x: cX[i] - 24, y: 776, h: 176 }, { pres, color: ACCENT[p.accent], thick: 5 });
          H.numBadge(sl, s, { x: cX[i], y: 782, w: 26, h: 29 }, {
            pres,
            kind: "square",
            n: i + 1,
            fs: s.FS(18)
          });
          H.text(sl, s, { x: cX[i] + 38, y: 779, w: 300, h: 36 }, {
            text: p.head,
            fs: s.FS(24),
            bold: true,
            color: C.NAVY_DEEP,
            align: "left",
            fit: true
          });
          H.text(sl, s, { x: cX[i], y: 822, w: 340, h: 134 }, {
            text: p.body,
            fs: s.FS(19),
            align: "left",
            valign: "top",
            lsm: 1.22,
            fit: true,
            pad: 0.02
          });
        });
        H.footnote(sl, s, { x: 22, y: 986, fs: s.FS(20), text: d.foot });
      };
    }
  });

  // slides/s14.js
  var require_s14 = __commonJS({
    "slides/s14.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      var NAVY14 = "032E86";
      var TINT = { BLUE: "F2F5F9", CREAM: "FAF7F2" };
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.runHead(sl, s, { text: d.runHead, y: 22, fs: s.FS(20) });
        H.chapterBadge(sl, s, {
          x: 1e3,
          y: 22,
          w: 400,
          h: 28,
          fs: s.FS(20),
          runs: [
            { text: "|   ", options: { color: "B9BEC6" } },
            { text: d.chapter, options: { color: C.TXT_SUB } }
          ]
        });
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 32,
          ty: 50,
          tw: 1300,
          th: 70,
          tfs: s.FS(44),
          sx: 34,
          sy: 146,
          mw: 12,
          mh: 30,
          marks: 1,
          sub: d.sub,
          bx: 62,
          by: 142,
          bw: 900,
          bh: 42,
          bfs: s.FS(28)
        });
        H.quoteBand(sl, s, { x: 200, y: 194, w: 1120, h: 72 }, {
          pres,
          runs: d.quote,
          fs: s.FS(30),
          padX: 40
        });
        H.pill(sl, s, { x: 26, y: 288, w: 371, h: 44 }, {
          pres,
          fill: NAVY14,
          text: d.sec,
          fs: s.FS(26),
          rad: 22
        });
        H.text(sl, s, { x: 414, y: 288, w: 1050, h: 44 }, {
          text: d.secNote,
          fs: s.FS(19),
          color: C.TXT_MID,
          align: "left",
          fit: true
        });
        sl.addShape(pres.shapes.UP_ARROW, {
          x: s.X(167),
          y: s.Y(352),
          w: s.W(17),
          h: s.H(444),
          fill: { color: "9AA0AA" },
          line: { type: "none" }
        });
        sl.addShape(pres.shapes.RIGHT_ARROW, {
          x: s.X(206),
          y: s.Y(812),
          w: s.W(1185),
          h: s.H(17),
          fill: { color: "9AA0AA" },
          line: { type: "none" }
        });
        H.text(sl, s, { x: 40, y: 530, w: 118, h: 76 }, {
          text: d.axisY,
          fs: s.FS(28),
          bold: true,
          color: C.TXT,
          align: "center",
          lsm: 1.15
        });
        H.text(sl, s, { x: 500, y: 838, w: 600, h: 40 }, {
          text: d.axisX,
          fs: s.FS(28),
          bold: true,
          color: C.TXT,
          align: "center"
        });
        [[82, 356, d.axisHigh], [81, 755, d.axisLow], [1342, 811, d.axisHigh]].forEach(([x, y, t]) => {
          sl.addShape(pres.shapes.OVAL, {
            x: s.X(x),
            y: s.Y(y),
            w: s.W(54),
            h: s.H(50),
            fill: { color: "4E4E4E" },
            line: { type: "none" }
          });
          H.text(sl, s, { x, y, w: 54, h: 50 }, {
            text: t,
            fs: s.FS(20),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
        });
        const Q = [
          { x: 215, y: 353, w: 555, h: 228 },
          { x: 780, y: 353, w: 627, h: 228 },
          { x: 215, y: 591, w: 555, h: 192 },
          { x: 780, y: 591, w: 626, h: 192 }
        ];
        const ITEM = [
          [{ bx: 398, by: 410, tx: 448, ty: 404, lw: 300 }],
          [
            { bx: 826, by: 366, tx: 876, ty: 360, lw: 300 },
            { bx: 826, by: 465, tx: 876, ty: 459, lw: 300 }
          ],
          [{ bx: 398, by: 630, tx: 448, ty: 624, lw: 300 }],
          [{ bx: 824, by: 610, tx: 874, ty: 604, lw: 300 }]
        ];
        d.quadrants.forEach((q, qi) => {
          const g = Q[qi];
          H.roundRect(sl, s, g, { pres, fill: TINT[q.tint], rad: 14 });
          if (q.img) {
            const box = {
              0: { x: 222, y: 382, w: 174, h: 146 },
              1: { x: 1192, y: 356, w: 206, h: 108 },
              2: { x: 224, y: 618, w: 172, h: 158 },
              3: { x: 1100, y: 645, w: 298, h: 136 }
            }[qi];
            H.image(sl, s, box, { name: q.img });
          }
          if (q.img2) H.image(sl, s, { x: 1183, y: 464, w: 215, h: 116 }, { name: q.img2 });
          q.items.forEach((it, ii) => {
            const t = ITEM[qi][ii];
            H.numBadge(sl, s, { x: t.bx, y: t.by, w: 36, h: 41 }, {
              pres,
              kind: "hexagon",
              n: it.n,
              fs: s.FS(22),
              fill: NAVY14
            });
            H.text(sl, s, { x: t.tx, y: t.ty, w: t.lw, h: 46 }, {
              text: it.name,
              fs: s.FS(30),
              bold: true,
              color: NAVY14,
              align: "left",
              fit: true
            });
            let y = t.ty + 50;
            if (it.sub) {
              H.text(sl, s, { x: t.tx, y, w: 340, h: 32 }, {
                text: it.sub,
                fs: s.FS(22),
                bold: true,
                color: C.BLUE_TXT,
                align: "left",
                fit: true
              });
              y += 36;
            }
            it.lines.forEach((ln) => {
              H.text(sl, s, { x: t.tx, y, w: 360, h: 32 }, {
                text: ln,
                fs: s.FS(22),
                color: C.TXT_MID,
                align: "left",
                fit: true
              });
              y += 36;
            });
            it.hi.forEach((ln) => {
              H.text(sl, s, { x: t.tx, y, w: 360, h: 32 }, {
                text: ln,
                fs: s.FS(22),
                bold: true,
                color: C.BLUE_TXT,
                align: "left",
                fit: true
              });
              y += 36;
            });
          });
        });
        H.roundRect(sl, s, { x: 31, y: 873, w: 1413, h: 118 }, { pres, fill: "F5F5F4", rad: 14 });
        const FX = [53, 404, 779, 1141];
        d.footItems.forEach((f, i) => {
          H.image(sl, s, { x: FX[i], y: 894, w: 75, h: 75 }, { name: f.icon });
          H.text(sl, s, { x: FX[i] + 92, y: 890, w: 250, h: 40 }, {
            text: f.head,
            fs: s.FS(28),
            bold: true,
            color: NAVY14,
            align: "left",
            fit: true
          });
          sl.addText(
            [
              { text: "|  ", options: { color: "B9BEC6" } },
              { text: f.tail, options: { color: C.TXT_MID } }
            ],
            {
              x: s.X(FX[i] + 92),
              y: s.Y(932),
              w: s.W(250),
              h: s.H(38),
              ...H.txtOpts({ fs: s.FS(22), align: "left" })
            }
          );
          if (i < 3) H.vline(sl, s, { x: FX[i + 1] - 40, y: 892, h: 80 }, { pres, color: "DCE0E6" });
        });
      };
    }
  });

  // slides/s15.js
  var require_s15 = __commonJS({
    "slides/s15.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      var NAVY15 = "002677";
      var GOLD15 = "9A835C";
      var BAND15 = "00194A";
      var TONE = { NAVY: "052976", GOLD: "A88F63", SKY: "2B8DB6" };
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.runHead(sl, s, { text: d.runHead, y: 22, fs: s.FS(20) });
        H.chapterBadge(sl, s, {
          x: 1e3,
          y: 22,
          w: 400,
          h: 28,
          fs: s.FS(20),
          runs: [
            { text: "|   ", options: { color: "B9BEC6" } },
            { text: d.chapter, options: { color: C.TXT_SUB } }
          ]
        });
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 30,
          ty: 50,
          tw: 1400,
          th: 70,
          tfs: s.FS(44),
          sx: 32,
          sy: 146,
          mw: 12,
          mh: 30,
          marks: 1,
          sub: d.sub,
          bx: 60,
          by: 142,
          bw: 900,
          bh: 42,
          bfs: s.FS(29)
        });
        H.quoteBand(sl, s, { x: 196, y: 196, w: 1120, h: 100 }, {
          pres,
          runs: d.quote,
          fs: s.FS(30),
          padX: 34,
          lsm: 1.35
        });
        const CARD = [
          {
            px: 36,
            pw: 698,
            cx: 35,
            cw: 700,
            tcx: 318,
            img: { x: 440, y: 360, w: 270, h: 92 },
            blocks: [
              { y: 455, h: 140 },
              { y: 606, h: 82 },
              { y: 700, h: 204 }
            ]
          },
          {
            px: 757,
            pw: 697,
            cx: 754,
            cw: 700,
            tcx: 1023,
            img: { x: 1180, y: 316, w: 260, h: 140 },
            blocks: [
              { y: 456, h: 144 },
              { y: 612, h: 88 },
              { y: 716, h: 184 }
            ]
          }
        ];
        d.cards.forEach((c, i) => {
          const g = CARD[i];
          H.roundRect(sl, s, { x: g.cx, y: 368, w: g.cw, h: 546 }, {
            pres,
            fill: C.WHITE,
            line: "E4E7EC",
            rad: 14
          });
          H.pill(sl, s, { x: g.px, y: 322, w: g.pw, h: 58 }, {
            pres,
            fill: c.tone === "GOLD" ? GOLD15 : NAVY15,
            rad: 29
          });
          H.text(sl, s, { x: g.tcx - 200, y: 322, w: 400, h: 58 }, {
            text: `${c.n} ${c.name}`,
            fs: s.FS(32),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          H.text(sl, s, { x: g.px + 20, y: 392, w: 400, h: 40 }, {
            text: c.stat,
            fs: s.FS(26),
            color: C.TXT,
            align: "center",
            fit: true
          });
          H.image(sl, s, g.img, { name: c.img });
          c.blocks.forEach((b, bi) => {
            const bg = g.blocks[bi];
            H.accentCard(sl, s, { x: g.px + 18, y: bg.y, w: g.pw - 36, h: bg.h }, {
              pres,
              tone: TONE[b.tone],
              head: b.head,
              hfs: s.FS(24),
              items: b.items,
              fs: s.FS(22),
              gap: 3,
              lsm: 1.18
            });
          });
        });
        H.bandBar(sl, s, { x: 28, y: 939, w: 1431, h: 76 }, {
          pres,
          fill: BAND15,
          runs: d.band,
          fs: s.FS(32)
        });
      };
    }
  });

  // slides/s16.js
  var require_s16 = __commonJS({
    "slides/s16.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      var NAVY16 = "012984";
      var BAND16 = "292C3A";
      var TONE = { NAVY: "022B8E", GOLD: "AD9060", SKY: "2789B0" };
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.runHead(sl, s, { text: d.runHead, y: 23, fs: s.FS(20) });
        H.chapterBadge(sl, s, {
          x: 1e3,
          y: 23,
          w: 400,
          h: 28,
          fs: s.FS(20),
          runs: [
            { text: "|   ", options: { color: "B9BEC6" } },
            { text: d.chapter, options: { color: C.TXT_SUB } }
          ]
        });
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 28,
          ty: 52,
          tw: 1400,
          th: 70,
          tfs: s.FS(43),
          sx: 30,
          sy: 147,
          mw: 12,
          mh: 30,
          marks: 1,
          sub: d.sub,
          bx: 58,
          by: 143,
          bw: 900,
          bh: 42,
          bfs: s.FS(29)
        });
        H.quoteBand(sl, s, { x: 182, y: 200, w: 1130, h: 100 }, {
          pres,
          runs: d.quote,
          fs: s.FS(30),
          padX: 34,
          lsm: 1.35
        });
        const CARD = [
          { px: 35, pw: 459, lw: 270, img: { x: 318, y: 332, w: 150, h: 104 } },
          { px: 518, pw: 459, lw: 235, img: { x: 752, y: 344, w: 222, h: 94 } },
          { px: 1001, pw: 461, lw: 236, img: { x: 1278, y: 320, w: 176, h: 124 } }
        ];
        const BLK = [
          { y: 449, h: 162 },
          { y: 618, h: 80 },
          { y: 706, h: 200 }
        ];
        d.cards.forEach((c, i) => {
          const g = CARD[i];
          H.roundRect(sl, s, { x: g.px - 2, y: 376, w: g.pw + 4, h: 542 }, {
            pres,
            fill: C.WHITE,
            line: "E4E7EC",
            rad: 14
          });
          H.pill(sl, s, { x: g.px, y: 329, w: g.lw, h: 45 }, {
            pres,
            fill: NAVY16,
            text: `${c.n} ${c.name}`,
            fs: s.FS(28),
            rad: 22
          });
          H.text(sl, s, { x: g.px + 14, y: 384, w: 250, h: 60 }, {
            text: c.stat,
            fs: s.FS(22),
            color: C.TXT,
            align: "left",
            valign: "top",
            lsm: 1.2,
            fit: true
          });
          H.image(sl, s, g.img, { name: c.img });
          c.blocks.forEach((b, bi) => {
            H.accentCard(sl, s, { x: g.px + 16, y: BLK[bi].y, w: g.pw - 32, h: BLK[bi].h }, {
              pres,
              tone: TONE[b.tone],
              head: b.head,
              hfs: s.FS(22),
              hh: 26,
              bt: 34,
              items: b.items,
              fs: s.FS(21),
              gap: 2,
              lsm: 0.98
            });
          });
        });
        H.bandBar(sl, s, { x: 32, y: 927, w: 1429, h: 85 }, {
          pres,
          fill: BAND16,
          runs: d.band,
          fs: s.FS(32)
        });
      };
    }
  });

  // slides/s17.js
  var require_s17 = __commonJS({
    "slides/s17.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      var NAVY17 = "082978";
      var GOLD17 = "865A1B";
      var DARK17 = "242A35";
      var HEX = { NAVY: "0A1B5A", GOLD: "886429", DARK: "2E323C" };
      var HEAD = { NAVY: NAVY17, GOLD: GOLD17, DARK: DARK17 };
      var BAR_L = "E9ECF4";
      var BAR_R = "F3EDE5";
      var BAND17 = "33353D";
      var LINE17 = "12336B";
      module.exports = function({ pres, sl, s, d }) {
        const P = { pres };
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 32,
          ty: 14,
          tw: 1300,
          th: 68,
          tfs: s.FS(48),
          sx: 30,
          sy: 86,
          mw: 12,
          mh: 30,
          marks: 1,
          sub: d.sub,
          bx: 58,
          by: 82,
          bw: 900,
          bh: 40,
          bfs: s.FS(26)
        });
        H.quoteBand(sl, s, { x: 136, y: 134, w: 1266, h: 112 }, {
          pres,
          runs: d.quote,
          fs: s.FS(28),
          style: "box",
          padX: 46,
          lsm: 1.35
        });
        H.roundRect(sl, s, { x: 40, y: 268, w: 964, h: 51 }, { pres, fill: BAR_L, rad: 8 });
        H.text(sl, s, { x: 40, y: 268, w: 964, h: 51 }, {
          text: d.phaseLeft,
          fs: s.FS(28),
          bold: true,
          color: NAVY17,
          align: "center"
        });
        H.roundRect(sl, s, { x: 1010, y: 268, w: 485, h: 50 }, { pres, fill: BAR_R, rad: 8 });
        H.text(sl, s, { x: 1010, y: 268, w: 485, h: 50 }, {
          text: d.phaseRight,
          fs: s.FS(28),
          bold: true,
          color: "9B743C",
          align: "center"
        });
        const AY = 409;
        sl.addShape(pres.shapes.LINE, {
          x: s.X(40),
          y: s.Y(AY),
          w: s.W(976),
          h: 0,
          line: { color: LINE17, width: 2.25 }
        });
        sl.addShape(pres.shapes.LINE, {
          x: s.X(1143),
          y: s.Y(AY),
          w: s.W(361),
          h: 0,
          line: { color: LINE17, width: 2.25, endArrowType: "triangle" }
        });
        sl.addShape(pres.shapes.LINE, {
          x: s.X(1078),
          y: s.Y(AY),
          w: s.W(65),
          h: s.H(48),
          line: { color: LINE17, width: 2.25 },
          flipV: true
        });
        sl.addShape(pres.shapes.LINE, {
          x: s.X(1016),
          y: s.Y(AY - 12),
          w: s.W(124),
          h: s.H(12),
          line: { color: "9B743C", width: 2, dashType: "dash", endArrowType: "triangle" }
        });
        H.text(sl, s, { x: 968, y: 322, w: 200, h: 56 }, {
          text: d.transition,
          fs: s.FS(19),
          bold: true,
          color: "8B6A2F",
          align: "center",
          valign: "top",
          lsm: 1.2,
          fit: true
        });
        const CX = [125, 327, 530, 734, 930, 1208, 1407];
        d.nodes.forEach((nd, i) => {
          const cx = CX[i];
          const filled = nd.tone === "DARK";
          sl.addShape(pres.shapes.HEXAGON, {
            x: s.X(cx - 24),
            y: s.Y(338),
            w: s.W(48),
            h: s.H(48),
            fill: filled ? { color: HEX.DARK } : { color: C.WHITE },
            line: { color: HEX[nd.tone], width: 1.75 },
            rotate: 90
          });
          H.text(sl, s, { x: cx - 24, y: 338, w: 48, h: 48 }, {
            text: nd.no,
            fs: s.FS(22),
            bold: true,
            color: filled ? C.WHITE : HEX[nd.tone],
            align: "center"
          });
          sl.addShape(pres.shapes.LINE, {
            x: s.X(cx),
            y: s.Y(386),
            w: 0,
            h: s.H(23),
            line: { color: LINE17, width: 1.5 }
          });
          sl.addShape(pres.shapes.OVAL, {
            x: s.X(cx - 7),
            y: s.Y(AY - 7),
            w: s.W(14),
            h: s.H(14),
            fill: { color: LINE17 },
            line: { type: "none" }
          });
          sl.addShape(pres.shapes.LINE, {
            x: s.X(cx),
            y: s.Y(AY),
            w: 0,
            h: s.H(22),
            line: { color: LINE17, width: 1.5 }
          });
          const col = HEAD[nd.tone];
          if (nd.head1) {
            H.text(sl, s, { x: cx - 130, y: nd.y1 - 6, w: 260, h: 36 }, {
              text: nd.head1,
              fs: s.FS(nd.ink1),
              bold: true,
              color: col,
              align: "center",
              fit: true
            });
          }
          if (nd.unit) {
            sl.addText(
              [
                { text: nd.head2, options: { fontSize: s.FS(nd.ink2) } },
                { text: nd.unit, options: { fontSize: s.FS(nd.inkU) } }
              ],
              {
                x: s.X(cx - 130),
                y: s.Y(nd.y2 - 6),
                w: s.W(260),
                h: s.H(48),
                ...H.txtOpts({ fs: s.FS(nd.ink2), bold: true, color: col, align: "center" })
              }
            );
          } else {
            H.text(sl, s, { x: cx - 130, y: nd.y2 - 6, w: 260, h: 48 }, {
              text: nd.head2,
              fs: s.FS(nd.ink2),
              bold: true,
              color: col,
              align: "center",
              fit: true
            });
          }
          H.hline(sl, s, { x: cx - 75, y: 523, w: 150 }, { pres, color: "D3D7DE" });
          H.text(sl, s, { x: cx - 130, y: 534, w: 260, h: 60 }, {
            text: nd.desc,
            fs: s.FS(21),
            color: C.TXT,
            align: "center",
            valign: "top",
            lsm: 1.22,
            fit: true
          });
        });
        const panels = [
          {
            px: 35,
            pw: 630,
            lx: 67,
            lw: 317,
            fill: C.NAVY,
            items: d.leftItems,
            head: d.leftHead,
            tone: "0A2A6B",
            rule: 665,
            dot: 25,
            tx: 46,
            tw: 590
          },
          // 우 패널은 오른쪽에 사진이 있어 글 폭이 좁다. 원본처럼 들여쓰기를 줄여
          // 최대한 확보하지만, 10pt 하한 탓에 첫 항목은 두 줄이 된다.
          {
            px: 705,
            pw: 800,
            lx: 737,
            lw: 333,
            fill: "8A6A34",
            items: d.rightItems,
            head: d.rightHead,
            tone: "8A6A34",
            rule: 1505,
            dot: 8,
            tx: 26,
            tw: 564
          }
        ];
        panels.forEach((g, gi) => {
          H.roundRect(sl, s, { x: g.px, y: 641, w: g.pw, h: 206 }, { pres, fill: "F4F5F7", rad: 12 });
          H.pill(sl, s, { x: g.lx, y: 627, w: g.lw, h: 38 }, {
            pres,
            fill: g.fill,
            text: g.head,
            fs: s.FS(25),
            rad: 19
          });
          H.hline(sl, s, { x: g.lx + g.lw, y: 645, w: g.rule - (g.lx + g.lw) }, { pres, color: g.tone });
          g.items.forEach((it, i) => {
            const y = 686 + i * 48;
            sl.addShape(pres.shapes.OVAL, {
              x: s.X(g.px + g.dot),
              y: s.Y(y + 10),
              w: s.W(9),
              h: s.H(9),
              fill: { color: g.tone },
              line: { type: "none" }
            });
            H.text(sl, s, { x: g.px + g.tx, y: y - 2, w: g.tw, h: 46 }, {
              text: it,
              fs: s.FS(23),
              color: C.TXT,
              align: "left",
              valign: "top",
              lsm: 1,
              fit: true,
              pad: 0.02
            });
          });
        });
        H.image(sl, s, { x: 1296, y: 668, w: 232, h: 182 }, { name: d.photo });
        H.roundRect(sl, s, { x: 24, y: 873, w: 1484, h: 121 }, { pres, fill: BAND17, rad: 20 });
        H.text(sl, s, { x: 60, y: 886, w: 1412, h: 44 }, {
          text: d.band1,
          fs: s.FS(26),
          bold: true,
          color: C.WHITE,
          align: "center",
          fit: true
        });
        H.text(sl, s, { x: 60, y: 933, w: 1412, h: 50 }, {
          text: d.band2,
          fs: s.FS(34),
          bold: true,
          color: "FFD87A",
          align: "center",
          fit: true
        });
      };
    }
  });

  // slides/s18.js
  var require_s18 = __commonJS({
    "slides/s18.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      var NAVY18 = "00277A";
      var HEX = { NAVY: "0A2A78", GOLD: "8F6023" };
      var BLUE18 = "0C247E";
      var PANEL18 = "F7F7F7";
      var BAND18 = "282B30";
      var GOLD18 = "F7D260";
      var DASH18 = "CFD3DA";
      module.exports = function({ pres, sl, s, d }) {
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 32,
          ty: 14,
          tw: 1300,
          th: 64,
          tfs: s.FS(44),
          sx: 28,
          sy: 80,
          mw: 12,
          mh: 26,
          marks: 1,
          sub: d.sub,
          bx: 50,
          by: 76,
          bw: 900,
          bh: 36,
          bfs: s.FS(21)
        });
        H.quoteBand(sl, s, { x: 243, y: 115, w: 1050, h: 96 }, {
          pres,
          runs: d.quote,
          fs: s.FS(27),
          style: "box",
          padX: 76,
          lsm: 1.32
        });
        [
          { x: 29, w: 655, text: d.leftHead },
          { x: 726, w: 756, text: d.rightHead }
        ].forEach((g) => {
          H.pill(sl, s, { x: g.x, y: 227, w: g.w, h: 38 }, {
            pres,
            fill: NAVY18,
            text: g.text,
            fs: s.FS(22),
            rad: 19
          });
          sl.addShape(pres.shapes.OVAL, {
            x: s.X(g.x + g.w - 37),
            y: s.Y(238),
            w: s.W(16),
            h: s.H(16),
            fill: { color: C.WHITE },
            line: { type: "none" }
          });
        });
        H.roundRect(sl, s, { x: 32, y: 281, w: 666, h: 456 }, { pres, fill: PANEL18, rad: 12 });
        H.dline(sl, s, { x: 369, y: 297, h: 420 }, { pres, dir: "v", color: DASH18 });
        H.dline(sl, s, { x: 47, y: 511, w: 634 }, { pres, color: DASH18 });
        const CX = [53, 388];
        const CY = [297, 528];
        d.cards.forEach((cd, i) => {
          const bx = CX[i % 2], by = CY[i < 2 ? 0 : 1];
          const col = HEX[cd.tone];
          sl.addShape(pres.shapes.HEXAGON, {
            x: s.X(bx),
            y: s.Y(by),
            w: s.W(42),
            h: s.H(47),
            fill: { color: col },
            line: { type: "none" },
            rotate: 90
          });
          H.text(sl, s, { x: bx, y: by, w: 42, h: 47 }, {
            text: cd.no,
            fs: s.FS(20),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          H.text(sl, s, { x: bx + 47, y: by + 2, w: 274, h: 42 }, {
            text: cd.head,
            fs: s.FS(23),
            bold: true,
            color: col === HEX.GOLD ? HEX.GOLD : BLUE18,
            align: "left",
            fit: true
          });
          const ry = by + 61;
          sl.addShape(pres.shapes.RECTANGLE, {
            x: s.X(bx),
            y: s.Y(ry),
            w: s.W(3),
            h: s.H(142),
            fill: { color: col },
            line: { type: "none" }
          });
          H.bullets(sl, s, { x: bx + 13, y: ry - 4, w: 295, h: 150 }, {
            items: cd.items,
            fs: s.FS(18),
            lsm: 1.06,
            gap: 8,
            valign: "top"
          });
        });
        H.image(sl, s, { x: 1280, y: 723, w: 256, h: 155 }, { name: d.photo });
        const AX = 771;
        sl.addShape(pres.shapes.LINE, {
          x: s.X(AX),
          y: s.Y(276),
          w: 0,
          h: s.H(436),
          line: { color: "7B8290", width: 1.5 }
        });
        [357, 472, 557, 642].forEach((y) => {
          H.dline(sl, s, { x: 733, y, w: 755 }, { pres, color: DASH18 });
          sl.addShape(pres.shapes.OVAL, {
            x: s.X(AX - 6),
            y: s.Y(y - 6),
            w: s.W(12),
            h: s.H(12),
            fill: { color: "25397E" },
            line: { type: "none" }
          });
        });
        const SEP = [[281, 58], [373, 79], [488, 51], [573, 51], [658, 57]];
        const ROWY = [282, 373, 488, 573, 658];
        d.rows.forEach((rw, i) => {
          const y = ROWY[i];
          const col = HEX[rw.tone];
          sl.addShape(pres.shapes.HEXAGON, {
            x: s.X(751),
            y: s.Y(y),
            w: s.W(41),
            h: s.H(47),
            fill: { color: col },
            line: { type: "none" },
            rotate: 90
          });
          H.text(sl, s, { x: 751, y, w: 41, h: 47 }, {
            text: rw.no,
            fs: s.FS(20),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          [971, 1171].forEach((sx) => {
            H.vline(sl, s, { x: sx, y: SEP[i][0], h: SEP[i][1] }, { pres, color: "D3D7DE", thick: 1.2 });
          });
          [
            { x: 822, w: 142, label: d.whenLabel, val: rw.when, fs: 21 },
            { x: 994, w: 170, label: d.doLabel, val: rw.act, fs: 19 }
          ].forEach((cl) => {
            H.text(sl, s, { x: cl.x, y: y + 5, w: cl.w, h: 20 }, {
              text: cl.label,
              fs: s.FS(15),
              color: C.TXT_SUB,
              align: "left",
              fit: true
            });
            H.text(sl, s, { x: cl.x, y: y + 26, w: cl.w, h: 54 }, {
              // 05행 '과업 종료 후 1년'은 10pt 하한에서 칸을 살짝 넘겨 줄이 접힌다.
              // 원본이 한 줄이므로 폰트를 미세 조정해 한 줄을 유지한다.
              text: cl.val,
              fit: true,
              pad: 0.02,
              fs: s.FS(cl.fs),
              bold: true,
              color: C.TXT,
              align: "left",
              valign: "top",
              lsm: 1.18
            });
          });
          H.text(sl, s, { x: 1191, y: y + 1, w: 310, h: 20 }, {
            text: d.supLabel,
            fs: s.FS(15),
            bold: true,
            color: BLUE18,
            align: "left",
            fit: true
          });
          if (rw.supRuns) {
            H.text(sl, s, { x: 1191, y: y + 20, w: 310, h: 22 }, {
              text: rw.sup,
              fs: s.FS(16),
              color: C.TXT,
              align: "left",
              valign: "top"
            });
            sl.addText(
              rw.supRuns.map((r) => ({
                text: r.text,
                options: { fontSize: r.big ? s.FS(21) : s.FS(16), color: r.big ? BLUE18 : C.TXT }
              })),
              {
                x: s.X(1191),
                y: s.Y(y + 42),
                w: s.W(310),
                h: s.H(62),
                ...H.txtOpts({ fs: s.FS(16), bold: true, color: C.TXT, align: "left", valign: "top", lsm: 1.06 })
              }
            );
          } else {
            H.text(sl, s, { x: 1191, y: y + 22, w: 310, h: 60 }, {
              text: rw.sup.replace(/\n/g, " "),
              fs: s.FS(16),
              color: C.TXT,
              align: "left",
              valign: "top",
              lsm: 1.08
            });
          }
        });
        H.roundRect(sl, s, { x: 31, y: 757, w: 1247, h: 106 }, { pres, fill: PANEL18, rad: 16 });
        H.pill(sl, s, { x: 29, y: 783, w: 236, h: 48 }, {
          pres,
          fill: NAVY18,
          text: d.supportHead,
          fs: s.FS(24),
          rad: 24
        });
        sl.addShape(pres.shapes.OVAL, {
          x: s.X(240),
          y: s.Y(800),
          w: s.W(14),
          h: s.H(14),
          fill: { color: C.WHITE },
          line: { type: "none" }
        });
        [577, 899].forEach((x) => {
          H.dline(sl, s, { x, y: 775, h: 72 }, { pres, dir: "v", color: "DCDEE2" });
        });
        const IC = [
          { ix: 305, tx: 398, tw: 168 },
          { ix: 617, tx: 711, tw: 176 },
          { ix: 931, tx: 1024, tw: 240 }
        ];
        d.supports.forEach((sp, i) => {
          H.image(sl, s, { x: IC[i].ix, y: 770, w: 77, h: 78 }, { name: sp.icon });
          H.text(sl, s, { x: IC[i].tx, y: 779, w: IC[i].tw, h: 60 }, {
            text: sp.text,
            fs: s.FS(23),
            bold: true,
            color: C.TXT,
            align: "left",
            valign: "middle",
            lsm: 1.2,
            fit: true
          });
        });
        H.roundRect(sl, s, { x: 26, y: 878, w: 1484, h: 123 }, { pres, fill: BAND18, rad: 20 });
        H.text(sl, s, { x: 60, y: 894, w: 1382, h: 44 }, {
          text: d.band1,
          fs: s.FS(27),
          bold: true,
          color: C.WHITE,
          align: "center",
          fit: true
        });
        H.text(sl, s, { x: 60, y: 940, w: 1382, h: 48 }, {
          text: d.band2,
          fs: s.FS(30),
          bold: true,
          color: GOLD18,
          align: "center",
          fit: true
        });
      };
    }
  });

  // slides/s19.js
  var require_s19 = __commonJS({
    "slides/s19.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      var FM = require_fontmetrics();
      var HDR19 = "11305F";
      var PILL = { NAVY: "062A63", GOLD: "9D8054" };
      var ROLE = { NAVY: "233E86", GOLD: "8C6121" };
      var BAND19 = "0A2650";
      var GOLD19 = "F8E371";
      var CHIP_B = "DDE5F2";
      var CHIP_C = "F2F0E3";
      var CHIP_TB = "1F3575";
      var CHIP_TC = "4A4034";
      var EDGE = "C9D3E6";
      var DESC = "4A4A4A";
      var CONN = "9AA0AB";
      var GEO = [
        { px: 13, pw: 381, lx: 131, lw: 150, cx: 205 },
        { px: 401, pw: 374, lx: 502, lw: 163, cx: 583 },
        { px: 781, pw: 359, lx: 867, lw: 177, cx: 955 },
        { px: 1148, pw: 369, lx: 1242, lw: 178, cx: 1334 }
      ];
      var PTOP = 512;
      var PBOT = 860;
      var PILLY = 497;
      var ROWTOP = PTOP + 22;
      var PXI = 1536 / 11;
      var MIN_LH = 10 * 1.18 / 72 * PXI;
      function layout(pw, members) {
        const pad = 6, nameW = 52, gap = 5, divGap = 8, gap2 = 6;
        const SAFE = 0.95;
        const chipW = Math.max(...members.flatMap((m) => m.term.split("\n")).map((t) => FM.widthIn(t, 10, true) * PXI)) + 10;
        const avail = pw - pad * 2 - nameW - gap - divGap - gap2 - chipW;
        const roleW = Math.round(avail * 0.42), taskW = avail - roleW;
        const need = members.map((m) => {
          const n = Math.max(
            FM.lineCount(m.role.replace(/\n/g, " "), 10, roleW * SAFE / PXI, true),
            FM.lineCount(m.task.replace(/\n/g, " "), 10, taskW * SAFE / PXI, false),
            FM.lineCount(m.term.replace(/\n/g, " "), 10, (chipW - 10) / PXI, true)
          );
          return n * MIN_LH + 10;
        });
        const slack = (PBOT - ROWTOP - need.reduce((a, b) => a + b, 0)) / members.length;
        const rows = [];
        let y = ROWTOP;
        need.forEach((h) => {
          rows.push({ y, h: h + slack });
          y += h + slack;
        });
        return {
          rows,
          nameW,
          roleW,
          taskW,
          chipW,
          nx: pad,
          rx: pad + nameW + gap,
          vx: pad + nameW + gap + roleW + divGap / 2,
          tx: pad + nameW + gap + roleW + divGap,
          kx: pw - pad - chipW
        };
      }
      function capBar(pres, sl, s, p, fill) {
        H.roundRect(sl, s, p, { pres, fill, rad: 10 });
        sl.addShape(pres.shapes.RECTANGLE, {
          x: s.X(p.x),
          y: s.Y(p.y + p.h / 2),
          w: s.W(p.w),
          h: s.H(p.h / 2),
          fill: { color: fill },
          line: { type: "none" }
        });
      }
      module.exports = function({ pres, sl, s, d }) {
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 27,
          ty: 10,
          tw: 1200,
          th: 64,
          tfs: s.FS(46),
          sx: 26,
          sy: 86,
          mw: 12,
          mh: 26,
          marks: 1,
          sub: d.sub,
          bx: 50,
          by: 82,
          bw: 800,
          bh: 36,
          bfs: s.FS(21)
        });
        H.quoteBand(sl, s, { x: 279, y: 116, w: 990, h: 70 }, {
          pres,
          runs: d.quote,
          fs: s.FS(28),
          style: "box",
          padX: 62,
          lsm: 1.2
        });
        const LEAD = [
          {
            x: 489,
            w: 538,
            y: 208,
            hh: 35,
            h: 100,
            nx: 498,
            nw: 92,
            nfs: 28,
            vx: 600,
            rx: 608,
            rw: 316,
            rfs: 18,
            kx: 930,
            ky: 257,
            kw: 86,
            kh: 37
          },
          {
            x: 470,
            w: 578,
            y: 338,
            hh: 36,
            h: 98,
            nx: 478,
            nw: 84,
            nfs: 26,
            vx: 566,
            rx: 574,
            rw: 378,
            rfs: 17,
            kx: 957,
            ky: 387,
            kw: 82,
            kh: 36
          }
        ];
        d.lead.forEach((ld, i) => {
          const g = LEAD[i];
          H.roundRect(sl, s, { x: g.x, y: g.y, w: g.w, h: g.h }, { pres, fill: C.WHITE, line: EDGE, rad: 10 });
          capBar(pres, sl, s, { x: g.x, y: g.y, w: g.w, h: g.hh }, HDR19);
          H.text(sl, s, { x: g.x, y: g.y, w: g.w, h: g.hh }, {
            text: ld.head,
            fs: s.FS(21),
            bold: true,
            color: C.WHITE,
            align: "center",
            fit: true
          });
          H.text(sl, s, { x: g.nx, y: g.y + g.hh + 6, w: g.nw, h: g.h - g.hh - 12 }, {
            text: ld.name,
            fs: s.FS(g.nfs),
            bold: true,
            color: C.TXT,
            align: "center",
            fit: true
          });
          H.vline(sl, s, { x: g.vx, y: g.y + g.hh + 14, h: g.h - g.hh - 28 }, { pres, color: "D8DCE4", thick: 1.2 });
          H.text(sl, s, { x: g.rx, y: g.y + g.hh + 6, w: g.rw, h: g.h - g.hh - 12 }, {
            text: ld.role,
            fs: s.FS(g.rfs),
            color: C.TXT,
            align: "center",
            fit: true,
            pad: 0.02
          });
          H.roundRect(sl, s, { x: g.kx, y: g.ky, w: g.kw, h: g.kh }, { pres, fill: CHIP_B, rad: 8 });
          H.text(sl, s, { x: g.kx, y: g.ky, w: g.kw, h: g.kh }, {
            text: ld.term,
            fs: s.FS(17),
            color: CHIP_TB,
            align: "center",
            fit: true
          });
        });
        const line = (x, y, w, h) => sl.addShape(pres.shapes.LINE, {
          x: s.X(x),
          y: s.Y(y),
          w: s.W(w),
          h: s.H(h),
          line: { color: CONN, width: 1.5 }
        });
        line(759, 308, 0, 30);
        line(759, 436, 0, 24);
        line(GEO[0].cx, 460, GEO[3].cx - GEO[0].cx, 0);
        GEO.forEach((g) => line(g.cx, 460, 0, PILLY - 460));
        d.groups.forEach((gr, gi) => {
          const g = GEO[gi];
          const L = layout(g.pw, gr.members);
          H.roundRect(
            sl,
            s,
            { x: g.px, y: PTOP, w: g.pw, h: PBOT - PTOP },
            { pres, fill: C.WHITE, line: EDGE, rad: 10 }
          );
          H.pill(sl, s, { x: g.lx, y: PILLY, w: g.lw, h: 35 }, {
            pres,
            fill: PILL[gr.tone],
            text: gr.head,
            fs: s.FS(22),
            rad: 17
          });
          gr.members.forEach((m, mi) => {
            const r = L.rows[mi];
            if (mi > 0) {
              H.dline(sl, s, { x: g.px + 10, y: r.y, w: g.pw - 20 }, { pres, color: "D6D8DC" });
            }
            const box = (dx, w, extra) => ({ x: g.px + dx, y: r.y + 5, w, h: r.h - 10, ...extra });
            H.text(sl, s, box(L.nx, L.nameW), {
              text: m.name,
              fs: s.FS(22),
              bold: true,
              color: C.TXT,
              align: "left",
              fit: true
            });
            H.text(sl, s, box(L.rx, L.roleW), {
              text: m.role.replace(/\n/g, " "),
              fs: s.FS(17),
              bold: true,
              color: ROLE[gr.tone],
              align: "left",
              lsm: 1.14
            });
            H.vline(
              sl,
              s,
              { x: g.px + L.vx, y: r.y + 14, h: r.h - 28 },
              { pres, color: "DEE0E4", thick: 1.2 }
            );
            H.text(sl, s, box(L.tx, L.taskW), {
              text: m.task.replace(/\n/g, " "),
              fs: s.FS(15),
              color: DESC,
              align: "left",
              lsm: 1.1
            });
            const cream = gr.tone === "GOLD";
            const kh = Math.min(56, r.h - 14);
            H.roundRect(
              sl,
              s,
              { x: g.px + L.kx, y: r.y + (r.h - kh) / 2, w: L.chipW, h: kh },
              { pres, fill: cream ? CHIP_C : CHIP_B, rad: 8 }
            );
            H.text(sl, s, { x: g.px + L.kx, y: r.y + (r.h - kh) / 2, w: L.chipW, h: kh }, {
              text: m.term,
              fs: s.FS(16),
              color: cream ? CHIP_TC : CHIP_TB,
              align: "center",
              lsm: 1.16
            });
          });
        });
        H.roundRect(sl, s, { x: 44, y: 874, w: 1450, h: 107 }, { pres, fill: BAND19, rad: 18 });
        [90, 1437].forEach((x) => sl.addShape(pres.shapes.OVAL, {
          x: s.X(x),
          y: s.Y(922),
          w: s.W(11),
          h: s.H(11),
          fill: { color: C.WHITE },
          line: { type: "none" }
        }));
        H.text(sl, s, { x: 120, y: 886, w: 1298, h: 44 }, {
          text: d.band1,
          fs: s.FS(27),
          bold: true,
          color: C.WHITE,
          align: "center",
          fit: true
        });
        H.text(sl, s, { x: 120, y: 928, w: 1298, h: 46 }, {
          text: d.band2,
          fs: s.FS(28),
          bold: true,
          color: GOLD19,
          align: "center",
          fit: true
        });
      };
    }
  });

  // slides/s20.js
  var require_s20 = __commonJS({
    "slides/s20.js"(exports, module) {
      "use strict";
      var { C, MIN_PT } = require_theme();
      var H = require_helpers();
      var FM = require_fontmetrics();
      var NAVY20 = "082470";
      var HEX = { NAVY: "0A2A80", GOLD: "8F5F24" };
      var BLUE20 = "11207D";
      var TINT = { GRAY: "F0F0F1", BLUE: "EAEFF9", CREAM: "F4EDDF" };
      var BROWN20 = "7F4C13";
      var COLBG = "F5F5F5";
      var BAND20 = "33363C";
      var GOLD20 = "F7D673";
      var RULE = "DCDDE0";
      function runs(sl, s, p, o) {
        sl.addText(
          o.runs.map((r) => ({
            text: r.text,
            options: {
              color: r.hi ? BLUE20 : o.color || C.TXT,
              bold: !!r.hi || !!o.bold,
              breakLine: !!r.br
            }
          })),
          {
            x: s.X(p.x),
            y: s.Y(p.y),
            w: s.W(p.w),
            h: s.H(p.h),
            ...H.txtOpts({
              fs: o.fs,
              color: o.color || C.TXT,
              align: o.align || "left",
              valign: o.valign || "top",
              lsm: o.lsm || 1.16
            })
          }
        );
      }
      module.exports = function({ pres, sl, s, d }) {
        H.titleBlock(sl, s, {
          pres,
          title: d.title,
          tx: 32,
          ty: 12,
          tw: 1300,
          th: 62,
          tfs: s.FS(43),
          sx: 28,
          sy: 78,
          mw: 12,
          mh: 26,
          marks: 1,
          sub: d.sub,
          bx: 50,
          by: 74,
          bw: 900,
          bh: 36,
          bfs: s.FS(22)
        });
        H.quoteBand(sl, s, { x: 266, y: 109, w: 1027, h: 89 }, {
          pres,
          runs: d.quote,
          fs: s.FS(25),
          style: "box",
          padX: 74,
          lsm: 1.3
        });
        const STRIP = [{ x: 27, w: 438 }, { x: 481, w: 489 }, { x: 988, w: 519 }];
        d.strip.forEach((st, i) => {
          const g = STRIP[i];
          H.roundRect(sl, s, { x: g.x, y: 205, w: g.w, h: 66 }, { pres, fill: TINT[st.tint], rad: 6 });
          const rs = [
            { text: st.head, bold: true },
            { text: "  |  ", color: "A9ADB4" },
            st.big ? { text: st.big, bold: true, big: true } : { text: st.body }
          ];
          const inner = s.W(g.w - 16);
          const ratio = s.FS(25) / s.FS(21);
          let fs = s.FS(21);
          for (let k = 0; k < 60; k++) {
            const w = rs.reduce((a, r) => a + FM.widthIn(r.text, r.big ? fs * ratio : fs, !!r.bold), 0);
            if (w <= inner * 0.97 || fs <= MIN_PT) break;
            fs = Math.round((fs - 0.2) * 10) / 10;
          }
          sl.addText(
            rs.map((r) => ({
              text: r.text,
              options: {
                bold: !!r.bold,
                color: r.big ? BROWN20 : r.color || C.TXT,
                fontSize: r.big ? Math.round(fs * ratio * 10) / 10 : fs
              }
            })),
            {
              x: s.X(g.x + 8),
              y: s.Y(205),
              w: inner,
              h: s.H(66),
              ...H.txtOpts({ fs, color: C.TXT, align: "center", valign: "middle" })
            }
          );
          if (i < 2) {
            sl.addShape(pres.shapes.ISOSCELES_TRIANGLE, {
              x: s.X(g.x + g.w + 2),
              y: s.Y(226),
              w: s.W(13),
              h: s.H(24),
              fill: { color: "9BA0A8" },
              line: { type: "none" },
              rotate: 90
            });
          }
        });
        H.pill(sl, s, { x: 26, y: 276, w: 249, h: 46 }, {
          pres,
          fill: NAVY20,
          text: d.gridHead,
          fs: s.FS(24),
          rad: 23
        });
        sl.addShape(pres.shapes.OVAL, {
          x: s.X(248),
          y: s.Y(292),
          w: s.W(14),
          h: s.H(14),
          fill: { color: C.WHITE },
          line: { type: "none" }
        });
        H.hline(sl, s, { x: 287, y: 302, w: 1213 }, { pres, color: "B6B9BE", thick: 1.2 });
        H.hline(sl, s, { x: 33, y: 337, w: 1467 }, { pres, color: RULE, thick: 1.2 });
        H.roundRect(sl, s, { x: 33, y: 334, w: 325, h: 392 }, { pres, fill: COLBG, rad: 8 });
        const COL = [
          { x: 375, w: 355, tx: 393, tw: 336 },
          // 무엇을 제공
          { x: 730, w: 366, tx: 770, tw: 322 },
          // 왜 필요한가
          { x: 1096, w: 404, tx: 1130, tw: 374 }
          // 재단 활용
        ];
        d.cols.forEach((t, i) => {
          H.text(sl, s, { x: COL[i].x, y: 305, w: COL[i].w, h: 28 }, {
            text: t,
            fs: s.FS(18),
            bold: true,
            color: BLUE20,
            align: "center",
            fit: true
          });
        });
        const SEP = [337, 438, 538, 632, 737];
        const BY = [351, 454, 550, 644];
        d.rows.forEach((rw, i) => {
          const top = SEP[i], bot = SEP[i + 1];
          if (i > 0) H.dline(sl, s, { x: 33, y: top, w: 1467 }, { pres, color: "D8D9DC" });
          [730, 1096].forEach((x) => {
            H.vline(sl, s, { x, y: top + 14, h: bot - top - 28 }, { pres, color: "DDDEE1", thick: 1.2 });
          });
          const col = HEX[rw.tone];
          sl.addShape(pres.shapes.HEXAGON, {
            x: s.X(53),
            y: s.Y(BY[i]),
            w: s.W(51),
            h: s.H(58),
            fill: { color: col },
            line: { type: "none" },
            rotate: 90
          });
          H.text(sl, s, { x: 53, y: BY[i], w: 51, h: 58 }, {
            text: rw.no,
            fs: s.FS(22),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          H.text(sl, s, { x: 126, y: top + 8, w: 226, h: bot - top - 16 }, {
            text: rw.title,
            fs: s.FS(22),
            bold: true,
            color: rw.tone === "GOLD" ? BROWN20 : C.TXT,
            align: "left",
            lsm: 1.24
          });
          runs(sl, s, { x: COL[0].tx, y: top + 8, w: COL[0].tw, h: bot - top - 16 }, {
            runs: rw.what,
            fs: s.FS(19),
            valign: "middle",
            lsm: 1.2
          });
          H.text(sl, s, { x: COL[1].tx, y: top + 8, w: COL[1].tw, h: bot - top - 16 }, {
            text: rw.why,
            fs: s.FS(19),
            color: C.TXT,
            align: "left",
            valign: "middle",
            lsm: 1.2
          });
          runs(sl, s, { x: COL[2].tx, y: top + 8, w: COL[2].tw, h: bot - top - 16 }, {
            runs: rw.use,
            fs: s.FS(19),
            valign: "middle",
            lsm: 1.2
          });
        });
        H.image(sl, s, { x: 1286, y: 718, w: 250, h: 161 }, { name: d.photo });
        H.roundRect(
          sl,
          s,
          { x: 32, y: 748, w: 1210, h: 114 },
          { pres, fill: C.WHITE, line: "DCDEE3", rad: 14 }
        );
        H.pill(sl, s, { x: 29, y: 733, w: 208, h: 44 }, {
          pres,
          fill: NAVY20,
          text: d.stepHead,
          fs: s.FS(23),
          rad: 22
        });
        sl.addShape(pres.shapes.OVAL, {
          x: s.X(211),
          y: s.Y(748),
          w: s.W(14),
          h: s.H(14),
          fill: { color: C.WHITE },
          line: { type: "none" }
        });
        const STEP = [
          { cx: 282, tx: 324, tw: 250 },
          { cx: 614, tx: 657, tw: 230 },
          { cx: 915, tx: 961, tw: 262 }
        ];
        d.steps.forEach((sp, i) => {
          const g = STEP[i];
          sl.addShape(pres.shapes.OVAL, {
            x: s.X(g.cx),
            y: s.Y(761),
            w: s.W(32),
            h: s.H(33),
            fill: { color: NAVY20 },
            line: { type: "none" }
          });
          H.text(sl, s, { x: g.cx, y: 761, w: 32, h: 33 }, {
            text: sp.n,
            fs: s.FS(19),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          H.text(sl, s, { x: g.cx + 42, y: 760, w: g.tw, h: 34 }, {
            text: sp.head,
            fs: s.FS(21),
            bold: true,
            color: BLUE20,
            align: "left",
            fit: true
          });
          runs(sl, s, { x: g.tx, y: 796, w: g.tw + 14, h: 58 }, {
            runs: sp.body,
            fs: s.FS(19),
            valign: "top",
            lsm: 1.22
          });
          if (i < 2) {
            sl.addShape(pres.shapes.ISOSCELES_TRIANGLE, {
              x: s.X(i === 0 ? 563 : 852),
              y: s.Y(795),
              w: s.W(24),
              h: s.H(32),
              fill: { color: "9BA0A8" },
              line: { type: "none" },
              rotate: 90
            });
          }
        });
        H.roundRect(sl, s, { x: 27, y: 879, w: 1482, h: 118 }, { pres, fill: BAND20, rad: 20 });
        H.text(sl, s, { x: 60, y: 892, w: 1416, h: 44 }, {
          text: d.band1,
          fs: s.FS(28),
          bold: true,
          color: C.WHITE,
          align: "center",
          fit: true
        });
        H.text(sl, s, { x: 60, y: 938, w: 1416, h: 48 }, {
          text: d.band2,
          fs: s.FS(31),
          bold: true,
          color: GOLD20,
          align: "center",
          fit: true
        });
      };
    }
  });

  // slides/s21.js
  var require_s21 = __commonJS({
    "slides/s21.js"(exports, module) {
      "use strict";
      var { C } = require_theme();
      var H = require_helpers();
      var HD1 = "002569";
      var HD2 = "0D3C89";
      var HD3 = "696969";
      var NAVY21 = "062A63";
      var GOLD21 = "B4801F";
      var GBAND = "AF7E22";
      var BAND21 = "292C33";
      var PANEL21 = "F8F8F8";
      var EDGE21 = "D9DCE1";
      var EYE = "4A5674";
      var BLUE = C.BLUE_TXT;
      module.exports = function({ pres, sl, s, d }) {
        H.text(sl, s, { x: 100, y: 46, w: 1600, h: 52 }, {
          text: d.eyebrow,
          fs: s.FS(34),
          bold: true,
          color: EYE,
          align: "left"
        });
        H.text(sl, s, { x: 100, y: 118, w: 3e3, h: 140 }, {
          text: d.title,
          fs: s.FS(112),
          bold: true,
          color: C.TXT,
          align: "left",
          fit: true
        });
        H.roundRect(
          sl,
          s,
          { x: 626, y: 301, w: 2292, h: 156 },
          { pres, fill: C.WHITE, line: "D6D6D6", rad: 34 }
        );
        [301, 451].forEach((y) => {
          sl.addShape(pres.shapes.RECTANGLE, {
            x: s.X(880),
            y: s.Y(y),
            w: s.W(1784),
            h: s.H(6),
            fill: { color: C.WHITE },
            line: { type: "none" }
          });
        });
        sl.addText(
          d.quote.map((r) => ({
            text: r.text,
            options: { color: r.hi ? BLUE : C.TXT, bold: true, breakLine: !!r.br }
          })),
          {
            x: s.X(680),
            y: s.Y(305),
            w: s.W(2184),
            h: s.H(148),
            ...H.txtOpts({ fs: s.FS(56), bold: true, align: "center", lsm: 1.34 })
          }
        );
        const section = (sec, bx, by, bw, bh) => {
          sl.addShape(pres.shapes.HEXAGON, {
            x: s.X(bx),
            y: s.Y(by),
            w: s.W(bw),
            h: s.H(bh),
            fill: { color: NAVY21 },
            line: { type: "none" },
            rotate: 90
          });
          H.text(sl, s, { x: bx, y: by, w: bw, h: bh }, {
            text: sec.no,
            fs: s.FS(40),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          H.vline(sl, s, { x: bx + bw + 32, y: by + 8, h: bh - 16 }, { pres, color: "A9AEB8", thick: 4 });
          H.text(sl, s, { x: bx + bw + 62, y: by, w: 1600, h: bh }, {
            text: sec.label,
            fs: s.FS(44),
            bold: true,
            color: C.TXT,
            align: "left"
          });
        };
        section(d.sec1, 90, 480, 73, 83);
        const CELL = [
          { x: 209, w: 979, fill: HD1 },
          { x: 1202, w: 798, fill: HD2 },
          { x: 2019, w: 1367, fill: HD3 }
        ];
        d.tblHead.forEach((t, i) => {
          sl.addShape(pres.shapes.RECTANGLE, {
            x: s.X(CELL[i].x),
            y: s.Y(574),
            w: s.W(CELL[i].w),
            h: s.H(82),
            fill: { color: CELL[i].fill },
            line: { type: "none" }
          });
          H.text(sl, s, { x: CELL[i].x, y: 574, w: CELL[i].w, h: 82 }, {
            text: t,
            fs: s.FS(48),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
        });
        const ROWY = [656, 766, 871, 989];
        d.tblRows.forEach((rw, i) => {
          const top = ROWY[i], bot = ROWY[i + 1], cy = (top + bot) / 2;
          if (i > 0) H.dline(sl, s, { x: 209, y: top, w: 3177 }, { pres, color: "CFD2D8" });
          sl.addShape(pres.shapes.HEXAGON, {
            x: s.X(127),
            y: s.Y(cy - 34),
            w: s.W(60),
            h: s.H(68),
            fill: { color: NAVY21 },
            line: { type: "none" },
            rotate: 90
          });
          H.text(sl, s, { x: 127, y: cy - 34, w: 60, h: 68 }, {
            text: rw.no,
            fs: s.FS(34),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          H.text(sl, s, { x: 294, y: top + 6, w: 880, h: bot - top - 12 }, {
            text: rw.name,
            fs: s.FS(46),
            bold: true,
            color: BLUE,
            align: "left",
            fit: true
          });
          H.text(sl, s, { x: 1210, y: top + 6, w: 782, h: bot - top - 12 }, {
            text: rw.ok,
            fs: s.FS(46),
            color: C.TXT,
            align: "center",
            fit: true
          });
          H.text(sl, s, { x: 2209, y: top + 6, w: 1170, h: bot - top - 12 }, {
            text: rw.gap,
            fs: s.FS(46),
            color: C.TXT,
            align: "left",
            fit: true
          });
        });
        H.hline(sl, s, { x: 209, y: 989, w: 3177 }, { pres, color: "C6C9CF", thick: 4 });
        H.roundRect(sl, s, { x: 95, y: 1068, w: 1410, h: 583 }, { pres, fill: PANEL21, rad: 30 });
        H.pill(sl, s, { x: 443, y: 1030, w: 710, h: 85 }, {
          pres,
          fill: NAVY21,
          text: d.leftHead,
          fs: s.FS(53),
          rad: 42
        });
        const FLOW = [
          { cx: 297, w: 380, by: 1226, sy: 1306 },
          { cx: 670, w: 300, ty: 1214, by: 1278 },
          { cx: 990, w: 260 },
          { cx: 1338, w: 380, ty: 1194, by: 1256, sy: 1340 }
        ];
        d.flow.forEach((f, i) => {
          const g = FLOW[i];
          if (f.circle) {
            sl.addShape(pres.shapes.OVAL, {
              x: s.X(895),
              y: s.Y(1205),
              w: s.W(190),
              h: s.H(190),
              fill: { color: C.WHITE },
              line: { color: "D5D8DE", width: 1 }
            });
            H.text(sl, s, { x: 895, y: 1205, w: 190, h: 190 }, {
              text: f.circle,
              fs: s.FS(50),
              bold: true,
              color: BLUE,
              align: "center",
              fit: true
            });
            return;
          }
          if (f.top) {
            H.text(sl, s, { x: g.cx - g.w / 2, y: g.ty, w: g.w, h: 52 }, {
              text: f.top,
              fs: s.FS(38),
              color: C.TXT,
              align: "center",
              fit: true
            });
          }
          sl.addText(
            [
              { text: f.big, options: { fontSize: s.FS(58), color: BLUE } },
              { text: f.unit, options: { fontSize: s.FS(36), color: BLUE } }
            ],
            {
              x: s.X(g.cx - g.w / 2),
              y: s.Y(g.by),
              w: s.W(g.w),
              h: s.H(72),
              ...H.txtOpts({ fs: s.FS(58), bold: true, color: BLUE, align: "center" })
            }
          );
          if (f.sub) {
            H.text(sl, s, { x: g.cx - g.w / 2, y: g.sy, w: g.w, h: 52 }, {
              text: f.sub,
              fs: s.FS(38),
              color: C.TXT,
              align: "center",
              fit: true
            });
          }
        });
        [471, 803, 1121].forEach((x) => {
          sl.addShape(pres.shapes.RIGHT_ARROW, {
            x: s.X(x),
            y: s.Y(1272),
            w: s.W(47),
            h: s.H(44),
            fill: { color: GOLD21 },
            line: { type: "none" }
          });
        });
        H.hline(sl, s, { x: 250, y: 1465, w: 1090 }, { pres, color: "CFD2D8", thick: 3 });
        [250, 1337].forEach((x) => H.vline(sl, s, { x, y: 1442, h: 26 }, { pres, color: "CFD2D8", thick: 3 }));
        H.vline(sl, s, { x: 793, y: 1465, h: 30 }, { pres, color: "CFD2D8", thick: 3 });
        H.text(sl, s, { x: 150, y: 1512, w: 1300, h: 70 }, {
          text: d.leftNote,
          fs: s.FS(42),
          color: C.TXT,
          align: "center",
          fit: true
        });
        H.roundRect(
          sl,
          s,
          { x: 1629, y: 1068, w: 1792, h: 590 },
          { pres, fill: C.WHITE, line: EDGE21, rad: 30 }
        );
        H.pill(sl, s, { x: 2138, y: 1030, w: 730, h: 85 }, {
          pres,
          fill: NAVY21,
          text: d.rightHead,
          fs: s.FS(53),
          rad: 42
        });
        const MC = [{ x: 1673, w: 772 }, { x: 2469, w: 907 }];
        d.methods.forEach((m, i) => {
          const g = MC[i];
          H.roundRect(
            sl,
            s,
            { x: g.x, y: 1136, w: g.w, h: 416 },
            { pres, fill: C.WHITE, line: EDGE21, rad: 20 }
          );
          const tw = 300, bx = g.x + g.w / 2 - tw / 2;
          sl.addShape(pres.shapes.HEXAGON, {
            x: s.X(bx),
            y: s.Y(1152),
            w: s.W(56),
            h: s.H(64),
            fill: { color: NAVY21 },
            line: { type: "none" },
            rotate: 90
          });
          H.text(sl, s, { x: bx, y: 1152, w: 56, h: 64 }, {
            text: m.no,
            fs: s.FS(32),
            bold: true,
            color: C.WHITE,
            align: "center"
          });
          H.text(sl, s, { x: bx + 70, y: 1152, w: g.w / 2 + 200, h: 64 }, {
            text: m.title,
            fs: s.FS(48),
            bold: true,
            color: BLUE,
            align: "left",
            fit: true
          });
          m.items.forEach((it, k) => {
            H.text(sl, s, { x: g.x + 20, y: 1236 + k * 98, w: g.w - 40, h: 70 }, {
              text: it,
              fs: s.FS(46),
              color: C.TXT,
              align: "center",
              fit: true
            });
            H.hline(
              sl,
              s,
              { x: g.x + 60, y: 1317 + k * 101, w: g.w - 120 },
              { pres, color: "E2E4E8", thick: 3 }
            );
          });
          sl.addShape(pres.shapes.DOWN_ARROW, {
            x: s.X(g.x + g.w / 2 - 22),
            y: s.Y(1428),
            w: s.W(44),
            h: s.H(34),
            fill: { color: "D3D6DC" },
            line: { type: "none" }
          });
          sl.addText(
            m.result.map((r) => ({
              text: r.text,
              options: { fontSize: r.big ? s.FS(58) : s.FS(48), color: m.strong ? BLUE : C.TXT }
            })),
            {
              x: s.X(g.x + 20),
              y: s.Y(1466),
              w: s.W(g.w - 40),
              h: s.H(72),
              ...H.txtOpts({ fs: s.FS(48), bold: !!m.strong, color: m.strong ? BLUE : C.TXT, align: "center" })
            }
          );
        });
        sl.addShape(pres.shapes.RECTANGLE, {
          x: s.X(1630),
          y: s.Y(1565),
          w: s.W(1660),
          h: s.H(83),
          fill: { color: GBAND },
          line: { type: "none" }
        });
        sl.addShape(pres.shapes.ISOSCELES_TRIANGLE, {
          x: s.X(3290),
          y: s.Y(1565),
          w: s.W(100),
          h: s.H(83),
          fill: { color: GBAND },
          line: { type: "none" },
          rotate: 90
        });
        H.text(sl, s, { x: 1630, y: 1565, w: 1660, h: 83 }, {
          text: d.goldBand,
          fs: s.FS(54),
          bold: true,
          color: C.WHITE,
          align: "center",
          fit: true
        });
        section(d.sec4, 90, 1693, 70, 80);
        const CARD = [{ x: 84, w: 781 }, { x: 880, w: 849 }, { x: 1744, w: 838 }, { x: 2600, w: 834 }];
        d.cards.forEach((cd, i) => {
          const g = CARD[i];
          H.roundRect(
            sl,
            s,
            { x: g.x, y: 1750, w: g.w, h: 352 },
            { pres, fill: C.WHITE, line: EDGE21, rad: 18 }
          );
          H.text(sl, s, { x: g.x, y: 1786, w: g.w, h: 70 }, {
            text: cd.title,
            fs: s.FS(44),
            bold: true,
            color: C.TXT,
            align: "center",
            fit: true
          });
          H.hline(sl, s, { x: g.x + 26, y: 1862, w: g.w - 52 }, { pres, color: "E6E8EC", thick: 3 });
          H.text(sl, s, { x: g.x + 0.04 * g.w, y: 1876, w: 0.4 * g.w, h: 56 }, {
            text: d.beforeLabel,
            fs: s.FS(34),
            color: C.TXT_SUB,
            align: "center",
            fit: true
          });
          H.text(sl, s, { x: g.x + 0.56 * g.w, y: 1876, w: 0.4 * g.w, h: 56 }, {
            text: d.afterLabel,
            fs: s.FS(34),
            color: C.TXT_SUB,
            align: "center",
            fit: true
          });
          H.hline(sl, s, { x: g.x + 26, y: 1937, w: g.w - 52 }, { pres, color: "E6E8EC", thick: 3 });
          H.text(sl, s, { x: g.x + 0.02 * g.w, y: 1952, w: 0.42 * g.w, h: 138 }, {
            text: cd.before,
            fs: s.FS(44),
            color: C.TXT,
            align: "center",
            lsm: 1.2
          });
          sl.addShape(pres.shapes.RIGHT_ARROW, {
            x: s.X(g.x + 0.46 * g.w),
            y: s.Y(1998),
            w: s.W(0.08 * g.w),
            h: s.H(44),
            fill: { color: GOLD21 },
            line: { type: "none" }
          });
          H.text(sl, s, { x: g.x + 0.56 * g.w, y: 1952, w: 0.42 * g.w, h: 138 }, {
            text: cd.after,
            fs: s.FS(44),
            bold: true,
            color: BLUE,
            align: "center",
            lsm: 1.2
          });
        });
        H.roundRect(sl, s, { x: 88, y: 2170, w: 3340, h: 260 }, { pres, fill: BAND21, rad: 44 });
        H.text(sl, s, { x: 200, y: 2200, w: 3116, h: 100 }, {
          text: d.band1,
          fs: s.FS(78),
          bold: true,
          color: C.WHITE,
          align: "center",
          fit: true
        });
        H.text(sl, s, { x: 200, y: 2312, w: 3116, h: 90 }, {
          text: d.band2,
          fs: s.FS(58),
          bold: true,
          color: "F5DC8E",
          align: "center",
          fit: true
        });
      };
    }
  });

  // slides/index.js
  var require_slides = __commonJS({
    "slides/index.js"(exports, module) {
      "use strict";
      module.exports = {
        s01: require_s01(),
        s02: require_s02(),
        s03: require_s03(),
        s04: require_s04(),
        s05: require_s05(),
        s06: require_s06(),
        s07: require_s07(),
        s08: require_s08(),
        s09: require_s09(),
        s10: require_s10(),
        s11: require_s11(),
        s12: require_s12(),
        s13: require_s13(),
        s14: require_s14(),
        s15: require_s15(),
        s16: require_s16(),
        s17: require_s17(),
        s18: require_s18(),
        s19: require_s19(),
        s20: require_s20(),
        s21: require_s21()
      };
    }
  });

  // web/presets.json
  var require_presets = __commonJS({
    "web/presets.json"(exports, module) {
      module.exports = [
        {
          key: "full",
          label: "\uBC1C\uCDCC 11\uC7A5",
          file: "2026_\uB0A9\uD488\uB300\uAE08\uC5F0\uB3D9\uC81C_\uC2E4\uD0DC\uC870\uC0AC_\uC81C\uC548\uC11C_\uBC1C\uCDCC11p.pptx",
          ids: ["s01", "s02", "s03", "s04", "s05", "s06", "s07", "s08", "s09", "s10", "s11"]
        },
        {
          key: "energy",
          label: "\uC5D0\uB108\uC9C0\uACBD\uBE44 \xB7 \uC791\uB3D9\uC9C0\uD45C 2\uC7A5",
          file: "2026_\uB0A9\uD488\uB300\uAE08\uC5F0\uB3D9\uC81C_\uC5D0\uB108\uC9C0\uACBD\uBE44_\uC791\uB3D9\uC9C0\uD45C_2p.pptx",
          ids: ["s12", "s13"]
        },
        {
          key: "matrix",
          label: "\uC5C5\uC885\uBCC4 \uBC00\uB3C4 \xB7 \uC751\uB2F5\uB09C\uC774\uB3C4 3\uC7A5",
          file: "2026_\uB0A9\uD488\uB300\uAE08\uC5F0\uB3D9\uC81C_\uC5C5\uC885\uBCC4\uBC00\uB3C4_\uC751\uB2F5\uB09C\uC774\uB3C4_3p.pptx",
          ids: ["s14", "s15", "s16"]
        },
        {
          key: "roadmap",
          label: "\uD310\uBCC4\uC870\uC0AC \u2192 2027 \uC2B9\uC778\uC5F0\uACC4 1\uC7A5",
          file: "2026_\uB0A9\uD488\uB300\uAE08\uC5F0\uB3D9\uC81C_\uD310\uBCC4\uC870\uC0AC_2027\uC2B9\uC778\uC5F0\uACC4_1p.pptx",
          ids: ["s17"]
        },
        {
          key: "outcome",
          label: "\uAE30\uB300\uC131\uACFC\xB7\uD65C\uC6A9 + \uD22C\uC785\uCCB4\uACC4 2\uC7A5",
          file: "2026_\uB0A9\uD488\uB300\uAE08\uC5F0\uB3D9\uC81C_\uAE30\uB300\uC131\uACFC\uD65C\uC6A9_\uD22C\uC785\uCCB4\uACC4_2p.pptx",
          ids: ["s18", "s19"]
        },
        {
          key: "extra",
          label: "\uCD94\uAC00 \uC81C\uC548 4\uC885 1\uC7A5",
          file: "2026_\uB0A9\uD488\uB300\uAE08\uC5F0\uB3D9\uC81C_\uCD94\uAC00\uC81C\uC5484\uC885_1p.pptx",
          ids: ["s20"]
        },
        {
          key: "search",
          label: "\uC801\uC6A9\uB300\uC0C1 \uD0D0\uC0C9\uBE44\uC6A9 1\uC7A5",
          file: "2026_\uB0A9\uD488\uB300\uAE08\uC5F0\uB3D9\uC81C_\uC801\uC6A9\uB300\uC0C1\uD0D0\uC0C9\uBE44\uC6A9_1p.pptx",
          ids: ["s21"]
        }
      ];
    }
  });

  // web/deck.js
  var require_deck = __commonJS({
    "web/deck.js"(exports, module) {
      var { SLIDE_W, SLIDE_H, C, scaler } = require_theme();
      var H = require_helpers();
      var FM = require_fontmetrics();
      var slides = require_slides();
      var PRESETS = require_presets();
      var ready = false;
      async function init(opts) {
        const o = opts || {};
        const res = await fetch(o.metricsUrl || "fonts/metrics.json");
        if (!res.ok) throw new Error(`\uD3F0\uD2B8 \uD3ED \uD45C\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uB2E4 (${res.status})`);
        FM.useTable(await res.json());
        FM.setStrict(true);
        H.setAssetBase(o.assetBase || "../assets");
        ready = true;
      }
      async function loadContent(url) {
        const res = await fetch(url || "api/content");
        if (!res.ok) throw new Error(`\uC6D0\uBB38\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uB2E4 (${res.status})`);
        return res.json();
      }
      function drawSlide(pres, sl, entry) {
        const draw = slides[entry.id];
        if (!draw) throw new Error(`\uB808\uC774\uC544\uC6C3 \uBAA8\uB4C8\uC774 \uC5C6\uB2E4: ${entry.id}`);
        draw({ pres, sl, s: scaler(entry.img[0], entry.img[1]), d: entry });
      }
      function pick(content, ids) {
        if (!ids || !ids.length) return content.slice();
        const want = new Set(ids);
        return content.filter((d) => want.has(d.id));
      }
      async function buildPptx(content, ids) {
        if (!ready) throw new Error("init() \uC744 \uBA3C\uC800 \uBD88\uB7EC\uC57C \uD55C\uB2E4");
        const PptxGenJS = window.PptxGenJS;
        if (!PptxGenJS) throw new Error("pptxgen.bundle.js \uAC00 \uB85C\uB4DC\uB418\uC9C0 \uC54A\uC558\uB2E4");
        const pres = new PptxGenJS();
        pres.defineLayout({ name: "NAMP", width: SLIDE_W, height: SLIDE_H });
        pres.layout = "NAMP";
        pres.author = "\uCF00\uC774\uC2A4\uD0EF\uB9AC\uC11C\uCE58";
        pres.company = "\uCF00\uC774\uC2A4\uD0EF\uB9AC\uC11C\uCE58";
        pres.title = "2026 \uB0A9\uD488\uB300\uAE08 \uC5F0\uB3D9\uC81C \uC2E4\uD0DC\uC870\uC0AC \uC81C\uC548\uC11C";
        for (const entry of pick(content, ids)) {
          const sl = pres.addSlide();
          sl.background = { color: C.WHITE };
          drawSlide(pres, sl, entry);
        }
        return pres.write({ outputType: "blob" });
      }
      async function download(content, ids, fileName) {
        const blob = await buildPptx(content, ids);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1e3);
        return blob.size;
      }
      module.exports = {
        init,
        loadContent,
        buildPptx,
        download,
        drawSlide,
        pick,
        PRESETS,
        SLIDE_W,
        SLIDE_H,
        C,
        scaler,
        FM,
        H,
        slides
      };
    }
  });
  return require_deck();
})();
