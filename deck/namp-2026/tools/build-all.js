'use strict';
/** 7개 프리셋을 차례로 빌드한다. sh 의 for 루프를 대신한다(윈도우 대응). */
const { spawnSync } = require('child_process');
const PRESETS = ['full', 'energy', 'matrix', 'roadmap', 'outcome', 'extra', 'search'];
for (const k of PRESETS) {
  const r = spawnSync(process.execPath, ['build.js', '--preset', k], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
}
