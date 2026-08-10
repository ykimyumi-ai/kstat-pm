'use strict';
/**
 * namp-2026 디자인 시스템
 *
 * 원본 PDF(텍스트 레이어 없는 래스터 11장)에서 직접 추출한 커스텀 프리셋.
 * kstat-ppt 기존 8종 프리셋 중 일치하는 것이 없어 신규 정의했다(원칙 0).
 *
 * 좌표는 원본 이미지의 픽셀 값을 그대로 쓰고, 이 모듈이 인치로 환산한다.
 * 눈대중 배치를 배제하기 위한 장치이므로 슬라이드 코드에서는 항상 px 단위로 쓴다.
 */

// 슬라이드 규격: 원본 이미지 비율 3:2
const SLIDE_W = 11.0;
const SLIDE_H = 7.3333;

// 원본에서 샘플링한 컬러 팔레트 (# 없는 6자리 — kstat-ppt 규칙)
const C = {
  NAVY:      '053576',  // 라벨 pill · 번호 배지 · 섹션 헤더
  NAVY_DEEP: '052A77',  // 번호 사각 배지 · 진한 강조
  NAVY_LINE: '0B3070',  // 헤더 구분선
  BLUE_TXT:  '133784',  // 인용문 강조 · 수치 텍스트
  BLUE_PALE: 'E5EBF7',  // 옅은 파랑 박스
  GOLD:      'B08D4C',  // 보고 배지 · 강조 박스 · 타임라인 종점
  GOLD_DEEP: '9C7123',  // 로드맵 하단 바
  CREAM:     'EFE9D8',  // 프로세스 결과 박스 · 본실태조사 박스
  PANEL:     'F5F6F8',  // 큰 패널 배경
  ROW_ALT:   'F4F5F7',  // 행 교대 배경
  CARD:      'FFFFFF',  // 흰 카드
  LINE:      'DDE1E8',  // 옅은 구분선
  GRAY_DARK: '4E4E4E',  // 재단 연동제 DB 박스
  TXT:       '1A1A1A',  // 본문
  TXT_MID:   '333333',
  TXT_SUB:   '606060',  // 보조 · 각주
  WHITE:     'FFFFFF',
};

// kstat-ppt 표준 폰트
const FONT_B = 'KoPub돋움체 Bold';
const FONT_M = 'KoPub돋움체 Medium';

// 한글 글자 잉크 높이 ÷ em. KoPub돋움체 실측 + 원본 대조로 확정한 캘리브레이션 상수.
const INK_RATIO = 0.99;

// kstat-ppt 원칙 15 — 본문 최소 10pt
const MIN_PT = 10;

/**
 * 원본 이미지 크기별 px→inch 환산기를 만든다.
 *
 * 1~6·10장은 1536×1024(3:2)라 가로·세로 배율이 같다.
 * 7·8·9·11장은 원본이 A4 가로 비율(~1492×1054)이라 3:2로 옮기면
 * 세로가 약 6% 압축된다. 이때 폰트는 세로 배율을 따라야 글자가 넘치지 않는다.
 */
function scaler(imgW, imgH) {
  const kx = SLIDE_W / imgW;
  const ky = SLIDE_H / imgH;
  const r = (v) => Math.round(v * 1000) / 1000;
  return {
    imgW, imgH, kx, ky,
    X: (px) => r(px * kx),          // 가로 위치
    W: (px) => r(px * kx),          // 가로 크기
    Y: (px) => r(px * ky),          // 세로 위치
    H: (px) => r(px * ky),          // 세로 크기
    // 글자 크기: 원본에서 잰 한글 글자 잉크 높이(px)를 pt로 환산한다.
    // 계수 0.99 는 추정값이 아니라 실측 캘리브레이션 결과다 — 원본의 제목·부제·
    // 인용문·각주 4개 표본에 대해 KoPub돋움체 실제 메트릭으로 계산한 폭이
    // 원본 폭의 0.98~1.04배가 되도록 맞춘 값이다.
    // 원본의 초소형 주석은 10pt 미만이 되는데, kstat-ppt 원칙 15(최소 10pt)에
    // 따라 하한을 둔다. 그만큼 해당 주석은 원본보다 조금 커진다.
    FS: (inkPx) => Math.max(
      MIN_PT, Math.round((inkPx / INK_RATIO) * ky * 72 * 10) / 10),
    // 이미 pt로 정한 값을 세로 압축 비율만큼 줄일 때
    PT: (pt) => Math.round(pt * (ky / (SLIDE_H / 1024)) * 10) / 10,
  };
}

module.exports = { SLIDE_W, SLIDE_H, C, FONT_B, FONT_M, INK_RATIO, MIN_PT, scaler };
