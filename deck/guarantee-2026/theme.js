'use strict';
/**
 * guarantee-2026 디자인 시스템 — 소상공인 실태조사 인포그래픽(세로 4장)
 *
 * 원본은 텍스트 레이어가 없는 이미지 PDF 4장(768×1152pt = 10.667×16in, 2:3)이다.
 * 좌표는 150dpi 렌더(1600×2400px)의 픽셀을 그대로 쓰고 이 모듈이 인치로 바꾼다.
 * 눈대중 배치를 막기 위한 장치이므로 슬라이드 코드에서는 언제나 px 로 적는다.
 *
 * 앞의 namp-2026 덱과 판형·팔레트·시각 어휘가 전혀 달라 별도 덱으로 둔다.
 * 폰트 폭 계산(fontmetrics)만 그쪽 것을 공유한다.
 */

// 원본 그대로. 768×1152pt = 10.667×16in
const SLIDE_W = 10.667;
const SLIDE_H = 16.0;

// 실측 기준 이미지 크기 (pdftoppm -r 150)
const IMG_W = 1600;
const IMG_H = 2400;

// 원본에서 샘플링한 팔레트 (# 없는 6자리 — kstat-ppt 규칙)
const C = {
  NAVY_DEEP: '00337F',  // 장 번호 배지 · 하단 결론 밴드
  NAVY:      '0B3C88',  // 섹션 번호 배지 · 진한 제목
  BLUE_DEEP: '00449C',  // 막대 1단(가장 진한) · 도넛 주 색
  BLUE:      '1D6FBF',  // 막대 2단
  BLUE_MID:  '4E9BDD',  // 막대 3단
  BLUE_LT:   '7DC0F0',  // 막대 4단
  BLUE_PALE: 'B9DBF6',  // 막대 5단
  RING_BG:   'C5D9E8',  // 도넛 나머지 조각
  TINT:      'E8F1FB',  // 섹션 머리 옅은 배경 · 아이콘 원배경
  TINT_SOFT: 'F1F7FD',  // 메모 박스 배경
  CARD:      'FFFFFF',  // 흰 카드
  CARD_LINE: 'D8E5F2',  // 카드 테두리
  RULE:      'E6EEF7',  // 행 구분선
  BG:        'FBFCFE',  // 지면 배경
  TXT:       '1A1A1A',  // 본문
  TXT_MID:   '3A3A3A',
  TXT_SUB:   '6B7280',  // 보조 · 각주
  RED:       'E23B3B',  // 격차 강조 · '매우 악화'
  GOLD:      'D5A419',  // 1위 메달
  SILVER:    'A8B0BA',  // 2위 메달
  BRONZE:    'C97B32',  // 3위 메달
  GRAY:      'BFC6CF',  // 비활성 눈금
  WHITE:     'FFFFFF',
};

// kstat-ppt 표준 폰트
const FONT_B = 'KoPub돋움체 Bold';
const FONT_M = 'KoPub돋움체 Medium';

// 글자 잉크 높이 ÷ em.
// 추정이 아니라 실측이다 — KoPub돋움체 Bold 로 40·60pt 표본을 실제로 렌더해
// 잉크 높이를 재서 얻었다(한글 0.9375·0.95, 숫자 0.844·0.825).
// 원본의 좌표를 '잉크 높이'로 재고 이 비율로 되돌리면 글자가 같은 자리를 차지한다.
const INK_RATIO = 0.945;      // 한글
const INK_RATIO_DIGIT = 0.83; // 숫자·라틴 (대문자 높이라 한글보다 낮다)

// kstat-ppt 원칙 15 — 본문 최소 10pt.
// 이 덱은 지면이 16in 라 원본의 가장 작은 글자도 12pt 안팎이라 사실상 걸리지 않는다.
const MIN_PT = 10;

/** 원본 px → 인치 환산기. 가로·세로 배율이 같다(2:3 그대로). */
function scaler(imgW, imgH) {
  const w = imgW || IMG_W;
  const h = imgH || IMG_H;
  const kx = SLIDE_W / w;
  const ky = SLIDE_H / h;
  const r = (v) => Math.round(v * 1000) / 1000;
  return {
    imgW: w, imgH: h, kx, ky,
    X: (px) => r(px * kx),
    W: (px) => r(px * kx),
    Y: (px) => r(px * ky),
    H: (px) => r(px * ky),
    // 원본에서 잰 한글 글자 잉크 높이(px) → pt
    FS: (inkPx) => Math.max(
      MIN_PT, Math.round((inkPx / INK_RATIO) * ky * 72 * 10) / 10),
    // 숫자만 있는 줄(‘56.5’ 같은 큰 수치)은 대문자 높이로 재야 한다
    FSD: (inkPx) => Math.max(
      MIN_PT, Math.round((inkPx / INK_RATIO_DIGIT) * ky * 72 * 10) / 10),
    // 이미 px 로 정한 길이를 pt 로 (선 두께 등)
    PT: (px) => Math.round(px * ky * 72 * 100) / 100,
  };
}

module.exports = {
  SLIDE_W, SLIDE_H, IMG_W, IMG_H, C, FONT_B, FONT_M,
  INK_RATIO, INK_RATIO_DIGIT, MIN_PT, scaler,
};
