'use strict';
/**
 * 네이티브 차트 래퍼 — 이 덱의 그래프는 전부 여기를 지난다.
 *
 * 왜 네이티브 차트인가: pptxgenjs 는 차트마다
 * `ppt/embeddings/Microsoft_Excel_Worksheet*.xlsx` 를 함께 넣는다. 그래서
 * 파워포인트에서 차트를 고른 뒤 "데이터 편집"을 누르면 엑셀이 열리고, 값을 고치면
 * 막대 길이와 값 라벨이 함께 바뀐다. 도형으로 그리면 이게 안 된다.
 *
 * 왜 래퍼인가: 이 덱에 차트가 18개다. 장마다 옵션을 손으로 붙이면 반드시 갈린다.
 * 원본 서식(축·눈금선·범례 없음, 값마다 다른 블루, 라벨은 막대 끝 바깥)을
 * 함수로 굳혀 둔다.
 *
 * ── 좌표 규약 ────────────────────────────────────────────────
 * box 는 **막대가 그려질 영역 + 값 라벨 자리**만 덮는다.
 * 항목 이름(‘매출 변화’)과 아이콘은 차트 밖 네이티브 글자·이미지로 따로 놓는다.
 * 축 라벨을 차트에 맡기면 파워포인트가 라벨 칸 폭을 제 마음대로 잡아 원본과
 * 어긋나기 때문이다. 값은 차트가 그리므로 데이터를 고치면 숫자도 함께 바뀐다.
 */
const { C, FONT_B } = require('./theme');

/** 축·눈금선·범례·배경을 모두 지운 공통 바탕. 카드 위에 투명하게 얹힌다. */
function base(bg) {
  // 배경은 투명 대신 '얹히는 면과 같은 색'으로 채운다.
  // kstat-ppt 는 transparency 를 금지한다(PPT 손상 이력).
  const fill = { color: bg || C.WHITE };
  return {
    showLegend: false,
    showTitle: false,
    chartArea: { fill },
    plotArea: { fill },
    catAxisHidden: true,
    valAxisHidden: true,
    catAxisLineShow: false,
    valAxisLineShow: false,
    catGridLine: { style: 'none' },
    valGridLine: { style: 'none' },
    dataLabelFontFace: FONT_B,
    border: { pt: 0, color: 'FFFFFF' },
  };
}

/**
 * 가로 막대 — 원본은 위에서부터 큰 값 순이다.
 * 네이티브 가로 막대는 첫 항목을 맨 아래에 그리므로 배열을 뒤집어 넣는다.
 * (catAxisOrientation:'maxMin' 은 타입 정의상 없는 값이라 쓰지 않는다.)
 *
 *   cats   항목 이름 (화면에는 안 나오지만 엑셀 표의 행 이름이 된다)
 *   vals   값
 *   colors 값마다의 색. 단일 계열 막대는 chartColors 가 데이터 포인트마다 적용된다.
 *   max    값축 최댓값. 원본의 막대 길이 비율을 그대로 내려면 실측해서 넘긴다.
 *   barH·pitch  막대 두께와 행 간격(px). 둘로 막대 사이 여백을 역산한다.
 */
function hbar(sl, s, pres, box, o) {
  const gap = o.barH && o.pitch
    ? Math.max(0, Math.round(((o.pitch - o.barH) / o.barH) * 100))
    : (o.gap === undefined ? 60 : o.gap);
  sl.addChart(pres.charts.BAR, [{
    name: o.name || '값',
    labels: o.cats.slice().reverse(),
    values: o.vals.slice().reverse(),
  }], {
    x: s.X(box.x), y: s.Y(box.y), w: s.W(box.w), h: s.H(box.h),
    ...base(o.bg),
    barDir: 'bar',
    barGapWidthPct: gap,
    chartColors: o.colors.slice().reverse(),
    valAxisMinVal: 0,
    valAxisMaxVal: o.max,
    showValue: o.showValue !== false,
    dataLabelPosition: 'outEnd',
    dataLabelFormatCode: o.fmt || '0.0"%"',
    dataLabelFontSize: o.valFs,
    dataLabelColor: o.valColor || C.BLUE_DEEP,
    dataLabelFontBold: true,
  });
}

