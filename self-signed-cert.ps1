# 자체 서명 인증서 생성 스크립트
$domain = "sp.wvl.co.kr"
$tempDir = "$env:TEMP\self-signed-cert"
$dockerTempDir = "$tempDir\docker"

# 임시 디렉토리 생성
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null
New-Item -Path $dockerTempDir -ItemType Directory -Force | Out-Null

Write-Host "자체 서명 인증서를 생성합니다: $domain" -ForegroundColor Yellow

# 인증서 생성
$cert = New-SelfSignedCertificate `
    -DnsName $domain `
    -CertStoreLocation cert:\LocalMachine\My `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -NotAfter (Get-Date).AddDays(90) `
    -KeyExportPolicy Exportable `
    -HashAlgorithm SHA256

Write-Host "인증서가 생성되었습니다. 인증서 지문: $($cert.Thumbprint)" -ForegroundColor Green

# 인증서 내보내기
$certPwd = ConvertTo-SecureString -String "temp1234" -Force -AsPlainText
$certPath = "$tempDir\$domain.pfx"
Export-PfxCertificate -Cert "cert:\LocalMachine\My\$($cert.Thumbprint)" -FilePath $certPath -Password $certPwd | Out-Null

Write-Host "인증서가 PFX 파일로 내보내졌습니다: $certPath" -ForegroundColor Green

# Nginx 중지
Write-Host "Nginx 컨테이너를 중지합니다..." -ForegroundColor Yellow
docker-compose stop nginx

# Docker로 PFX를 PEM 형식으로 변환
Set-Location -Path $tempDir
$dockerfile = @"
FROM alpine:latest
RUN apk add --no-cache openssl
WORKDIR /certs
CMD ["/bin/sh", "-c", "openssl pkcs12 -in $domain.pfx -nocerts -nodes -passin pass:temp1234 -out $domain.key && openssl pkcs12 -in $domain.pfx -clcerts -nokeys -passin pass:temp1234 -out $domain.crt"]
"@

Set-Content -Path "$dockerTempDir\Dockerfile" -Value $dockerfile
Copy-Item -Path $certPath -Destination $dockerTempDir

# Docker 이미지 빌드 및 실행
Push-Location $dockerTempDir
Write-Host "Docker 이미지를 빌드하고 인증서를 PEM 형식으로 변환합니다..." -ForegroundColor Green
docker build -t cert-converter .
docker run --rm -v ${PWD}:/certs cert-converter
Pop-Location

# Certbot 디렉토리 생성
$certbotLiveDir = "certbot/conf/live/$domain"
if (-not (Test-Path $certbotLiveDir)) {
    New-Item -Path $certbotLiveDir -ItemType Directory -Force | Out-Null
}

# 인증서 파일 복사
Write-Host "인증서 파일을 Certbot 디렉토리로 복사합니다..." -ForegroundColor Green
Copy-Item -Path "$dockerTempDir\$domain.crt" -Destination "$certbotLiveDir\fullchain.pem" -Force
Copy-Item -Path "$dockerTempDir\$domain.key" -Destination "$certbotLiveDir\privkey.pem" -Force

# Certbot 설정 디렉토리 생성
$certbotArchiveDir = "certbot/conf/archive/$domain"
if (-not (Test-Path $certbotArchiveDir)) {
    New-Item -Path $certbotArchiveDir -ItemType Directory -Force | Out-Null
}

# 아카이브 디렉토리에도 복사
Copy-Item -Path "$dockerTempDir\$domain.crt" -Destination "$certbotArchiveDir\fullchain1.pem" -Force
Copy-Item -Path "$dockerTempDir\$domain.key" -Destination "$certbotArchiveDir\privkey1.pem" -Force

# Nginx 재시작
Write-Host "Nginx 컨테이너를 재시작합니다..." -ForegroundColor Green
docker-compose up -d nginx

# 임시 파일 정리
Write-Host "임시 파일을 정리합니다..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force

# 인증서 저장소에서 인증서 제거
Remove-Item -Path "cert:\LocalMachine\My\$($cert.Thumbprint)" -Force

Write-Host ""
Write-Host "자체 서명 인증서 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host "https://$domain 에서 확인해 보세요 (브라우저에서 보안 경고가 표시됩니다)." -ForegroundColor Yellow
Write-Host ""
Write-Host "참고: Let's Encrypt 인증서를 발급받으려면 cert-standalone.ps1 스크립트를 실행하세요." -ForegroundColor Cyan
Write-Host "Let's Encrypt는 IP당 주당 5개의 인증서 발급 제한이 있습니다." -ForegroundColor Cyan 