#!/usr/bin/env pwsh
# cert-docker-webroot.ps1
# Docker-compose 환경에서 webroot 방식으로 Let's Encrypt 인증서를 발급하는 스크립트

# 도메인 및 이메일 설정
$domain = "sp.wvl.co.kr"
$email = "support@wvl.co.kr"

Write-Host "Docker-compose 환경에서 도메인 '$domain'에 대한 Let's Encrypt SSL 인증서를 발급합니다."
Write-Host "이메일: $email"
Write-Host ""
Write-Host "진행하시겠습니까? (y/n)"
$confirm = Read-Host
if ($confirm -ne "y") {
    Write-Host "작업을 취소합니다."
    exit
}

# 디렉토리 구조 확인
Write-Host "디렉토리 구조를 확인합니다..."
$certbotPath = ".\certbot"
$wwwPath = "$certbotPath\www"

if (-not (Test-Path $wwwPath)) {
    Write-Host "certbot www 디렉토리를 생성합니다..."
    New-Item -Path $wwwPath -ItemType Directory -Force | Out-Null
}

if (-not (Test-Path "$wwwPath\.well-known")) {
    Write-Host ".well-known 디렉토리를 생성합니다..."
    New-Item -Path "$wwwPath\.well-known" -ItemType Directory -Force | Out-Null
}

if (-not (Test-Path "$wwwPath\.well-known\acme-challenge")) {
    Write-Host "acme-challenge 디렉토리를 생성합니다..."
    New-Item -Path "$wwwPath\.well-known\acme-challenge" -ItemType Directory -Force | Out-Null
}

# 파일 권한 설정 확인
Write-Host "디렉토리 권한을 확인합니다..."
try {
    if (-not [System.OperatingSystem]::IsLinux()) {
        Write-Host "Windows 환경에서는 특별한 권한 설정이 필요하지 않습니다."
    }
} catch {
    Write-Host "운영체제 확인 중 오류가 발생했습니다. Windows 환경으로 가정하고 계속 진행합니다."
}

# 테스트 파일 생성
Write-Host "테스트 파일을 생성하여 웹루트 접근을 확인합니다..."
$testFilePath = "$wwwPath\.well-known\acme-challenge\test.txt"
"테스트 파일입니다. $(Get-Date)" | Out-File -FilePath $testFilePath -Encoding utf8

Write-Host "테스트 URL: http://$domain/.well-known/acme-challenge/test.txt"
Write-Host "브라우저에서 이 URL이 접근 가능한지 확인한 후 계속 진행하세요."

# 테스트 URL 확인
Write-Host "테스트 URL 접근성을 확인합니다..."
try {
    $response = Invoke-WebRequest -Uri "http://$domain/.well-known/acme-challenge/test.txt" -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "성공: 테스트 URL에 접근할 수 있습니다. HTTP 상태 코드: $($response.StatusCode)"
    } else {
        Write-Host "경고: 테스트 URL 접근에 문제가 있습니다. HTTP 상태 코드: $($response.StatusCode)"
    }
} catch {
    Write-Host "경고: 테스트 URL에 접근할 수 없습니다. 오류: $($_.Exception.Message)"
    Write-Host "Nginx 설정에서 .well-known/acme-challenge 경로가 올바르게 설정되어 있는지 확인하세요."
    Write-Host "계속 진행하시겠습니까? (y/n)"
    $continue = Read-Host
    if ($continue -ne "y") {
        Write-Host "작업을 취소합니다."
        exit
    }
}

# nginx 설정 확인
Write-Host "nginx 설정을 점검합니다..."
$nginxConfigFile = ".\nginx\nginx-ssl.conf"
if (Test-Path $nginxConfigFile) {
    $nginxConfig = Get-Content -Path $nginxConfigFile -Raw
    if ($nginxConfig -match "location /.well-known/acme-challenge") {
        Write-Host "nginx 설정에 acme-challenge 경로가 올바르게 설정되어 있습니다."
    } else {
        Write-Host "경고: nginx 설정에 acme-challenge 경로가 없습니다. nginx-ssl.conf 파일을 수정하세요."
        Write-Host "계속 진행하시겠습니까? (y/n)"
        $continue = Read-Host
        if ($continue -ne "y") {
            Write-Host "작업을 취소합니다."
            exit
        }
    }
} else {
    Write-Host "경고: nginx 설정 파일을 찾을 수 없습니다."
}

# Docker-compose 실행 중인지 확인
Write-Host "Docker 컨테이너 상태를 확인합니다..."
docker ps

Write-Host "인증서 발급을 위해 certbot 서비스를 실행합니다..."
$certbotCommand = "docker-compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email $email --agree-tos --no-eff-email --force-renewal -d $domain"

Write-Host "실행 명령: $certbotCommand"
Write-Host "인증서 발급을 시작합니다..."
Invoke-Expression $certbotCommand

# 인증서 확인
$certPath = ".\certbot\conf\live\$domain\fullchain.pem"
if (Test-Path $certPath) {
    Write-Host "인증서가 성공적으로 발급되었습니다!"
    Write-Host "인증서 경로: $certPath"
    
    # nginx 재시작
    Write-Host "nginx 컨테이너를 재시작합니다..."
    docker-compose restart nginx
    
    Write-Host "https://$domain 접속을 확인하세요."
} else {
    Write-Host "인증서 발급에 실패했습니다. 로그를 확인합니다:"
    if (Test-Path ".\certbot\logs\letsencrypt.log") {
        Get-Content -Path ".\certbot\logs\letsencrypt.log" -Tail 30
    } else {
        Write-Host "로그 파일을 찾을 수 없습니다."
    }
    
    Write-Host "문제 해결 방법:"
    Write-Host "1. nginx 설정에서 .well-known/acme-challenge 경로가 올바르게 설정되어 있는지 확인하세요."
    Write-Host "2. 방화벽에서 포트 80이 열려 있는지 확인하세요."
    Write-Host "3. DNS 설정이 올바른지 확인하세요. ($domain -> 34.22.74.163)"
    Write-Host "4. docker-compose 파일에서 볼륨 매핑이 올바른지 확인하세요."
}

# 테스트 파일 제거
if (Test-Path $testFilePath) {
    Remove-Item -Path $testFilePath -Force
    Write-Host "테스트 파일을 제거했습니다."
}

Write-Host "완료! 인증서는 90일 후 자동으로 갱신됩니다." 