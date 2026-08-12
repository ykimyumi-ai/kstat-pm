'use strict';
/**
 * 웹 편집기의 덱 엔진 — CLI(build.js)와 **같은 코드**로 PPTX 를 만든다.
 *
 * 브라우저와 노드가 갈리는 지점은 셋뿐이라 여기서 전부 흡수한다.
 *   1) 폰트 폭   — TTF 대신 tools/gen-metrics.js 가 만든 표를 주입
 *   2) assets    — 파일 경로 대신 URL
 *   3) pptxgenjs — 벤더가 제공하는 브라우저 번들(window.PptxGenJS)을 쓴다
 *
 * 슬라이드 레이아웃 코드(slides/*.js)와 helpers/theme 은 한 줄도 고치지 않는다.
 * 그래야 웹에서 뽑은 PPTX 가 CLI 산출물과 같아진다.
 */
const { SLIDE_W, SLIDE_H, C, scaler } = require('../theme');
const H = require('../helpers');
const FM = require('../fontmetrics');
const slides = require('../slides');

const PRESETS = require('./presets.json');

let ready = false;

/**
 * 폰트 폭 표와 assets 위치를 걸어 준다. 무엇이든 그리기 전에 한 번 불러야 한다.
 * assetBase 는 서버가 assets/ 를 서빙하는 URL.
 */
async function init(opts) {
  const o = opts || {};
  const res = await fetch(o.metricsUrl || 'fonts/metrics.json');
  if (!res.ok) throw new Error(`폰트 폭 표를 불러오지 못했다 (${res.status})`);
  FM.useTable(await res.json());
  FM.setStrict(true);   // 표가 없으면 조용히 근사하지 말고 멈춘다
  H.setAssetBase(o.assetBase || '../assets');
  ready = true;
}

/** 현재 서버에 저장된 원문을 가져온다. */
async function loadContent(url) {
  const res = await fetch(url || 'api/content');
  if (!res.ok) throw new Error(`원문을 불러오지 못했다 (${res.status})`);
  return res.json();
}

/**
 * 한 장을 그린다. drawTo 가 받는 pres/sl 은 pptxgenjs 일 수도, SVG 백엔드일 수도 있다
 * — 슬라이드 코드는 addShape/addText/addImage 만 쓰므로 둘 다 통한다.
 */
function drawSlide(pres, sl, entry) {
  const draw = slides[entry.id];
  if (!draw) throw new Error(`레이아웃 모듈이 없다: ${entry.id}`);
  draw({ pres, sl, s: scaler(entry.img[0], entry.img[1]), d: entry });
}

/** content 배열에서 id 목록에 해당하는 장만 골라 순서대로 돌려준다. */
function pick(content, ids) {
  if (!ids || !ids.length) return content.slice();
  const want = new Set(ids);
  return content.filter((d) => want.has(d.id));
}

/**
 * PPTX 를 만들어 Blob 으로 돌려준다. build.js 와 같은 순서·같은 메타데이터를 쓴다.
 */
async function buildPptx(content, ids) {
  if (!ready) throw new Error('init() 을 먼저 불러야 한다');
  const PptxGenJS = window.PptxGenJS;
  if (!PptxGenJS) throw new Error('pptxgen.bundle.js 가 로드되지 않았다');

  const pres = new PptxGenJS();
  pres.defineLayout({ name: 'NAMP', width: SLIDE_W, height: SLIDE_H });
  pres.layout = 'NAMP';
  pres.author = '케이스탯리서치';
  pres.company = '케이스탯리서치';
  pres.title = '2026 납품대금 연동제 실태조사 제안서';

  for (const entry of pick(content, ids)) {
    const sl = pres.addSlide();
    sl.background = { color: C.WHITE };
    drawSlide(pres, sl, entry);
  }
  return pres.write({ outputType: 'blob' });
}

/** 만든 PPTX 를 브라우저에서 내려받는다. */
async function download(content, ids, fileName) {
  const blob = await buildPptx(content, ids);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return blob.size;
}

module.exports = {
  init, loadContent, buildPptx, download, drawSlide, pick,
  PRESETS, SLIDE_W, SLIDE_H, C, scaler, FM, H, slides,
};
