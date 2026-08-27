'use strict';
/**
 * 외부 실행파일 찾기 — LibreOffice · poppler · Python.
 *
 * 리눅스 컨테이너에서는 전부 PATH 에 있지만 윈도우에서는 설치 위치가 제각각이라
 * 흔한 자리를 직접 뒤진다. 한 곳에 모아 두어야 render·verify·server 가 갈리지 않는다.
 *
 * 환경변수로 못박을 수 있다: SOFFICE_BIN · PDFTOPPM_BIN · PYTHON_BIN
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const WIN = process.platform === 'win32';

/** PATH 에 있는지 which/where 로 묻는다 (실제로 실행해 보지 않는다) */
function onPath(cmd) {
  const probe = spawnSync(WIN ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  if (probe.status !== 0) return null;
  const first = String(probe.stdout).split(/\r?\n/).find(Boolean);
  return first ? first.trim() : null;
}

function firstExisting(paths) {
  return paths.find((p) => {
    try { return !!p && fs.statSync(p).isFile(); } catch (e) { return false; }
  }) || null;
}

/**
 * LibreOffice.
 * 윈도우에서는 soffice.exe 가 아니라 **soffice.com** 을 써야 한다 —
 * .exe 는 곧바로 되돌아와서 변환이 끝나기 전에 다음 단계가 시작된다.
 */
function soffice() {
  if (process.env.SOFFICE_BIN) return process.env.SOFFICE_BIN;
  if (!WIN) return onPath('soffice') || onPath('libreoffice');
  return onPath('soffice.com') || firstExisting([
    'C:\\Program Files\\LibreOffice\\program\\soffice.com',
    'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com',
    process.env.LOCALAPPDATA
      && path.join(process.env.LOCALAPPDATA, 'Programs\\LibreOffice\\program\\soffice.com'),
  ]);
}

/** poppler 의 pdftoppm — PDF 를 정확한 DPI 로 PNG 화한다 */
function pdftoppm() {
  if (process.env.PDFTOPPM_BIN) return process.env.PDFTOPPM_BIN;
  const onp = onPath(WIN ? 'pdftoppm.exe' : 'pdftoppm');
  if (onp) return onp;
  if (!WIN) return null;
  return firstExisting([
    process.env.USERPROFILE && path.join(process.env.USERPROFILE, 'scoop\\shims\\pdftoppm.exe'),
    'C:\\ProgramData\\chocolatey\\bin\\pdftoppm.exe',
  ]);
}

/** Python 3 — 윈도우에는 python3 가 없고 python 또는 py 런처다 */
function python() {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;
  for (const c of WIN ? ['python', 'py'] : ['python3', 'python']) {
    const p = onPath(c);
    if (!p) continue;
    const v = spawnSync(p, isPyLauncher(p) ? ['-3', '-V'] : ['-V'], { encoding: 'utf8' });
    if (v.status === 0 && /Python 3/.test(`${v.stdout}${v.stderr}`)) return p;
  }
  return null;
}

function isPyLauncher(bin) {
  return /(^|[\\/])py(\.exe)?$/i.test(bin || '');
}

/** py 런처는 -3 을 앞에 붙여야 3.x 가 뜬다 */
function pythonArgs(bin) {
  return isPyLauncher(bin) ? ['-3'] : [];
}

const HOWTO = {
  soffice: WIN
    ? 'LibreOffice: winget install TheDocumentFoundation.LibreOffice'
    : 'LibreOffice: apt install libreoffice  (또는 brew install --cask libreoffice)',
  pdftoppm: WIN
    ? 'poppler: scoop install poppler   (scoop 이 없으면 https://scoop.sh)'
    : 'poppler: apt install poppler-utils  (또는 brew install poppler)',
  python: WIN
    ? 'Python: winget install Python.Python.3.12   그다음  pip install python-pptx'
    : 'Python: apt install python3 python3-pip   그다음  pip install python-pptx',
};

module.exports = { WIN, soffice, pdftoppm, python, pythonArgs, onPath, HOWTO };
