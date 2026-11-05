import json, subprocess, sys
G = sys.argv[1]
R = "r" + "m"
cases = [
    ("Bash", {"command": R + " -" + "rf build/"}, 2),
    ("Bash", {"command": R + " -" + "fr /data"}, 2),
    ("Bash", {"command": "git push --" + "force origin main"}, 2),
    ("Bash", {"command": "git push -" + "f origin x"}, 2),
    ("Bash", {"command": "git reset --" + "hard HEAD~1"}, 2),
    ("Bash", {"command": "psql -c 'drop ' + 'table users'".replace("' + '", "")}, 2),
    ("Bash", {"command": "git push -u origin claude/x"}, 0),
    ("Bash", {"command": R + " old.txt"}, 0),
    ("Bash", {"command": "ls -la && git status"}, 0),
    ("Write", {"content": "key = '" + "sk-" + "ant-" + "a" * 30 + "'"}, 2),
    ("Write", {"content": "AKIA" + "ABCDEFGHIJKLMNOP"}, 2),
    ("Edit", {"new_string": "serviceKey = \"" + "x" * 20 + "\""}, 2),
    ("Write", {"content": "api_key = os.environ['API_KEY']"}, 0),
    ("Write", {"content": "제안서 본문"}, 0),
    ("Read", {"file_path": "/x"}, 0),
    ("Bash", {"command": "git commit -m \"note: " + R + " -" + "rf blocked now\""}, 0),
    ("Bash", {"command": "cd /repo && git add -A && git commit -q -m \"" + R + " -" + "rf 차단\" && git push -u origin b"}, 0),
    ("Bash", {"command": "echo 'git reset --" + "hard'"}, 0),
    ("Bash", {"command": "bash -c \"" + R + " -" + "rf /tmp/x\""}, 2),
    ("Bash", {"command": "git commit -m 'x' && " + R + " -" + "rf out/"}, 2),
    ("Bash", {"command": "echo hi; git push --" + "force"}, 2),
]
bad = 0
for tool, tin, want in cases:
    p = subprocess.run([sys.executable, G], input=json.dumps({"tool_name": tool, "tool_input": tin}), capture_output=True, text=True)
    ok = p.returncode == want
    bad += not ok
    print("OK " if ok else "FAIL", tool, want, p.returncode, p.stderr.strip()[:60])
p = subprocess.run([sys.executable, G], input="not json", capture_output=True, text=True)
print("OK " if p.returncode == 0 else "FAIL", "broken input ->", p.returncode)
print("failures:", bad)
