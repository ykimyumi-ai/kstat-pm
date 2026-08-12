'use strict';
/* global Deck */
/**
 * 편집기 화면 — 21장 목록 / SVG 미리보기 / 필드 폼 3분할.
 *
 * 폼은 장별로 만들지 않는다. 21장의 편집 대상 키가 157종이고 대부분 그 장에만
 * 나오기 때문이다. 대신 content 를 재귀로 훑어 문자열마다 입력칸을 내고,
 * labels.json 으로 이름만 한국어로 바꾼다.
 */
(function () {
  var S = {
    content: null,      // 현재 편집 중인 원문
    saved: null,        // 서버에 저장된 상태 (되돌리기·변경 표시용)
    version: null,
    idx: 0,
    labels: {},
    editor: localStorage.getItem('deck-editor') || '',
    baseWarn: {},       // 장별 기준선 경고 수 (내 편집이 새로 만든 것만 부각)
    dirty: false,
  };

  var $ = function (s) { return document.querySelector(s); };
  var el = function (tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  };

  function label(key) {
    return Object.prototype.hasOwnProperty.call(S.labels, key) ? S.labels[key] : key;
  }
  function getAt(obj, path) {
    return path.reduce(function (o, k) { return o[k]; }, obj);
  }
  function setAt(obj, path, val) {
    var o = obj;
    for (var i = 0; i < path.length - 1; i++) o = o[path[i]];
    o[path[path.length - 1]] = val;
  }

  // ── 미리보기 ───────────────────────────────────────────────
  function renderPreview() {
    var d = S.content[S.idx];
    var host = $('#stage');
    var out;
    try {
      out = Deck.renderSlideSvg(d);
    } catch (e) {
      host.innerHTML = '<p class="err">그리기 실패: ' + e.message + '</p>';
      return;
    }
    host.innerHTML = out.svg;
    var base = S.baseWarn[d.id] === undefined ? out.warnings.length : S.baseWarn[d.id];
    if (S.baseWarn[d.id] === undefined) S.baseWarn[d.id] = out.warnings.length;
    var added = out.warnings.length - base;
    var box = $('#warn');
    box.innerHTML = '';
    if (out.warnings.length) {
      var h = el('div', 'warn-head', added > 0
        ? '넘침 ' + out.warnings.length + '건 (내 편집으로 ' + added + '건 늘었다)'
        : '넘침 ' + out.warnings.length + '건 — 편집 전부터 있던 것');
      h.classList.add(added > 0 ? 'bad' : 'muted');
      box.appendChild(h);
      out.warnings.forEach(function (w) {
        box.appendChild(el('div', 'warn-item',
          w.nLines + '줄 / 칸은 ' + w.maxLines + '줄  ·  ' + w.text));
      });
    }
    $('#opcount').textContent = out.opCount + '개 도형·글자';
    hookPreviewClicks();
  }

  /**
   * 미리보기 글자 ↔ 입력칸 연결.
   * 슬라이드 코드에 추적을 심을 수 없으므로 글자 내용으로 되짚는다.
   * 편집 대상 문자열은 대부분 유일해서 이 정도로 충분하다.
   */
  function hookPreviewClicks() {
    var texts = $('#stage').querySelectorAll('text');
    Array.prototype.forEach.call(texts, function (t) {
      t.style.cursor = 'pointer';
      t.onclick = function () {
        var v = t.textContent.trim();
        if (!v) return;
        var hit = null;
        document.querySelectorAll('#form textarea').forEach(function (ta) {
          if (!hit && ta.value.indexOf(v) > -1) hit = ta;
        });
        if (hit) {
          hit.focus();
          hit.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      };
    });
  }

  // ── 폼 ────────────────────────────────────────────────────
  function buildForm() {
    var d = S.content[S.idx];
    var savedSlide = S.saved[S.idx];
    var form = $('#form');
    form.innerHTML = '';

    var fields = Deck.fieldkinds.displayFields(d);
    if (!fields.length) {
      form.appendChild(el('p', 'muted', '이 장에는 편집할 글자가 없다.'));
      return;
    }

    var lastTop = null;
    fields.forEach(function (f) {
      var top = f.path[0];
      if (top !== lastTop) {
        form.appendChild(el('h3', null, label(top)));
        lastTop = top;
      }
      var wrap = el('div', 'field');
      var crumbs = f.path.slice(1).map(function (p) {
        return typeof p === 'number' ? '#' + (p + 1) : label(p);
      }).join(' · ');
      // 최상위 필드 하나뿐이면 섹션 제목과 같은 말을 두 번 쓰지 않는다
      if (crumbs) wrap.appendChild(el('label', 'crumb', crumbs));

      var ta = el('textarea');
      ta.value = f.value;
      ta.rows = Math.min(6, Math.max(1, Math.ceil(f.value.length / 34)));
      var was = getAt(savedSlide, f.path);
      if (was !== f.value) wrap.classList.add('changed');

      ta.oninput = function () {
        setAt(S.content[S.idx], f.path, ta.value);
        wrap.classList.toggle('changed', ta.value !== was);
        S.dirty = true;
        clearTimeout(ta._t);
        ta._t = setTimeout(function () { renderPreview(); markDirty(); }, 180);
      };
      ta.onfocus = function () { highlight(ta.value); };
      wrap.appendChild(ta);

      if (was !== f.value) {
        var undo = el('button', 'mini', '되돌리기');
        undo.onclick = function () {
          ta.value = was;
          ta.oninput();
          wrap.classList.remove('changed');
        };
        wrap.appendChild(undo);
      }
      form.appendChild(wrap);
    });
  }

  function highlight(value) {
    var v = String(value || '').trim();
    $('#stage').querySelectorAll('text').forEach(function (t) {
      var on = v && t.textContent.indexOf(v) > -1;
      t.style.outline = on ? '2px solid #d0a544' : '';
      t.setAttribute('opacity', on || !v ? '1' : '1');
    });
  }

  // ── 목록·상태 ─────────────────────────────────────────────
  function buildList() {
    var list = $('#list');
    list.innerHTML = '';
    S.content.forEach(function (d, i) {
      var row = el('div', 'slide' + (i === S.idx ? ' on' : ''));
      row.appendChild(el('span', 'sid', d.id));
      row.appendChild(el('span', 'stitle', d.title || d.eyebrow || ''));
      if (JSON.stringify(d) !== JSON.stringify(S.saved[i])) row.appendChild(el('span', 'dot'));
      row.onclick = function () { S.idx = i; buildList(); buildForm(); renderPreview(); };
      list.appendChild(row);
    });
  }

  function markDirty() {
    var n = S.content.filter(function (d, i) {
      return JSON.stringify(d) !== JSON.stringify(S.saved[i]);
    }).length;
    $('#save').disabled = n === 0;
    $('#save').textContent = n ? '저장 (' + n + '장 변경)' : '저장';
    buildList();
  }

  // ── 저장·다운로드 ─────────────────────────────────────────
  function save() {
    if (!S.editor) {
      S.editor = (prompt('편집자 이름을 적어 주세요 (저장 이력에 남습니다)') || '').trim();
      if (!S.editor) return;
      localStorage.setItem('deck-editor', S.editor);
    }
    $('#save').disabled = true;
    fetch('api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      // 편집자 이름을 헤더로 보내면 한글에서 fetch 가 거부된다(ISO-8859-1 제한)
      body: JSON.stringify({ baseVersion: S.version, content: S.content, editor: S.editor }),
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; });
    }).then(function (r) {
      if (r.status === 409) {
        alert('다른 사람이 먼저 저장했습니다 (' + r.j.savedAt + ').\n'
          + '새로고침해서 최신본을 받은 뒤 다시 편집해 주세요.');
        return;
      }
      if (r.status === 422) { alert(r.j.error); return; }
      if (!r.ok) { alert('저장 실패: ' + (r.j.error || r.status)); return; }
      S.version = r.j.version;
      S.saved = JSON.parse(JSON.stringify(S.content));
      S.dirty = false;
      toast('저장했습니다');
      markDirty(); buildForm();
    }).catch(function (e) { alert('저장 실패: ' + e.message); });
  }

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    setTimeout(function () { t.classList.remove('on'); }, 2200);
  }

  function buildDownloads() {
    var box = $('#dl');
    box.innerHTML = '';
    Deck.PRESETS.forEach(function (p) {
      var b = el('button', 'ghost', p.label);
      b.onclick = function () {
        b.disabled = true;
        Deck.download(S.content, p.ids, p.file)
          .then(function () { b.disabled = false; toast(p.file + ' 내려받았습니다'); })
          .catch(function (e) { b.disabled = false; alert('실패: ' + e.message); });
      };
      box.appendChild(b);
    });
    var cur = el('button', 'ghost', '이 장만');
    cur.onclick = function () {
      var d = S.content[S.idx];
      Deck.download(S.content, [d.id], d.id + '.pptx').catch(function (e) { alert(e.message); });
    };
    box.appendChild(cur);
  }

  function verify() {
    var btn = $('#verify');
    btn.disabled = true;
    btn.textContent = '검증 중…';
    var ids = S.content.map(function (d) { return d.id; });
    Deck.buildPptx(S.content, ids).then(function (blob) {
      return fetch('api/verify?ids=' + ids.join(','), { method: 'POST', body: blob });
    }).then(function (r) { return r.json(); }).then(function (j) {
      btn.disabled = false; btn.textContent = '검증 실행';
      $('#warn').innerHTML = '<pre class="report">' + (j.output || j.error || '') + '</pre>';
    }).catch(function (e) {
      btn.disabled = false; btn.textContent = '검증 실행';
      alert('검증 실패: ' + e.message);
    });
  }

  // ── 시작 ──────────────────────────────────────────────────
  Promise.all([
    Deck.init({ metricsUrl: 'fonts/metrics.json', assetBase: 'assets' }),
    fetch('labels.json').then(function (r) { return r.json(); }),
    fetch('api/content').then(function (r) { return r.json(); }),
  ]).then(function (r) {
    S.labels = r[1];
    S.content = r[2].content;
    S.saved = JSON.parse(JSON.stringify(S.content));
    S.version = r[2].version;
    $('#meta').textContent = S.content.length + '장 · ' + r[2].savedAt.slice(0, 16).replace('T', ' ');
    buildList(); buildForm(); renderPreview(); buildDownloads(); markDirty();
    $('#save').onclick = save;
    $('#verify').onclick = verify;
    window.onbeforeunload = function () { return S.dirty ? '저장하지 않은 편집이 있습니다.' : undefined; };
  }).catch(function (e) {
    document.body.innerHTML = '<p style="padding:24px;color:#f88">시작 실패: ' + e.message + '</p>';
  });
}());
