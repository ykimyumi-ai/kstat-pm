#!/usr/bin/env python3
"""훅 알림 냉각 모듈: 같은 알림을 짧은 시간 안에 반복해서 내보내지 않게 한다.

훅이 같은 문구를 반복하면 그때마다 모델이 깨어나 전체 컨텍스트를 다시 읽는다.
이 모듈은 (훅 이름, 키) 조합이 냉각 시간 안에 이미 나갔는지 판정한다.

사용 예 (로컬 훅 맨 위):
    sys.path.insert(0, r"E:/클로드작업/_AGENT/tools")
    from hook_throttle import should_fire
    if not should_fire("audit_gate", 대상집합_문자열):
        sys.exit(0)          # 같은 알림은 30분에 1회만

상태 파일은 임시 폴더에 둔다(환경 변수 KSTAT_TOKEN_GUARD_DIR 로 바꿀 수 있다).
상태를 읽거나 쓰지 못하면 True(알림 허용)를 돌려준다. 훅 고장이 작업을 멈추지 않게 한다.
"""
import hashlib
import json
import os
import tempfile
import time
from pathlib import Path

DEFAULT_COOLDOWN_SEC = 1800
_KEEP_SEC = 86400  # 하루 지난 기록은 정리한다


def state_dir() -> Path:
    d = os.environ.get("KSTAT_TOKEN_GUARD_DIR")
    return Path(d) if d else Path(tempfile.gettempdir())


def _path(hook_name: str) -> Path:
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in hook_name)[:60]
    return state_dir() / f"kstat_throttle_{safe}.json"


def should_fire(hook_name: str, key: str, cooldown_sec: int = DEFAULT_COOLDOWN_SEC, now: float | None = None) -> bool:
    """냉각 시간 안에 같은 (hook_name, key)가 이미 나갔으면 False, 아니면 True를 돌려주고 기록한다."""
    try:
        t = time.time() if now is None else now
        h = hashlib.sha1(str(key).encode("utf-8", "ignore")).hexdigest()[:16]
        p = _path(hook_name)
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            if not isinstance(data, dict):
                data = {}
        except Exception:
            data = {}
        last = data.get(h)
        if isinstance(last, (int, float)) and 0 <= t - last < cooldown_sec:
            return False
        data[h] = t
        data = {k: v for k, v in data.items() if isinstance(v, (int, float)) and t - v < _KEEP_SEC}
        p.write_text(json.dumps(data), encoding="utf-8")
        return True
    except Exception:
        return True