/**
 * 세로 막대 (3장 ‘자금 운용 상황 변화’ 2개 막대).
 * 값 라벨은 막대 위 바깥에 붙는다.
 */
function colBar(sl, s, pres, box, o) {
  const gap = o.barW && o.pitch
    ? Math.max(0, Math.round(((o.pitch - o.barW) / o.barW) * 100))
    : (o.gap === undefined ? 60 : o.gap);
  sl.addChart(pres.charts.BAR, [{
    name: o.name || '값', labels: o.cats, values: o.vals,
  }], {
    x: s.X(box.x), y: s.Y(box.y), w: s.W(box.w), h: s.H(box.h),
    ...base(o.bg),
    barDir: 'col',
    barGapWidthPct: gap,
    chartColors: o.colors,
    valAxisMinVal: o.min === undefined ? 0 : o.min,
    valAxisMaxVal: o.max,
    showValue: o.showValue !== false,
    dataLabelPosition: 'outEnd',
    dataLabelFormatCode: o.fmt || '0.00"점"',
    dataLabelFontSize: o.valFs,
    dataLabelColor: o.valColor || C.BLUE_DEEP,
    dataLabelFontBold: true,
  });
}

/**
 * 두 계열 가로 막대 (3장 ‘중요도–만족도’).
 * 계열마다 색이 하나씩이므로 chartColors 는 계열 수만큼 준다.
 */
function dualBar(sl, s, pres, box, o) {
  sl.addChart(pres.charts.BAR, o.series.map((se) => ({
    name: se.name,
    labels: o.cats.slice().reverse(),
    values: se.vals.slice().reverse(),
  })), {
    x: s.X(box.x), y: s.Y(box.y), w: s.W(box.w), h: s.H(box.h),
    ...base(o.bg),
    barDir: 'bar',
    barGrouping: 'clustered',
    barGapWidthPct: o.gap === undefined ? 40 : o.gap,
    barOverlapPct: o.overlap === undefined ? 0 : o.overlap,
    chartColors: o.series.map((se) => se.color),
    valAxisMinVal: 0,
    valAxisMaxVal: o.max,
    showValue: true,
    dataLabelPosition: 'outEnd',
    dataLabelFormatCode: o.fmt || '0.00',
    dataLabelFontSize: o.valFs,
    dataLabelColor: o.valColor || C.BLUE_DEEP,
    dataLabelFontBold: true,
  });
}

/**
 * 도넛.
 *
 * 원본은 큰 콜아웃 숫자(41.0% 등)를 링 바깥 정해진 자리에 크게 놓는다.
 * 네이티브 차트의 데이터 라벨은 그 자리에 놓을 수 없어 **라벨은 끄고** 콜아웃은
 * 슬라이드 글자로 따로 둔다. 데이터를 고치면 링은 바뀌지만 콜아웃 숫자는
 * 함께 바뀌지 않는다 — 이 덱에서 유일하게 남는 수동 항목이다(README 에 명시).
 *
 *   firstAng  첫 조각이 시작하는 각도(12시=0, 시계방향)
 *   hole      구멍 지름 비율(%)
 */
function donut(sl, s, pres, box, o) {
  sl.addChart(pres.charts.DOUGHNUT, [{
    name: o.name || '비율', labels: o.cats, values: o.vals,
  }], {
    x: s.X(box.x), y: s.Y(box.y), w: s.W(box.w), h: s.H(box.h),
    ...base(o.bg),
    holeSize: o.hole === undefined ? 50 : o.hole,
    firstSliceAng: o.firstAng || 0,
    chartColors: o.colors,
    showValue: false,
    dataBorder: o.border ? { pt: o.border, color: C.WHITE } : { pt: 0, color: 'FFFFFF' },
  });
}

module.exports = { hbar, colBar, dualBar, donut };
