#!/usr/bin/env python3
"""SessionStart 훅: 이 프로젝트의 핸드오프 목록(업무별 최신본)과 가장 최근 핸드오프를 세션 첫머리에 넣는다.

세션 시작 시점에는 사용자가 어떤 업무를 할지 모른다. 그래서 업무별 최신 파일 목록을 보여 주고,
첫 요청이 오면 Claude가 그 업무의 최신본을 열어 이어받는다.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from handoff_common import handoff_dir, handoff_key, list_handoffs, work_type  # noqa: E402

MAX_CHARS = 4000


def next_step(path: Path) -> str:
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if "다음 할 일" in line:
            return line.split(":", 1)[-1].strip()[:120]
    return ""


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        data = {}
    cwd = data.get("cwd") or "."
    key = handoff_key(cwd)
    d = handoff_dir(cwd)
    files = list_handoffs(d, key)
    if not files:
        print(f"[핸드오프] 프로젝트 「{key}」의 이전 핸드오프 없음({d}). 새 작업으로 시작한다.")
        return
    latest_by_type = {}
    for p in files:  # 최신순
        latest_by_type.setdefault(work_type(p, key), p)
    out = [f"[핸드오프] 프로젝트 「{key}」 업무별 최신본 ({d}):"]
    for wt, p in latest_by_type.items():
        ns = next_step(p)
        out.append(f"- {wt}: {p.name}" + (f" · 다음 할 일: {ns}" if ns else ""))
    newest = files[0]
    out.append(f"\n[핸드오프] 가장 최근 파일 전문: {newest.name}\n")
    out.append(newest.read_text(encoding="utf-8", errors="ignore")[:MAX_CHARS])
    out.append("\n→ 첫 요청의 업무가 위 최근 파일과 다르면 그 업무의 최신본을 열어 이어받는다. "
               "첫 답변 첫 줄에 「핸드오프: <파일명> 이어받음」 또는 「이 업무 핸드오프 없음 — 새로 시작」을 적는다.")
    print("\n".join(out))


if __name__ == "__main__":
    main()
