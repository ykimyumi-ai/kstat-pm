'use strict';
/**
 * content.json 의 값이 "화면에 찍히는 글자"인지 "서식·메타 표시자"인지 가른다.
 *
 * verify.py 의 원문 대조와 웹 편집기의 폼 생성이 같은 규칙을 써야 한다.
 * 한쪽만 글자로 보면 검증에서 새고, 다른 쪽만 메타로 보면 편집할 수 없다.
 *
 * **키 이름만으로 가르면 안 된다.** 실제로 그렇게 하다 원문 4건을 놓쳤다 —
 * `c` 는 s03 에서 색 이름('BLUE')이지만 s04 에서는 표의 세 번째 글자 칸이다.
 * 그래서 키와 값을 함께 본다.
 */

// 값과 무관하게 항상 메타
const ALWAYS_META = new Set(['id', 'options', 'fixes']);

// 값이 팔레트 이름이나 6자리 hex 일 때만 메타 (아니면 글자다)
const PALETTE_KEYS = new Set(['tone', 'accent', 'tint', 'c']);

// 값이 에셋 이름일 때만 메타
const ASSET_KEYS = new Set(['photo', 'icon', 'img2']);

// theme.js 의 팔레트 이름 + 슬라이드 로컬 톤 이름 + 날 hex
const PALETTE_VALUE = new RegExp(
  '^(NAVY|NAVY_DEEP|NAVY_LINE|BLUE|BLUE_TXT|BLUE_PALE|GOLD|GOLD_DEEP|SKY|DARK'
  + '|CREAM|PANEL|ROW_ALT|CARD|LINE|GRAY|GRAY_DARK|TXT|TXT_MID|TXT_SUB|WHITE)$'
  + '|^[0-9A-Fa-f]{6}$');

// assets/ 의 파일 이름 규칙 (s14-crane 처럼)
const ASSET_VALUE = /^s\d{2}-[a-z0-9-]+$/;

/**
 * 이 (키, 값) 쌍이 메타인가?
 * true 면 원문 대조 대상이 아니고 편집기에서도 글자로 다루지 않는다.
 */
function isMeta(key, value) {
  if (ALWAYS_META.has(key)) return true;
  // img 는 두 가지로 쓰인다 — 장 루트에서는 원본 캔버스 크기 [w, h],
  // 행 안에서는 사진 파일 이름. 둘 다 메타지만 모양이 달라 따로 본다.
  if (key === 'img') {
    if (Array.isArray(value)) {
      return value.length === 2 && value.every((n) => typeof n === 'number');
    }
    return typeof value === 'string' && ASSET_VALUE.test(value);
  }
  if (key === 'quoteStyle') return value === 'box';
  if (PALETTE_KEYS.has(key)) {
    return typeof value === 'string' && PALETTE_VALUE.test(value);
  }
  if (ASSET_KEYS.has(key)) {
    return typeof value === 'string' && ASSET_VALUE.test(value);
  }
  return false;
}

/** 한 장에서 화면에 찍히는 문자열을 전부 모은다. */
function displayStrings(node, out) {
  const acc = out || [];
  if (node === null || node === undefined) return acc;
  if (typeof node === 'string') { acc.push(node); return acc; }
  if (Array.isArray(node)) { node.forEach((v) => displayStrings(v, acc)); return acc; }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) {
      if (isMeta(k, node[k])) continue;
      displayStrings(node[k], acc);
    }
  }
  return acc;
}

/** 화면 글자를 경로와 함께 모은다 (편집기 폼용). */
function displayFields(node, out, path) {
  const acc = out || [];
  const p = path || [];
  if (node === null || node === undefined) return acc;
  if (typeof node === 'string') { acc.push({ path: p, value: node }); return acc; }
  if (Array.isArray(node)) {
    node.forEach((v, i) => displayFields(v, acc, p.concat(i)));
    return acc;
  }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) {
      if (isMeta(k, node[k])) continue;
      displayFields(node[k], acc, p.concat(k));
    }
  }
  return acc;
}

module.exports = { isMeta, displayStrings, displayFields };
