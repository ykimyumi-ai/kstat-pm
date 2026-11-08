#!/usr/bin/env python3
"""PreToolUse 훅: 토큰 낭비 신호를 경고로 알린다. 막지 않는다(항상 종료 코드 0).

경고는 additionalContext 한 줄로 모델에게 전달된다. 같은 경고는 세션당 한 번만 낸다.
  1) 컨텍스트가 30만·50만·70만 토큰에 도달 -> 핸드오프 후 새 세션 또는 compact
  2) 감사·심사 서브에이전트를 4회 호출할 때마다 -> 감사 범위·횟수 규칙
  3) 큰 이미지(200KB 초과) 또는 같은 이미지 재독 -> 축소·크롭, 재독 금지
입력을 못 읽거나 예외가 나면 조용히 통과한다(훅 고장이 작업을 멈추지 않게).
"""
import json
import os
import re
import sys
import tempfile
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

CTX_LEVELS = [300_000, 500_000, 700_000]
CTX_RESET_BELOW = 150_000      # compact 뒤 컨텍스트가 이만큼 줄면 경고를 다시 켠다
CTX_CHECK_EVERY = 10           # 호출 10회에 한 번만 transcript를 읽는다(첫 호출과 Agent 호출은 항상)
TAIL_BYTES = 200_000
AUDIT_EVERY = 4
IMAGE_MAX_BYTES = 200_000
IMAGE_EXT = (".png", ".jpg", ".jpeg")
AUDIT_RE = re.compile(r"감사|audit|심사|검수", re.IGNORECASE)


def state_dir() -> Path:
    d = os.environ.get("KSTAT_TOKEN_GUARD_DIR")
    return Path(d) if d else Path(tempfile.gettempdir())


def state_path(session: str) -> Path:
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in session)[:80] or "nosession"
    return state_dir() / f"kstat_token_guard_{safe}.json"


def load_state(p: Path) -> dict:
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
        return d if isinstance(d, dict) else {}
    except Exception:
        return {}


def save_state(p: Path, st: dict) -> None:
    try:
        p.write_text(json.dumps(st, ensure_ascii=False), encoding="utf-8")
    except Exception:
        pass


def context_tokens(transcript_path: str) -> int | None:
    """transcript 끝부분에서 마지막 본 대화 assistant 메시지의 usage 합(입력+캐시 읽기+캐시 쓰기)을 구한다."""
    try:
        p = Path(transcript_path)
        size = p.stat().st_size
        with p.open("rb") as f:
            f.seek(max(0, size - TAIL_BYTES))
            tail = f.read().decode("utf-8", errors="ignore")
        for line in reversed(tail.splitlines()):
            try:
                d = json.loads(line)
            except Exception:
                continue  # 잘린 첫 줄 등
            if d.get("type") != "assistant" or d.get("isSidechain"):
                continue
            u = (d.get("message") or {}).get("usage")
            if not isinstance(u, dict):
                continue
            return sum(int(u.get(k) or 0) for k in ("input_tokens", "cache_read_input_tokens", "cache_creation_input_tokens"))
    except Exception:
        return None
    return None


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return
    if not isinstance(data, dict):
        return
    tool = data.get("tool_name", "")
    tin = data.get("tool_input", {}) or {}
    session = str(data.get("session_id") or "")
    if not session:
        session = re.sub(r"\W", "_", str(data.get("transcript_path") or "nosession"))[-60:]

    sp = state_path(session)
    st = load_state(sp)
    st["calls"] = int(st.get("calls", 0)) + 1
    msgs: list[str] = []

    # 1) 컨텍스트 크기
    is_agent = tool in ("Agent", "Task")
    if data.get("transcript_path") and (st["calls"] == 1 or st["calls"] % CTX_CHECK_EVERY == 0 or is_agent):
        size = context_tokens(str(data["transcript_path"]))
        if size is not None:
            warned = int(st.get("ctx_warned", -1))
            if size < CTX_RESET_BELOW:
                warned = -1
            level = max((i for i, v in enumerate(CTX_LEVELS) if size >= v), default=-1)
            if level > warned:
                warned = level
                msgs.append(
                    f"컨텍스트 약 {size // 1000}k 토큰. 매 턴 전체를 다시 읽어 비용이 누적된다. "
                    "단계가 끝났으면 핸드오프를 쓰고 새 세션으로 옮기거나 compact 한다."
                )
            st["ctx_warned"] = warned

    # 2) 감사·심사 에이전트
    if is_agent:
        text = " ".join(str(tin.get(k, "")) for k in ("description", "prompt", "subagent_type"))
        if AUDIT_RE.search(text):
            st["audits"] = int(st.get("audits", 0)) + 1
            if st["audits"] % AUDIT_EVERY == 0:
                msgs.append(
                    f"감사 에이전트 {st['audits']}회째. 중간 감사는 고친 자리만, 전수 감사는 제출 직전 1회. "
                    "같은 지적이 2회 반복되거나 차단 건수가 줄지 않으면 중단하고 사람에게 확정을 묻는다."
                )

    # 3) 이미지 읽기
    if tool == "Read":
        fp = str(tin.get("file_path", ""))
        if fp.lower().endswith(IMAGE_EXT):
            seen = st.get("images") if isinstance(st.get("images"), list) else []
            try:
                big = os.path.getsize(fp) > IMAGE_MAX_BYTES
            except OSError:
                big = False
            if fp in seen:
                msgs.append(f"같은 이미지를 다시 읽는다({Path(fp).name}). 수치·존재 여부는 스크립트로 판정하고 재독을 피한다.")
            elif big:
                msgs.append(f"큰 이미지({Path(fp).name}). 축소하거나 필요한 부분만 잘라 읽는다.")
            if fp not in seen:
                seen.append(fp)
            st["images"] = seen[-50:]

    save_state(sp, st)
    if msgs:
        out = {"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": "[token_guard] " + " / ".join(msgs)}}
        print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        pass
    sys.exit(0)
