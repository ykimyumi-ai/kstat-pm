# 로컬 PC 에서 작업하기

이 저장소는 원래 클라우드 컨테이너에서 만들었다. 로컬로 옮기는 이유는 하나다 —
**원본 파일이 PC 에 있는데 클라우드에서는 못 읽는다.** 로컬이면 업로드·다운로드
왕복이 사라지고, 원본 PPTX 를 직접 열 수 있고, 산출물이 작업 폴더에 바로 떨어진다.

## 설치

```powershell
# PowerShell 에서 (관리자 아니어도 대개 된다)
Set-ExecutionPolicy -Scope Process Bypass -Force
.\setup-windows.ps1
```

수동으로 하려면 네 가지다.

| 무엇 | 왜 | 설치 |
|---|---|---|
| **Node 18+** | PPTX 를 만든다 | `winget install OpenJS.NodeJS.LTS` |
| **Python 3** + `python-pptx` | 실측 도구와 `verify.py` | `winget install Python.Python.3.12` → `pip install python-pptx` |
| **LibreOffice** | 원본 대조 렌더 | `winget install TheDocumentFoundation.LibreOffice` |
| **poppler** | PDF → PNG | `scoop install poppler` |
| **KoPub돋움체** | 렌더와 파워포인트가 같은 글꼴을 써야 줄바꿈이 일치한다 | 사내 PC 엔 이미 있을 가능성이 높다 |

설치 후 반드시 확인:

```bash
cd deck/namp-2026
npm install
npm run doctor      # 빠진 것만 설치 방법을 알려 준다
```

## 쓰는 법

```bash
cd deck/guarantee-2026      # 또는 namp-2026
npm run build               # out/ 에 PPTX
npm run verify              # 구조·원문·차트 검증
npm run render              # 원본 대조용 PNG
npm run doctor              # 환경 점검
```

`namp-2026` 에는 원문 편집기도 있다.

```bash
cd deck/namp-2026
npm run build:web && npm run serve      # http://localhost:8080
```

## 윈도우에서 달라지는 점

원래 bash 스크립트였던 것을 전부 Node 로 바꿨다. `tools/env.js` 가 실행파일을 찾는다.

| 예전 | 지금 | 이유 |
|---|---|---|
| `bash tools/render.sh` | `node tools/render.js` | 윈도우에 bash·sed·printf 가 없다 |
| `python3 verify.py` | `node tools/py.js verify.py` | 윈도우는 `python` 또는 `py -3` 다 |
| `for k in …; do …; done` | `node tools/build-all.js` | sh 문법이다 |
| `soffice` | `soffice.com` 자동 탐색 | `.exe` 는 변환이 끝나기 전에 되돌아온다 |

찾지 못하면 환경변수로 못박을 수 있다.

```bash
SOFFICE_BIN="C:\Program Files\LibreOffice\program\soffice.com"
PDFTOPPM_BIN="C:\Users\...\scoop\shims\pdftoppm.exe"
PYTHON_BIN="C:\Python312\python.exe"
```

## 클라우드에서 이어받기

```bash
git clone <저장소> kstat-pm
cd kstat-pm
git checkout claude/editable-pptx-regenerate-69m53j
```

각 덱의 `README.md` 에 좌표계·차트 규약·원본과 다른 점·오탈자 교정표가 다 있다.
새 세션에서도 그것만 읽으면 이어서 작업할 수 있다.
