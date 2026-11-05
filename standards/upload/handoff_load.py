#!/usr/bin/env python3
"""SessionStart 훅: 이 작업의 최신 핸드오프를 세션 첫머리에 넣는다.

Claude가 쓴 핸드오프(HANDOFF_<키>_YYYYMMDD_HHMM.md)를 우선 보여 준다.
그보다 나중에 만들어진 자동 기록(HANDOFF_<키>_자동_…)이 있으면 함께 보여 준다.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from handoff_common import handoff_dir, handoff_key, list_handoffs  # noqa: E402

MAX_CHARS = 6000


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    cwd = data.get("cwd") or "."
    key = handoff_key(cwd)
    d = handoff_dir(cwd)
    files = list_handoffs(d, key)
    manual = [p for p in files if "_자동_" not in p.name]
    auto = [p for p in files if "_자동_" in p.name]
    if not files:
        print(f"[핸드오프] 키 「{key}」의 이전 핸드오프 없음({d}). 새 작업으로 시작한다.")
        return
    out = []
    if manual:
        out.append(f"[핸드오프] 최신본 이어받음: {manual[0].name}\n")
        out.append(manual[0].read_text(encoding="utf-8", errors="ignore")[:MAX_CHARS])
    if auto and (not manual or auto[0].stat().st_mtime > manual[0].stat().st_mtime):
        out.append(f"\n[핸드오프] 그 뒤 세션의 자동 기록(요약 아님, 참고용): {auto[0].name}\n")
        out.append(auto[0].read_text(encoding="utf-8", errors="ignore")[:MAX_CHARS // 2])
    out.append("\n→ 첫 답변 첫 줄에 「핸드오프: <파일명> 이어받음」을 적고, 「다음 할 일」부터 이어서 한다.")
    print("\n".join(out))


if __name__ == "__main__":
    main()
