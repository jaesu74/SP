#!/usr/bin/env pwsh
# direct-cert.ps1
# 직접 certbot 명령을 실행하여 인증서를 발급하는 스크립트

$domain = "sp.wvl.co.kr"
$email = "jaesu@kakao.com"

# 사용자 확인
Write-Host "이 스크립트는 '$domain' 도메인에 대한 Let's Encrypt SSL 인증서를 발급합니다."
Write-Host "계속 진행하시겠습니까? (y/n)"
$confirm = Read-Host
if ($confirm -ne "y") {
    Write-Host "스크립트 실행이 취소되었습니다."
    exit
}

# certbot 디렉토리 생성
Write-Host "certbot 디렉토리 생성 중..."
if (-not (Test-Path -Path "certbot/conf/live/$domain")) {
    New-Item -ItemType Directory -Path "certbot/conf/live/$domain" -Force | Out-Null
}
if (-not (Test-Path -Path "certbot/www/.well-known/acme-challenge")) {
    New-Item -ItemType Directory -Path "certbot/www/.well-known/acme-challenge" -Force | Out-Null
}

# ACME 챌린지 테스트
Write-Host "ACME 챌린지 테스트 파일 생성 중..."
$testContent = "This is a test file for certbot ACME challenge"
$testFilePath = "certbot/www/.well-known/acme-challenge/test-direct.txt"
$testContent | Out-File -FilePath $testFilePath -Encoding ASCII

# 테스트 파일 접근 확인
Write-Host "테스트 파일 접근 확인 중..."
Write-Host "URL: http://$domain/.well-known/acme-challenge/test-direct.txt"
$testResponse = curl -s -o /dev/null -w "%{http_code}" "http://$domain/.well-known/acme-challenge/test-direct.txt"
Write-Host "HTTP 응답 코드: $testResponse"

if ($testResponse -ne "200") {
    Write-Host "오류: ACME 챌린지 경로에 접근할 수 없습니다." -ForegroundColor Red
    Write-Host "Nginx 설정을 확인하세요. .well-known/acme-challenge 경로가 올바르게 구성되어 있는지 확인하세요." -ForegroundColor Yellow
    
    # Nginx 설정 수정 제안
    Write-Host "`nNginx 설정에 다음 내용이 포함되어 있는지 확인하세요:" -ForegroundColor Yellow
    Write-Host "server {" -ForegroundColor Cyan
    Write-Host "    listen 80;" -ForegroundColor Cyan
    Write-Host "    server_name $domain;" -ForegroundColor Cyan
    Write-Host "    location /.well-known/acme-challenge/ {" -ForegroundColor Cyan
    Write-Host "        root /var/www/certbot;" -ForegroundColor Cyan
    Write-Host "    }" -ForegroundColor Cyan
    Write-Host "}" -ForegroundColor Cyan
    
    # 방화벽 확인 제안
    Write-Host "`n외부에서 포트 80에 접근할 수 있는지 확인하세요:" -ForegroundColor Yellow
    Write-Host "1. Google Cloud 콘솔에서 VPC 네트워크 > 방화벽 규칙 확인" -ForegroundColor Cyan
    Write-Host "2. 다음 명령으로 포트 80이 열려있는지 확인: curl -I http://$domain" -ForegroundColor Cyan
    
    # 사용자에게 계속 진행할지 묻기
    Write-Host "`n계속 진행하시겠습니까? (y/n)"
    $continueConfirm = Read-Host
    if ($continueConfirm -ne "y") {
        Write-Host "스크립트 실행이 취소되었습니다."
        Remove-Item -Path $testFilePath -Force
        exit
    }
}

# Nginx 컨테이너 정지
Write-Host "Nginx 컨테이너 정지 중..."
docker-compose stop nginx

# 대기 시간 추가
Write-Host "3초 대기 중..."
Start-Sleep -Seconds 3

# certbot 실행하여 인증서 발급
Write-Host "certbot 실행하여 인증서 발급 중..."
docker run --rm -p 80:80 `
    -v ${PWD}/certbot/conf:/etc/letsencrypt `
    -v ${PWD}/certbot/logs:/var/log/letsencrypt `
    -v ${PWD}/certbot/www:/var/www/certbot `
    certbot/certbot certonly --standalone `
    --non-interactive --agree-tos `
    --email $email `
    --domains $domain `
    --force-renewal

# 인증서 발급 결과 확인
$certPath = "certbot/conf/live/$domain/fullchain.pem"
if (Test-Path -Path $certPath) {
    Write-Host "인증서가 성공적으로 발급되었습니다!" -ForegroundColor Green
    
    # 발급된 인증서 정보 표시
    Write-Host "`n인증서 정보:" -ForegroundColor Cyan
    Write-Host "- 인증서 경로: $certPath" -ForegroundColor Cyan
    Write-Host "- 만료일: $(docker run --rm -v ${PWD}/certbot/conf:/etc/letsencrypt certbot/certbot certificates | Select-String -Pattern "Expiry Date")" -ForegroundColor Cyan
} else {
    Write-Host "인증서 발급에 실패했습니다." -ForegroundColor Red
    Write-Host "certbot 로그를 확인하세요: certbot/logs/" -ForegroundColor Yellow
    
    # 로그 파일 내용 표시
    $logFiles = Get-ChildItem -Path "certbot/logs" -Filter "*.log" | Sort-Object LastWriteTime -Descending
    if ($logFiles.Count -gt 0) {
        $latestLog = $logFiles[0].FullName
        Write-Host "`n최신 로그 파일 내용 (마지막 20줄):" -ForegroundColor Yellow
        Get-Content -Path $latestLog -Tail 20
    }
}

# 테스트 파일 제거
Remove-Item -Path $testFilePath -Force

# Nginx 컨테이너 재시작
Write-Host "Nginx 컨테이너 재시작 중..."
docker-compose start nginx

Write-Host "`n프로세스 완료!"
Write-Host "https://$domain 에서 SSL 인증서를 확인하세요." 