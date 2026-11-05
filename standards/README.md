# standards — 작업 표준과 하네스 (버전 관리본)

Drive `/_피드백백로그/`에 올린 표준의 버전 관리 사본과, 그 표준을 강제하는 스킬·훅·검사기를 둔다.

## 하네스 배치 원칙

| 무엇 | 어디에 | 컨텍스트 비용 | 이 저장소의 해당 파일 |
|---|---|---|---|
| 매번 필요한 최소 규칙 | 개인 지침(claude.ai) · `CLAUDE.md`(Claude Code) | 매 대화 전량 | `PERSONAL_INSTRUCTIONS_slim.md`(초안) · `../CLAUDE.md`(19줄) |
| 작업 때만 필요한 절차 | 스킬(설명만 상주, 본문은 호출 시) | 호출 시만 | `skills/task-intake/` · `skills/proposal-writing/` |
| 착수 시 읽는 규칙 요약 | Drive 표준 파일 | 착수 시 1회 | `ACTIVE_RULES.md` · `PROPOSAL_STANDARD.md` |
| 반드시 막아야 할 것 | 훅(이벤트 때만 실행) | 0 | `hooks/guard.py` (`../.claude/settings.json`) |
| 반복되는 문체 위반 | 검사기(완료 조건) | 실행 결과만 | `tools/proposal_style_check.py` |
| 대량 탐색·독립 검증 | 서브에이전트(5조건 중 2개 이상일 때만) | 결론만 | `task-intake` 처리 경로 판정·상태 인계 규격 |
| 사건 기록 | 원장 `BACKLOG.md` + inbox | 0(읽지 않음, 검색만) | — |

환경 제약: 훅은 Claude Code(로컬·클라우드)에서만 작동한다. claude.ai 채팅·Cowork에서는 스킬과 개인 지침이 유일한 장치이므로, 강제가 필요한 규칙은 검사기를 스킬에 넣어 「통과가 완료 조건」으로 건다.

## 파일 목록

| 파일 | 역할 | 버전 |
|---|---|---|
| `ACTIVE_RULES.md` | 착수 시 읽는 상시 규칙 26개 (원장 237행의 파생 요약) | v1.0 |
| `PROPOSAL_STANDARD.md` | 제안서 표준: 정본 2종 ID, 착수 절차, 쪽 규격, 문체, 검토 | v2.0 |
| `PERSONAL_INSTRUCTIONS_slim.md` | 개인 지침 경량안과 이관 대응표 | 초안 v0.1(승인 대기) |
| `skills/task-intake/SKILL.md` | 착수 문답 절차 + 처리 경로 판정(단일 루프 기본) + 상태 인계 규격 | v1.1 |
| `skills/proposal-writing/` | 제안서 스킬 개정안 + 문체 검사기 동봉 | v2.0 |
| `hooks/guard.py` | 비가역 명령·비밀 키 하드코딩 차단 훅 | v1.0 |
| `tools/proposal_style_check.py` | 서술형 종결·내부 용어·AI 티 용어 차단, 조어·조사 경고 | v1.0 |

## 적용 절차 (사용자 작업)

1. **스킬 업로드:** claude.ai 설정 → 스킬에서
   - `skills/task-intake/` 폴더를 새로 올린다.
   - `skills/proposal-writing/` 폴더(scripts 포함)로 기존 스킬을 교체한다. 로컬에 `references/` 8개 파일이 있으면 함께 묶는다.
2. **개인 지침 교체:** `PERSONAL_INSTRUCTIONS_slim.md`의 교체 문안으로 바꾼다. 현재 문안은 먼저 사본을 보관한다.
3. **로컬 Claude Code:**
   - `hooks/guard.py`를 `~/.claude/settings.json`의 PreToolUse에 등록한다. Windows는 명령을 `python`으로 바꾼다.
   - `backlog_brief.py`(SessionStart)가 원장 대신 ACTIVE_RULES 경로만 안내하도록 줄인다.
4. **정례 반영:** 2주에 한 번 「승격후보 반영」을 요청해 표준·스킬 버전을 올린다. 규칙을 하나 넣으면 하나를 원장으로 내려 ACTIVE_RULES 30개 상한을 지킨다.
