"""scope_guard.py 시험. `python3 standards/hooks/test_scope_guard.py` 로 실행한다."""
import json
import os
import subprocess
import sys
import tempfile
import uuid
from datetime import datetime, timedelta
from pathlib import Path

SG = Path(__file__).resolve().parent / "scope_guard.py"


def run(payload, scope_file=None, raw=None):
    env = {k: v for k, v in os.environ.items() if k not in ("KSTAT_NIGHT_SCOPE", "CLAUDE_PROJECT_DIR")}
    if scope_file:
        env["KSTAT_NIGHT_SCOPE"] = str(scope_file)
    p = subprocess.run([sys.executable, str(SG)], input=raw if raw is not None else json.dumps(payload),
                       capture_output=True, text=True, encoding="utf-8", env=env)
    return p.returncode, p.stdout.strip(), p.stderr.strip()


def setup(tmp, **extra):
    root = Path(tmp) / "work"
    (root / "out").mkdir(parents=True)
    (root / "_원본").mkdir()
    (root / "out" / "exists.txt").write_text("x", encoding="utf-8")
    scope = {"mode": "block", "allow": [str(root / "out") + "/**", str(root / "아침보고.md")], "deny": ["**/_원본/**"]}
    scope.update(extra)
    sf = Path(tmp) / "night_scope.json"
    sf.write_text(json.dumps(scope, ensure_ascii=False), encoding="utf-8")
    return root, sf


def w(path, tool="Write", sid="s"):
    return {"session_id": sid, "tool_name": tool, "tool_input": {"file_path": str(path)}, "cwd": str(Path(path).parent)}


def b(cmd, cwd):
    return {"session_id": "s", "tool_name": "Bash", "tool_input": {"command": cmd}, "cwd": str(cwd)}


def test_no_scope_file_is_silent():
    assert run(w("/anything/at/all.txt"), None) == (0, "", "")


def test_block_mode_paths():
    with tempfile.TemporaryDirectory() as tmp:
        root, sf = setup(tmp)
        assert run(w(root / "out" / "a.txt"), sf)[0] == 0
        assert run(w(root / "out" / "sub" / "deep.txt", "Edit"), sf)[0] == 0
        assert run(w(root / "아침보고.md"), sf)[0] == 0
        assert run(w(root / "other.txt"), sf)[0] == 2
        assert run(w(root / "_원본" / "x.xlsx"), sf)[0] == 2
        assert run(w(root / "out" / ".." / "other.txt"), sf)[0] == 2        # 경로 우회
        rc, _, err = run(w(root / "other.txt"), sf)
        assert "허용 범위 밖" in err and "결정대기.md" in err
        assert run(w(sf), sf)[0] == 2                                         # 범위 파일 자체


def test_other_tools_ignored():
    with tempfile.TemporaryDirectory() as tmp:
        root, sf = setup(tmp)
        p = {"session_id": "s", "tool_name": "Read", "tool_input": {"file_path": str(root / "other.txt")}}
        assert run(p, sf) == (0, "", "")


def test_warn_mode_does_not_block():
    with tempfile.TemporaryDirectory() as tmp:
        root, sf = setup(tmp, mode="warn")
        rc, out, _ = run(w(root / "other.txt"), sf)
        assert rc == 0 and "scope_guard" in json.loads(out)["hookSpecificOutput"]["additionalContext"]


def test_expired_scope_ignored():
    with tempfile.TemporaryDirectory() as tmp:
        root, sf = setup(tmp, expires=(datetime.now() - timedelta(minutes=1)).isoformat())
        assert run(w(root / "other.txt"), sf) == (0, "", "")
    with tempfile.TemporaryDirectory() as tmp2:
        root2, sf2 = setup(tmp2, expires=(datetime.now() + timedelta(hours=1)).isoformat())
        assert run(w(root2 / "other.txt"), sf2)[0] == 2                       # 만료 전에는 적용


def test_new_file_limit():
    with tempfile.TemporaryDirectory() as tmp:
        root, sf = setup(tmp, max_new_files=2)
        sid = "lim" + uuid.uuid4().hex                                        # 상태 파일이 임시 폴더에 남으므로 매번 새 세션 ID
        assert run(w(root / "out" / "n1.txt", sid=sid), sf)[0] == 0
        assert run(w(root / "out" / "n2.txt", sid=sid), sf)[0] == 0
        rc, _, err = run(w(root / "out" / "n3.txt", sid=sid), sf)
        assert rc == 2 and "상한" in err
        assert run(w(root / "out" / "exists.txt", sid=sid), sf)[0] == 0       # 기존 파일 수정은 세지 않음


def test_bash_targets():
    with tempfile.TemporaryDirectory() as tmp:
        root, sf = setup(tmp)
        o, x = root / "out", root / "other"
        assert run(b(f"echo hi > {o}/a.txt", root), sf)[0] == 0
        assert run(b(f"echo hi > {x}.txt", root), sf)[0] == 2
        assert run(b(f"echo hi >> {x}.txt", root), sf)[0] == 2
        assert run(b(f"cp {o}/exists.txt {x}.txt", root), sf)[0] == 2
        assert run(b(f"mv {o}/exists.txt {o}/moved.txt", root), sf)[0] == 0
        assert run(b("ls -la 2>&1 | head", root), sf)[0] == 0
        assert run(b("python3 build.py > /dev/null 2>&1", root), sf)[0] == 0
        assert run(b(f"echo hi | tee {x}.txt", root), sf)[0] == 2
        assert run(b("git status", root), sf)[0] == 0


def test_never_fails_on_bad_input():
    with tempfile.TemporaryDirectory() as tmp:
        root, sf = setup(tmp)
        assert run(None, sf, raw="not json")[0] == 0
        assert run(None, sf, raw="[1]")[0] == 0
        bad = Path(tmp) / "bad.json"
        bad.write_text("{broken", encoding="utf-8")
        assert run(w(root / "other.txt"), bad)[0] == 0                        # 범위 파일이 깨지면 막지 않음


if __name__ == "__main__":
    fails = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print("OK  ", name)
            except AssertionError as e:
                fails += 1
                print("FAIL", name, e)
    print("failures:", fails)
    sys.exit(1 if fails else 0)
