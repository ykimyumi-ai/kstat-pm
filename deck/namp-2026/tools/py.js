'use strict';
/**
 * Python 스크립트를 플랫폼에 관계없이 돌린다.
 *
 * 리눅스는 python3, 윈도우는 python 또는 py -3 다. npm 스크립트에 python3 를
 * 박아 두면 윈도우에서 통째로 안 돈다.
 *
 * 사용: node tools/py.js verify.py [인자...]
 */
const { spawnSync } = require('child_process');
const env = require('./env');

const bin = env.python();
if (!bin) {
  console.error(`\n  Python 3 을 찾지 못했다.\n  ${env.HOWTO.python}\n`
    + '  이미 설치했다면 PYTHON_BIN 으로 지정할 것.\n');
  process.exit(1);
}
const r = spawnSync(bin, [...env.pythonArgs(bin), ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
