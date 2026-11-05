# kstat-pm — 프로젝트 공통 지침 (짧게 유지: 30줄 이내)

이 파일은 매 세션 전부 읽힌다. 상황별 절차는 여기 쓰지 않고 스킬로, 반드시 막아야 할 것은 훅으로 둔다.

## 상시 규칙
- 대화 응답은 한국어 경어체. 첫 문단에 결론.
- 실질 작업 착수 시 `standards/skills/task-intake` 절차를 따른다: 찾을 수 있는 것은 찾고, 결과를 바꾸는 질문만 한 번에 묻고, 작업 명세서 승인 뒤 무중단 실행.
- 상시 규칙 원문: `standards/ACTIVE_RULES.md` (Drive `/_피드백백로그/ACTIVE_RULES.md`와 동일). 피드백 원장 `BACKLOG.md` 전문은 읽지 않고 FB 번호로 해당 행만 뽑는다.
- 제안서 작업: `standards/PROPOSAL_STANDARD.md` + 산출물마다 `python3 standards/tools/proposal_style_check.py <파일>` 통과(종료 코드 0)가 완료 조건.
- 근거 표기는 [확인]·[미확인]·[추론]. 출처 없는 수치는 넣지 않는다.
- 원본은 덮지 않고 판 번호를 올린다. 삭제 대신 이동.
- 지적을 받으면 같은 턴에 Drive `/_피드백백로그/inbox/`에 기록한다.

## 강제 장치 (훅 — `.claude/settings.json`)
- `standards/hooks/guard.py`: 비가역 명령(rm -rf, 강제 푸시, reset --hard, DROP 등)과 비밀 키 하드코딩을 실행 직전에 차단한다. 막히면 우회하지 말고 방법을 바꾼다.

## 큰 작업
- 여러 폴더 탐색·대량 조사·독립 검증은 서브에이전트에 맡기고 결론만 받는다.
- 10만 자 넘는 파일은 대화에 올리지 않고 디스크에서 스크립트로 처리한다.
