"""token_guard.py · hook_throttle.py 시험. `python3 -m pytest standards/hooks/test_token_guard.py -q` 또는 직접 실행."""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
TG = HERE / "token_guard.py"


def run(payload, state_dir, raw=None):
    env = dict(os.environ, KSTAT_TOKEN_GUARD_DIR=str(state_dir))
    p = subprocess.run([sys.executable, str(TG)], input=raw if raw is not None else json.dumps(payload),
                       capture_output=True, text=True, encoding="utf-8", env=env)
    out = p.stdout.strip()
    ctx = json.loads(out)["hookSpecificOutput"]["additionalContext"] if out else ""
    return p.returncode, ctx


def transcript(tmp, total, name="t.jsonl"):
    """usage 합이 total 인 assistant 메시지를 마지막 줄에 둔 합성 transcript."""
    p = Path(tmp) / name
    lines = [json.dumps({"type": "user", "message": {"role": "user", "content": "x"}}),
             json.dumps({"type": "assistant", "message": {"usage": {"input_tokens": 10, "cache_read_input_tokens": total - 20, "cache_creation_input_tokens": 10}}})]
    p.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return str(p)


def call(sid, tool="Bash", tin=None, tp=None):
    d = {"session_id": sid, "tool_name": tool, "tool_input": tin or {}}
    if tp:
        d["transcript_path"] = tp
    return d


def test_context_warn_once_and_escalate():
    with tempfile.TemporaryDirectory() as sd, tempfile.TemporaryDirectory() as td:
        tp = transcript(td, 350_000)
        rc, ctx = run(call("s1", tp=tp), sd)          # 첫 호출은 항상 검사
        assert rc == 0 and "350k" in ctx and "핸드오프" in ctx
        for _ in range(12):                              # 같은 수준은 다시 경고하지 않는다
            rc, ctx = run(call("s1", tp=tp), sd)
            assert rc == 0 and ctx == ""
        tp = transcript(td, 520_000)
        got = ""
        for _ in range(10):                              # 10회마다 검사 -> 50만 경고가 한 번 나온다
            rc, ctx = run(call("s1", tp=tp), sd)
            got += ctx
        assert "520k" in got


def test_context_rearm_after_compact():
    with tempfile.TemporaryDirectory() as sd, tempfile.TemporaryDirectory() as td:
        assert "350k" in run(call("s2", tp=transcript(td, 350_000)), sd)[1]
        small = transcript(td, 50_000)
        for _ in range(10):
            run(call("s2", tp=small), sd)
        big = transcript(td, 350_000)
        got = "".join(run(call("s2", tp=big), sd)[1] for _ in range(10))
        assert "350k" in got                             # compact 후 다시 커지면 재경고


def test_audit_agent_every_fourth():
    with tempfile.TemporaryDirectory() as sd:
        res = [run(call("s3", "Agent", {"description": "수치 감사", "prompt": "v3 감사"}), sd)[1] for _ in range(8)]
        assert [bool(r) for r in res] == [False, False, False, True, False, False, False, True]
        assert "4회째" in res[3] and "8회째" in res[7]
        assert run(call("s3", "Agent", {"description": "자료 수집", "prompt": "탐색"}), sd)[1] == ""


def test_image_warnings():
    with tempfile.TemporaryDirectory() as sd, tempfile.TemporaryDirectory() as td:
        big, small = Path(td) / "big.png", Path(td) / "small.png"
        big.write_bytes(b"0" * 300_000)
        small.write_bytes(b"0" * 1_000)
        assert "큰 이미지" in run(call("s4", "Read", {"file_path": str(big)}), sd)[1]
        assert run(call("s4", "Read", {"file_path": str(small)}), sd)[1] == ""
        assert "다시 읽는다" in run(call("s4", "Read", {"file_path": str(big)}), sd)[1]
        assert run(call("s4", "Read", {"file_path": str(Path(td) / "a.txt")}), sd)[1] == ""


def test_never_fails():
    with tempfile.TemporaryDirectory() as sd, tempfile.TemporaryDirectory() as td:
        assert run(None, sd, raw="not json") == (0, "")
        assert run(None, sd, raw="[1,2]") == (0, "")
        assert run(call("s5", tp=str(Path(td) / "missing.jsonl")), sd) == (0, "")
        (Path(sd) / "kstat_token_guard_s6.json").write_text("{broken", encoding="utf-8")
        assert run(call("s6", "Agent", {"description": "감사"}), sd)[0] == 0
        assert run(call("s7", tp=transcript(td, 350_000)), "/nonexistent/dir")[0] == 0   # 상태 저장 실패도 통과


def test_throttle():
    import hook_throttle as ht
    with tempfile.TemporaryDirectory() as sd:
        os.environ["KSTAT_TOKEN_GUARD_DIR"] = sd
        try:
            assert ht.should_fire("gate", "A", 1800, now=1000) is True
            assert ht.should_fire("gate", "A", 1800, now=1500) is False   # 냉각 중
            assert ht.should_fire("gate", "B", 1800, now=1500) is True    # 다른 키
            assert ht.should_fire("other", "A", 1800, now=1500) is True   # 다른 훅
            assert ht.should_fire("gate", "A", 1800, now=3000) is True    # 냉각 끝
            (Path(sd) / "kstat_throttle_gate.json").write_text("{broken", encoding="utf-8")
            assert ht.should_fire("gate", "A", 1800, now=3001) is True    # 상태 손상 -> 허용
        finally:
            os.environ.pop("KSTAT_TOKEN_GUARD_DIR", None)


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
