# 자동으로 y를 입력하고 cert-standalone.ps1을 실행하는 스크립트
$certScript = Get-Content -Path ".\cert-standalone.ps1" -Raw
$certScript = $certScript -replace "Read-Host", "'y'"
$tempScriptPath = ".\temp-cert-script.ps1"
$certScript | Out-File -FilePath $tempScriptPath

# 임시 스크립트 실행
Write-Host "인증서 발급 스크립트를 실행합니다..."
& $tempScriptPath

# 임시 스크립트 삭제
Remove-Item -Path $tempScriptPath -Force
Write-Host "인증서 발급 프로세스가 완료되었습니다." 