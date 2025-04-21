# Let's Encrypt SSL 인증서 발급 스크립트 - 도커 볼륨 매핑 방식
# 이 스크립트는 Certbot을 사용하여 sp.wvl.co.kr 도메인에 대한 SSL 인증서를 발급합니다.

$domain = "sp.wvl.co.kr"
$email = "support@wvl.co.kr"

# 사용자 확인
Write-Host "도메인 $domain 에 대한 Let's Encrypt SSL 인증서를 발급합니다." -ForegroundColor Yellow
$confirm = Read-Host "계속하시겠습니까? (y/n)"
if ($confirm -ne "y") { exit }

# Certbot 디렉토리 생성
$certbotConfDir = "certbot/conf"
$certbotWwwDir = "certbot/www"
$acmeChallengeDir = "$certbotWwwDir/.well-known/acme-challenge"

if (-not (Test-Path $certbotConfDir)) { New-Item -ItemType Directory -Path $certbotConfDir -Force }
if (-not (Test-Path $acmeChallengeDir)) { New-Item -ItemType Directory -Path $acmeChallengeDir -Force }

# ACME 챌린지 테스트 파일 생성
Write-Host "ACME 챌린지 테스트 파일 생성 중..." -ForegroundColor Cyan
$testFile = "test-file-$((Get-Random).ToString().Substring(0, 8))"
$testFilePath = "$acmeChallengeDir/$testFile"
"이것은 ACME 챌린지 테스트 파일입니다." | Out-File -FilePath $testFilePath -Encoding utf8

# Docker 컨테이너가 실행 중인지 확인
$nginxRunning = docker ps -q -f name=nginx
if (-not $nginxRunning) {
    Write-Host "Nginx 컨테이너가 실행 중이 아닙니다. Docker Compose를 시작합니다." -ForegroundColor Yellow
    docker-compose up -d nginx
}

# 잠시 대기하여 Nginx가 시작될 시간을 줍니다
Write-Host "Nginx가 시작되기를 기다리는 중..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# ACME 챌린지 경로가 제대로 작동하는지 확인
Write-Host "ACME 챌린지 경로 테스트 중..." -ForegroundColor Cyan
$testUrl = "http://$domain/.well-known/acme-challenge/$testFile"
$response = try { Invoke-WebRequest -Uri $testUrl -UseBasicParsing } catch { $_.Exception.Response }

if ($response.StatusCode -eq 200) {
    Write-Host "ACME 챌린지 경로가 올바르게 설정되어 있습니다." -ForegroundColor Green
} else {
    Write-Host "ACME 챌린지 경로에 접근할 수 없습니다. 상태 코드: $($response.StatusCode)" -ForegroundColor Red
    
    # Docker 컨테이너 내부에서 파일 확인
    Write-Host "Docker 컨테이너 내부에서 ACME 챌린지 파일 확인 중..." -ForegroundColor Yellow
    docker exec sp-nginx-1 ls -la /var/www/certbot/.well-known/acme-challenge/
    
    # Nginx 로그 확인
    Write-Host "Nginx 로그 확인 중..." -ForegroundColor Yellow
    docker exec sp-nginx-1 tail -n 20 /var/log/nginx/error.log
    
    # 사용자에게 계속 진행할지 물어봅니다
    Write-Host "ACME 챌린지 경로 테스트에 실패했습니다. 계속 진행하시겠습니까? (y/n)" -ForegroundColor Red
    $continueConfirm = Read-Host
    if ($continueConfirm -ne "y") { 
        Write-Host "스크립트를 취소합니다." -ForegroundColor Yellow
        exit 
    }
}

# 스탠드얼론 모드로 시도
Write-Host "웹루트 방식 대신 스탠드얼론 방식으로 시도합니다..." -ForegroundColor Cyan
Write-Host "Nginx 컨테이너를 중지합니다." -ForegroundColor Yellow
docker-compose stop nginx

# 잠시 대기하여 Nginx가 완전히 중지될 시간을 줍니다
Start-Sleep -Seconds 3

# Docker로 Certbot 실행하여 인증서 발급 (스탠드얼론 모드)
Write-Host "인증서 발급 중 (스탠드얼론 모드)..." -ForegroundColor Cyan
$certbotCmd = "docker run -it --rm " +
            "--network host " +
            "-v ${PWD}/certbot/conf:/etc/letsencrypt " +
            "-v ${PWD}/certbot/www:/var/www/certbot " +
            "certbot/certbot certonly " +
            "--standalone " +
            "--email $email " +
            "--agree-tos --no-eff-email " +
            "--force-renewal " +
            "-d $domain"

# 인증서 발급 명령 실행
Invoke-Expression $certbotCmd

# Nginx 재시작
Write-Host "Nginx 컨테이너 재시작 중..." -ForegroundColor Cyan
docker-compose up -d nginx

# 인증서 발급 확인
Start-Sleep -Seconds 5  # 파일 시스템 동기화를 위해 잠시 대기
$certPath = "$certbotConfDir/live/$domain/fullchain.pem"
if (Test-Path $certPath) {
    Write-Host "인증서가 성공적으로 발급되었습니다!" -ForegroundColor Green
    Write-Host "인증서 발급 및 Nginx 재시작이 완료되었습니다." -ForegroundColor Green
    Write-Host "https://$domain 에서 확인하세요." -ForegroundColor Cyan
} else {
    Write-Host "인증서 발급에 실패했습니다. 로그를 확인하세요." -ForegroundColor Red
    Write-Host "Docker 컨테이너에서 발생한 로그를 확인하려면 다음 명령을 실행하세요:" -ForegroundColor Yellow
    Write-Host "docker logs certbot" -ForegroundColor Gray
} 