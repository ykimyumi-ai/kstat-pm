# standards — 작업 표준 (버전 관리본)

Drive `/_피드백백로그/`에 올린 표준 파일의 버전 관리 사본이다. Drive 쪽이 작업 시 읽히는 사본이고, 이 저장소는 개정 이력을 남긴다.

| 파일 | 역할 | 버전 |
|---|---|---|
| `ACTIVE_RULES.md` | 모든 작업 착수 시 읽는 상시 규칙 26개 (원장 237행의 파생 요약) | v1.0 |
| `PROPOSAL_STANDARD.md` | 제안서 작성 표준: 정본 2종 ID, 착수 절차, 쪽 규격, 문체, 검토 | v2.0 |
| `skills/proposal-writing/SKILL.md` | proposal-writing 스킬 개정안 (기준선 커밋 대비 diff로 변경점 확인) | v2.0 |

## 구조: 기록과 반영의 분리

- `BACKLOG.md`(원장)는 **기록**하는 곳이다. 지적이 나오면 계속 원장이나 inbox에 적는다.
- 이 폴더의 표준과 스킬은 **행동을 바꾸는** 곳이다. 2주에 한 번 원장의 승격후보를 여기로 옮기고 버전을 올린다.
- 착수 시에는 원장 전문(약 40만 자)을 읽지 않는다. ACTIVE_RULES와 도메인 표준만 읽는다.

## 적용 절차 (사용자 작업)

1. **스킬 재업로드:** claude.ai → 설정 → 스킬에서 `proposal-writing`을 `skills/proposal-writing/SKILL.md`로 교체한다. 로컬에 `references/` 8개 파일이 있으면 함께 묶어 올린다(현재 동기화본에는 없음).
2. **개인 지침 교체:** 개인 지침의 `[피드백 백로그]` 문단을 아래 문안으로 바꾼다.

```
[작업 표준] 파일 산출물·분석·문서·검토 작업을 시작하기 전에 Google Drive /_피드백백로그/ACTIVE_RULES.md 를 읽고, 제안서 작업이면 PROPOSAL_STANDARD.md 도 읽는다. BACKLOG.md 전문은 읽지 않고 필요한 FB 행만 검색한다. 첫 답변 맨 앞에 「적용 표준: ACTIVE_RULES vX · (도메인 표준 vX) · 백로그 대조: FB-xx 해당/해당 없음」을 한 줄 적는다. 내가 오류·문체·판단을 지적하면 그 답변에서 바로 /_피드백백로그/inbox/ 에 FB_YYYYMMDD_HHMM_요지.md 를 만든다(양식은 BACKLOG.md §3). 단순 질문·잡담에는 적용하지 않는다.
```

3. **로컬 세션 훅:** 로컬 `backlog_brief.py`(SessionStart)가 원장 전문 대신 ACTIVE_RULES를 출력하도록 바꾼다(원장 §4).
4. **정례 반영:** 2주에 한 번 「승격후보 반영」 작업을 요청해 표준·스킬 버전을 올린다.
