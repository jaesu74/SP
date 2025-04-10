#!/usr/bin/env pwsh
# 경제 제재 통합 검색 서비스 빌드 스크립트
# 이 스크립트는 소스 파일을 빌드하여 dist 디렉토리에 배포 준비된 파일을 생성합니다.

# 오류 발생 시 스크립트 중단
$ErrorActionPreference = "Stop"

Write-Host "===== 경제 제재 통합 검색 서비스 빌드 시작 =====" -ForegroundColor Green

# 필요한 디렉토리 확인 및 생성
Write-Host "1. 디렉토리 구조 확인 중..." -ForegroundColor Cyan
$directories = @(
    "dist",
    "dist/css",
    "dist/js",
    "dist/assets",
    "dist/assets/img",
    "dist/assets/images"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
        Write-Host " - 디렉토리 생성됨: $dir" -ForegroundColor Yellow
    }
}

# dist 디렉토리 정리 (README.md 유지)
Write-Host "2. 기존 빌드 파일 정리 중..." -ForegroundColor Cyan
$keepFiles = @("README.md")
Get-ChildItem -Path "dist" -Recurse -File | Where-Object { $keepFiles -notcontains $_.Name } | Remove-Item -Force
Write-Host " - 기존 빌드 파일 정리 완료" -ForegroundColor Yellow

# HTML 파일 복사
Write-Host "3. HTML 파일 복사 중..." -ForegroundColor Cyan
Copy-Item -Path "src/index.html" -Destination "dist/index.html" -Force
Write-Host " - index.html 복사 완료" -ForegroundColor Yellow

# CSS 파일 복사 및 병합
Write-Host "4. CSS 파일 처리 중..." -ForegroundColor Cyan
# 기본 스타일 변수 및 리셋 파일 먼저 복사
Copy-Item -Path "src/css/base/variables.css" -Destination "dist/css/variables.css" -Force
Copy-Item -Path "src/css/base/reset.css" -Destination "dist/css/reset.css" -Force

# 레이아웃 및 컴포넌트 CSS 복사
Copy-Item -Path "src/css/layout/grid.css" -Destination "dist/css/grid.css" -Force
Copy-Item -Path "src/css/components/*" -Destination "dist/css/" -Recurse -Force

# 기타 CSS 파일 복사
Copy-Item -Path "src/css/alerts.css" -Destination "dist/css/alerts.css" -Force
Copy-Item -Path "src/css/style.css" -Destination "dist/css/style.css" -Force
Copy-Item -Path "src/css/textures.css" -Destination "dist/css/textures.css" -Force

# CSS 병합 기능 (향후 구현)
Write-Host " - CSS 파일 복사 완료" -ForegroundColor Yellow

# JS 파일 처리
Write-Host "5. JavaScript 파일 처리 중..." -ForegroundColor Cyan
# 유틸리티 파일
Copy-Item -Path "src/js/utils/*.js" -Destination "dist/js/" -Force

# 서비스 파일
Copy-Item -Path "src/js/services/*.js" -Destination "dist/js/" -Force

# 애니메이션 모듈
New-Item -Path "dist/js/animations" -ItemType Directory -Force | Out-Null
Copy-Item -Path "src/js/animations/*.js" -Destination "dist/js/animations/" -Force

# 컴포넌트 파일
Copy-Item -Path "src/js/components/*.js" -Destination "dist/js/" -Force

# 메인 애플리케이션 JS
Copy-Item -Path "src/js/app.js" -Destination "dist/js/app.js" -Force

# JS 최적화 및 병합 (향후 구현)
Write-Host " - JavaScript 파일 복사 완료" -ForegroundColor Yellow

# 이미지 및 자산 복사
Write-Host "6. 이미지 및 자산 복사 중..." -ForegroundColor Cyan
Copy-Item -Path "src/assets/img/*" -Destination "dist/assets/img/" -Recurse -Force
Copy-Item -Path "src/assets/images/*" -Destination "dist/assets/images/" -Recurse -Force
Write-Host " - 이미지 및 자산 복사 완료" -ForegroundColor Yellow

# 완료 메시지
Write-Host "===== 빌드 완료 =====" -ForegroundColor Green
Write-Host "빌드된 파일은 'dist' 디렉토리에 있습니다." -ForegroundColor Green
Write-Host "배포하려면: git add dist && git commit -m '빌드 업데이트' && git push" -ForegroundColor Green
