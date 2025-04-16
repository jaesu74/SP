# nginx를 위한 더미 인증서 생성 스크립트

# nginx conf.d 디렉토리 생성
if (-not (Test-Path -Path ".\nginx\conf.d")) {
    New-Item -ItemType Directory -Path ".\nginx\conf.d" -Force | Out-Null
}

# 더미 인증서 생성
Write-Host "더미 인증서 생성 중..."
$certPath = (Get-Location).Path + "\nginx\conf.d"
$certPathDocker = $certPath.Replace("\", "/").Replace("C:", "/c")

Write-Host "인증서를 생성할 경로: $certPath"
Write-Host "도커 볼륨 마운트 경로: $certPathDocker"

docker run --rm -v "${certPathDocker}:/cert" nginx:alpine /bin/sh -c "cd /cert && apk add --no-cache openssl && openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout dummy.key -out dummy.crt -subj '/CN=localhost' && chmod 644 dummy.key dummy.crt"

$crtExists = Test-Path -Path ".\nginx\conf.d\dummy.crt"
$keyExists = Test-Path -Path ".\nginx\conf.d\dummy.key"

if ($crtExists -and $keyExists) {
    Write-Host "인증서 생성 완료! 이제 docker-compose up -d를 실행하세요."
} else {
    Write-Host "인증서 생성에 실패했습니다."
    exit 1
} 