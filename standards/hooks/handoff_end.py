#!/usr/bin/env python3
"""SessionEnd 훅: 세션이 끝날 때 핸드오프가 없으면 자동 기록을 남긴다.

이 세션 중에 Claude가 핸드오프를 이미 썼으면 아무것도 하지 않는다.
자동 기록은 요약이 아니다. 대화 기록(transcript)에서 사용자 요청·수정한 파일·마지막 답변 끝부분을 기계적으로 옮긴다.
"""
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from handoff_common import handoff_dir, handoff_key, list_handoffs  # noqa: E402


def text_of(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text")
    return ""


def parse(transcript: Path):
    prompts, files, last_answer, started = [], [], "", None
    for line in transcript.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            d = json.loads(line)
        except Exception:
            continue
        ts = d.get("timestamp")
        if ts and started is None:
            started = ts
        msg = d.get("message") or {}
        if d.get("type") == "user" and msg.get("role") == "user":
            t = text_of(msg.get("content")).strip()
            if t and not t.startswith(("<", "[Image")):
                prompts.append(t)
        if d.get("type") == "assistant":
            for c in msg.get("content", []) if isinstance(msg.get("content"), list) else []:
                if c.get("type") == "tool_use" and c.get("name") in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
                    fp = (c.get("input") or {}).get("file_path")
                    if fp and fp not in files:
                        files.append(fp)
            t = text_of(msg.get("content")).strip()
            if t:
                last_answer = t
    return prompts, files, last_answer, started


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return
    cwd = data.get("cwd") or "."
    tp = data.get("transcript_path")
    if not tp or not Path(tp).is_file():
        return
    key = handoff_key(cwd)
    d = handoff_dir(cwd)
    prompts, files, last_answer, started = parse(Path(tp))
    if not prompts:
        return
    start_ts = 0.0
    if started:
        try:
            start_ts = datetime.fromisoformat(started.replace("Z", "+00:00")).timestamp()
        except ValueError:
            pass
    written = [p for p in list_handoffs(d, key) if "_자동_" not in p.name and p.stat().st_mtime >= start_ts]
    if written:
        return  # Claude가 이 세션에서 이미 핸드오프를 남겼다
    d.mkdir(parents=True, exist_ok=True)
    now = datetime.now()
    out = d / f"HANDOFF_{key}_자동_{now:%Y%m%d_%H%M}.md"
    body = [
        f"# HANDOFF(자동 기록) · {key} · {now:%Y-%m-%d %H:%M}",
        "",
        "> 세션 종료 시 Claude가 핸드오프를 남기지 않아 대화 기록에서 기계적으로 옮겼다. 요약·판단이 아니다.",
        f"> 대화 기록 원본: {tp}",
        "",
        "## 사용자 요청 (최근 5개)",
        *[f"- {p[:300]}" for p in prompts[-5:]],
        "",
        "## 이 세션에서 수정·생성한 파일",
        *([f"- {f}" for f in files] or ["- (없음)"]),
        "",
        "## 마지막 답변 끝부분",
        last_answer[-1500:] if last_answer else "(없음)",
    ]
    out.write_text("\n".join(body) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
