'use strict';
/**
 * 슬라이드 레이아웃 모듈 정적 맵.
 *
 * build.js 가 `require('./slides/' + id)` 로 동적 로드하면 번들러(esbuild)가
 * 정적으로 해석하지 못해 웹 편집기 번들에 슬라이드가 들어가지 않는다.
 * 여기에 한 번 나열해 두면 CLI 와 브라우저가 같은 경로를 쓴다.
 */
module.exports = {
  s01: require('./s01'),
  s02: require('./s02'),
  s03: require('./s03'),
  s04: require('./s04'),
  s05: require('./s05'),
  s06: require('./s06'),
  s07: require('./s07'),
  s08: require('./s08'),
  s09: require('./s09'),
  s10: require('./s10'),
  s11: require('./s11'),
  s12: require('./s12'),
  s13: require('./s13'),
  s14: require('./s14'),
  s15: require('./s15'),
  s16: require('./s16'),
  s17: require('./s17'),
  s18: require('./s18'),
  s19: require('./s19'),
  s20: require('./s20'),
  s21: require('./s21'),
};
