#!/usr/bin/env pwsh
# 경제 제재 통합 검색 서비스 빌드 스크립트
# 이 스크립트는 소스 파일을 빌드하여 docs 디렉토리에 배포 준비된 파일을 생성합니다.

# 오류 발생 시 스크립트 중단
$ErrorActionPreference = "Stop"

Write-Host "===== Build Start =====" -ForegroundColor Green

# 필요한 디렉토리 확인 및 생성
Write-Host "1. Checking directory structure..." -ForegroundColor Cyan
$directories = @(
    "docs",
    "docs/css",
    "docs/js",
    "docs/js/utils",
    "docs/js/services",
    "docs/js/components",
    "docs/js/animations",
    "docs/assets",
    "docs/assets/img",
    "docs/assets/images"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
        Write-Host " - Created directory: $dir" -ForegroundColor Yellow
    }
}

# docs 디렉토리 정리 (README.md 및 .nojekyll 유지)
Write-Host "2. Cleaning previous build files..." -ForegroundColor Cyan
$keepFiles = @("README.md", ".nojekyll", "CNAME")
Get-ChildItem -Path "docs" -Recurse -File | Where-Object { $keepFiles -notcontains $_.Name } | Remove-Item -Force
Write-Host " - Cleaned previous build files" -ForegroundColor Yellow

# HTML 파일 복사
Write-Host "3. Copying HTML files..." -ForegroundColor Cyan
Copy-Item -Path "src/index.html" -Destination "docs/index.html" -Force
Write-Host " - Copied index.html" -ForegroundColor Yellow

# CSS 파일 복사 및 병합
Write-Host "4. Processing CSS files..." -ForegroundColor Cyan
# 기본 스타일 변수 및 리셋 파일 먼저 복사
Copy-Item -Path "src/css/base/variables.css" -Destination "docs/css/variables.css" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "src/css/base/reset.css" -Destination "docs/css/reset.css" -Force -ErrorAction SilentlyContinue

# 레이아웃 및 컴포넌트 CSS 복사
Copy-Item -Path "src/css/layout/grid.css" -Destination "docs/css/grid.css" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "src/css/components/*" -Destination "docs/css/" -Recurse -Force -ErrorAction SilentlyContinue

# 기타 CSS 파일 복사
Copy-Item -Path "src/css/alerts.css" -Destination "docs/css/alerts.css" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "src/css/style.css" -Destination "docs/css/style.css" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "src/css/textures.css" -Destination "docs/css/textures.css" -Force -ErrorAction SilentlyContinue

Write-Host " - Copied CSS files" -ForegroundColor Yellow

# JS 파일 처리
Write-Host "5. Processing JavaScript files..." -ForegroundColor Cyan
# 유틸리티 파일
Copy-Item -Path "src/js/utils/*.js" -Destination "docs/js/utils/" -Force -ErrorAction SilentlyContinue

# 서비스 파일
Copy-Item -Path "src/js/services/*.js" -Destination "docs/js/services/" -Force -ErrorAction SilentlyContinue

# 애니메이션 모듈
Copy-Item -Path "src/js/animations/*.js" -Destination "docs/js/animations/" -Force -ErrorAction SilentlyContinue

# 컴포넌트 파일
Copy-Item -Path "src/js/components/*.js" -Destination "docs/js/components/" -Force -ErrorAction SilentlyContinue

# 메인 애플리케이션 JS
Copy-Item -Path "src/js/app.js" -Destination "docs/js/app.js" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "src/js/animations.js" -Destination "docs/js/animations.js" -Force -ErrorAction SilentlyContinue

Write-Host " - Copied JavaScript files" -ForegroundColor Yellow

# 이미지 및 자산 복사
Write-Host "6. Copying assets..." -ForegroundColor Cyan
Copy-Item -Path "src/assets/img/*" -Destination "docs/assets/img/" -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item -Path "src/assets/images/*" -Destination "docs/assets/images/" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host " - Copied assets" -ForegroundColor Yellow

# 완료 메시지
Write-Host "===== Build Complete =====" -ForegroundColor Green
Write-Host "Build files are in 'docs' directory" -ForegroundColor Green
Write-Host "To deploy: git add docs; git commit -m 'Build update'; git push" -ForegroundColor Green
