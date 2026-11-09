#!/usr/bin/env python3
"""PreToolUse 훅: 야간 무인 실행의 수정 허용 범위를 코드로 강제한다.

프롬프트에 「이 파일만 고쳐라」라고 적는 대신, 허용 경로 밖 쓰기를 실행 직전에 막는다.
범위 파일이 없거나 만료됐으면 아무것도 하지 않는다(평소 작업에는 영향 없음).

범위 파일: <프로젝트>/.claude/night_scope.json (환경 변수 KSTAT_NIGHT_SCOPE 로 경로 지정 가능)
  {
    "mode": "block",                       # block: 차단(종료 코드 2) / warn: 경고만(기본)
    "allow": ["E:/클로드작업/과업/07_통계표/**", "E:/클로드작업/과업/아침보고.md"],
    "deny":  ["**/_원본/**"],              # 선택. allow 보다 우선
    "max_new_files": 20,                   # 선택. 새로 만드는 파일 수 상한
    "expires": "2026-11-10T09:00:00"       # 선택. 이 시각 이후 범위 파일을 무시
  }

검사 대상: Write·Edit·MultiEdit·NotebookEdit 의 file_path 와,
Bash 의 리다이렉션(>, >>)·tee·cp·mv 대상 경로(가능한 범위의 점검).
한계: Bash 로 실행한 스크립트가 내부에서 파일을 쓰는 것은 막지 못한다.
입력을 못 읽거나 예외가 나면 막지 않는다(훅 고장이 작업을 멈추지 않게).
"""
import fnmatch
import json
import os
import re
import shlex
import sys
import tempfile
from datetime import datetime
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except Exception:
        pass

WRITE_TOOLS = ("Write", "Edit", "MultiEdit", "NotebookEdit")
SCOPE_REL = Path(".claude") / "night_scope.json"


def norm(p: str, base: str = "") -> str:
    p = str(p).strip().strip("'\"")
    if base and not (os.path.isabs(p) or re.match(r"^[A-Za-z]:[\\/]", p)):
        p = os.path.join(base, p)
    p = p.replace("\\", "/")
    p = re.sub(r"/+", "/", p)
    parts: list[str] = []
    for seg in p.split("/"):
        if seg == "..":
            if parts and parts[-1] not in ("", ".."):
                parts.pop()
        elif seg != ".":
            parts.append(seg)
    return "/".join(parts).lower()


def match(path: str, pattern: str) -> bool:
    pat = norm(pattern)
    if pat.endswith("/**") or pat.endswith("/*"):
        prefix = pat[: pat.rindex("/")]
        return path == prefix or path.startswith(prefix + "/")
    return fnmatch.fnmatchcase(path, pat)


def find_scope(data: dict) -> Path | None:
    env = os.environ.get("KSTAT_NIGHT_SCOPE")
    if env:
        return Path(env) if Path(env).is_file() else None
    for base in (os.environ.get("CLAUDE_PROJECT_DIR"), data.get("cwd")):
        if base and (Path(base) / SCOPE_REL).is_file():
            return Path(base) / SCOPE_REL
    return None


def expired(scope: dict) -> bool:
    exp = scope.get("expires")
    if not exp:
        return False
    try:
        t = datetime.fromisoformat(str(exp))
        now = datetime.now(t.tzinfo) if t.tzinfo else datetime.now()
        return now >= t
    except Exception:
        return False


def bash_targets(cmd: str) -> list[str]:
    """Bash 명령에서 쓰기 대상으로 보이는 경로를 뽑는다(리다이렉션·tee·cp·mv). 완전하지 않다."""
    out: list[str] = []
    for m in re.finditer(r"(?<![0-9&<])>>?\s*([^\s;&|<>()]+)", cmd):
        t = m.group(1)
        if t.startswith("&") or t in ("/dev/null", "/dev/stderr", "/dev/stdout") or t.lower() == "nul":
            continue
        out.append(t)
    for seg in re.split(r"[;&|]+", cmd):
        try:
            toks = shlex.split(seg)
        except ValueError:
            continue
        if not toks:
            continue
        name = os.path.basename(toks[0])
        args = [a for a in toks[1:] if not a.startswith("-")]
        if name == "tee":
            out += args
        elif name in ("cp", "mv") and len(args) >= 2:
            out.append(args[-1])
    return out


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        return
    if not isinstance(data, dict):
        return
    tool = data.get("tool_name", "")
    tin = data.get("tool_input", {}) or {}
    if tool not in WRITE_TOOLS and tool != "Bash":
        return
    sp = find_scope(data)
    if sp is None:
        return
    try:
        scope = json.loads(sp.read_text(encoding="utf-8"))
    except Exception:
        return
    if not isinstance(scope, dict) or expired(scope):
        return

    base = str(data.get("cwd") or os.getcwd())
    targets: list[str] = []
    if tool in WRITE_TOOLS:
        fp = tin.get("file_path") or tin.get("notebook_path")
        if fp:
            targets.append(str(fp))
    else:
        targets = bash_targets(str(tin.get("command", "")))
    if not targets:
        return

    allow = [str(a) for a in scope.get("allow") or []]
    deny = [str(a) for a in scope.get("deny") or []]
    scope_path = norm(str(sp), base)
    problems: list[str] = []
    new_files = 0
    for raw in targets:
        t = norm(raw, base)
        if t == scope_path:
            problems.append(f"범위 파일 자체는 수정할 수 없다({Path(raw).name})")
        elif any(match(t, d) for d in deny):
            problems.append(f"금지 경로({raw})")
        elif not any(match(t, a) for a in allow):
            problems.append(f"허용 범위 밖({raw})")
        elif tool == "Write" and not os.path.exists(raw if os.path.isabs(raw) else os.path.join(base, raw)):
            new_files += 1

    max_new = scope.get("max_new_files")
    if new_files and isinstance(max_new, int):
        sf = Path(tempfile.gettempdir()) / ("kstat_scope_guard_" + re.sub(r"\W", "_", str(data.get("session_id") or "nosession"))[:60] + ".json")
        try:
            st = json.loads(sf.read_text(encoding="utf-8"))
        except Exception:
            st = {}
        st["new"] = int(st.get("new", 0)) + new_files
        try:
            sf.write_text(json.dumps(st), encoding="utf-8")
        except Exception:
            pass
        if st["new"] > max_new:
            problems.append(f"새 파일 상한 {max_new}개 초과({st['new']}개째)")

    if not problems:
        return
    reason = "; ".join(problems)
    if str(scope.get("mode", "warn")).lower() == "block":
        print(f"[scope_guard] 차단: {reason}. 명세서의 수정 허용 경로 안에서만 쓴다. 범위를 넓혀야 하면 결정대기.md에 적고 이 작업은 건너뛴다.", file=sys.stderr)
        sys.exit(2)
    out = {"hookSpecificOutput": {"hookEventName": "PreToolUse",
                                  "additionalContext": f"[scope_guard] 경고: {reason}. 명세서의 수정 허용 경로 밖이다."}}
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        pass
    sys.exit(0)
