#!/bin/bash

# 로그 시작 표시
echo "===== 제재 정보 수집 시작: $(date) ====="

# 현재 디렉토리를 앱 디렉토리로 변경
cd /app

# 제재 정보 수집 스크립트 실행
python sanctions_collector.py

# 실행 결과 기록
if [ $? -eq 0 ]; then
  echo "✓ 제재 정보 수집 성공"
  
  # Node.js 데이터 통합 스크립트가 있는 경우 실행
  if [ -f /app/scripts/integrate-sanctions-data.js ]; then
    echo "- Node.js 통합 스크립트 실행 중..."
    node /app/scripts/integrate-sanctions-data.js
    
    if [ $? -eq 0 ]; then
      echo "✓ Node.js 통합 스크립트 실행 성공"
    else
      echo "✗ Node.js 통합 스크립트 실행 실패"
    fi
  fi

  # 중복 데이터 제거 스크립트 실행
  if [ -f /app/scripts/remove-duplicate-data.js ]; then
    echo "- 중복 데이터 제거 스크립트 실행 중..."
    node /app/scripts/remove-duplicate-data.js
    
    if [ $? -eq 0 ]; then
      echo "✓ 중복 데이터 제거 성공"
    else
      echo "✗ 중복 데이터 제거 실패"
    fi
  fi
  
  # 데이터 동기화 스크립트가 있는 경우 실행
  if [ -f /app/scripts/sync-data.js ]; then
    echo "- 데이터 동기화 스크립트 실행 중..."
    node /app/scripts/sync-data.js
    
    if [ $? -eq 0 ]; then
      echo "✓ 데이터 동기화 성공"
    else
      echo "✗ 데이터 동기화 실패"
    fi
  fi

  # 이전 버전 정리 스크립트 실행
  if [ -f /app/scripts/cleanup-old-versions.js ]; then
    echo "- 이전 버전 정리 스크립트 실행 중..."
    node /app/scripts/cleanup-old-versions.js
    
    if [ $? -eq 0 ]; then
      echo "✓ 이전 버전 정리 성공"
    else
      echo "✗ 이전 버전 정리 실패"
    fi
  fi
else
  echo "✗ 제재 정보 수집 실패"
fi

# 로그 종료 표시
echo "===== 제재 정보 수집 종료: $(date) ====="
echo 