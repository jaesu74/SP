# 간단한 인증서 생성 스크립트
$domain = "sp.wvl.co.kr"

# 필요한 디렉토리 생성
$certbotLiveDir = "certbot/conf/live/$domain"
$certbotArchiveDir = "certbot/conf/archive/$domain"

if (-not (Test-Path $certbotLiveDir)) { 
    New-Item -Path $certbotLiveDir -ItemType Directory -Force | Out-Null
}
if (-not (Test-Path $certbotArchiveDir)) {
    New-Item -Path $certbotArchiveDir -ItemType Directory -Force | Out-Null
}

Write-Host "Nginx 컨테이너를 중지합니다..." -ForegroundColor Yellow
docker-compose stop nginx

# 인증서 직접 생성
Write-Host "간단한 더미 인증서를 생성합니다..." -ForegroundColor Green

$dummyCert = @"
-----BEGIN CERTIFICATE-----
MIIDazCCAlOgAwIBAgIUEqlt1sDyxd7LFG6skiOXB3SpMIcwDQYJKoZIhvcNAQEL
BQAwRTELMAkGA1UEBhMCS1IxEzARBgNVBAgMClNvbWUtU3RhdGUxITAfBgNVBAoM
GEludGVybmV0IFdpZGdpdHMgUHR5IEx0ZDAeFw0yNTA0MTYwNDQ1MTlaFw0yNTA1
MTYwNDQ1MTlaMEUxCzAJBgNVBAYTAktSMRMwEQYDVQQIDApTb21lLVN0YXRlMSEw
HwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQCj8snYvQDaOh8i4YSHRZT2vBMJvewMz3l5OO1c8DFc
sFLZUMvgB9n6MhYtj8XOhOt6qyD9A9ndyffbqGS6JMDVwgCEj9I1Rr8CBs0Rz83y
6cPKc0IZIMIqarVItKYVNRm3kky39g7GQkVSR8Z3E+0XxHJ0SCf2x4QEZUDSg1+v
kgUwmvxrh8YA1Zd0rWH4YVvcpgYbSqwUv4R5wKn5aBqQmUXX/JQaU0nCyQQihBXA
rJM0xSl8ow5YMDyX25vfqRgYSNFqT/O1RqOAUKhPpNpRPQUWz5G5jXMxgFg5E4l3
icBDruxYLzUeQZM/hvWyRdBzSRIUQiwxQrLgHFZHAgMBAAGjUzBRMB0GA1UdDgQW
BBQKXE9DHaF1Tza40yCKJiJ0sq7IUjAfBgNVHSMEGDAWgBQKXE9DHaF1Tza40yCK
JiJ0sq7IUjAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCjTy5t
z0rpY3kZrCDOH29g1C3eNdmz/Ik3w+b5e+prn43ztJkPi0nQrTGG5WrN4E5AkAg9
U5efD8Wk/l7aoyWnJnwCFJdaLphHJ9Cvw6R+YFjJAOSLcGLsbofWYlQmZ5oOfEUa
h8D4J/YIv6R0kUWiqSlwTQcNznE7g3c9X8fHJVtpQ1IwbXjqdDrGVVL1GBY4iV7k
QQ5KIB0p3PwSy1DhAoJLMXETWwNyZPjg/3cbwQUe4J5RieZVhFd8KsYPuY1okLg+
AZeYILrGJY2UZo7MkGqhxDwGbKgOAw8y9DQrC3IuN4WxIcpOUziGZSZ6+RThWNZN
bx/DYiZcZTqUz6Zt
-----END CERTIFICATE-----
"@

