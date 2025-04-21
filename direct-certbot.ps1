# 직접 인증서 발급 스크립트
# 호스트 네트워크를 사용해 스탠드얼론 모드로 Let's Encrypt 인증서 발급

$domain = "sp.wvl.co.kr"
$email = "support@wvl.co.kr"

Write-Host "도메인 $domain 에 대한 인증서를 발급합니다." -ForegroundColor Yellow
$continue = Read-Host "계속하시겠습니까? (y/n)"
if ($continue -ne "y") { exit }

# 기존 Nginx 중지
Write-Host "Nginx 중지 중..." -ForegroundColor Cyan
docker-compose stop nginx
Start-Sleep -Seconds 3

# 포트 상태 확인
Write-Host "포트 80 상태 확인 중..." -ForegroundColor Cyan
try {
    $testConnection = New-Object System.Net.Sockets.TcpClient
    $testConnection.Connect($domain, 80)
    Write-Host "포트 80이 이미 사용 중입니다. 프로세스를 확인하세요." -ForegroundColor Red
    $testConnection.Close()
    $proceed = Read-Host "계속 진행하시겠습니까? (y/n)"
    if ($proceed -ne "y") { exit }
} catch {
    Write-Host "포트 80이 사용 가능합니다." -ForegroundColor Green
}

# 인증서 발급
Write-Host "인증서 발급 중..." -ForegroundColor Cyan
Write-Host "다음 명령을 실행합니다: " -ForegroundColor Gray
Write-Host "docker run --rm -p 80:80 -v `"$((Get-Location).Path)\certbot\conf:/etc/letsencrypt`" certbot/certbot certonly --standalone --preferred-challenges http -d $domain --email $email --agree-tos --no-eff-email --force-renewal" -ForegroundColor Gray

docker run --rm -p 80:80 -v "$((Get-Location).Path)\certbot\conf:/etc/letsencrypt" certbot/certbot certonly --standalone --preferred-challenges http -d $domain --email $email --agree-tos --no-eff-email --force-renewal

# 인증서 발급 확인
Write-Host "인증서 발급 결과 확인 중..." -ForegroundColor Cyan
$certPath = "certbot\conf\live\$domain\fullchain.pem"
if (Test-Path $certPath) {
    Write-Host "인증서가 성공적으로 발급되었습니다!" -ForegroundColor Green
    
    # Nginx 설정이 sp.wvl.co.kr 인증서를 사용하도록 이미 수정되어 있음을 확인
    Write-Host "Nginx 재시작 중..." -ForegroundColor Cyan
    docker-compose up -d nginx
    
    Write-Host "인증서 발급 및 Nginx 재시작이 완료되었습니다." -ForegroundColor Green
    Write-Host "https://$domain 에서 확인하세요." -ForegroundColor Cyan
} else {
    Write-Host "인증서 발급에 실패했습니다." -ForegroundColor Red
} 