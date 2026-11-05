#!/usr/bin/env python3
"""제안서 문체 검사기 (PROPOSAL_STANDARD v2.0 §3 강제 장치).

사용: python3 proposal_style_check.py <파일.pptx|.docx|.md|.txt> [--allow 낱말1,낱말2]
종료 코드: 0 = 차단 항목 없음, 2 = 차단 항목 있음(훅·완료 판정에서 막는 용도), 1 = 실행 오류.

차단(BLOCK): 서술형 종결, 내부 체계 용어, AI 작성 티 용어
경고(WARN): 매니저가 쓰지 않는 조어 후보, 받침과 조사 불일치 후보
"""
import re
import sys
from pathlib import Path

DESCRIPTIVE_END = re.compile(r"[가-힣](?:습니다|합니다|입니다|됩니다|한다|된다|이다|있다|없다|했다|였다|겠다|진다|난다|린다|친다|간다|온다|준다|낸다|본다|둔다|운다)[.!。]?\s*$")
INTERNAL_TERMS = ["공정팀", "감사역", "게이트", "자비스", "프라이데이", "서브에이전트", "에이전트", "발주문", "집필역", "실행역", "백로그", "FB-"]
AI_TERMS = ["USP", "ROI", "OKR", "MVP", "TBD", "ASAP", "CSF", "시너지", "레버리지", "페인 포인트", "밸류 프로포지션",
            "게임 체인저", "디스럽션", "온보딩", "얼라인", "싱크업", "디퍼런시에이터", "솔루션을 제공", "원스톱 솔루션",
            "토탈 솔루션", "엔드 투 엔드"]
COINED_TERMS = ["까닭", "모습", "닿는", "한 벌", "급소", "틀어진", "흡수", "공정", "번짐"]
PARTICLE = re.compile(r"([가-힣]{2,})(은|을|과|으로)(?=[\s,.)」』·]|$)")


def has_batchim(ch: str) -> bool:
    code = ord(ch) - 0xAC00
    return 0 <= code <= 11171 and code % 28 != 0


def iter_units(path: Path):
    """(위치, 텍스트 한 줄) 순서로 돌려준다."""
    suffix = path.suffix.lower()
    if suffix == ".pptx":
        from pptx import Presentation
        prs = Presentation(str(path))
        for si, slide in enumerate(prs.slides, start=1):
            for shape in slide.shapes:
                frames = []
                if shape.has_text_frame:
                    frames.append(shape.text_frame)
                if getattr(shape, "has_table", False) and shape.has_table:
                    for row in shape.table.rows:
                        for cell in row.cells:
                            frames.append(cell.text_frame)
                for tf in frames:
                    for p in tf.paragraphs:
                        text = "".join(r.text for r in p.runs).strip()
                        if text:
                            yield f"{si}쪽", text
    elif suffix == ".docx":
        import docx
        d = docx.Document(str(path))
        for pi, p in enumerate(d.paragraphs, start=1):
            if p.text.strip():
                yield f"문단{pi}", p.text.strip()
        for ti, t in enumerate(d.tables, start=1):
            for row in t.rows:
                for cell in row.cells:
                    for line in cell.text.splitlines():
                        if line.strip():
                            yield f"표{ti}", line.strip()
    else:
        for li, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            if line.strip():
                yield f"{li}행", line.strip()


def check(path: Path, allow: set):
    findings = []
    ai_insight = 0
    for loc, text in iter_units(path):
        if DESCRIPTIVE_END.search(text):
            findings.append(("BLOCK", "서술형 종결", loc, text))
        for term in INTERNAL_TERMS:
            if term in text and term not in allow:
                findings.append(("BLOCK", f"내부 용어「{term}」", loc, text))
        for term in AI_TERMS:
            if term in text and term not in allow:
                findings.append(("BLOCK", f"AI 티 용어「{term}」", loc, text))
        ai_insight += text.count("인사이트")
        for term in COINED_TERMS:
            if term in text and term not in allow:
                findings.append(("WARN", f"조어 후보「{term}」", loc, text))
        for m in PARTICLE.finditer(text):
            word, josa = m.group(1), m.group(2)
            if not has_batchim(word[-1]):
                findings.append(("WARN", f"조사 불일치 후보「{word}{josa}」", loc, text))
    if ai_insight > 1 and "인사이트" not in allow:
        findings.append(("BLOCK", f"AI 티 용어「인사이트」{ai_insight}회(1회 초과)", "전체", ""))
    return findings


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    path = Path(argv[1])
    allow = set()
    if "--allow" in argv:
        allow = {t.strip() for t in argv[argv.index("--allow") + 1].split(",") if t.strip()}
    if not path.exists():
        print(f"파일 없음: {path}", file=sys.stderr)
        return 1
    findings = check(path, allow)
    block = [f for f in findings if f[0] == "BLOCK"]
    warn = [f for f in findings if f[0] == "WARN"]
    for level, kind, loc, text in findings:
        print(f"[{level}] {loc} · {kind} · {text[:80]}")
    print(f"\n검사 파일: {path.name} · 차단 {len(block)}건 · 경고 {len(warn)}건")
    if block:
        print("판정: 미통과 — 차단 항목을 고친 뒤 다시 돌린다", file=sys.stderr)
        return 2
    print("판정: 통과(경고는 사람이 확인)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
