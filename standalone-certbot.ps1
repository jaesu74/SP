# standalone-certbot.ps1
# 호스트 네트워크 모드에서 certbot을 실행하여 Let's Encrypt 인증서 발급

# 설정값
$domain = "sp.wvl.co.kr"
$email = "support@wvl.co.kr"

# 사용자 확인
Write-Host "Let's Encrypt SSL 인증서 발급을 시작합니다: $domain" -ForegroundColor Green
$continue = Read-Host "계속하시겠습니까? (Y/N)"
if ($continue -ne "Y") {
    Write-Host "인증서 발급이 취소되었습니다." -ForegroundColor Yellow
    exit
}

# NGINX 컨테이너 중지
Write-Host "NGINX 컨테이너를 중지합니다..." -ForegroundColor Cyan
docker stop sp-nginx-1
Write-Host "NGINX 컨테이너가 중지되었습니다." -ForegroundColor Green

# 포트 80 확인
Write-Host "포트 80이 사용 가능한지 확인합니다..." -ForegroundColor Cyan
$portCheck = netstat -ano | findstr :80
if ($portCheck) {
    Write-Host "주의: 포트 80이 이미 사용 중입니다:" -ForegroundColor Yellow
    $portCheck
    $proceed = Read-Host "그래도 계속하시겠습니까? (Y/N)"
    if ($proceed -ne "Y") {
        Write-Host "인증서 발급이 취소되었습니다." -ForegroundColor Yellow
        docker start sp-nginx-1
        exit
    }
}

try {
    # 인증서 발급 (standalone 모드)
    Write-Host "certbot을 standalone 모드로 실행하여 인증서를 발급합니다..." -ForegroundColor Cyan
    
    # 네트워크 호스트 모드로 실행하여 포트 80 직접 사용
    $cmd = "docker run --rm --net=host -v `"$PWD/certbot/conf:/etc/letsencrypt`" certbot/certbot certonly --standalone --preferred-challenges http -d $domain --email $email --agree-tos --no-eff-email --force-renewal"
    
    Write-Host "실행 명령: $cmd" -ForegroundColor Gray
    Invoke-Expression $cmd
    
    # 인증서 발급 확인
    if (Test-Path "certbot/conf/live/$domain/fullchain.pem") {
        Write-Host "인증서가 성공적으로 발급되었습니다!" -ForegroundColor Green
        Write-Host "인증서 위치: certbot/conf/live/$domain/" -ForegroundColor Green
    } else {
        Write-Host "인증서 발급에 실패했습니다. 로그를 확인해 주세요." -ForegroundColor Red
    }
}
catch {
    Write-Host "오류 발생: $_" -ForegroundColor Red
}
finally {
    # NGINX 컨테이너 재시작
    Write-Host "NGINX 컨테이너를 재시작합니다..." -ForegroundColor Cyan
    docker start sp-nginx-1
    Write-Host "NGINX 컨테이너가 재시작되었습니다." -ForegroundColor Green
    
    # 인증서 발급 성공시 SSL 구성 확인 안내
    if (Test-Path "certbot/conf/live/$domain/fullchain.pem") {
        Write-Host "SSL 인증서가 발급되었습니다. 다음 단계:" -ForegroundColor Green
        Write-Host "1. NGINX SSL 구성을 확인하세요" -ForegroundColor Green
        Write-Host "2. https://$domain 에서 SSL 연결을 확인하세요" -ForegroundColor Green
    }
} 