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


WORK_TYPES = ["제안서", "조사설계", "데이터검증", "통계표", "보고서", "개별리포트", "기타", "자동"]


def list_handoffs(d: Path, key: str):
    if not d.is_dir():
        return []
    files = [p for p in d.glob(f"HANDOFF_{key}_*.md") if p.is_file()]
    return sorted(files, key=lambda p: p.stat().st_mtime, reverse=True)


def work_type(path: Path, key: str) -> str:
    """HANDOFF_<키>_<업무>_YYYYMMDD_HHMM.md 에서 업무를 뽑는다. 업무가 없는 옛 형식은 「미분류」."""
    rest = path.stem[len(f"HANDOFF_{key}_"):]
    m = re.match(r"(.+?)_\d{8}_\d{4}$", rest)
    return m.group(1) if m else "미분류"
