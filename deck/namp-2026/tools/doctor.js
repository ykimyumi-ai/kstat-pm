'use strict';
/**
 * 이 PC 에서 덱을 돌릴 수 있는지 점검한다. 없는 것만 설치 방법을 알려 준다.
 * 사용: npm run doctor
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const env = require('./env');

const NAMP = path.join(__dirname, '..');
let bad = 0;

function line(ok, name, detail, howto) {
  console.log(`  ${ok ? '✅' : '❌'} ${name.padEnd(16)} ${detail}`);
  if (!ok) { bad += 1; if (howto) console.log(`     → ${howto}`); }
}

console.log(`\n  플랫폼: ${process.platform} / Node ${process.version}\n`);

line(Number(process.versions.node.split('.')[0]) >= 18, 'Node',
  process.version, 'Node 18 이상: https://nodejs.org');

const so = env.soffice();
line(!!so, 'LibreOffice', so || '없음 — 원본 대조 렌더를 못 한다', env.HOWTO.soffice);

const pt = env.pdftoppm();
line(!!pt, 'poppler', pt || '없음 — PDF→PNG 를 못 한다', env.HOWTO.pdftoppm);

const py = env.python();
line(!!py, 'Python 3', py || '없음 — verify.py·실측 도구를 못 돌린다', env.HOWTO.python);

if (py) {
  const r = spawnSync(py, [...env.pythonArgs(py), '-c',
    'import pptx,sys;sys.stdout.write(pptx.__version__)'], { encoding: 'utf8' });
  line(r.status === 0, 'python-pptx', r.status === 0 ? r.stdout.trim() : '없음',
    `${py} -m pip install python-pptx`);
}

const mods = path.join(NAMP, 'node_modules', 'pptxgenjs');
line(fs.existsSync(mods), 'pptxgenjs',
  fs.existsSync(mods) ? '설치됨' : '없음', 'deck/namp-2026 에서 npm install');

// KoPub돋움체 — 렌더와 파워포인트가 같은 글꼴을 써야 줄바꿈이 일치한다
let fontOk = false;
let fontHow = '';
if (env.WIN) {
  const dirs = [path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft\\Windows\\Fonts')];
  fontOk = dirs.some((d) => {
    try { return fs.readdirSync(d).some((f) => /kopub/i.test(f)); } catch (e) { return false; }
  });
  fontHow = 'KoPub돋움체 설치 (https://www.kopus.org/biz/electronic/font.aspx) — 사내 PC엔 이미 있을 수 있다';
} else {
  const r = spawnSync('fc-list', [':', 'family'], { encoding: 'utf8' });
  fontOk = r.status === 0 && /KoPub/i.test(r.stdout);
  fontHow = 'KoPub돋움체를 시스템 글꼴로 설치';
}
line(fontOk, 'KoPub돋움체', fontOk ? '설치됨' : '없음 — 렌더 줄바꿈이 실제와 달라진다', fontHow);

console.log(bad
  ? `\n  ${bad}건 빠졌다. 위 안내대로 설치한 뒤 다시 실행할 것.\n`
  : '\n  전부 준비됐다. npm run build 부터 시작하면 된다.\n');
process.exit(bad ? 1 : 0);
