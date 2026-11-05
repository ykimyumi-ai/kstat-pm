#!/usr/bin/env python3
"""PreToolUse 훅: 비가역 명령과 비밀 키 하드코딩을 실행 직전에 막는다.

Claude Code가 stdin으로 넘기는 JSON(tool_name, tool_input)을 읽는다.
막을 때는 종료 코드 2와 사유(stderr)를 돌려준다. Claude는 사유를 보고 방법을 바꾼다.
평상시에는 컨텍스트를 쓰지 않는다.
"""
import json
import re
import sys

BASH_RULES = [
    (r"\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\b", "rm -rf 금지 — 삭제 대신 _보관 폴더로 이동한다(FB-13)"),
    (r"\bgit\s+push\b.*(--force\b|\s-f\b)", "강제 푸시 금지 — 이력을 덮는다"),
    (r"\bgit\s+reset\s+--hard\b", "git reset --hard 금지 — 작업 내용이 사라진다"),
    (r"\bgit\s+clean\s+-[a-zA-Z]*f", "git clean -f 금지 — 추적 안 된 파일이 사라진다"),
    (r"\b(DROP|TRUNCATE)\s+(TABLE|DATABASE|SCHEMA)\b", "DROP/TRUNCATE 금지 — 복구 불가"),
    (r"\bdel\s+/[sq]", "del /s·/q 금지 — 삭제 대신 이동한다"),
    (r"Remove-Item\b.*-Recurse", "Remove-Item -Recurse 금지 — 삭제 대신 이동한다"),
]

SECRET_RULES = [
    (r"sk-ant-[A-Za-z0-9_\-]{20,}", "Anthropic API 키"),
    (r"sk-[A-Za-z0-9]{32,}", "API 비밀 키"),
    (r"AKIA[0-9A-Z]{16}", "AWS 액세스 키"),
    (r"AIza[0-9A-Za-z_\-]{35}", "Google API 키"),
    (r"ghp_[A-Za-z0-9]{36}", "GitHub 토큰"),
    (r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----", "개인 키"),
    (r"(?i)(api[_-]?key|secret|password|serviceKey)\s*[:=]\s*['\"][^'\"\s]{16,}['\"]", "하드코딩된 비밀 값"),
]


def block(reason: str) -> None:
    print(f"[guard] 차단: {reason}", file=sys.stderr)
    sys.exit(2)


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)  # 입력을 못 읽으면 막지 않는다(훅 고장이 작업을 멈추지 않게)
    tool = data.get("tool_name", "")
    tin = data.get("tool_input", {}) or {}

    if tool == "Bash":
        cmd = tin.get("command", "")
        # 커밋 메시지·echo 출력처럼 실행되지 않는 따옴표 안 글자는 검사에서 뺀다(오탐 방지).
        # bash -c "..." 처럼 따옴표 안이 실행되는 경우는 그대로 검사한다.
        if re.match(r"\s*(cd\s+\S+\s*&&\s*)?(git\s+(add\b.*&&\s*git\s+)?commit|echo|printf)\b", cmd):
            cmd = re.sub(r"\"(?:[^\"\\]|\\.)*\"|'[^']*'", "''", cmd, flags=re.S)
        for pat, reason in BASH_RULES:
            if re.search(pat, cmd, flags=re.IGNORECASE if "DROP" in pat else 0):
                block(reason)

    if tool in ("Write", "Edit", "MultiEdit", "NotebookEdit"):
        text = " ".join(str(tin.get(k, "")) for k in ("content", "new_string", "new_source"))
        for e in tin.get("edits", []) or []:
            text += " " + str(e.get("new_string", ""))
        for pat, label in SECRET_RULES:
            if re.search(pat, text):
                block(f"{label} 탐지 — 파일에 직접 쓰지 않고 환경 변수나 .env(커밋 제외)로 읽는다")

    sys.exit(0)


if __name__ == "__main__":
    main()
