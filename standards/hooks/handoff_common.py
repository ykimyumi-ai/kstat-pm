"""핸드오프 훅 공통 함수: 키와 저장 폴더를 정한다."""
import os
import re
from pathlib import Path

DEFAULT_DIRS = ["G:/내 드라이브/_핸드오프", "G:/My Drive/_핸드오프"]


def handoff_dir(cwd: str) -> Path:
    env = os.environ.get("HANDOFF_DIR")
    if env:
        return Path(env)
    for d in DEFAULT_DIRS:
        if Path(d).is_dir():
            return Path(d)
    return Path(cwd) / "_handoff"


def handoff_key(cwd: str) -> str:
    """우선순위: 환경변수 HANDOFF_KEY → CLAUDE.md의 「핸드오프 키: ○○」 → 작업 폴더 이름."""
    env = os.environ.get("HANDOFF_KEY")
    if env:
        return env.strip()
    md = Path(cwd) / "CLAUDE.md"
    if md.is_file():
        m = re.search(r"핸드오프\s*키\s*[:：]\s*(\S+)", md.read_text(encoding="utf-8", errors="ignore"))
        if m:
            return m.group(1).strip()
    return Path(cwd).name or "기본"


def list_handoffs(d: Path, key: str):
    if not d.is_dir():
        return []
    files = [p for p in d.glob(f"HANDOFF_{key}_*.md") if p.is_file()]
    return sorted(files, key=lambda p: p.stat().st_mtime, reverse=True)
