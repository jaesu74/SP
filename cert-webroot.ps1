#!/usr/bin/env pwsh
# cert-webroot.ps1
# Let's Encrypt 인증서를 webroot 방식으로 발급하는 스크립트

# 도메인 및 이메일 설정
$domain = "sp.wvl.co.kr"
$email = "support@wvl.co.kr"

Write-Host "도메인 '$domain'에 대한 Let's Encrypt SSL 인증서를 발급합니다."
Write-Host "이메일: $email"
Write-Host ""
Write-Host "진행하시겠습니까? (y/n)"
$confirm = Read-Host
if ($confirm -ne "y") {
    Write-Host "작업을 취소합니다."
    exit
}

# certbot 디렉토리 확인 및 생성
$certbotPath = ".\certbot"
$wwwPath = "$certbotPath\www"
$configPath = "$certbotPath\conf"
$logsPath = "$certbotPath\logs"
$workPath = "$certbotPath\work"

if (-not (Test-Path $wwwPath)) {
    Write-Host "certbot www 디렉토리를 생성합니다..."
    New-Item -Path $wwwPath -ItemType Directory -Force | Out-Null
}

if (-not (Test-Path "$wwwPath\.well-known\acme-challenge")) {
    Write-Host "acme-challenge 디렉토리를 생성합니다..."
    New-Item -Path "$wwwPath\.well-known\acme-challenge" -ItemType Directory -Force | Out-Null
}

if (-not (Test-Path $configPath)) {
    Write-Host "certbot conf 디렉토리를 생성합니다..."
    New-Item -Path $configPath -ItemType Directory -Force | Out-Null
}

if (-not (Test-Path $logsPath)) {
    Write-Host "certbot logs 디렉토리를 생성합니다..."
    New-Item -Path $logsPath -ItemType Directory -Force | Out-Null
}

if (-not (Test-Path $workPath)) {
    Write-Host "certbot work 디렉토리를 생성합니다..."
    New-Item -Path $workPath -ItemType Directory -Force | Out-Null
}

# 기존 Docker 컨테이너 상태 확인
Write-Host "Docker 컨테이너 상태를 확인합니다..."
docker ps

# 테스트 파일 생성
Write-Host "테스트 파일을 생성하여 웹루트 접근을 확인합니다..."
$testFile = "$wwwPath\test.txt"
"테스트 파일입니다. $(Get-Date)" | Out-File -FilePath $testFile -Encoding utf8

Write-Host "테스트 URL: http://$domain/.well-known/test.txt 접속 가능 여부를 확인하세요."
Write-Host "확인 후 계속 진행하려면 아무 키나 누르세요..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# certbot 명령 실행 (webroot 방식)
Write-Host "Let's Encrypt 인증서 발급을 시작합니다..."
$certbotCommand = "docker run --rm " +
                  "-v ${PWD}\certbot\conf:/etc/letsencrypt " +
                  "-v ${PWD}\certbot\logs:/var/log/letsencrypt " +
                  "-v ${PWD}\certbot\work:/var/lib/letsencrypt " +
                  "-v ${PWD}\certbot\www:/var/www " +
                  "certbot/certbot certonly " +
                  "--webroot " +
                  "--webroot-path=/var/www " +
                  "--email $email " +
                  "--agree-tos " +
                  "--no-eff-email " +
                  "--force-renewal " +
                  "-d $domain"

Write-Host "실행 명령: $certbotCommand"
Invoke-Expression $certbotCommand

# 인증서 확인
$certPath = ".\certbot\conf\live\$domain\fullchain.pem"
if (Test-Path $certPath) {
    Write-Host "인증서가 성공적으로 발급되었습니다!"
    Write-Host "인증서 경로: $certPath"
    
    # nginx 설정 업데이트 확인
    Write-Host "nginx 설정을 확인합니다..."
    $nginxConfig = Get-Content -Path ".\nginx\nginx-ssl.conf" -Raw
    $correctCertPath = $nginxConfig -match "ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem"
    $correctKeyPath = $nginxConfig -match "ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem"
    
    if (-not $correctCertPath -or -not $correctKeyPath) {
        Write-Host "nginx 설정을 업데이트해야 합니다."
        Write-Host "nginx/nginx-ssl.conf 파일에서 인증서 경로를 다음으로 수정하세요:"
        Write-Host "ssl_certificate /etc/letsencrypt/live/$domain/fullchain.pem;"
        Write-Host "ssl_certificate_key /etc/letsencrypt/live/$domain/privkey.pem;"
    }
    
    # nginx 컨테이너 재시작
    Write-Host "nginx 컨테이너를 재시작합니다..."
    docker-compose restart nginx
    
    Write-Host "https://$domain 접속을 확인하세요."
} else {
    Write-Host "인증서 발급에 실패했습니다. 로그를 확인하세요: .\certbot\logs"
    Get-Content -Path ".\certbot\logs\letsencrypt.log" -Tail 50
}

# 테스트 파일 제거
if (Test-Path $testFile) {
    Remove-Item -Path $testFile -Force
}

Write-Host "완료! 인증서는 90일 후 자동으로 갱신됩니다." 