$dummyKey = @"
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCj8snYvQDaOh8i
4YSHRZT2vBMJvewMz3l5OO1c8DFcsFLZUMvgB9n6MhYtj8XOhOt6qyD9A9ndyffb
qGS6JMDVwgCEj9I1Rr8CBs0Rz83y6cPKc0IZIMIqarVItKYVNRm3kky39g7GQkVS
R8Z3E+0XxHJ0SCf2x4QEZUDSg1+vkgUwmvxrh8YA1Zd0rWH4YVvcpgYbSqwUv4R5
wKn5aBqQmUXX/JQaU0nCyQQihBXArJM0xSl8ow5YMDyX25vfqRgYSNFqT/O1RqOA
UKhPpNpRPQUWz5G5jXMxgFg5E4l3icBDruxYLzUeQZM/hvWyRdBzSRIUQiwxQrLg
HFZHAgMBAAECggEAKEjzXu/ksZFfE0hPYdkMZG5RqP+fUQU75I0B8BjmcpCr5Lva
jmBWL8jEFsB9gRu3mN+K6d7Jp6Jj89TkrH0YtU5O/mDIcDjXZq3zUHt+BpJ8MNfQ
GXX+s67HYXiZ3b8OtzWHFCn5BgVkFLQbYKwQOsqfr0CZpEW7Mh0g4HJ20GQ11IWB
B+/6X/L2KUWt5+J0qSYfXiA9mH5jRiKV4a6Z4KIKWwXUkMYYp05JXjMbFJA/+yh0
TjKtElJP5AY1cI7fSgDwxc6AJnXZwDmJX8bJLtLFUGaX+Xj+ZiGl26V8yU/8Fkzj
XJ9YaBTMI0WJ6ZsNVk77OhmN4Fbyv8LH9UYGaSHvgQKBgQDeXvLXaNXgMi/JnSoW
HWPEKcByjQu7AxOkFkKFIYTtdGIuF2nP0M/W4TgYVeZZ0SsGlye59FGtDUXJz5dx
fbtqktNnUQY+0A2oZ73JYzQAGBERUiJai5nyEEn/qvAXMJQfTeu+cJc7k11hR7Qm
hxgQz4jqeJRWE3ZVVIL5n/HGpQKBgQC8/KYmqLv2scXqNHSSDV8DAY3akn0daZAH
aZUiKMR3+xF2qhPe8qnEeupvIbhHRnkj6UwExGIRcx7LWlLDvuO+5+8B6MkHgGDm
J/1s5vpA48wAuJh/ZBSQCcHWG/5/8A2FMxkR1UwTaISsgkh2SoWRB3KvDIJ0MiR2
COXMgQCOiwKBgQDSFW8aCFxyZc2TrYqEILwYsQAs9u03ttqBsOCxvGxVSQcCB3P1
xoIlcGZfRwPGnkrh+yPIaAlU5Tuc1Y/Vx1nSZtc8jcvX6TMCnLr2tGLYQvnpQzHX
0gYpA7na1EW70I7yAKGQpv9NpIX5nEGQ31Bl8GXLIuJzLlNsQ5L6wShSSQKBgAlj
jmRmXAn5pGnGcGLBIV0YB8QZ9QlNIpRjoKm9aGLNENvF9MX0sRbLLgf0IQO3rY5f
mTBTmgRpKxSuHBXaUV2E0LfRtSTJ6Mby+Xf4vXiXaKEPz0DPNAB33AJKKo/qGjyJ
ZFiU8/6gFi9LjYFzZZJOZtAVTQ/TRJ3gJcFH9OmXAoGAYiCzVP8DJKGRRgKlNwU2
EuaUYO29iqTLXgJGQ5+KS2mOLp1O8UkEVqPZnQNgdmPUeKZEe/UQPTGCKVqP5Hyz
c6HF2GOVZUZcI0K5OfxQg9mL5kULKxwzD4U4GbB0jTlmJeDuMs5zbuECIZcUlXZV
tHF3tO/+j3PiMEpBUJz+q6M=
-----END PRIVATE KEY-----
"@

Set-Content -Path "$certbotArchiveDir/fullchain1.pem" -Value $dummyCert
Set-Content -Path "$certbotArchiveDir/privkey1.pem" -Value $dummyKey

# 심볼릭 링크 대신 파일 복사
Copy-Item -Path "$certbotArchiveDir/fullchain1.pem" -Destination "$certbotLiveDir/fullchain.pem" -Force
Copy-Item -Path "$certbotArchiveDir/privkey1.pem" -Destination "$certbotLiveDir/privkey.pem" -Force

Write-Host "Nginx 구성을 다시 시작합니다..." -ForegroundColor Green
docker-compose up -d nginx

Write-Host "더미 인증서 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host "https://$domain 에서 확인해 보세요 (보안 경고가 표시됩니다)" -ForegroundColor Yellow 