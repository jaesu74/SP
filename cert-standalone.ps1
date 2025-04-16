# SSL 인증서 발급 스크립트 (Let's Encrypt with Docker)
$domain = "sp.wvl.co.kr"
$email = "support@wvl.co.kr"

Write-Host "Let's Encrypt SSL 인증서 발급을 시작합니다: $domain" -ForegroundColor Green
Write-Host "이 스크립트는 Let's Encrypt의 HTTP-01 챌린지를 이용해 인증서를 발급합니다." -ForegroundColor Yellow
Write-Host "진행하려면 Enter를 누르세요. 취소하려면 Ctrl+C를 누르세요." -ForegroundColor Yellow
Read-Host

# 기존 컨테이너 중지
Write-Host "현재 실행 중인 nginx 컨테이너를 중지합니다..." -ForegroundColor Yellow
docker stop $(docker ps -q --filter name=sp_nginx)

# 필요한 디렉토리 생성
Write-Host "필요한 디렉토리를 생성합니다..." -ForegroundColor Yellow
mkdir -p certbot/conf
mkdir -p certbot/www/.well-known/acme-challenge

# 테스트 파일 생성하여 챌린지 경로 작동 확인
$testPath = "certbot/www/.well-known/acme-challenge/test-file.txt"
"This is a test file for ACME challenge" | Out-File -FilePath $testPath -Encoding utf8

# 인증서 발급용 임시 Nginx 컨테이너 실행
Write-Host "HTTP-01 챌린지를 위한 임시 웹 서버를 시작합니다..." -ForegroundColor Yellow
docker run --rm -d --name acme_nginx -p 80:80 -v ${PWD}/certbot/www:/usr/share/nginx/html nginx:alpine

# 접근 테스트
Write-Host "챌린지 경로 접근 테스트 중..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$testUrl = "http://$domain/.well-known/acme-challenge/test-file.txt"
$testResult = curl -s $testUrl
if ($testResult -match "test file") {
    Write-Host "챌린지 경로 접근 가능 확인됨!" -ForegroundColor Green
} else {
    Write-Host "경고: 챌린지 경로에 접근할 수 없습니다. 인증서 발급이 실패할 수 있습니다." -ForegroundColor Red
    Write-Host "계속 진행하려면 Enter를 누르세요. 취소하려면 Ctrl+C를 누르세요." -ForegroundColor Yellow
    Read-Host
}

# Let's Encrypt 인증서 발급
Write-Host "인증서 발급을 시작합니다..." -ForegroundColor Yellow
docker run --rm -v ${PWD}/certbot/conf:/etc/letsencrypt -v ${PWD}/certbot/www:/var/www/certbot certbot/certbot certonly --webroot -w /var/www/certbot -d $domain --email $email --agree-tos --no-eff-email --force-renewal

# 임시 Nginx 컨테이너 중지
Write-Host "임시 웹 서버를 중지합니다..." -ForegroundColor Yellow
docker stop acme_nginx

# 인증서 발급 확인
$certPath = "certbot/conf/live/$domain/fullchain.pem"
if (Test-Path $certPath) {
    Write-Host "인증서가 성공적으로 발급되었습니다!" -ForegroundColor Green
    
    # 인증서 정보 표시
    docker run --rm -v ${PWD}/certbot/conf:/etc/letsencrypt certbot/certbot certificates

    # 인증서 복사 (docker-compose 볼륨과 호환되도록)
    Write-Host "인증서를 볼륨 경로로 복사합니다..." -ForegroundColor Yellow
    if (-not (Test-Path "certbot/etc/letsencrypt/live/$domain")) {
        mkdir -p "certbot/etc/letsencrypt/live/$domain"
    }
    
    Copy-Item -Path "certbot/conf/live/$domain/*" -Destination "certbot/etc/letsencrypt/live/$domain/" -Recurse -Force
    Copy-Item -Path "certbot/conf/archive" -Destination "certbot/etc/letsencrypt/" -Recurse -Force
    Copy-Item -Path "certbot/conf/renewal" -Destination "certbot/etc/letsencrypt/" -Recurse -Force
    
    # Docker 컨테이너 시작
    Write-Host "nginx 컨테이너를 다시 시작합니다..." -ForegroundColor Yellow
    docker-compose up -d nginx
    
    Write-Host "완료! https://$domain 에서 사이트를 확인하세요." -ForegroundColor Green
    Write-Host "인증서는 certbot 서비스에 의해 자동으로 갱신됩니다." -ForegroundColor Green
} else {
    Write-Host "인증서 발급에 실패했습니다. 로그를 확인하세요." -ForegroundColor Red
} 