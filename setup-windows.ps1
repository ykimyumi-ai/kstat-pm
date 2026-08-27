<#
  케이스탯 덱 작업 환경 세팅 (윈도우)

  하는 일: winget 으로 Node·Python·LibreOffice 를, scoop 으로 poppler 를 깔고
           npm 의존성을 설치한 뒤 점검까지 돌린다. 이미 있는 것은 건너뛴다.

  사용 (PowerShell 에서):
      Set-ExecutionPolicy -Scope Process Bypass -Force
      .\setup-windows.ps1

  관리자 권한은 winget 설치 단계에서만 필요할 수 있다.
#>
$ErrorActionPreference = 'Stop'

function Have($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Step($msg) { Write-Host "`n== $msg" -ForegroundColor Cyan }

Step '1/5  Node.js'
if (Have node) { Write-Host "  이미 있음: $(node -v)" }
else { winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements }

Step '2/5  Python 3 + python-pptx'
if (Have python) { Write-Host "  이미 있음: $(python -V)" }
else { winget install -e --id Python.Python.3.12 --accept-source-agreements --accept-package-agreements }
# 새 셸이 아니면 방금 깐 python 이 PATH 에 안 잡힌다
$py = (Get-Command python -ErrorAction SilentlyContinue)
if ($py) { & $py.Source -m pip install --quiet --upgrade python-pptx }
else { Write-Host "  PowerShell 을 새로 열고 다시 실행할 것 (PATH 갱신 필요)" -ForegroundColor Yellow }

Step '3/5  LibreOffice  (원본 대조 렌더용)'
$soffice = 'C:\Program Files\LibreOffice\program\soffice.com'
if (Test-Path $soffice) { Write-Host '  이미 있음' }
else { winget install -e --id TheDocumentFoundation.LibreOffice --accept-source-agreements --accept-package-agreements }

Step '4/5  poppler  (PDF → PNG)'
if (Have pdftoppm) { Write-Host '  이미 있음' }
else {
  if (-not (Have scoop)) {
    Write-Host '  scoop 설치 중…'
    Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
  }
  scoop install poppler
}

Step '5/5  npm 의존성 + 점검'
Push-Location (Join-Path $PSScriptRoot 'deck\namp-2026')
npm install
npm run doctor
Pop-Location

Write-Host "`n세팅 끝. 문제가 있으면 'npm run doctor' 결과를 그대로 알려 줄 것." -ForegroundColor Green
