# PowerShell script for setting up SSL certificates
# Check if docker-compose is installed
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Error "docker-compose is not installed or not in PATH"
    exit 1
}

# Domain and email configuration
$domains = @("sp.wvl.co.kr")
$email = "support@wvl.co.kr" # Change to your email

# 인증서 요청 전 준비 작업
Write-Host "인증서 발급 준비 중..."

# Create directories for certificate data
if (-not (Test-Path -Path ".\certbot\www\.well-known\acme-challenge")) {
    New-Item -ItemType Directory -Path ".\certbot\www\.well-known\acme-challenge" -Force | Out-Null
    # 테스트 파일 생성
    "acme-challenge directory" | Out-File -FilePath ".\certbot\www\.well-known\acme-challenge\test.txt"
}

# Download TLS parameters if they don't exist
if (-not (Test-Path -Path ".\certbot\conf\options-ssl-nginx.conf") -or 
    -not (Test-Path -Path ".\certbot\conf\ssl-dhparams.pem")) {
    
    Write-Host "TLS 파라미터 다운로드 중..."
    
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf" -OutFile ".\certbot\conf\options-ssl-nginx.conf"
    
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem" -OutFile ".\certbot\conf\ssl-dhparams.pem"
}

# 컨테이너 상태 확인
Write-Host "컨테이너 상태 확인..."
docker-compose ps

# 진단 도구 실행 (acme-challenge 경로 테스트)
Write-Host "ACME 챌린지 경로 테스트..."
docker-compose exec nginx curl -Ik http://sp.wvl.co.kr/.well-known/acme-challenge/test.txt

Write-Host "`n인증서 발급 준비가 완료되었습니다. 인증서를 발급하시겠습니까? (y/n)"
$response = Read-Host
if ($response -ne "y") {
    Write-Host "인증서 발급이 취소되었습니다."
    exit 0
}

# Request Let's Encrypt certificate
Write-Host "Let's Encrypt 인증서 요청 중..."
docker-compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot --email $email -d $domains --agree-tos --no-eff-email" certbot

Write-Host "인증서 발급이 완료되었습니다. Nginx 설정을 수정합니다..."

# nginx 설정 수정
$nginxConfPath = ".\nginx\nginx-ssl.conf"
$nginxConf = Get-Content -Path $nginxConfPath -Raw
$nginxConf = $nginxConf -replace "# 임시로 자체 서명 인증서 사용 \(인증서 발급 전까지만\)", "# sp.wvl.co.kr 인증서 사용"
$nginxConf = $nginxConf -replace "ssl_certificate /etc/nginx/conf.d/dummy.crt;", "ssl_certificate /etc/letsencrypt/live/$domains/fullchain.pem;"
$nginxConf = $nginxConf -replace "ssl_certificate_key /etc/nginx/conf.d/dummy.key;", "ssl_certificate_key /etc/letsencrypt/live/$domains/privkey.pem;"
$nginxConf | Out-File -FilePath $nginxConfPath

# Reload nginx
Write-Host "Nginx 재시작 중..."
docker-compose exec nginx nginx -s reload

Write-Host "인증서 설정이 완료되었습니다. https://$domains 에서 확인하세요." 